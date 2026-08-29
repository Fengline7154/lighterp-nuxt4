// server/repositories/postgres/order-item.repository.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createPrismaBaseRepository } from "../base/prisma.base.repository";
import type { TxContext } from "~~/server/infrastructure/tx";

export const createOrderItemRepository = (prisma: PrismaClient) => {
  const baseRepo = createPrismaBaseRepository(prisma, "orderItem");
  const getClient = (tx?: TxContext) => tx?.prisma ?? prisma;

  return {
    ...baseRepo,

    /**
     * 根据 ID 查询订单明细（含产品信息）
     */
    async findByIdWithProduct(id: string, tx?: TxContext) {
      const client = getClient(tx);
      return client.orderItem.findUnique({
        where: { id },
        include: {
          product: { select: { name: true, code: true } },
        },
      });
    },

    /**
     * 查询某个产品是否被进行中的订单引用
     * 用于产品停用时校验
     */
    async findActiveByProductId(productId: string, tx?: TxContext) {
      const client = getClient(tx);
      return client.orderItem.findFirst({
        where: {
          productId,
          order: {
            status: { in: ["PENDING", "APPROVED", "PRODUCING"] },
          },
        },
        select: { id: true, order: { select: { orderCode: true } } },
      });
    },

    /** 根据 ID 更新订单明细 */
    async updateOrderItem(
      id: string,
      data: Record<string, any>,
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      return client.orderItem.update({ where: { id }, data });
    },

    /** 根据订单 ID 查询所有明细 */
    async findByOrderId(orderId: string, tx?: TxContext) {
      const client = getClient(tx);
      return client.orderItem.findMany({ where: { orderId } });
    },
    /** 根据 ID 查询订单明细（含产品名和订单ID，用于校验） */
    async findByIdForReceipt(id: string, tx?: TxContext) {
      const client = getClient(tx);
      return client.orderItem.findUnique({
        where: { id },
        select: {
          id: true,
          orderId: true,
          productId: true,
          quantity: true,
          fulfilledQuantity: true,
          bomId: true,
          product: { select: { name: true } },
        },
      });
    },

    // order-item.repository.ts 新增方法

    /** 更新 fulfilledQuantity（入库时调用） */
    async incrementFulfilledQty(
      id: string,
      amount: number | string,
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      return client.orderItem.update({
        where: { id },
        data: { fulfilledQuantity: { increment: amount } },
      });
    },
    /** 更新 producedQuantity（报工时调用） */
    async updateProducedQty(id: string, qty: number | string, tx?: TxContext) {
      const client = getClient(tx);
      return client.orderItem.update({
        where: { id },
        data: { producedQty: qty },
      });
    },

    /** 增量更新 producedQty */
    async incrementProducedQty(
      id: string,
      qty: number | string,
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      return client.orderItem.update({
        where: { id },
        data: { producedQty: { increment: qty } },
      });
    },
  };
};
