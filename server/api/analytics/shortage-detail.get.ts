import { createAnalyticsService } from "~~/server/services/analytics.service";
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "report:view");
  const productId = getQuery(event).productId as string;
  if (!productId) throw createError({ statusCode: 400, message: "缺少产品ID" });
  return createAnalyticsService(usePrisma()).getShortageDetail(productId);
});
