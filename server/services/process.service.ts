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
  };
};
