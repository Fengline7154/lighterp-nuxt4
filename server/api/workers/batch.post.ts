// server/api/workers/batch.post.ts
import { usePrisma } from "~~/server/config/prisma";
import { createWorkerApplication } from "~~/server/application/worker.application";
import { requirePermission } from "~~/server/utils/requirePermission";
import { buildRequestContext } from "~~/server/utils/buildRequestContext";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "user:create");
  const ctx = buildRequestContext(event);
  const body = await readBody(event);
  const app = createWorkerApplication(usePrisma());
  return app.batchCreate(ctx, body);
});
