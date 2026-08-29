// server/api/workers/[id]/delete.ts
import { usePrisma } from "~~/server/config/prisma";
import { createWorkerApplication } from "~~/server/application/worker.application";
import { requirePermission } from "~~/server/utils/requirePermission";
import { buildRequestContext } from "~~/server/utils/buildRequestContext";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "staff:manage");
  const ctx = buildRequestContext(event);
  const id = getRouterParam(event, "id")!;
  const app = createWorkerApplication(usePrisma());
  return app.deactivate(ctx, id);
});
