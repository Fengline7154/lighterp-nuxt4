// server/api/production-logs/batch.post.ts
import { usePrisma } from "~~/server/config/prisma";
import { createProductionApplication } from "~~/server/application/production.application";
import { requirePermission } from "~~/server/utils/requirePermission";
import { buildRequestContext } from "~~/server/utils/buildRequestContext";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "production:report");

  const ctx = buildRequestContext(event);
  const body = await readBody(event);

  const app = createProductionApplication(usePrisma());
  return app.batchSubmitLogs(ctx, body);
});
