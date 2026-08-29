// server/api/inventory-locations/search.get.ts
import { usePrisma } from "~~/server/config/prisma";
import { createInventoryLocationService } from "~~/server/services/inventory-location.service";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "inventory:view");
  const query = getQuery(event);
  const q = query.q as string;
  if (!q) throw createError({ statusCode: 400, message: "缺少搜索关键词" });

  const service = createInventoryLocationService(usePrisma());
  const data = await service.searchByProduct(q);
  return { data };
});
