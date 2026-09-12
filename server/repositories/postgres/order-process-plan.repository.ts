// server/repositories/postgres/order-process-plan.repository.ts
import type {
  PrismaClient,
  PlanStatus,
  WageType,
} from "~~/prisma/generated/client";
import { createPrismaBaseRepository } from "../base/prisma.base.repository";
import type { TxContext } from "~~/server/infrastructure/tx";

export const createOrderProcessPlanRepository = (prisma: PrismaClient) => {
  const baseRepo = createPrismaBaseRepository(prisma, "orderProcessPlan");
  const getClient = (tx?: TxContext) => tx?.prisma ?? prisma;

  return {
    ...baseRepo,

    /** 按订单 ID 查询工序计划 */
    async findByOrderId(orderId: string, tx?: TxContext) {
      const client = getClient(tx);
      return client.orderProcessPlan.findMany({
        where: { orderId },
        orderBy: { sequence: "asc" },
        include: {
          product: { select: { name: true } },
          orderItem: { select: { productName: true } },
        },
      });
    },

    /** 按产品 ID 查询工序计划 */
    async findByProductId(productId: string, tx?: TxContext) {
      const client = getClient(tx);
      return client.orderProcessPlan.findMany({
        where: { productId },
        orderBy: { sequence: "asc" },
      });
    },

    /** 批量创建工序计划 */
    async createMany(
      data: Array<{
        productId?: string;
        orderId: string;
        orderItemId: string;
        processId?: string | null;
        sequence: number;
        processName: string;
        wageType?: WageType;
        unitPrice?: number | string;
        assignedQty: number | string;
        standardHours?: number | string;
        hourlyRate?: number | string;
      }>,
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      return client.orderProcessPlan.createMany({ data });
    },

    /** 更新工序计划进度 */
    async updateProgress(
      id: string,
      data: {
        completedQty?: number | string;
        qualifiedQty?: number | string;
        defectiveQty?: number | string;
        status?: PlanStatus;
        startTime?: Date;
        endTime?: Date;
      },
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      return client.orderProcessPlan.update({
        where: { id },
        data,
      });
    },
    //根据订单物料明细id查找订单计划
    async findByOrderItemId(orderItemId: string, tx?: TxContext) {
      const client = getClient(tx);
      return client.orderProcessPlan.findMany({
        where: { orderItemId },
        select: { id: true, qualifiedQty: true },
      });
    },
    /** 按订单明细 ID 查询工序计划（仅校验用字段） */
    async findForValidation(orderItemId: string, tx?: TxContext) {
      const client = getClient(tx);
      return client.orderProcessPlan.findMany({
        where: { orderItemId },
        select: { id: true, sequence: true, processName: true },
      });
    },
  };
};
