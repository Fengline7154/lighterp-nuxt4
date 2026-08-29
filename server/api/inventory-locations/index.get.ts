// server/api/inventory-locations/index.get.ts
import { usePrisma } from "~~/server/config/prisma";
import { createInventoryLocationService } from "~~/server/services/inventory-location.service";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "inventory:view");
  const query = getQuery(event);
  const locationId = query.locationId as string;
  if (!locationId)
    throw createError({ statusCode: 400, message: "缺少库位ID" });

  const service = createInventoryLocationService(usePrisma());
  const data = await service.getByLocationId(locationId);
  return { data };
});
