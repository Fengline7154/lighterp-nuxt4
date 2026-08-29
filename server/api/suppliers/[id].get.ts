import { usePrisma } from "~~/server/config/prisma";
import { createSupplierApplication } from "~~/server/application/supplier.application";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "purchase:supplierView");

  const auth = event.context.auth.user;
  const canViewSensitive =
    auth.role === "admin" ||
    auth.permissions?.includes("data:view-supplier") ||
    auth.permissions?.includes("*");

  const id = getRouterParam(event, "id")!;
  const app = createSupplierApplication(usePrisma());
  return { data: await app.getById(id, canViewSensitive) };
});
