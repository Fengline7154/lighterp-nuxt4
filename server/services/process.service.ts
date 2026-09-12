// server/services/process.service.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createProcessRepository } from "~~/server/repositories/postgres/process.repository";
import { createOrderProcessPlanRepository } from "~~/server/repositories/postgres/order-process-plan.repository";
import { createProductProcessTemplateRepository } from "~~/server/repositories/postgres/product-process-template.repository";
import {
  createDecimal,
  toPrismaDecimal,
} from "~~/shared/mappers/baseRepoType/decimal";
import { runInTransaction } from "~~/server/utils/transaction";
import type { TxContext } from "~~/server/infrastructure/tx";
import {
  createProcessSchema,
  updateProcessSchema,
} from "~~/shared/schemas/api/process.schema";
import { RequestContext } from "~~/shared/types/request";
export const createProcessService = (prisma: PrismaClient) => {
  const processRepo = createProcessRepository(prisma);
  const planRepo = createOrderProcessPlanRepository(prisma);
  const templateRepo = createProductProcessTemplateRepository(prisma);

  return {
    /** 获取所有标准工序 */
    async getAllProcesses() {
      return processRepo.findAll();
    },

    /** 获取订单工序计划 */
    async getOrderPlans(orderId: string) {
      return planRepo.findByOrderId(orderId);
    },
    // process.service.ts 补充

    /** 创建标准工序 */
    async create(rawdata: unknown, tx?: TxContext) {
      const data = createProcessSchema.parse(rawdata);
      return runInTransaction(tx, prisma, async (txCtx) => {
        return processRepo.create(data, txCtx);
      });
    },
    /**更新标准工序 */
    async update(id: string, rawdata: unknown, tx?: TxContext) {
      const parse = updateProcessSchema.parse(rawdata);
      return runInTransaction(tx, prisma, async (txCtx) => {
        const existing = await processRepo.findById(id, undefined, txCtx);
        if (!existing)
          throw createError({ statusCode: 404, message: "工序不存在" });
        return processRepo.update({ id }, parse, txCtx);
      });
    },

    /** 为订单生成工序计划（在进入生产时调用） */
    async generateOrderPlans(
      orderId: string,
      items: Array<{ id: string; productId: string; quantity: number }>,
      tx?: TxContext,
    ) {
      return runInTransaction(tx, prisma, async (txCtx) => {
        const existing = await planRepo.findByOrderId(orderId, tx);
        if (existing && existing.length > 0) {
          return existing; // 已存在，直接返回
        }
        for (const item of items) {
          const templates = await templateRepo.findByProductId(
            item.productId,
            txCtx,
          );

          if (templates.length > 0) {
            await planRepo.createMany(
              templates.map((t) => ({
                orderId,
                orderItemId: item.id,
                productId: item.productId,
                processId: t.processId,
                sequence: t.sequence,
                processName: t.processName,
                assignedQty: toPrismaDecimal(createDecimal(item.quantity)),
                wageType: t.wageType,
                standardHours:
                  t.standardHours != null
                    ? toPrismaDecimal(createDecimal(String(t.standardHours)))
                    : undefined,
                hourlyRate:
                  t.hourlyRate != null
                    ? toPrismaDecimal(createDecimal(String(t.hourlyRate)))
                    : undefined,
                unitPrice:
                  t.unitPrice != null
                    ? toPrismaDecimal(createDecimal(String(t.unitPrice)))
                    : undefined,
              })),
              txCtx,
            );
          } else {
            await planRepo.createMany(
              [
                {
                  orderId,
                  orderItemId: item.id,
                  productId: item.productId,
                  sequence: 1,
                  processName: "总装",
                  assignedQty: toPrismaDecimal(createDecimal(item.quantity)),
                },
              ],
              txCtx,
            );
          }
        }
      });
    },
    /** 保存订单工序计划（增删改） */
    async saveOrderPlans(
      orderId: string,
      orderItemId: string,
      plans: Array<{
        id?: string; // 有 id 表示更新，无 id 表示新增
        processId?: string | null;
        sequence: number;
        processName: string;
        wageType?: "HOURLY" | "PIECE";
        standardHours?: number | string;
        hourlyRate?: number | string;
        unitPrice?: number | string;
      }>,
      tx?: TxContext,
    ) {
      return runInTransaction(tx, prisma, async (txCtx) => {
        // 1. 查现有工序计划
        const existing = await planRepo.findByOrderItemId(orderItemId, txCtx);
        const existingIds = new Set(existing.map((p: any) => p.id));

        // 2. 处理提交的 plans
        const submittedIds = new Set(
          plans.filter((p) => p.id).map((p) => p.id as string),
        );

        // 3. 删除未提交的（前端删掉的）
        for (const oldPlan of existing) {
          if (!submittedIds.has(oldPlan.id)) {
            await planRepo.delete(oldPlan.id, txCtx);
          }
        }

        // 4. 新增或更新
        for (const plan of plans) {
          const planData = {
            processId: plan.processId || null,
            sequence: plan.sequence,
            processName: plan.processName,
            wageType: plan.wageType || "HOURLY",
            standardHours:
              plan.standardHours != null
                ? toPrismaDecimal(createDecimal(plan.standardHours))
                : undefined,
            hourlyRate:
              plan.hourlyRate != null
                ? toPrismaDecimal(createDecimal(plan.hourlyRate))
                : undefined,
            unitPrice:
              plan.unitPrice != null
                ? toPrismaDecimal(createDecimal(plan.unitPrice))
                : undefined,
          };

          if (!plan.id) {
            const orderItem = await prisma.orderItem.findUnique({
              where: { id: orderItemId },
              select: { quantity: true },
            });
            await planRepo.create(
              {
                orderId,
                orderItemId,
                ...planData,
                assignedQty: orderItem ? String(orderItem.quantity) : "0",
              },
              txCtx,
            );
          }
        }

        return planRepo.findByOrderItemId(orderItemId, txCtx);
      });
    },
    /** 添加工序计划（不影响已有工序） */
    async addOrderPlan(
      orderId: string,
      orderItemId: string,
      plan: {
        processId?: string | null;
        sequence: number;
        processName: string;
        wageType?: "HOURLY" | "PIECE";
        standardHours?: number | string;
        hourlyRate?: number | string;
        unitPrice?: number | string;
      },
      tx?: TxContext,
    ) {
      return runInTransaction(tx, prisma, async (txCtx) => {
        // 查现有工序（完整字段）

        const existing = await planRepo.findForValidation(orderItemId, txCtx);

        // 校验序号不重复
        const seqExists = existing.some(
          (p) => Number(p.sequence) === Number(plan.sequence),
        );
        if (seqExists) {
          throw createError({
            statusCode: 400,
            message: `序号 ${plan.sequence} 已存在，请使用其他序号`,
          });
        }

        // 校验工序名称不重复
        const nameExists = existing.some(
          (p) => p.processName === plan.processName,
        );
        if (nameExists) {
          throw createError({
            statusCode: 400,
            message: `工序 "${plan.processName}" 已存在`,
          });
        }

        // 查订单明细的需求数量
        const orderItem = await prisma.orderItem.findUnique({
          where: { id: orderItemId },
          select: { quantity: true },
        });

        return planRepo.create(
          {
            orderId,
            orderItemId,
            processId: plan.processId || null,
            sequence: plan.sequence,
            processName: plan.processName,
            wageType: plan.wageType || "HOURLY",
            standardHours:
              plan.standardHours != null
                ? toPrismaDecimal(createDecimal(plan.standardHours))
                : undefined,
            hourlyRate:
              plan.hourlyRate != null
                ? toPrismaDecimal(createDecimal(plan.hourlyRate))
                : undefined,
            unitPrice:
              plan.unitPrice != null
                ? toPrismaDecimal(createDecimal(plan.unitPrice))
                : undefined,
            assignedQty: orderItem ? String(orderItem.quantity) : "0",
          },
          txCtx,
        );
      });
    },
  };
};
