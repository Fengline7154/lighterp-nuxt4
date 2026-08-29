// server/application/process.application.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createProcessService } from "~~/server/services/process.service";
import { createProductProcessTemplateService } from "~~/server/services/product-process-template.service";
import { createAuditService } from "~~/server/services/audit.service";
import { createPrismaTxContext } from "~~/server/infrastructure/tx";
import type { RequestContext } from "~~/shared/types/request";

export const createProcessApplication = (prisma: PrismaClient) => {
  const processService = createProcessService(prisma);
  const templateService = createProductProcessTemplateService(prisma);
  const auditService = createAuditService(prisma);

  return {
    /** 工序列表 */
    async getAllProcesses() {
      return processService.getAllProcesses();
    },

    /** 创建工序 */
    async create(ctx: RequestContext, rawdata: unknown) {
      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        const process = await processService.create(rawdata, txCtx);

        await auditService.log(
          ctx.operatorId,
          "Process",
          process.id,
          "CREATE",
          {
            remark: `创建工序 ${process.name}`,
          },
        );

        return process;
      });
    },

    /** 更新工序 */
    async update(ctx: RequestContext, id: string, data: unknown) {
      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        const process = await processService.update(id, data, txCtx);

        await auditService.log(
          ctx.operatorId,
          "Process",
          process.id || "错误:更新基础工序失败",
          "UPDATE",
          {
            remark: `更新工序 ${process.name}`,
          },
        );

        return process;
      });
    },

    /** 订单工序计划查询 */
    async getOrderPlans(orderId: string) {
      return processService.getOrderPlans(orderId);
    },

    /** 产品工序模板查询 */
    async getRouting(productId: string) {
      return templateService.getByProductId(productId);
    },

    /** 保存产品工序模板 */
    async saveRouting(ctx: RequestContext, rawdata: unknown) {
      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        await templateService.saveTemplates(rawdata, txCtx);

        await auditService.log(
          ctx.operatorId,
          "Product",
          (rawdata as any).productId,
          "ROUTING_SAVE",
          {
            remark: "保存产品工序模板",
          },
        );

        return { success: true };
      });
    },
  };
};
