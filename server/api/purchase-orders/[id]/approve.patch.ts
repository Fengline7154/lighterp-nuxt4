// server/api/purchase-orders/[id]/approve.patch.ts
import { usePrisma } from "~~/server/config/prisma";
import { createPurchaseOrderApplication } from "~~/server/application/purchase-order.application";
import { requirePermission } from "~~/server/utils/requirePermission";
import { buildRequestContext } from "~~/server/utils/buildRequestContext";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "purchase:approve");
  const ctx = buildRequestContext(event);
  const id = getRouterParam(event, "id")!;
  const app = createPurchaseOrderApplication(usePrisma());
  return app.approve(ctx, { id });
});
