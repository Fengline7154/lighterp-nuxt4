// server/api/production-logs/index.get.ts
import { usePrisma } from "~~/server/config/prisma";
import { createProductionLogService } from "~~/server/services/production-log.service";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "production:view");

  const query = getQuery(event);
  const service = createProductionLogService(usePrisma());

  return service.getList({
    page: Number(query.page) || 1,
    limit: Number(query.limit) || 20,
    keyword: query.keyword as string | undefined,
    startDate: query.startDate as string | undefined,
    endDate: query.endDate as string | undefined,
  });
});
