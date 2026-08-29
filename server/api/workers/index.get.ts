import { usePrisma } from "~~/server/config/prisma";
import { createWorkerService } from "~~/server/services/worker.service";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "user:view");

  const query = getQuery(event);
  const service = createWorkerService(usePrisma());

  return service.getList({
    page: Number(query.page) || 1,
    limit: Number(query.limit) || 20,
    keyword: query.keyword as string | undefined,
    status: query.status as string | undefined,
  });
});
