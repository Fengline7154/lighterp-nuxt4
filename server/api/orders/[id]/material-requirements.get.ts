// server/api/orders/[id]/material-requirements.get.ts
import { usePrisma } from "~~/server/config/prisma";
import { createReceiptService } from "~~/server/services/receipt.service";
import { createBomRepository } from "~~/server/repositories/postgres/bom.repository";
import { createOrderReservationRepository } from "~~/server/repositories/postgres/order-reservation.repository";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "bom:view");

  const orderId = getRouterParam(event, "id")!;
  const prisma = usePrisma();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        select: {
          id: true,
          productId: true,
          productName: true,
          quantity: true,
          bomId: true,
        },
      },
    },
  });
  if (!order) throw createError({ statusCode: 404 });

  const receiptService = createReceiptService(prisma);
  const bomRepo = createBomRepository(prisma);
  const reservationRepo = createOrderReservationRepository(prisma);

  // 1. 查本订单已预留的物料量
  const reservations = await reservationRepo.findMany(
    { orderId },
    { page: 1, limit: 1000 },
  );
  const orderReservedMap = new Map<string, number>();
  for (const r of reservations.data) {
    if (r.type === "MATERIAL_RESERVE") {
      const net = Number(r.quantity) - Number(r.released);
      orderReservedMap.set(
        r.productId,
        (orderReservedMap.get(r.productId) || 0) + net,
      );
    }
  }

  // 2. BOM 展开，汇总物料需求
  const materialMap = new Map<
    string,
    { productName: string; demand: number }
  >();

  for (const item of order.items) {
    let bomId = item.bomId;
    if (!bomId) {
      const publishedBom = await bomRepo.findActiveByProductId(item.productId);
      if (publishedBom) bomId = publishedBom.id;
    }

    if (bomId) {
      const bomMaterials = await receiptService.expandBomMaterials(
        bomId,
        Number(item.quantity),
      );
      for (const [materialId, demand] of bomMaterials) {
        const existing = materialMap.get(materialId);
        materialMap.set(materialId, {
          productName: "",
          demand: (existing?.demand || 0) + Number(demand.toString()),
        });
      }
    }
  }

  // 3. 补产品名 + 查库存
  const productIds = [...materialMap.keys()];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, unit: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const inventories = await prisma.inventory.findMany({
    where: { productId: { in: productIds } },
  });
  const invMap = new Map(inventories.map((i) => [i.productId, i]));

  // 4. 计算缺口
  const isApproved = order.status !== "PENDING";
  const result = [...materialMap.entries()].map(([materialId, data]) => {
    const p = productMap.get(materialId);
    const inv = invMap.get(materialId);
    const availableQty = inv
      ? Math.max(0, Number(inv.quantity) - Number(inv.reservedQty))
      : 0;
    const totalStock = inv ? Number(inv.quantity) : 0;

    // 已审批：本订单已预留的加回来
    const orderReserved = orderReservedMap.get(materialId) || 0;
    const effectiveAvailable = isApproved
      ? availableQty + orderReserved
      : availableQty;

    const demandNum = data.demand;
    const shortage = Math.max(0, demandNum - effectiveAvailable);

    return {
      productId: materialId,
      productName: p?.name || data.productName || materialId,
      unit: p?.unit || "",
      demand: demandNum,
      totalStock,
      availableQty,
      orderReserved: isApproved ? orderReserved : undefined,
      effectiveAvailable,
      shortage,
    };
  });

  return { data: result, isApproved };
});
