// server/api/wage-summary/index.get.ts
import { usePrisma } from "~~/server/config/prisma";
import { createAnalyticsService } from "~~/server/services/analytics.service";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "wage:view");

  const query = getQuery(event);
  const service = createAnalyticsService(usePrisma());
  return service.getWageSummary({
    startDate: query.startDate as string,
    endDate: query.endDate as string,
    orderId: query.orderId as string,
    workerId: query.workerId as string,
    groupBy: query.groupBy as string,
  });
});
