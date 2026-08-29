import { usePrisma } from "~~/server/config/prisma";
import { createLocationService } from "~~/server/services/location.service";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "inventory:view");

  const query = getQuery(event);
  const service = createLocationService(usePrisma());

  return service.getList({
    page: Number(query.page) || 1,
    limit: Number(query.limit) || 20,
    keyword: query.keyword as string | undefined,
    status: query.status as string | undefined,
  });
});
