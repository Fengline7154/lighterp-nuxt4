// server/services/order-misc-cost.service.ts
import type { PrismaClient, MiscCostType } from "~~/prisma/generated/client";
import { createOrderMiscCostRepository } from "~~/server/repositories/postgres/order-misc-cost.repository";
import type { TxContext } from "~~/server/infrastructure/tx";
import { createError } from "h3";

export const createOrderMiscCostService = (prisma: PrismaClient) => {
  const repo = createOrderMiscCostRepository(prisma);

  return {
    /** 获取订单杂项费用列表（只返回有效记录） */
    async getByOrderId(orderId: string) {
      return repo.findByOrderId(orderId);
    },

    /** 分页查询杂费列表 */
    async getList(params: {
      page: number;
      limit: number;
      keyword?: string;
      costType?: string;
      orderId?: string;
      workerId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    }) {
      const where: any = {
        status: params.status || "ACTIVE",
      };

      if (params.keyword) {
        where.OR = [
          { description: { contains: params.keyword } },
          { workerName: { contains: params.keyword } },
          { worker: { name: { contains: params.keyword } } },
          { order: { orderCode: { contains: params.keyword } } },
        ];
      }
      if (params.costType) where.costType = params.costType;
      if (params.orderId) where.orderId = params.orderId;
      if (params.workerId) where.workerId = params.workerId;
      if (params.startDate || params.endDate) {
        where.createdAt = {};
        if (params.startDate) where.createdAt.gte = new Date(params.startDate);
        if (params.endDate)
          where.createdAt.lte = new Date(
            new Date(params.endDate).setHours(23, 59, 59, 999),
          );
      }

      return repo.findMany(where, {
        page: params.page,
        limit: params.limit,
      });
    },

    /** 添加杂项费用 */
    async addCost(
      params: {
        orderId?: string | null;
        workerId?: string | null;
        workerName?: string | null;
        costType: MiscCostType;
        description: string;
        amount: number;
        remark?: string | null;
        operatorId: string;
      },
      tx?: TxContext,
    ) {
      if (!params.description?.trim()) {
        throw createError({ statusCode: 400, message: "请填写费用说明" });
      }
      if (!params.amount || params.amount <= 0) {
        throw createError({ statusCode: 400, message: "金额必须大于 0" });
      }

      return repo.createCost(params, tx);
    },

    /** 作废杂项费用 */
    async voidCost(id: string, tx?: TxContext) {
      const existing = await repo.findById(id, tx);
      if (!existing) {
        throw createError({ statusCode: 404, message: "杂费记录不存在" });
      }
      if (existing.status === "VOIDED") {
        throw createError({ statusCode: 400, message: "该记录已作废" });
      }
      return repo.voidCost(id, tx);
    },

    /** 工资汇总 */
    async getWageSummary(params: {
      startDate?: string;
      endDate?: string;
      orderId?: string;
      workerId?: string;
      groupBy?: string;
    }) {
      const where: any = {};

      if (params.orderId) where.orderId = params.orderId;
      if (params.workerId) where.workerId = params.workerId;
      if (params.startDate || params.endDate) {
        where.createdAt = {};
        if (params.startDate) where.createdAt.gte = new Date(params.startDate);
        if (params.endDate)
          where.createdAt.lte = new Date(
            new Date(params.endDate).setHours(23, 59, 59, 999),
          );
      }

      const groupBy = params.groupBy || "worker";
      const groups = await repo.wageSummary(where, groupBy);

      const summary = {
        totalAmount: groups.reduce((s, g) => s + g.totalAmount, 0),
        totalCount: groups.reduce((s, g) => s + g.count, 0),
        groupCount: groups.length,
      };

      return { data: groups, summary };
    },
  };
};
