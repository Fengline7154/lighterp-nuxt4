// server/services/purchase-receipt.service.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createPurchaseReceiptRepository } from "~~/server/repositories/postgres/purchase-receipt.repository";
import { createSequenceService } from "~~/server/services/sequence.service";
import { runInTransaction } from "~~/server/utils/transaction";
import type { TxContext } from "~~/server/infrastructure/tx";

export const createPurchaseReceiptService = (prisma: PrismaClient) => {
  const repo = createPurchaseReceiptRepository(prisma);
  const seqService = createSequenceService(prisma);

  return {
    async create(
      data: {
        orderId: string;
        orderItemId: string;
        productId: string;
        quantity: number | string;
        unitCost: number | string;
        locationId?: string;
        operatorId: string;
        remark?: string;
      },
      tx?: TxContext,
    ) {
      return runInTransaction(tx, prisma, async (txCtx) => {
        const receiptCode = await seqService.getFormattedPurchaseReceiptCode();
        return repo.create({ ...data, receiptCode }, txCtx);
      });
    },

    async getList(params: {
      page: number;
      limit: number;
      orderId?: string;
      startDate?: string;
      endDate?: string;
    }) {
      return repo.findMany({
        page: params.page,
        limit: params.limit,
        orderId: params.orderId,
        startDate: params.startDate ? new Date(params.startDate) : undefined,
        endDate: params.endDate
          ? new Date(
              new Date(params.endDate as string).setHours(23, 59, 59, 999),
            )
          : undefined,
      });
    },
  };
};
