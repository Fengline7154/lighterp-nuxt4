// server/repositories/postgres/receipt.repository.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import type { TxContext } from "~~/server/infrastructure/tx";

export const createReceiptRepository = (prisma: PrismaClient) => {
  const getClient = (tx?: TxContext) => tx?.prisma ?? prisma;

  return {
    /**
     * 创建入库单记录
     */
    async createReceipt(
      data: {
        orderId: string;
        orderItemId: string;
        productId: string;
        quantity: number;
        receiptCode: string;
        operatorId: string;
        remark?: string;
        locationId?: string;
      },
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      return client.orderReceipt.create({ data });
    },

    /**
     * 根据 ID 查询入库单，包含订单和产品信息
     */
    async findByIdWithDetails(id: string, tx?: TxContext) {
      const client = getClient(tx);
      return client.orderReceipt.findUnique({
        where: { id },
        include: {
          order: { select: { orderCode: true } },

          orderItem: {
            select: {
              product: { select: { name: true, code: true } },
              quantity: true,
            },
          },
          operator: { select: { badgeCode: true, name: true } },
        },
      });
    },

    /**
     * 分页查询入库单列表，包含订单和产品信息
     */
    async findManyWithDetails(
      filter: {
        receiptCode?: string;
        orderId?: string;
        productId?: string;
        startDate?: Date;
        endDate?: Date;
        page: number;
        limit: number;
        sortField?: string;
        sortDir?: string;
      },
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      const {
        page,
        limit,
        receiptCode,
        orderId,
        productId,
        startDate,
        endDate,
        sortField,
        sortDir,
      } = filter;
      const where: any = {};
      if (receiptCode) where.receiptCode = { contains: receiptCode };
      if (orderId) where.orderId = orderId;
      if (productId) where.productId = productId;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate)
          where.createdAt.lte = new Date(
            new Date(endDate).setHours(23, 59, 59, 999),
          );
      }
      const orderBy: any = {};
      orderBy[sortField || "createdAt"] = sortDir || "desc";

      const [data, total] = await Promise.all([
        client.orderReceipt.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy,
          select: {
            id: true,
            receiptCode: true,
            orderId: true,
            productId: true,
            quantity: true,
            operatorId: true,
            createdAt: true,
            order: { select: { orderCode: true } },
            orderItem: { select: { product: { select: { name: true } } } },
            operator: { select: { badgeCode: true, name: true } },
            location: { select: { code: true, name: true } },
          },
        }),
        client.orderReceipt.count({ where }),
      ]);
      return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    },

    /**
     * 批量查询操作人信息（返回 badgeCode 映射）
     */
    async getOperatorBadgeMap(operatorIds: string[], tx?: TxContext) {
      const client = getClient(tx);
      const users = await client.user.findMany({
        where: { id: { in: operatorIds } },
        select: { id: true, badgeCode: true, name: true },
      });
      return new Map(users.map((u) => [u.id, u]));
    },
  };
};
