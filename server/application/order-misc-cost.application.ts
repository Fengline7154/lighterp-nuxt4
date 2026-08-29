// server/application/order-misc-cost.application.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createOrderMiscCostService } from "~~/server/services/order-misc-cost.service";
import { createAuditService } from "~~/server/services/audit.service";
import { createPrismaTxContext } from "~~/server/infrastructure/tx";
import type { RequestContext } from "~~/shared/types/request";

export const createOrderMiscCostApplication = (prisma: PrismaClient) => {
  const miscCostService = createOrderMiscCostService(prisma);
  const auditService = createAuditService(prisma);

  return {
    async getList(params: any) {
      return miscCostService.getList(params);
    },

    async getByOrderId(orderId: string) {
      return miscCostService.getByOrderId(orderId);
    },

    async create(ctx: RequestContext, rawdata: unknown) {
      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        const cost = await miscCostService.addCost(
          {
            ...(rawdata as any),
            operatorId: ctx.operatorId,
          },
          txCtx,
        );

        await auditService.log(
          ctx.operatorId,
          "OrderMiscCost",
          cost.id,
          "CREATE",
          {
            remark: `新增杂费：${cost.description}，金额 ¥${cost.amount}`,
          },
        );

        return cost;
      });
    },

    async voidCost(ctx: RequestContext, id: string) {
      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        const cost = await miscCostService.voidCost(id, txCtx);

        await auditService.log(ctx.operatorId, "OrderMiscCost", id, "VOID", {
          remark: `作废杂费：${cost.description}，金额 ¥${cost.amount}`,
        });

        return cost;
      });
    },

    async getWageSummary(params: any) {
      return miscCostService.getWageSummary(params);
    },
  };
};
