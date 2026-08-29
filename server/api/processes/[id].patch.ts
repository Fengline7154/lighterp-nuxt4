// server/api/processes/[id]/[id].patch.ts
import { usePrisma } from "~~/server/config/prisma";
import { createProcessApplication } from "~~/server/application/process.application";
import { requirePermission } from "~~/server/utils/requirePermission";
import { buildRequestContext } from "~~/server/utils/buildRequestContext";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "process:manage");
  const ctx = buildRequestContext(event);
  const id = getRouterParam(event, "id")!;
  const body = await readBody(event);
  const app = createProcessApplication(usePrisma());
  return app.update(ctx, id, body);
});
