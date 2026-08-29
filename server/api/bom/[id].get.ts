// server/api/bom/[id].get.ts
import { createBomService } from "~~/server/services/bom.service";
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "bom:view");

  const id = getRouterParam(event, "id")!;
  const service = createBomService(usePrisma());
  return service.getById(id);
});
