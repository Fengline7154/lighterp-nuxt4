// server/api/purchase-orders/index.post.ts
import { usePrisma } from "~~/server/config/prisma";
import { createPurchaseOrderApplication } from "~~/server/application/purchase-order.application";
import { requirePermission } from "~~/server/utils/requirePermission";
import { buildRequestContext } from "~~/server/utils/buildRequestContext";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "purchase:create");
  const ctx = buildRequestContext(event);
  const body = await readBody(event);
  const app = createPurchaseOrderApplication(usePrisma());
  return app.create(ctx, body);
});
