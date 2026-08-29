import { usePrisma } from "~~/server/config/prisma";
import { createPurchaseOrderService } from "~~/server/services/purchase-order.service";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "purchase:view");

  const auth = event.context.auth.user;
  const canViewSensitive =
    auth.role === "admin" ||
    auth.permissions?.includes("data:view-supplier") ||
    auth.permissions?.includes("*");

  const id = getRouterParam(event, "id")!;
  return {
    data: await createPurchaseOrderService(usePrisma()).getById(
      id,
      canViewSensitive,
    ),
  };
});
