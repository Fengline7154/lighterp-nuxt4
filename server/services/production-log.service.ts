// server/services/production-log.service.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createProductionLogRepository } from "~~/server/repositories/postgres/production-log.repository";
import { createOrderProcessPlanRepository } from "~~/server/repositories/postgres/order-process-plan.repository";
import {
  createDecimal,
  toPrismaDecimal,
  type IDecimal,
} from "~~/shared/mappers/baseRepoType/decimal";
import {
  submitProductionLogSchema,
  editProductionLogSchema,
  batchSubmitSchema,
} from "~~/shared/schemas/api/production-log.schema";
import { runInTransaction } from "~~/server/utils/transaction";
import type { TxContext } from "~~/server/infrastructure/tx";
import { RequestContext } from "~~/shared/types/request";
import { createOrderItemRepository } from "../repositories/postgres/order-item.repository";

export const createProductionLogService = (prisma: PrismaClient) => {
  const logRepo = createProductionLogRepository(prisma);
  const planRepo = createOrderProcessPlanRepository(prisma);
  const orderItemRepo = createOrderItemRepository(prisma);
  function calcLaborCost(params: {
    wageType?: "HOURLY" | "PIECE";
    qualifiedQty: IDecimal;
    laborHours?: number;
    hourlyRate?: number;
    unitPrice?: number;
  }): IDecimal | undefined {
    if (
      params.wageType === "HOURLY" &&
      params.laborHours != null &&
      params.hourlyRate != null
    ) {
      return createDecimal(params.laborHours).times(
        createDecimal(params.hourlyRate),
      );
    }
    if (params.wageType === "PIECE" && params.unitPrice != null) {
      return params.qualifiedQty.times(createDecimal(params.unitPrice));
    }
    return undefined;
  }

  return {
    /** 查询单条报工记录（含关联详情） */
    async getById(id: string) {
      const log = await logRepo.findFirst(
        { id },
        {
          include: {
            order: { select: { id: true, orderCode: true } },
            product: {
              select: { id: true, code: true, name: true, unit: true },
            },
            worker: { select: { id: true, code: true, name: true } },
            operator: { select: { id: true, badgeCode: true, name: true } },
            process: { select: { id: true, name: true } },
            plan: {
              select: {
                id: true,
                processName: true,
                assignedQty: true,
                completedQty: true,
                qualifiedQty: true,
                status: true,
              },
            },
          },
        },
      );
      if (!log)
        throw createError({ statusCode: 404, message: "报工记录不存在" });
      return log;
    },
    /** 提交报工 */
    async submitLog(ctx: RequestContext, rawdata: unknown, tx?: TxContext) {
      const params = submitProductionLogSchema.parse(rawdata);

      return runInTransaction(tx, prisma, async (txCtx) => {
        const completedQty = createDecimal(params.completedQty);
        const qualifiedQty = createDecimal(params.qualifiedQty);
        const defectiveQty = createDecimal(params.defectiveQty);
        const laborCost = calcLaborCost({
          wageType: params.wageType,
          qualifiedQty,
          laborHours: params.laborHours,
          hourlyRate: params.hourlyRate,
          unitPrice: params.unitPrice,
        });

        // 校验：报工数量不能超出计划量
        const plan = await planRepo.findFirst(
          { id: params.planId },
          undefined,
          txCtx,
        );
        if (plan) {
          const planCompleted = createDecimal(String(plan.completedQty));
          const planAssigned = createDecimal(String(plan.assignedQty));
          const newCompleted = planCompleted.plus(qualifiedQty);
          if (newCompleted.gt(planAssigned)) {
            const remaining = planAssigned.minus(planCompleted);
            throw createError({
              statusCode: 400,
              message: `合格数量超限！计划总量: ${planAssigned.toString()}，已完成: ${planCompleted.toString()}，剩余可报: ${remaining.toString()}，本次合格: ${qualifiedQty.toString()}`,
            });
          }
        }
        const calcDefective = completedQty.minus(qualifiedQty);
        if (!calcDefective.eq(createDecimal(params.defectiveQty || 0))) {
          throw createError({
            statusCode: 400,
            message: `完成数必须等于合格数+不良数！完成: ${completedQty.toString()}，合格: ${qualifiedQty.toString()}，不良: ${params.defectiveQty || 0}`,
          });
        }

        const log = await logRepo.createLog(
          {
            planId: params.planId,
            orderId: params.orderId,
            productId: params.productId,
            processId: params.processId,
            processName: params.processName,
            completedQty: toPrismaDecimal(completedQty),
            qualifiedQty: toPrismaDecimal(qualifiedQty),
            defectiveQty: toPrismaDecimal(defectiveQty),
            wageType: params.wageType,
            laborHours: params.laborHours,
            hourlyRate: params.hourlyRate,
            unitPrice: params.unitPrice,
            laborCost: laborCost ? toPrismaDecimal(laborCost) : undefined,
            workerId: params.workerId,
            operatorId: ctx.operatorId,
            remark: params.remark,
          },
          txCtx,
        );

        // plan 已在上方获取
        if (plan) {
          const planCompleted = createDecimal(String(plan.completedQty));
          const planQualified = createDecimal(String(plan.qualifiedQty));
          const planDefective = createDecimal(String(plan.defectiveQty));
          const planAssigned = createDecimal(String(plan.assignedQty));

          const newCompleted = planCompleted.plus(completedQty);
          const newQualified = planQualified.plus(qualifiedQty);
          const newDefective = planDefective.plus(defectiveQty);
          const newStatus = newCompleted.gte(planAssigned)
            ? "COMPLETED"
            : "IN_PROGRESS";

          const updateData: any = {
            completedQty: toPrismaDecimal(newCompleted),
            qualifiedQty: toPrismaDecimal(newQualified),
            defectiveQty: toPrismaDecimal(newDefective),
            status: newStatus as any,
          };
          if (newStatus === "COMPLETED") updateData.endTime = new Date();
          if (plan.status === "PENDING") updateData.startTime = new Date();

          await planRepo.updateProgress(params.planId, updateData, txCtx);

          if (plan.orderItemId) {
            const allPlans = await planRepo.findByOrderItemId(
              plan.orderItemId,
              txCtx,
            );
            const minQualified = Math.min(
              ...allPlans.map((p: any) => Number(p.qualifiedQty)),
            );
            await orderItemRepo.updateProducedQty(
              plan.orderItemId,
              toPrismaDecimal(createDecimal(minQualified)),
              txCtx,
            );
          }
        }

        return log;
      });
    },

    /** 编辑报工 */
    async reviseLog(ctx: RequestContext, rawdata: unknown, tx?: TxContext) {
      const params = editProductionLogSchema.parse(rawdata);
      return runInTransaction(tx, prisma, async (txCtx) => {
        const oldLog = await logRepo.findFirst(
          { id: params.id },
          undefined,
          txCtx,
        );
        if (!oldLog)
          throw createError({ statusCode: 404, message: "报工记录不存在" });

        // 查 plan 并校验新数量不超限
        const plan = await planRepo.findFirst(
          { id: oldLog.planId },
          undefined,
          txCtx,
        );
        if (plan) {
          const planAssigned = createDecimal(String(plan.assignedQty));
          const planCompleted = createDecimal(String(plan.completedQty));
          const oldQualified = createDecimal(String(oldLog.qualifiedQty));
          const newQualifiedQty = createDecimal(params.qualifiedQty);
          const qtyDiff = newQualifiedQty.minus(oldQualified);
          const projected = planCompleted.plus(qtyDiff);
          if (projected.gt(planAssigned)) {
            const remaining = planAssigned
              .minus(planCompleted)
              .plus(oldQualified);
            throw createError({
              statusCode: 400,
              message: `合格数量超限！计划总量: ${planAssigned.toString()}，当前已完成: ${planCompleted.toString()}，最大合格可报: ${remaining.toString()}`,
            });
          }
        }

        await logRepo.markAsOld(params.id, txCtx);

        const completedQty = createDecimal(params.completedQty);
        const qualifiedQty = createDecimal(params.qualifiedQty);
        const defectiveQty = createDecimal(params.defectiveQty);
        const wageType = params.wageType || (oldLog.wageType as any);
        const laborHours =
          params.laborHours ??
          (oldLog.laborHours ? Number(oldLog.laborHours) : undefined);
        const hourlyRate =
          params.hourlyRate ??
          (oldLog.hourlyRate ? Number(oldLog.hourlyRate) : undefined);
        const unitPrice =
          params.unitPrice ??
          (oldLog.unitPrice ? Number(oldLog.unitPrice) : undefined);
        const laborCost = calcLaborCost({
          wageType,
          qualifiedQty,
          laborHours,
          hourlyRate,
          unitPrice,
        });

        const newLog = await logRepo.createLog(
          {
            planId: oldLog.planId,
            orderId: oldLog.orderId,
            productId: oldLog.productId,
            processId: oldLog.processId || undefined,
            processName: oldLog.processName,
            completedQty: toPrismaDecimal(completedQty),
            qualifiedQty: toPrismaDecimal(qualifiedQty),
            defectiveQty: toPrismaDecimal(defectiveQty),
            wageType,
            laborHours,
            hourlyRate,
            unitPrice,
            laborCost: laborCost ? toPrismaDecimal(laborCost) : undefined,
            workerId: params.workerId || oldLog.workerId || undefined,
            operatorId: ctx.operatorId,
            remark: params.remark || `修改自 ${params.id}`,
          },
          txCtx,
        );

        if (plan) {
          const oldCompleted = createDecimal(String(oldLog.completedQty));
          const oldQualified = createDecimal(String(oldLog.qualifiedQty));
          const oldDefective = createDecimal(String(oldLog.defectiveQty));
          const qtyDiff = completedQty.minus(oldCompleted);
          const qualifiedDiff = qualifiedQty.minus(oldQualified);
          const defectiveDiff = defectiveQty.minus(oldDefective);

          const planCompleted = createDecimal(String(plan.completedQty));
          const planQualified = createDecimal(String(plan.qualifiedQty));
          const planDefective = createDecimal(String(plan.defectiveQty));
          const planAssigned = createDecimal(String(plan.assignedQty));

          const newCompleted = planCompleted.plus(qtyDiff);
          const newStatus = newCompleted.gte(planAssigned)
            ? "COMPLETED"
            : "IN_PROGRESS";

          await planRepo.updateProgress(
            oldLog.planId,
            {
              completedQty: toPrismaDecimal(newCompleted),
              qualifiedQty: toPrismaDecimal(planQualified.plus(qualifiedDiff)),
              defectiveQty: toPrismaDecimal(planDefective.plus(defectiveDiff)),
              status: newStatus as any,
            },
            txCtx,
          );
        }
        // 更新成品完工数量
        const updatedPlan = await planRepo.findFirst(
          { id: oldLog.planId },
          undefined,
          txCtx,
        );
        if (updatedPlan?.orderItemId) {
          const allPlans = await planRepo.findByOrderItemId(
            updatedPlan.orderItemId,
            txCtx,
          );
          const minQualified = Math.min(
            ...allPlans.map((p: any) => Number(p.qualifiedQty)),
          );
          await orderItemRepo.updateProducedQty(
            updatedPlan.orderItemId,
            toPrismaDecimal(createDecimal(minQualified)),
            txCtx,
          );
        }

        return newLog;
      });
    },

    /** 批量报工 */
    async batchSubmitLogs(
      ctx: RequestContext,
      rawdata: unknown,
      tx?: TxContext,
    ) {
      const { reports } = batchSubmitSchema.parse(rawdata);

      return runInTransaction(tx, prisma, async (txCtx) => {
        const logs: any[] = [];

        for (const report of reports) {
          const completedQty = createDecimal(report.completedQty);
          const qualifiedQty = createDecimal(report.qualifiedQty);
          const defectiveQty = createDecimal(report.defectiveQty);

          // 校验超限
          const plan = await planRepo.findFirst(
            { id: report.planId },
            undefined,
            txCtx,
          );
          if (plan) {
            const planAssigned = createDecimal(String(plan.assignedQty));
            const planCompleted = createDecimal(String(plan.completedQty));
            const newCompleted = planCompleted.plus(qualifiedQty);
            if (newCompleted.gt(planAssigned)) {
              const remaining = planAssigned.minus(planCompleted);
              throw createError({
                statusCode: 400,
                message: `${plan.processName} 合格数量超限！计划: ${planAssigned.toString()}，剩余: ${remaining.toString()}，本次合格: ${qualifiedQty.toString()}`,
              });
            }
          }
          const calcDefective = completedQty.minus(qualifiedQty);
          if (!calcDefective.eq(createDecimal(report.defectiveQty || 0))) {
            throw createError({
              statusCode: 400,
              message: `完成数必须等于合格数+不良数！完成: ${completedQty.toString()}，合格: ${qualifiedQty.toString()}，不良: ${report.defectiveQty || 0}`,
            });
          }

          const laborCost = calcLaborCost({
            wageType: report.wageType,
            qualifiedQty,
            laborHours: report.laborHours,
            hourlyRate: report.hourlyRate,
            unitPrice: report.unitPrice,
          });

          const log = await logRepo.createLog(
            {
              planId: report.planId,
              orderId: report.orderId,
              productId: report.productId,
              processId: report.processId,
              processName: report.processName,
              workerId: report.workerId,
              completedQty: toPrismaDecimal(completedQty),
              qualifiedQty: toPrismaDecimal(qualifiedQty),
              defectiveQty: toPrismaDecimal(defectiveQty),
              wageType: report.wageType || "HOURLY",
              laborHours: report.laborHours,
              hourlyRate: report.hourlyRate,
              unitPrice: report.unitPrice,
              laborCost: laborCost ? toPrismaDecimal(laborCost) : undefined,
              operatorId: ctx.operatorId,
              remark: report.remark,
            },
            txCtx,
          );

          if (plan) {
            const planCompleted = createDecimal(String(plan.completedQty));
            const planQualified = createDecimal(String(plan.qualifiedQty));
            const planDefective = createDecimal(String(plan.defectiveQty));
            const planAssigned = createDecimal(String(plan.assignedQty));

            const newCompleted = planCompleted.plus(completedQty);
            const newQualified = planQualified.plus(qualifiedQty);
            const newDefective = planDefective.plus(defectiveQty);
            const newStatus = newCompleted.gte(planAssigned)
              ? "COMPLETED"
              : "IN_PROGRESS";

            const updateData: any = {
              completedQty: toPrismaDecimal(newCompleted),
              qualifiedQty: toPrismaDecimal(newQualified),
              defectiveQty: toPrismaDecimal(newDefective),
              status: newStatus as any,
            };
            if (newStatus === "COMPLETED") updateData.endTime = new Date();
            if (plan.status === "PENDING") updateData.startTime = new Date();

            await planRepo.updateProgress(report.planId, updateData, txCtx);
          }

          logs.push(log);
        }
        // 批量更新成品完工数量
        const updatedOrderItems = new Set<string>();
        for (const report of reports) {
          const plan = await planRepo.findFirst(
            { id: report.planId },
            undefined,
            txCtx,
          );
          if (plan?.orderItemId) updatedOrderItems.add(plan.orderItemId);
        }

        for (const orderItemId of updatedOrderItems) {
          const allPlans = await planRepo.findByOrderItemId(orderItemId, txCtx);
          const minQualified = Math.min(
            ...allPlans.map((p: any) => Number(p.qualifiedQty)),
          );
          await orderItemRepo.updateProducedQty(
            orderItemId,
            toPrismaDecimal(createDecimal(minQualified)),
            txCtx,
          );
        }

        return {
          success: true,
          count: logs.length,
          logIds: logs.map((l: any) => l.id),
        };
      });
    },

    /** 查询订单报工记录 */
    async getByOrderId(orderId: string) {
      return logRepo.findLatestByOrderId(orderId);
    },

    /** 查询报工记录列表 */
    async getList(params: {
      page: number;
      limit: number;
      keyword?: string;
      startDate?: string;
      endDate?: string;
    }) {
      return logRepo.findAllWithFilters(params);
    },
  };
};
