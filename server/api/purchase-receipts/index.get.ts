// server/api/purchase-receipts/index.get.ts
import { usePrisma } from "~~/server/config/prisma";
import { createPurchaseReceiptService } from "~~/server/services/purchase-receipt.service";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "purchase:view");
  const query = getQuery(event);
  const service = createPurchaseReceiptService(usePrisma());
  return service.getList({
    page: Number(query.page) || 1,
    limit: Number(query.limit) || 10,
    orderId: query.orderId as string,
    startDate: query.startDate as string,
    endDate: query.endDate as string,
  });
});
