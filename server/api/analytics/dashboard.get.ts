import { createAnalyticsService } from "~~/server/services/analytics.service";
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  // 登录即可访问，不需要特定权限
  await requirePermission(event);

  const service = createAnalyticsService(usePrisma());
  return await service.getDashboard();
});
