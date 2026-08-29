import { usePrisma } from "~~/server/config/prisma";
import { createOrderService } from "~~/server/services/order.service";
import { generatePdf } from "~~/server/utils/pdf/generator";
import { buildOrderPdfRenderer } from "~~/server/utils/pdf/order-document";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "order:view");

  const id = getRouterParam(event, "id")!;
  const prisma = usePrisma();
  const orderService = createOrderService(prisma);

  const order = await orderService.getOrderWithPlans(id);

  // 展开每个订单项的 BOM 直接子物料
  for (const item of order.items) {
    let bomId = item.bomId;
    if (!bomId) {
      const publishedBom = await prisma.bom.findFirst({
        where: { productId: item.productId, status: "PUBLISHED" },
        orderBy: { version: "desc" },
      });
      if (publishedBom) bomId = publishedBom.id;
    }

    if (bomId) {
      const bom = await prisma.bom.findUnique({
        where: { id: bomId },
        include: {
          items: {
            include: {
              material: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  unit: true,
                  spec: true,
                },
              },
            },
          },
        },
      });

      item.bomMaterials = bom
        ? bom.items.map((bomItem) => ({
            materialId: bomItem.materialId,
            materialName: bomItem.material?.name || bomItem.materialName,
            materialCode: bomItem.material?.code || "",
            unit: bomItem.unit || bomItem.material?.unit || "",
            spec: bomItem.material?.spec || "",
            demand: (Number(bomItem.quantity) * Number(item.quantity)).toFixed(
              4,
            ),
          }))
        : [];
    } else {
      item.bomMaterials = [];
    }
  }

  // 合并所有产品的 BOM 物料（相同物料数量相加）
  const materialMap = new Map<string, any>();
  for (const item of order.items) {
    for (const mat of item.bomMaterials || []) {
      const existing = materialMap.get(mat.materialId);
      if (existing) {
        existing.demand = (
          Number(existing.demand) + Number(mat.demand)
        ).toFixed(4);
      } else {
        materialMap.set(mat.materialId, { ...mat });
      }
    }
  }
  order.bomMaterials = [...materialMap.values()];

  const pdfBuffer = await generatePdf({
    title: "生产任务单",
    fontSize: 10,
    render: buildOrderPdfRenderer(order),
  });

  setHeader(event, "Content-Type", "application/pdf");
  setHeader(
    event,
    "Content-Disposition",
    `inline; filename="production-order-${order.orderCode}.pdf"`,
  );

  return pdfBuffer;
});
