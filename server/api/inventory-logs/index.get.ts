// server/api/inventory-logs/index.get.ts
import { usePrisma } from "~~/server/config/prisma";
import { createInventoryLogService } from "~~/server/services/inventory-log.service";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "inventory:view");

  const query = getQuery(event);
  const service = createInventoryLogService(usePrisma());

  return service.getList({
    page: Number(query.page) || 1,
    limit: Number(query.limit) || 20,
    keyword: query.keyword as string | undefined,
    type: query.type as string | undefined,
    startDate: query.startDate as string | undefined,
    endDate: query.endDate as string | undefined,
  });
});
