// server/application/location.application.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createLocationService } from "~~/server/services/location.service";
import { createAuditService } from "~~/server/services/audit.service";
import { createPrismaTxContext } from "~~/server/infrastructure/tx";
import type { RequestContext } from "~~/shared/types/request";

export const createLocationApplication = (prisma: PrismaClient) => {
  const locationService = createLocationService(prisma);
  const auditService = createAuditService(prisma);

  return {
    async getList(params: any) {
      return locationService.getList(params);
    },

    async getAll() {
      return locationService.getAll();
    },

    async getById(id: string) {
      return locationService.getById(id);
    },

    async create(ctx: RequestContext, rawdata: unknown) {
      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);
        const location = await locationService.create(rawdata as any, txCtx);

        await auditService.log(
          ctx.operatorId,
          "Location",
          location.id,
          "CREATE",
          {
            remark: `创建库位 ${location.code} ${location.name}`,
          },
        );

        return location;
      });
    },

    async update(ctx: RequestContext, id: string, rawdata: unknown) {
      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);
        const location = await locationService.update(
          id,
          rawdata as any,
          txCtx,
        );

        await auditService.log(ctx.operatorId, "Location", id, "UPDATE", {
          remark: `更新库位 ${location.name}`,
        });

        return location;
      });
    },

    async deactivate(ctx: RequestContext, id: string) {
      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);
        const location = await locationService.deactivate(id, txCtx);

        await auditService.log(
          ctx.operatorId,
          "Location",
          id,
          "STATUS_CHANGE",
          {
            field: "status",
            newValue: "INACTIVE",
            remark: `库位 ${location.name} 停用`,
          },
        );

        return location;
      });
    },
  };
};
