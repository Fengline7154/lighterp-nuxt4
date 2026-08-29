// server/repositories/postgres/purchase-receipt.repository.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import type { TxContext } from "~~/server/infrastructure/tx";

export const createPurchaseReceiptRepository = (prisma: PrismaClient) => {
  const getClient = (tx?: TxContext) => tx?.prisma ?? prisma;

  return {
    /** 创建采购入库记录 */
    async create(
      data: {
        receiptCode: string;
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
      const client = getClient(tx);
      return client.purchaseReceipt.create({ data });
    },

    /** 按采购单 ID 查询入库记录 */
    async findByOrderId(orderId: string, tx?: TxContext) {
      const client = getClient(tx);
      return client.purchaseReceipt.findMany({
        where: { orderId },
        include: {
          orderItem: { select: { productName: true } },
          operator: { select: { badgeCode: true, name: true } },
          location: { select: { code: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    },

    /** 分页查询 */
    async findMany(
      filter: {
        page: number;
        limit: number;
        orderId?: string;
        productId?: string;
        startDate?: Date;
        endDate?: Date;
      },
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      const where: any = {};
      if (filter.orderId) where.orderId = filter.orderId;
      if (filter.productId) where.productId = filter.productId;
      if (filter.startDate || filter.endDate) {
        where.createdAt = {};
        if (filter.startDate) where.createdAt.gte = filter.startDate;
        if (filter.endDate)
          where.createdAt.lte = new Date(
            new Date(filter.endDate).setHours(23, 59, 59, 999),
          );
      }

      const skip = (filter.page - 1) * filter.limit;
      const [data, total] = await Promise.all([
        client.purchaseReceipt.findMany({
          where,
          skip,
          take: filter.limit,
          orderBy: { createdAt: "desc" },
          include: {
            order: { select: { orderCode: true } },
            orderItem: { select: { productName: true } },
            operator: { select: { badgeCode: true, name: true } },
            location: { select: { code: true, name: true } },
          },
        }),
        client.purchaseReceipt.count({ where }),
      ]);

      return {
        data,
        total,
        page: filter.page,
        limit: filter.limit,
        totalPages: Math.ceil(total / filter.limit),
      };
    },
  };
};
