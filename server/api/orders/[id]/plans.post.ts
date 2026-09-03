// server/api/orders/[id]/plans.post.ts
import { usePrisma } from "~~/server/config/prisma";
import { createProcessService } from "~~/server/services/process.service";
import { requirePermission } from "~~/server/utils/requirePermission";
import { buildRequestContext } from "~~/server/utils/buildRequestContext";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "order:update");

  const ctx = buildRequestContext(event);
  const orderId = getRouterParam(event, "id")!;
  const body = await readBody(event);

  const processService = createProcessService(usePrisma());
  return processService.saveOrderPlans(orderId, body.orderItemId, body.plans);
});
