// server/api/locations/index.post.ts
import { usePrisma } from "~~/server/config/prisma";
import { createLocationApplication } from "~~/server/application/location.application";
import { requirePermission } from "~~/server/utils/requirePermission";
import { buildRequestContext } from "~~/server/utils/buildRequestContext";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "inventory:adjust");
  const ctx = buildRequestContext(event);
  const body = await readBody(event);
  const app = createLocationApplication(usePrisma());
  return app.create(ctx, body);
});
