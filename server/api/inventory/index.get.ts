import { createInventoryService } from "~~/server/services/inventory.service";
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "inventory:view");

  const query = getQuery(event);
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const sortField = (query.sortField as string) || "updatedAt";
  const sortDir = (query.sortDir as string) || "desc";
  const keyword = (query.keyword as string) || "";

  const invService = createInventoryService(usePrisma());
  return await invService.getList(page, limit, sortField, sortDir, keyword);
});
