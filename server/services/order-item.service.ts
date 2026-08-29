// server/services/order-item.service.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createOrderItemRepository } from "~~/server/repositories/postgres/order-item.repository";
import { runInTransaction } from "~~/server/utils/transaction";
import type { TxContext } from "~~/server/infrastructure/tx";

export const createOrderItemService = (prisma: PrismaClient) => {
  const repo = createOrderItemRepository(prisma);

  return {
    /** 根据 ID 查询（含产品信息） */
    async findByIdWithProduct(id: string, tx?: TxContext) {
      return repo.findByIdWithProduct(id, tx);
    },
    /** 按订单ID和产品ID查明细 */
    async findByOrderIdAndProductId(
      orderId: string,
      productId: string,
      tx?: TxContext,
    ) {
      const client = tx?.prisma ?? prisma;
      return client.orderItem.findFirst({
        where: { orderId, productId },
        select: {
          id: true,
          quantity: true,
          fulfilledQuantity: true,
          productId: true,
        },
      });
    },
    /** 更新 fulfilledQuantity */
    async incrementFulfilledQty(
      id: string,
      amount: number | string,
      tx?: TxContext,
    ) {
      return runInTransaction(tx, prisma, async (txCtx) => {
        return repo.updateOrderItem(
          id,
          { fulfilledQuantity: { increment: amount } },
          txCtx,
        );
      });
    },

    /** 更新 shippedQuantity */
    async incrementShippedQty(
      id: string,
      amount: number | string,
      tx?: TxContext,
    ) {
      return runInTransaction(tx, prisma, async (txCtx) => {
        return repo.updateOrderItem(
          id,
          { shippedQuantity: { increment: amount } },
          txCtx,
        );
      });
    },

    /** 按订单 ID 查询所有明细 */
    async findByOrderId(orderId: string, tx?: TxContext) {
      return repo.findByOrderId(orderId, tx);
    },

    /** 锁定 BOM 快照 */
    async snapshotBom(
      id: string,
      bomId: string,
      bomVersion: number,
      tx?: TxContext,
    ) {
      return runInTransaction(tx, prisma, async (txCtx) => {
        return repo.updateOrderItem(id, { bomId, bomVersion }, txCtx);
      });
    },
  };
};
