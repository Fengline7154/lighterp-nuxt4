// server/api/analytics/order-progress.get.ts
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

  const where: any = { status: { in: ["APPROVED", "PRODUCING"] } };
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: {
        select: { quantity: true, fulfilledQuantity: true, productName: true },
      },
      customer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const data = orders.map((o) => {
    const totalQty = o.items.reduce((s, i) => s + Number(i.quantity), 0);
    const fulfilledQty = o.items.reduce(
      (s, i) => s + Number(i.fulfilledQuantity),
      0,
    );
    return {
      id: o.id,
      orderCode: o.orderCode,
      customerName: o.customer?.name || "-",
      totalQty,
      fulfilledQty,
      percent: totalQty > 0 ? Math.round((fulfilledQty / totalQty) * 100) : 0,
    };
  });

  return { data };
});
