// server/repositories/postgres/production-log.repository.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createPrismaBaseRepository } from "../base/prisma.base.repository";
import type { TxContext } from "~~/server/infrastructure/tx";

export const createProductionLogRepository = (prisma: PrismaClient) => {
  const baseRepo = createPrismaBaseRepository(prisma, "productionLog");
  const getClient = (tx?: TxContext) => tx?.prisma ?? prisma;

  return {
    ...baseRepo,

    /**
     * 创建报工记录
     * 注意：laborCost 由服务层计算后传入，仓库只负责写入
     */
    async createLog(
      data: {
        planId: string;
        orderId: string;
        productId: string;
        processId?: string;
        processName: string;
        completedQty: number | string;
        qualifiedQty: number | string;
        defectiveQty: number | string;
        wageType?: string;
        laborHours?: number | string;
        hourlyRate?: number | string;
        unitPrice?: number | string;
        laborCost?: number | string; // 新增：服务层计算后传入
        workerId?: string;
        operatorId: string;
        remark?: string;
      },
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      return client.productionLog.create({
        data: {
          planId: data.planId,
          orderId: data.orderId,
          productId: data.productId,
          processId: data.processId,
          processName: data.processName,
          completedQty: data.completedQty,
          qualifiedQty: data.qualifiedQty,
          defectiveQty: data.defectiveQty,
          wageType: (data.wageType as any) || "HOURLY",
          laborHours: data.laborHours,
          hourlyRate: data.hourlyRate,
          unitPrice: data.unitPrice,
          laborCost: data.laborCost,
          workerId: data.workerId || "",
          operatorId: data.operatorId,
          remark: data.remark,
        },
      });
    },

    async markAsOld(id: string, tx?: TxContext) {
      const client = getClient(tx);
      return client.productionLog.update({
        where: { id },
        data: { isLatest: false },
      });
    },

    async findLatestByOrderId(orderId: string, tx?: TxContext) {
      const client = getClient(tx);
      return client.productionLog.findMany({
        where: { orderId, isLatest: true },
        orderBy: { createdAt: "asc" },
      });
    },

    async findAllWithFilters(
      params: {
        page: number;
        limit: number;
        keyword?: string;
        startDate?: string;
        endDate?: string;
      },
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      const where: any = { isLatest: true };

      if (params.keyword) {
        where.OR = [
          { order: { orderCode: { contains: params.keyword } } },
          { product: { name: { contains: params.keyword } } },
          { worker: { code: { contains: params.keyword } } },
          { worker: { name: { contains: params.keyword } } },
        ];
      }
      if (params.startDate || params.endDate) {
        where.createdAt = {};
        if (params.startDate) where.createdAt.gte = new Date(params.startDate);
        if (params.endDate)
          where.createdAt.lte = new Date(
            new Date(params.endDate).setHours(23, 59, 59, 999),
          );
      }

      const skip = (params.page - 1) * params.limit;
      const [data, total] = await Promise.all([
        client.productionLog.findMany({
          where,
          skip,
          take: params.limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            planId: true,
            orderId: true,
            processName: true,
            completedQty: true,
            qualifiedQty: true,
            defectiveQty: true,
            wageType: true,
            operatorId: true,
            workerId: true,
            createdAt: true,
            product: { select: { code: true, name: true } },
            order: { select: { orderCode: true } },
            worker: { select: { name: true, code: true } },
            operator: { select: { badgeCode: true, name: true } },
          },
        }),
        client.productionLog.count({ where }),
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
