// server/api/tools/material-calculator.get.ts
import { usePrisma } from "~~/server/config/prisma";
import { createReceiptService } from "~~/server/services/receipt.service";
import { createBomRepository } from "~~/server/repositories/postgres/bom.repository";
import { createInventoryRepository } from "~~/server/repositories/postgres/inventory.repository";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "bom:view");

  const query = getQuery(event);
  const productId = query.productId as string;
  const quantity = Number(query.quantity) || 1;

  const prisma = usePrisma();
  const receiptService = createReceiptService(prisma);
  const bomRepo = createBomRepository(prisma);

  const publishedBom = await bomRepo.findActiveByProductId(productId);
  if (!publishedBom) return { data: [] };

  const materialMap = await receiptService.expandBomMaterials(
    publishedBom.id,
    quantity,
  );

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

  const result = [...materialMap.entries()].map(([materialId, demand]) => {
    const p = productMap.get(materialId);
    const inv = invMap.get(materialId);
    const available = inv
      ? Math.max(0, Number(inv.quantity) - Number(inv.reservedQty))
      : 0;
    const demandNum = Number(demand.toString());
    return {
      productId: materialId,
      productName: p?.name || materialId,
      unit: p?.unit || "",
      demand: demandNum,
      available,
      shortage: Math.max(0, demandNum - available),
    };
  });

  return { data: result };
});
