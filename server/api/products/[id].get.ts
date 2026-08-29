import { createProductService } from "~~/server/services/product.service";
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "product:view");

  const id = getRouterParam(event, "id")!;
  const service = createProductService(usePrisma());
  return service.getById(id);
});
