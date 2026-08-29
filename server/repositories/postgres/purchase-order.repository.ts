// server/repositories/postgres/purchase-order.repository.ts
import type {
  PrismaClient,
  PurchaseOrderStatus,
} from "~~/prisma/generated/client";
import { createPrismaBaseRepository } from "../base/prisma.base.repository";
import type { TxContext } from "~~/server/infrastructure/tx";

export const createPurchaseOrderRepository = (prisma: PrismaClient) => {
  const baseRepo = createPrismaBaseRepository(prisma, "purchaseOrder");
  const getClient = (tx?: TxContext) => tx?.prisma ?? prisma;

  return {
    ...baseRepo,

    /** 创建采购单（含明细） */
    async createWithItems(
      data: {
        orderCode: string;
        supplierId: string;
        createdById: string;
        expectedDate?: Date;
        totalAmount: number | string;
        remark?: string;
        items: Array<{
          productId: string;
          productName: string;
          spec?: string;
          unit?: string;
          quantity: number | string;
          unitPrice: number | string;
        }>;
      },
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      return client.purchaseOrder.create({
        data: {
          orderCode: data.orderCode,
          supplierId: data.supplierId,
          createdById: data.createdById,
          expectedDate: data.expectedDate,
          totalAmount: data.totalAmount,
          remark: data.remark,
          items: { create: data.items },
        },
        include: { items: true },
      });
    },

    /** 更新采购单状态 */
    async updateStatus(
      id: string,
      status: PurchaseOrderStatus,
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      return client.purchaseOrder.update({ where: { id }, data: { status } });
    },

    /** 审批通过 */
    async approve(id: string, approvedById: string, tx?: TxContext) {
      const client = getClient(tx);
      return client.purchaseOrder.update({
        where: { id },
        data: { status: "APPROVED", approvedById, approvedAt: new Date() },
      });
    },

    /** 更新明细已入库数量 */
    async incrementReceivedQty(
      itemId: string,
      qty: number | string,
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      return client.purchaseOrderItem.update({
        where: { id: itemId },
        data: { receivedQty: { increment: qty } },
      });
    },

    /** 根据订单号查 ID */
    async findIdByOrderCode(
      orderCode: string,
      tx?: TxContext,
    ): Promise<string | null> {
      const client = getClient(tx);
      const order = await client.purchaseOrder.findFirst({
        where: { orderCode },
        select: { id: true },
      });
      return order?.id || null;
    },
  };
};
