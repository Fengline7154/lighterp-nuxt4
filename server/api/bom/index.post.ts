import { usePrisma } from "~~/server/config/prisma";
import { createBomApplication } from "~~/server/application/bom.application";
import { requirePermission } from "~~/server/utils/requirePermission";
import { buildRequestContext } from "~~/server/utils/buildRequestContext";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "bom:create");
  const ctx = buildRequestContext(event);
  const body = await readBody(event);
  const app = createBomApplication(usePrisma());
  return app.createBomWithNewMaterials(ctx, body);
});
