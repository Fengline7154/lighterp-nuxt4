import { usePrisma } from "~~/server/config/prisma";
import { createOrderMiscCostApplication } from "~~/server/application/order-misc-cost.application";
import { requirePermission } from "~~/server/utils/requirePermission";
import { buildRequestContext } from "~~/server/utils/buildRequestContext";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "production:report");

  const ctx = buildRequestContext(event);
  const body = await readBody(event);

  const app = createOrderMiscCostApplication(usePrisma());
  return app.create(ctx, body);
});
