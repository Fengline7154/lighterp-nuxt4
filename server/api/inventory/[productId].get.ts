import { createInventoryService } from "~~/server/services/inventory.service";
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "inventory:view");

  const productId = getRouterParam(event, "productId");
  if (!productId) throw createError({ statusCode: 400 });

  const invService = createInventoryService(usePrisma());
  return await invService.getByProductId(productId);
});
