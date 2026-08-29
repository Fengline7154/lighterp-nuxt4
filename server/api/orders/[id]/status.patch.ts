// server/api/orders/[id]/status.patch.ts
import { usePrisma } from "~~/server/config/prisma";
import { createOrderApplication } from "~~/server/application/order.application";
import { requirePermission } from "~~/server/utils/requirePermission";
import { buildRequestContext } from "~~/server/utils/buildRequestContext";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const permMap: Record<string, string> = {
    APPROVED: "order:approve",
    CANCELLED: "order:cancel",
    PRODUCING: "order:approve",
    COMPLETED: "order:approve",
  };
  const perm = permMap[body.status] || "order:edit";
  await requirePermission(event, perm);

  const ctx = buildRequestContext(event);
  const orderId = getRouterParam(event, "id")!;
  const rawdata = { ...body, orderId };

  const app = createOrderApplication(usePrisma());
  return app.changeStatus(ctx, rawdata);
});
