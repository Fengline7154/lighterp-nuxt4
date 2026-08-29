// server/api/orders/index.post.ts
import { createOrderService } from "~~/server/services/order.service";
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";
import { buildRequestContext } from "~~/server/utils/buildRequestContext";
import { createOrderApplication } from "~~/server/application/order.application";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "order:create");

  const ctx = buildRequestContext(event);
  const body = await readBody(event);

  const app = createOrderApplication(usePrisma());
  return app.createOrder(ctx, body);
});
