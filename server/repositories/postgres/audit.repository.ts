// server/repositories/postgres/audit.repository.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import type { TxContext } from "~~/server/infrastructure/tx";

export const createAuditRepository = (prisma: PrismaClient) => {
  const getClient = (tx?: TxContext) => tx?.prisma ?? prisma;

  return {
    /**
     * 创建一条审计日志
     * 注意：审计日志通常不在业务事务内，可以不传 tx
     */
    async createLog(
      data: {
        entity: string;
        entityId: string;
        action: string;
        field?: string;
        oldValue?: string;
        newValue?: string;
        remark?: string;
        operatorId: string;
      },
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      return client.auditLog.create({ data });
    },

    /**
     * 分页查询审计日志（不含补全）
     */
    async findMany(
      options: {
        page: number;
        limit: number;
        entity?: string;
        entityId?: string;
        operatorId?: string;
        action?: string;
        startDate?: string;
        endDate?: string;
        orderBy?: any;
      },
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      const where: any = {};
      if (options.entity) where.entity = options.entity;
      if (options.entityId) where.entityId = options.entityId;
      if (options.operatorId) where.operatorId = options.operatorId;
      if (options.action) where.action = options.action;
      if (options.startDate || options.endDate) {
        where.createdAt = {};
        if (options.startDate)
          where.createdAt.gte = new Date(options.startDate);
        if (options.endDate)
          where.createdAt.lte = new Date(
            new Date(options.endDate).setHours(23, 59, 59, 999),
          );
      }

      const skip = (options.page - 1) * options.limit;
      const [data, total] = await Promise.all([
        client.auditLog.findMany({
          where,
          skip,
          take: options.limit,
          orderBy: options.orderBy || { createdAt: "desc" },
        }),
        client.auditLog.count({ where }),
      ]);

      return {
        data,
        total,
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(total / options.limit),
      };
    },
  };
};
