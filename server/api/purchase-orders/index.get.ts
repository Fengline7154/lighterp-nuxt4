// server/api/purchase-orders/index.get.ts
import { usePrisma } from "~~/server/config/prisma";
import { createPurchaseOrderService } from "~~/server/services/purchase-order.service";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "purchase:view");
  const query = getQuery(event);
  const service = createPurchaseOrderService(usePrisma());
  return service.getList({
    page: Number(query.page) || 1,
    limit: Number(query.limit) || 10,
    keyword: query.keyword as string,
    status: query.status as string,
    supplierId: query.supplierId as string,
    startDate: query.startDate as string,
    endDate: query.endDate as string,
  });
});
