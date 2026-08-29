// server/application/supplier.application.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createSupplierService } from "~~/server/services/supplier.service";
import { createAuditService } from "~~/server/services/audit.service";
import { createPrismaTxContext } from "~~/server/infrastructure/tx";
import type { RequestContext } from "~~/shared/types/request";

export const createSupplierApplication = (prisma: PrismaClient) => {
  const supplierService = createSupplierService(prisma);
  const auditService = createAuditService(prisma);

  return {
    async getList(params: any, canViewSensitive: boolean = false) {
      return supplierService.getList(params, canViewSensitive);
    },

    async getById(id: string, canViewSensitive: boolean = false) {
      return supplierService.getById(id, canViewSensitive);
    },

    async create(ctx: RequestContext, rawdata: unknown) {
      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);
        const supplier = await supplierService.create(rawdata as any, txCtx);

        await auditService.log(
          ctx.operatorId,
          "Supplier",
          supplier.code || supplier.id,
          "CREATE",
          {
            remark: `创建供应商 ${supplier.code} ${supplier.name}`,
          },
        );

        return supplier;
      });
    },

    async update(ctx: RequestContext, id: string, rawdata: unknown) {
      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);
        const supplier = await supplierService.update(
          id,
          rawdata as any,
          txCtx,
        );

        await auditService.log(
          ctx.operatorId,
          "Supplier",
          supplier.code || id,
          "UPDATE",
          {
            remark: `更新供应商 ${supplier.name}`,
          },
        );

        return supplier;
      });
    },
  };
};
