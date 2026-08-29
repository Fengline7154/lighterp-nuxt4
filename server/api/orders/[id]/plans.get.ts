// server/api/orders/[id]/plans.get.ts
import { usePrisma } from "~~/server/config/prisma";
import { createProcessService } from "~~/server/services/process.service";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "order:view");
  const orderId = getRouterParam(event, "id")!;
  const service = createProcessService(usePrisma());
  const plans = await service.getOrderPlans(orderId);
  return { data: plans };
});
