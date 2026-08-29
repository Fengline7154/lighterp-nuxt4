// server/api/order-receipts/index.get.ts
import { createReceiptService } from "~~/server/services/receipt.service";
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "order:view");
  const query = getQuery(event);
  const service = createReceiptService(usePrisma());
  return await service.getList({
    page: Number(query.page) || 1,
    limit: Number(query.limit) || 10,
    receiptCode: query.receiptCode as string,
    orderId: query.orderId as string,
    productId: query.productId as string,
    startDate: query.startDate
      ? new Date(query.startDate as string)
      : undefined,
    endDate: query.endDate
      ? new Date(new Date(query.endDate as string).setHours(23, 59, 59, 999))
      : undefined,
    sortField: query.sortField as string,
    sortDir: query.sortDir as string,
  });
});
