// server/api/orders/[id].get.ts
import { createOrderService } from "~~/server/services/order.service";
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";
import { desensitizeOrder } from "~~/server/utils/desensitize";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "order:view");

  const id = getRouterParam(event, "id")!;
  const orderService = createOrderService(usePrisma());
  const order = await orderService.getOrderById(id);

  const permissions = event.context.auth?.user?.permissions || [];
  return desensitizeOrder(order, permissions);
});
