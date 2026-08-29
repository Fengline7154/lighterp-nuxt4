// server/services/inventory-log.service.ts
import type { LogRelatedType, PrismaClient } from "~~/prisma/generated/client";
import { createInventoryLogRepository } from "~~/server/repositories/postgres/inventory-log.repository";
import type { TxContext } from "~~/server/infrastructure/tx";

export const createInventoryLogService = (prisma: PrismaClient) => {
  const repo = createInventoryLogRepository(prisma);

  return {
    async createLog(
      data: {
        productId: string;
        type: LogRelatedType;
        quantity: number | string;
        beforeQty: number | string;
        afterQty: number | string;
        relatedCode?: string;
        remark?: string;
        operatorId: string;
        locationId?: string;
      },
      tx?: TxContext,
    ) {
      return repo.createLog(data, tx);
    },
    // inventory-log.service.ts 新增
    async findFirst(where: any, tx?: TxContext) {
      const client = tx?.prisma ?? prisma;
      return client.inventoryLog.findFirst({ where, select: { id: true } });
    },
    async getList(params: {
      page: number;
      limit: number;
      keyword?: string;
      type?: string;
      startDate?: string;
      endDate?: string;
    }) {
      const result = await repo.findManyWithDetails(params);
      return result;
    },
  };
};
