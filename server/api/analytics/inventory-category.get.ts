// server/api/analytics/inventory-category.get.ts
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";
export default defineEventHandler(async (event) => {
  await requirePermission(event, "report:view");
  const prisma = usePrisma();
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE", inventories: { some: {} } },
    select: { category: true, inventories: { select: { quantity: true } } },
  });

  const categoryMap = new Map<string, number>();
  for (const p of products) {
    const cat = p.category || "OTHER";
    const qty = p.inventories.reduce((s, i) => s + Number(i.quantity), 0);
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + qty);
  }

  const labels: Record<string, string> = {
    FINISHED: "成品",
    SEMI: "半成品",
    RAW: "原材料",
    PACKAGING: "包材",
    OTHER: "其他",
  };
  const data = [...categoryMap.entries()].map(([cat, qty]) => ({
    category: labels[cat] || cat,
    qty,
  }));

  return { data };
});
