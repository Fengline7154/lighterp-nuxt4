import { usePrisma } from "~~/server/config/prisma";
import { createSupplierApplication } from "~~/server/application/supplier.application";
import { requirePermission } from "~~/server/utils/requirePermission";
import { buildRequestContext } from "~~/server/utils/buildRequestContext";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "purchase:supplierManage");

  const ctx = buildRequestContext(event);
  const body = await readBody(event);

  const app = createSupplierApplication(usePrisma());
  return { data: await app.create(ctx, body) };
});
