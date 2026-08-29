import { usePrisma } from "~~/server/config/prisma";
import { createOrderMiscCostApplication } from "~~/server/application/order-misc-cost.application";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "production:view");

  const query = getQuery(event);
  const app = createOrderMiscCostApplication(usePrisma());
  return app.getList({
    page: Number(query.page) || 1,
    limit: Number(query.limit) || 20,
    keyword: query.keyword as string,
    costType: query.costType as string,
    orderId: query.orderId as string,
    workerId: query.workerId as string,
    status: query.status as string,
    startDate: query.startDate as string,
    endDate: query.endDate as string,
  });
});
