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

  const query = getQuery(event);
  const app = createSupplierApplication(usePrisma());
  return app.getList(
    {
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
      keyword: query.keyword as string,
      status: query.status as string,
    },
    canViewSensitive,
  );
});
