// server/api/locations/[id]/delete.ts
import { usePrisma } from "~~/server/config/prisma";
import { createLocationApplication } from "~~/server/application/location.application";
import { requirePermission } from "~~/server/utils/requirePermission";
import { buildRequestContext } from "~~/server/utils/buildRequestContext";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "inventory:adjust");
  const ctx = buildRequestContext(event);
  const id = getRouterParam(event, "id")!;
  const app = createLocationApplication(usePrisma());
  return app.deactivate(ctx, id);
});
