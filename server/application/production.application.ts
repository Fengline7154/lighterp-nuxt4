// server/application/production.application.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createProductionLogService } from "~~/server/services/production-log.service";
import { createProcessService } from "~~/server/services/process.service";
import { createAuditService } from "~~/server/services/audit.service";
import { createPrismaTxContext } from "~~/server/infrastructure/tx";
import type { RequestContext } from "~~/shared/types/request";
import { createError } from "h3";

export const createProductionApplication = (prisma: PrismaClient) => {
  const productionLogService = createProductionLogService(prisma);
  const processService = createProcessService(prisma);
  const auditService = createAuditService(prisma);

  return {
    /**
     * 查询单条报工记录（只读）
     */
    async getLogById(id: string) {
      return productionLogService.getById(id);
    },
    /**
     * 提交报工
     */
    async submitLog(ctx: RequestContext, rawdata: unknown) {
      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        const log = await productionLogService.submitLog(ctx, rawdata, txCtx);

        await auditService.log(
          ctx.operatorId,
          "ProductionLog",
          log.id,
          "CREATE",
          {
            remark: `报工提交：工序 ${log.processName}，完成 ${log.completedQty}，合格 ${log.qualifiedQty}`,
          },
        );

        return log;
      });
    },

    /**
     * 编辑报工（作废 + 重报）
     */
    async reviseLog(ctx: RequestContext, id: string, rawdata: unknown) {
      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        const newLog = await productionLogService.reviseLog(
          ctx,
          rawdata,
          txCtx,
        );

        await auditService.log(ctx.operatorId, "ProductionLog", id, "REVISE", {
          remark: `报工修改：原记录 ${id} 已作废，新记录 ${newLog.id}`,
        });

        return newLog;
      });
    },

    /**
     * 批量报工
     */
    async batchSubmitLogs(ctx: RequestContext, rawdata: unknown) {
      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        const result = await productionLogService.batchSubmitLogs(
          ctx,
          rawdata,
          txCtx,
        );

        // 为每条报工记录单独写审计，remark 带序号
        for (let i = 0; i < result.logIds.length; i++) {
          await auditService.log(
            ctx.operatorId,
            "ProductionLog",
            result.logIds[i],
            "CREATE",
            {
              remark: `批量报工：第 ${i + 1} 条 / 共 ${result.count} 条（记录ID: ${result.logIds[i]}）`,
            },
          );
        }

        return result;
      });
    },

    /**
     * 为订单生成工序计划
     */
    async generateOrderPlans(
      orderId: string,
      items: Array<{ id: string; productId: string; quantity: number }>,
      txCtx?: any,
    ) {
      return processService.generateOrderPlans(orderId, items, txCtx);
    },

    /**
     * 查询订单工序计划（只读）
     */
    async getOrderPlans(orderId: string) {
      return processService.getOrderPlans(orderId);
    },

    /**
     * 查询订单报工记录（只读）
     */
    async getOrderLogs(orderId: string) {
      return productionLogService.getByOrderId(orderId);
    },
  };
};
