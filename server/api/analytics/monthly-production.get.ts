// server/api/analytics/monthly-production.get.ts
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";
// server/api/analytics/monthly-production.get.ts
export default defineEventHandler(async (event) => {
  await requirePermission(event, "report:view");
  const query = getQuery(event);
  const prisma = usePrisma();

  const now = new Date();
  const startDate = query.startDate
    ? new Date(query.startDate as string)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = query.endDate
    ? new Date(new Date(query.endDate as string).setHours(23, 59, 59, 999))
    : now;

  const receipts = await prisma.orderReceipt.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    include: {
      orderItem: { select: { product: { select: { name: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  // 按天+产品汇总
  const dailyProductMap = new Map<string, Map<string, number>>();
  const allProducts = new Set<string>();

  for (const r of receipts) {
    const day = r.createdAt.toISOString().split("T")[0]!;
    const productName = r.orderItem?.product?.name || "未知";
    allProducts.add(productName);

    if (!dailyProductMap.has(day)) dailyProductMap.set(day, new Map());
    const dayMap = dailyProductMap.get(day)!;
    dayMap.set(
      productName,
      (dayMap.get(productName) || 0) + Number(r.quantity),
    );
  }

  // 生成日期序列
  const dates: string[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(current.toISOString().split("T")[0]!);
    current.setDate(current.getDate() + 1);
  }

  // 构建 datasets
  const products = [...allProducts];
  const colors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ef4444",
    "#06b6d4",
    "#ec4899",
    "#84cc16",
  ];
  const datasets = products.map((product, idx) => ({
    label: product,
    data: dates.map((day) => dailyProductMap.get(day)?.get(product) || 0),
    backgroundColor: colors[idx % colors.length],
  }));

  return { data: { dates, datasets } };
});
