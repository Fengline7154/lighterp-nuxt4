// server/repositories/postgres/order-misc-cost.repository.ts
import type { PrismaClient, MiscCostType } from "~~/prisma/generated/client";
import { createPrismaBaseRepository } from "../base/prisma.base.repository";
import type { TxContext } from "~~/server/infrastructure/tx";

export const createOrderMiscCostRepository = (prisma: PrismaClient) => {
  const baseRepo = createPrismaBaseRepository(prisma, "orderMiscCost");
  const getClient = (tx?: TxContext) => tx?.prisma ?? prisma;

  return {
    ...baseRepo,

    /** 按订单 ID 查询杂项费用（默认只查有效） */
    async findByOrderId(orderId: string, tx?: TxContext) {
      const client = getClient(tx);
      return client.orderMiscCost.findMany({
        where: { orderId, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        include: {
          order: { select: { orderCode: true } },
          worker: { select: { code: true, name: true } },
        },
      });
    },

    /** 分页查询杂费列表（支持筛选） */
    async findMany(
      where: any,
      options: {
        page: number;
        limit: number;
        orderBy?: any;
      },
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      const { page, limit, orderBy } = options;
      const [data, total] = await Promise.all([
        client.orderMiscCost.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: orderBy || { createdAt: "desc" },
          include: {
            order: { select: { orderCode: true } },
            worker: { select: { code: true, name: true } },
            operator: { select: { badgeCode: true, name: true } },
          },
        }),
        client.orderMiscCost.count({ where }),
      ]);

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    },

    /** 创建杂项费用记录 */
    async createCost(
      data: {
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
      const client = getClient(tx);
      return client.orderMiscCost.create({
        data: {
          ...data,
          status: "ACTIVE",
        },
        include: {
          order: { select: { orderCode: true } },
          worker: { select: { code: true, name: true } },
        },
      });
    },

    /** 作废杂项费用记录（软删除） */
    async voidCost(id: string, tx?: TxContext) {
      const client = getClient(tx);
      return client.orderMiscCost.update({
        where: { id },
        data: { status: "VOIDED" },
        include: {
          order: { select: { orderCode: true } },
          worker: { select: { code: true, name: true } },
        },
      });
    },

    /** 按 ID 查询单条记录 */
    async findById(id: string, tx?: TxContext) {
      const client = getClient(tx);
      return client.orderMiscCost.findUnique({
        where: { id },
        include: {
          order: { select: { orderCode: true } },
          worker: { select: { code: true, name: true } },
        },
      });
    },

    /** 工资汇总查询 */
    async wageSummary(where: any, groupBy: string, tx?: TxContext) {
      const client = getClient(tx);

      const records = await client.orderMiscCost.findMany({
        where: { ...where, status: "ACTIVE" },
        include: {
          order: { select: { orderCode: true } },
          worker: { select: { code: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      // 分组聚合
      const groups = new Map<string, any>();
      for (const record of records) {
        let key = "";
        if (groupBy === "worker") {
          key = record.worker?.name || record.workerName || "未指定";
        } else if (groupBy === "order") {
          key = record.order?.orderCode || "未绑定订单";
        } else if (groupBy === "costType") {
          key = record.costType;
        } else {
          key = "全部";
        }

        if (!groups.has(key)) {
          groups.set(key, {
            key,
            totalAmount: 0,
            count: 0,
            records: [],
          });
        }
        const group = groups.get(key)!;
        group.totalAmount += Number(record.amount);
        group.count += 1;
        group.records.push(record);
      }

      return [...groups.values()];
    },
  };
};
