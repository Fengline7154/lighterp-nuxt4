// server/repositories/postgres/order.repository.ts
import type { OrderType, PrismaClient } from "~~/prisma/generated/client";
import { createPrismaBaseRepository } from "../base/prisma.base.repository";
import type { TxContext } from "~~/server/infrastructure/tx";

export const createOrderRepository = (prisma: PrismaClient) => {
  const baseRepo = createPrismaBaseRepository(prisma, "order");
  const getClient = (tx?: TxContext) => tx?.prisma ?? prisma;

  return {
    ...baseRepo,

    /**
     * 创建订单（含明细）
     * 注意：totalAmount 由服务层计算后传入，仓库只负责写入
     */
    async createOrder(
      data: {
        orderCode: string;
        createdById: string;
        department?: string;
        customerId?: string;
        deadlineAt?: Date;
        orderType?: OrderType;
        totalAmount: number | string; // 服务层计算好的总额
        items: Array<{
          productId: string;
          productName: string;
          quantity: number | string;
          unitPrice: number | string;
        }>;
      },
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      return client.order.create({
        data: {
          orderCode: data.orderCode,
          createdById: data.createdById,
          department: data.department,
          customerId: data.customerId,
          deadlineAt: data.deadlineAt,
          totalAmount: data.totalAmount,
          orderType: data.orderType,
          items: { create: data.items },
        },
        include: { items: true },
      });
    },

    /**
     * 通用更新订单（任意字段）
     */
    async updateOrder(id: string, data: Record<string, any>, tx?: TxContext) {
      const client = getClient(tx);
      return client.order.update({ where: { id }, data });
    },

    /**
     * 根据订单号查询 ID（高频查询，保留快捷方法）
     */
    async findIdByOrderCode(
      orderCode: string,
      tx?: TxContext,
    ): Promise<string | null> {
      const client = getClient(tx);
      const order = await client.order.findFirst({
        where: { orderCode },
        select: { id: true },
      });
      return order?.id || null;
    },
  };
};
