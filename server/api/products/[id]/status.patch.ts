// server/api/products/[id]/status.patch.ts
import { usePrisma } from "~~/server/config/prisma";
import { createProductApplication } from "~~/server/application/product.application";
import { requirePermission } from "~~/server/utils/requirePermission";
import { buildRequestContext } from "~~/server/utils/buildRequestContext";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "product:edit");
  const ctx = buildRequestContext(event);
  const id = getRouterParam(event, "id")!;
  const body = await readBody(event);
  const app = createProductApplication(usePrisma());
  return app.changeStatus(ctx, { ...body, id });
});
