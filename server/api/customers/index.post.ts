// server/api/customers/index.post.ts
import { usePrisma } from "~~/server/config/prisma";
import { createCustomerApplication } from "~~/server/application/customer.application";
import { requirePermission } from "~~/server/utils/requirePermission";
import { buildRequestContext } from "~~/server/utils/buildRequestContext";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "customer:create");
  const ctx = buildRequestContext(event);
  const body = await readBody(event);
  const app = createCustomerApplication(usePrisma());
  return app.create(ctx, body);
});
