// server/repositories/postgres/inventory-log.repository.ts
import type { LogRelatedType, PrismaClient } from "~~/prisma/generated/client";
import { createPrismaBaseRepository } from "../base/prisma.base.repository";
import type { TxContext } from "~~/server/infrastructure/tx";

export const createInventoryLogRepository = (prisma: PrismaClient) => {
  const baseRepo = createPrismaBaseRepository(prisma, "inventoryLog");
  const getClient = (tx?: TxContext) => tx?.prisma ?? prisma;

  return {
    ...baseRepo,

    /** 创建库存流水记录 */
    async createLog(
      data: {
        productId: string;
        type: LogRelatedType;
        quantity: number | string;
        beforeQty: number | string;
        afterQty: number | string;
        relatedCode?: string;
        remark?: string;
        operatorId: string;
        locationId?: string;
      },
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      return client.inventoryLog.create({ data });
    },

    /** 查询库存流水列表（带关联信息） */
    async findManyWithDetails(
      params: {
        page: number;
        limit: number;
        keyword?: string;
        type?: string;
        startDate?: string;
        endDate?: string;
      },
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      const where: any = {};

      if (params.keyword) {
        where.OR = [
          { product: { code: { contains: params.keyword } } },
          { product: { name: { contains: params.keyword } } },
          { relatedCode: { contains: params.keyword } },
          { remark: { contains: params.keyword } },
        ];
      }
      if (params.type) where.type = params.type;
      if (params.startDate || params.endDate) {
        where.createdAt = {};
        if (params.startDate) where.createdAt.gte = new Date(params.startDate);
        if (params.endDate) where.createdAt.lte = new Date(params.endDate);
      }

      const skip = (params.page - 1) * params.limit;
      const [data, total] = await Promise.all([
        client.inventoryLog.findMany({
          where,
          skip,
          take: params.limit,
          orderBy: { createdAt: "desc" },
          include: {
            location: { select: { code: true, name: true } },
            product: { select: { code: true, name: true } },
            operator: { select: { badgeCode: true, name: true } },
          },
        }),
        client.inventoryLog.count({ where }),
      ]);

      return {
        data,
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(total / params.limit),
      };
    },
  };
};
