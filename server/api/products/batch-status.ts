// server/api/products/batch-status.ts
import { usePrisma } from "~~/server/config/prisma";
import { createProductApplication } from "~~/server/application/product.application";
import { requirePermission } from "~~/server/utils/requirePermission";
import { buildRequestContext } from "~~/server/utils/buildRequestContext";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "inventory:adjust");
  const ctx = buildRequestContext(event);
  const body = await readBody(event);
  const app = createProductApplication(usePrisma());
  return app.batchChangeStatus(ctx, body);
});
