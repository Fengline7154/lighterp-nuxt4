// server/api/locations/[id].get.ts
import { usePrisma } from "~~/server/config/prisma";
import { createLocationService } from "~~/server/services/location.service";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "inventory:view");
  const id = getRouterParam(event, "id")!;
  const service = createLocationService(usePrisma());
  const location = await service.getById(id);
  return { data: location };
});
