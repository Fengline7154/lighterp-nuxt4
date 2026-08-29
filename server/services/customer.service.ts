// server/services/customer.service.ts
import { createCustomerRepository } from "~~/server/repositories/postgres/customer.repository";
import { createSequenceService } from "~~/server/services/sequence.service";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "~~/shared/schemas/api/customer.schema";
import type { PrismaClient } from "~~/prisma/generated/client";
import type { RequestContext } from "~~/shared/types/request";
import type { TxContext } from "~~/server/infrastructure/tx";
import { createError } from "h3";
import { runInTransaction } from "~~/server/utils/transaction";

export const createCustomerService = (prisma: PrismaClient) => {
  const repo = createCustomerRepository(prisma);
  const seqService = createSequenceService(prisma);

  return {
    // ==================== 读操作 ====================

    async getList(
      filter: Record<string, any>,
      options: {
        page: number;
        limit: number;
        sortField?: string;
        sortDir?: string;
      },
    ) {
      const where: any = { ...filter };
      const orderBy: any = {};
      orderBy[options.sortField || "createdAt"] = options.sortDir || "desc";

      return repo.findMany(where, {
        page: options.page,
        limit: options.limit,
        orderBy,
      });
    },

    async getById(id: string) {
      const customer = await repo.findById(id);
      if (!customer)
        throw createError({ statusCode: 404, message: "客户不存在" });
      return customer;
    },

    // ==================== 写操作 ====================

    async create(ctx: RequestContext, rawdata: unknown, tx?: TxContext) {
      const data = createCustomerSchema.parse(rawdata);

      return runInTransaction(tx, prisma, async (txCtx) => {
        const code = await seqService.getFormattedCustomerCode();
        return repo.create({ ...data, code }, txCtx);
      });
    },

    async update(ctx: RequestContext, rawdata: unknown, tx?: TxContext) {
      const data = updateCustomerSchema.parse(rawdata);

      return runInTransaction(tx, prisma, async (txCtx) => {
        const old = await repo.findById(data.id, undefined, txCtx);
        if (!old) throw createError({ statusCode: 404, message: "客户不存在" });
        return repo.update({ id: data.id }, data, txCtx);
      });
    },

    async changeStatus(ctx: RequestContext, rawdata: unknown, tx?: TxContext) {
      const data = updateCustomerSchema.parse(rawdata);

      return runInTransaction(tx, prisma, async (txCtx) => {
        const old = await repo.findById(data.id, undefined, txCtx);
        if (!old) throw createError({ statusCode: 404, message: "客户不存在" });
        return repo.update({ id: data.id }, { status: data.status }, txCtx);
      });
    },
  };
};
