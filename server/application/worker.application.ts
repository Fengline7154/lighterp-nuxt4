// server/application/worker.application.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createWorkerService } from "~~/server/services/worker.service";
import { createAuditService } from "~~/server/services/audit.service";
import { createPrismaTxContext } from "~~/server/infrastructure/tx";
import type { RequestContext } from "~~/shared/types/request";

export const createWorkerApplication = (prisma: PrismaClient) => {
  const workerService = createWorkerService(prisma);
  const auditService = createAuditService(prisma);

  return {
    async getList(params: any) {
      return workerService.getList(params);
    },

    async getAll() {
      return workerService.getAll();
    },

    async getById(id: string) {
      return workerService.getById(id);
    },

    async create(ctx: RequestContext, rawdata: unknown) {
      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);
        const worker = await workerService.create(rawdata, txCtx);

        await auditService.log(ctx.operatorId, "Worker", worker.id, "CREATE", {
          remark: `创建员工 ${worker.code} ${worker.name}`,
        });

        return worker;
      });
    },

    async update(ctx: RequestContext, id: string, rawdata: unknown) {
      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);
        const worker = await workerService.update(id, rawdata, txCtx);

        await auditService.log(ctx.operatorId, "Worker", id, "UPDATE", {
          remark: `更新员工 ${worker.name}`,
        });

        return worker;
      });
    },

    async deactivate(ctx: RequestContext, id: string) {
      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);
        const worker = await workerService.deactivate(id, txCtx);

        await auditService.log(ctx.operatorId, "Worker", id, "STATUS_CHANGE", {
          field: "status",
          newValue: "INACTIVE",
          remark: `员工 ${worker.name} 停用`,
        });

        return worker;
      });
    },

    async batchCreate(ctx: RequestContext, rawdata: unknown) {
      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);
        const data = rawdata as { workers: any[] };
        const results = [];

        for (const item of data.workers) {
          const worker = await workerService.create(item, txCtx);
          results.push(worker);
        }

        await auditService.log(ctx.operatorId, "Worker", "batch", "CREATE", {
          remark: `批量创建 ${results.length} 名员工`,
        });

        return { success: true, count: results.length, data: results };
      });
    },
  };
};
