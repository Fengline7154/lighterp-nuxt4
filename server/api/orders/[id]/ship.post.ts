// server/api/orders/[id]/ship.post.ts
import { usePrisma } from "~~/server/config/prisma";
import { createOrderApplication } from "~~/server/application/order.application";
import { requirePermission } from "~~/server/utils/requirePermission";
import { buildRequestContext } from "~~/server/utils/buildRequestContext";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "order:ship");

  const ctx = buildRequestContext(event);
  const orderId = getRouterParam(event, "id")!;
  const body = await readBody(event);

  const app = createOrderApplication(usePrisma());
  return app.shipOrder(ctx, { orderId, ...body });
});
