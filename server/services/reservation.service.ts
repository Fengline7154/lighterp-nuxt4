// server/services/reservation.service.ts
import type { PrismaClient, ReservationType } from "~~/prisma/generated/client";
import { createOrderReservationRepository } from "~~/server/repositories/postgres/order-reservation.repository";
import {
  createDecimal,
  toPrismaDecimal,
  type IDecimal,
} from "~~/shared/mappers/baseRepoType/decimal";
import { runInTransaction } from "~~/server/utils/transaction";
import type { TxContext } from "~~/server/infrastructure/tx";
import { createInventoryService } from "./inventory.service";

export const createReservationService = (prisma: PrismaClient) => {
  const repo = createOrderReservationRepository(prisma);
  const inventoryService = createInventoryService(prisma);
  return {
    /** 批量创建预留记录 */
    async createMany(
      data: Array<{
        orderId: string;
        orderItemId?: string;
        productId: string;
        type: ReservationType;
        quantity: number | string;
      }>,
      tx?: TxContext,
    ) {
      return runInTransaction(tx, prisma, async (txCtx) => {
        return repo.createMany(data, txCtx);
      });
    },

    /** 查询订单所有预留 */
    async findByOrderId(orderId: string, tx?: TxContext) {
      return repo.findMany({ orderId }, { page: 1, limit: 10000 }, tx);
    },

    /** 查找未完全消耗的预留 */
    async findUnconsumed(
      orderId: string,
      productId: string,
      type: ReservationType,
      tx?: TxContext,
    ) {
      return repo.findUnconsumedByOrderAndProduct(orderId, productId, type, tx);
    },

    /** 增加消耗量 */
    async incrementConsumedQty(
      id: string,
      amount: number | string,
      tx?: TxContext,
    ) {
      return repo.incrementConsumedQty(id, amount, tx);
    },

    /** 增加释放量 */
    async incrementReleased(
      id: string,
      amount: number | string,
      tx?: TxContext,
    ) {
      return repo.incrementReleased(id, amount, tx);
    },

    /**
     * 冲销物料预留：根据物料需求 Map，按 FIFO 消耗预留记录
     */
    async consumeMaterials(
      orderId: string,
      materialMap: Map<string, IDecimal>,
      tx?: TxContext,
    ) {
      return runInTransaction(tx, prisma, async (txCtx) => {
        for (const [materialId, needed] of materialMap) {
          let remaining = needed;
          const reservations = await repo.findUnconsumedByOrderAndProduct(
            orderId,
            materialId,
            "MATERIAL_RESERVE",
            txCtx,
          );
          for (const res of reservations) {
            if (remaining.lte(0)) break;
            const total = createDecimal(String(res.quantity));
            const consumed = createDecimal(String(res.consumedQty));
            const released = createDecimal(String(res.released));
            const availableToConsume = total.minus(consumed).minus(released);
            if (availableToConsume.lte(0)) continue;
            const toConsume = remaining.lt(availableToConsume)
              ? remaining
              : availableToConsume;

            await repo.incrementConsumedQty(
              res.id,
              toPrismaDecimal(toConsume),
              txCtx,
            );

            // 同步释放库存预留
            await inventoryService.release(
              {
                productId: materialId,
                qty: Number(toConsume.toString()),
                relatedCode: orderId,
              },
              txCtx,
            );
            //扣减对应的库存量
            await inventoryService.deduct(
              {
                productId: materialId,
                quantity: Number(toConsume.toString()),
                type: "PRODUCTION_OUT",
              },
              txCtx,
            );

            remaining = remaining.minus(toConsume);
          }
        }
      });
    },

    /**
     * 释放订单所有未完全释放的预留
     */
    async releaseAll(orderId: string, tx?: TxContext) {
      return runInTransaction(tx, prisma, async (txCtx) => {
        const result = await repo.findMany(
          { orderId },
          { page: 1, limit: 10000 },
          txCtx,
        );
        for (const res of result.data) {
          const remaining = createDecimal(String(res.quantity)).minus(
            createDecimal(String(res.released)),
          );
          if (remaining.gt(0)) {
            await repo.incrementReleased(
              res.id,
              toPrismaDecimal(remaining),
              txCtx,
            );
          }
        }
      });
    },
  };
};
