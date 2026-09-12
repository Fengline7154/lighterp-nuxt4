// server/api/inventory-alerts/index.get.ts
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "inventory:view");

  const prisma = usePrisma();
  const alerts = await prisma.inventoryAlert.findMany({
    include: {
      product: {
        select: {
          code: true,
          name: true,
          unit: true,
          category: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 补全当前库存
  const productIds = alerts.map((a) => a.productId);
  const inventories = await prisma.inventory.findMany({
    where: { productId: { in: productIds } },
    select: { productId: true, quantity: true },
  });
  const invMap = new Map(inventories.map((i) => [i.productId, i.quantity]));

  const data = alerts.map((alert) => ({
    ...alert,
    currentQuantity: invMap.get(alert.productId)
      ? String(invMap.get(alert.productId))
      : "0",
    isBelowThreshold:
      Number(invMap.get(alert.productId) || 0) < Number(alert.threshold),
  }));

  return { data };
});
