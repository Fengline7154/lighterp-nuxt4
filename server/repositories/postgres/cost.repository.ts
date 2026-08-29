// server/repositories/postgres/cost.repository.ts
import type { TxContext } from "~~/server/infrastructure/tx";
import type {
  PrismaClient,
  CostDirection,
  CostType,
  CostSourceType,
} from "~~/prisma/generated/client";

export const createCostRepository = (prisma: PrismaClient) => {
  const getClient = (tx?: TxContext) => tx?.prisma ?? prisma;

  return {
    async createEntry(
      data: {
        inventoryLogId: string;
        productId: string;
        direction: CostDirection;
        quantity: number | string;
        unitCost: number | string;
        totalCost: number | string;
        costType?: CostType;
        sourceType: CostSourceType;
        orderId?: string;
        remark?: string;
      },
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      return client.inventoryCostEntry.create({ data });
    },

    async getProductInEntries(productId: string, tx?: TxContext) {
      const client = getClient(tx);
      return client.inventoryCostEntry.findMany({
        where: { productId, direction: "IN" },
        orderBy: { createdAt: "asc" },
      });
    },

    async getOrderCostSummary(orderId: string) {
      return prisma.orderCostSummary.findUnique({ where: { orderId } });
    },

    async getOrderMaterialCost(orderId: string, tx?: TxContext) {
      const client = getClient(tx);
      const result = await client.inventoryCostEntry.aggregate({
        where: { orderId, direction: "OUT", costType: "MATERIAL" },
        _sum: { totalCost: true },
      });
      return result._sum.totalCost || 0;
    },

    async upsertOrderCostSummary(
      data: {
        orderId: string;
        totalAmount: number | string;
        materialCost: number | string;
        grossProfit: number | string; // 服务层计算好的毛利
      },
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      return client.orderCostSummary.upsert({
        where: { orderId: data.orderId },
        create: {
          orderId: data.orderId,
          totalAmount: data.totalAmount,
          materialCost: data.materialCost,
          grossProfit: data.grossProfit,
        },
        update: {
          materialCost: data.materialCost,
          grossProfit: data.grossProfit,
        },
      });
    },
  };
};
