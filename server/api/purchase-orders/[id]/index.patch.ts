// server/api/purchase-orders/[id]/index.patch.ts
import { usePrisma } from "~~/server/config/prisma";
import { createPurchaseOrderApplication } from "~~/server/application/purchase-order.application";
import { requirePermission } from "~~/server/utils/requirePermission";
import { buildRequestContext } from "~~/server/utils/buildRequestContext";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "purchase:edit");

  const ctx = buildRequestContext(event);
  const id = getRouterParam(event, "id")!;
  const body = await readBody(event);

  const app = createPurchaseOrderApplication(usePrisma());
  return app.update(ctx, { id, ...body });
});
