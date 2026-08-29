// server/api/customers/[id]/patch.ts
import { usePrisma } from "~~/server/config/prisma";
import { createCustomerApplication } from "~~/server/application/customer.application";
import { requirePermission } from "~~/server/utils/requirePermission";
import { buildRequestContext } from "~~/server/utils/buildRequestContext";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "customer:edit");
  const ctx = buildRequestContext(event);
  const id = getRouterParam(event, "id")!;
  const body = await readBody(event);
  const app = createCustomerApplication(usePrisma());
  return app.update(ctx, { ...body, id });
});
