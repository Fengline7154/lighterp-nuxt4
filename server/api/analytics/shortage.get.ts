import { createAnalyticsService } from "~~/server/services/analytics.service";
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "report:view");
  const service = createAnalyticsService(usePrisma());
  return service.getShortage();
});
