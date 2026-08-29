// server/repositories/postgres/order-reservation.repository.ts
import type { PrismaClient, ReservationType } from "~~/prisma/generated/client";
import { createPrismaBaseRepository } from "../base/prisma.base.repository";
import type { TxContext } from "~~/server/infrastructure/tx";

export const createOrderReservationRepository = (prisma: PrismaClient) => {
  const baseRepo = createPrismaBaseRepository(prisma, "orderReservation");
  const getClient = (tx?: TxContext) => tx?.prisma ?? prisma;

  return {
    ...baseRepo,

    /** 按订单和产品查询未完全消耗的预留记录 */
    async findUnconsumedByOrderAndProduct(
      orderId: string,
      productId: string,
      type: ReservationType,
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      const all = await client.orderReservation.findMany({
        where: { orderId, productId, type },
        orderBy: { createdAt: "asc" },
      });
      // 过滤：有剩余可消耗的（quantity > consumedQty + released）
      return all.filter(
        (r) => Number(r.quantity) > Number(r.consumedQty) + Number(r.released),
      );
    },

    /** 更新 consumedQty */
    async incrementConsumedQty(
      id: string,
      amount: number | string,
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      return client.orderReservation.update({
        where: { id },
        data: {
          consumedQty: { increment: amount },
        },
      });
    },

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
      const client = getClient(tx);
      return client.orderReservation.createMany({ data });
    },

    /** 更新 released（释放预留） */
    async incrementReleased(
      id: string,
      amount: number | string,
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      return client.orderReservation.update({
        where: { id },
        data: {
          released: { increment: amount },
        },
      });
    },
  };
};
