// server/services/cost.service.ts
import { createCostRepository } from "~~/server/repositories/postgres/cost.repository";
import type {
  PrismaClient,
  CostDirection,
  CostSourceType,
} from "~~/prisma/generated/client";
import type { TxContext } from "~~/server/infrastructure/tx";
import {
  createDecimal,
  toPrismaDecimal,
  type IDecimal,
} from "~~/shared/mappers/baseRepoType/decimal";
import { runInTransaction } from "~~/server/utils/transaction";

export const createCostService = (prisma: PrismaClient) => {
  const costRepo = createCostRepository(prisma);

  /**
   * 加权平均成本计算（全程 IDecimal 精确运算）
   */
  async function calculateWeightedAverageCost(
    productId: string,
    tx?: TxContext,
  ): Promise<IDecimal> {
    const entries = await costRepo.getProductInEntries(productId, tx);
    if (entries.length === 0) return createDecimal(0);

    let totalCost = createDecimal(0);
    let totalQty = createDecimal(0);

    for (const e of entries) {
      totalCost = totalCost.plus(e.totalCost);
      totalQty = totalQty.plus(e.quantity);
    }

    return totalQty.gt(0) ? totalCost.div(totalQty) : createDecimal(0);
  }

  return {
    /** 入库成本记录 */
    async recordInboundCost(
      params: {
        inventoryLogId: string;
        productId: string;
        quantity: number | string;
        unitCost: number | string;
        direction: CostDirection;
        sourceType: CostSourceType;
        remark?: string;
      },
      tx?: TxContext,
    ) {
      return runInTransaction(tx, prisma, async (txCtx) => {
        const qty = createDecimal(params.quantity);
        const cost = createDecimal(params.unitCost);
        const totalCost = qty.times(cost);

        return costRepo.createEntry(
          {
            inventoryLogId: params.inventoryLogId,
            productId: params.productId,
            quantity: toPrismaDecimal(qty),
            unitCost: toPrismaDecimal(cost),
            totalCost: toPrismaDecimal(totalCost),
            direction: params.direction,
            sourceType: params.sourceType,
            remark: params.remark,
          },
          txCtx,
        );
      });
    },

    /** 出库成本记录（自动计算加权平均单价） */
    async recordOutboundCost(
      params: {
        inventoryLogId: string;
        productId: string;
        quantity: number | string;
        direction: CostDirection;
        sourceType: CostSourceType;
        orderId?: string;
        remark?: string;
      },
      tx?: TxContext,
    ) {
      return runInTransaction(tx, prisma, async (txCtx) => {
        const qty = createDecimal(params.quantity);
        const unitCost = await calculateWeightedAverageCost(
          params.productId,
          txCtx,
        );
        const totalCost = qty.times(unitCost);

        return costRepo.createEntry(
          {
            inventoryLogId: params.inventoryLogId,
            productId: params.productId,
            quantity: toPrismaDecimal(qty),
            unitCost: toPrismaDecimal(unitCost),
            totalCost: toPrismaDecimal(totalCost),
            direction: params.direction,
            sourceType: params.sourceType,
            orderId: params.orderId,
            remark: params.remark,
          },
          txCtx,
        );
      });
    },

    /** 订单成本汇总 */
    async summarizeOrderCost(
      orderId: string,
      totalAmount: number | string,
      tx?: TxContext,
    ) {
      return runInTransaction(tx, prisma, async (txCtx) => {
        const materialCost = await costRepo.getOrderMaterialCost(
          orderId,
          txCtx,
        );

        const total = createDecimal(totalAmount);
        const material = createDecimal(String(materialCost));
        const grossProfit = total.minus(material);

        return costRepo.upsertOrderCostSummary(
          {
            orderId,
            totalAmount: toPrismaDecimal(total),
            materialCost: toPrismaDecimal(material),
            grossProfit: toPrismaDecimal(grossProfit),
          },
          txCtx,
        );
      });
    },
  };
};
