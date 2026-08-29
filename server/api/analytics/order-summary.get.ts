// server/api/analytics/order-summary.get.ts
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";
export default defineEventHandler(async (event) => {
  await requirePermission(event, "report:view");
  const query = getQuery(event);
  const prisma = usePrisma();

  const startDate = query.startDate
    ? new Date(query.startDate as string)
    : undefined;
  const endDate = query.endDate
    ? new Date(new Date(query.endDate as string).setHours(23, 59, 59, 999))
    : undefined;

  const where: any = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const result = await prisma.order.groupBy({
    by: ["status"],
    where,
    _count: { id: true },
    orderBy: { status: "asc" },
  });

  const total = result.reduce((s, r) => s + r._count.id, 0);

  return {
    total,
    items: result.map((r) => ({
      status: r.status,
      count: r._count.id,
      percentage: total > 0 ? ((r._count.id / total) * 100).toFixed(1) : "0",
    })),
  };
});
