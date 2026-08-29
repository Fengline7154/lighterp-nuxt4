// server/api/orders/[id].get.ts
import { createOrderService } from "~~/server/services/order.service";
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "order:view");

  const id = getRouterParam(event, "id")!;
  const orderService = createOrderService(usePrisma());
  return orderService.getOrderById(id);
});
