// server/application/customer.application.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createCustomerService } from "~~/server/services/customer.service";
import { createAuditService } from "~~/server/services/audit.service";
import { createPrismaTxContext } from "~~/server/infrastructure/tx";
import type { RequestContext } from "~~/shared/types/request";

export const createCustomerApplication = (prisma: PrismaClient) => {
  const customerService = createCustomerService(prisma);
  const auditService = createAuditService(prisma);

  return {
    async getList(filter: Record<string, any>, options: any) {
      return customerService.getList(filter, options);
    },

    async getById(id: string) {
      return customerService.getById(id);
    },

    async create(ctx: RequestContext, rawdata: unknown) {
      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);
        const customer = await customerService.create(ctx, rawdata, txCtx);

        await auditService.log(
          ctx.operatorId,
          "Customer",
          customer.id,
          "CREATE",
          {
            remark: `创建客户 ${customer.code} ${customer.name}`,
          },
        );

        return customer;
      });
    },

    async update(ctx: RequestContext, rawdata: unknown) {
      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);
        const customer = await customerService.update(ctx, rawdata, txCtx);

        await auditService.log(
          ctx.operatorId,
          "Customer",
          customer.id,
          "UPDATE",
          {
            remark: `更新客户 ${customer.name}`,
          },
        );

        return customer;
      });
    },

    async changeStatus(ctx: RequestContext, rawdata: unknown) {
      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);
        const customer = await customerService.changeStatus(
          ctx,
          rawdata,
          txCtx,
        );

        await auditService.log(
          ctx.operatorId,
          "Customer",
          customer.id,
          "STATUS_CHANGE",
          {
            field: "status",
            newValue: customer.status,
            remark: `客户 ${customer.name} 状态变更`,
          },
        );

        return customer;
      });
    },
  };
};
