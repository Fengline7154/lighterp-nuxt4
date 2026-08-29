// server/api/production-logs/[id]/edit.patch.ts
import { usePrisma } from "~~/server/config/prisma";
import { createProductionApplication } from "~~/server/application/production.application";
import { requirePermission } from "~~/server/utils/requirePermission";
import { buildRequestContext } from "~~/server/utils/buildRequestContext";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "production:revise");

  const ctx = buildRequestContext(event);
  const id = getRouterParam(event, "id")!;
  const body = await readBody(event);

  const app = createProductionApplication(usePrisma());
  return app.reviseLog(ctx, id, body);
});
