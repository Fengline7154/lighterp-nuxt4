// server/services/worker.service.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createWorkerRepository } from "~~/server/repositories/postgres/worker.repository";
import {
  createWorkerSchema,
  updateWorkerSchema,
  type CreateWorkerInput,
  type UpdateWorkerInput,
} from "~~/shared/schemas/worker.schema";
import { createSequenceService } from "./sequence.service";
import { runInTransaction } from "~~/server/utils/transaction";
import type { TxContext } from "~~/server/infrastructure/tx";

export const createWorkerService = (prisma: PrismaClient) => {
  const repo = createWorkerRepository(prisma);
  const seqService = createSequenceService(prisma);

  return {
    async getList(params: {
      page: number;
      limit: number;
      keyword?: string;
      status?: string;
    }) {
      const where: any = {};
      if (params.keyword) {
        where.OR = [
          { name: { contains: params.keyword } },
          { phone: { contains: params.keyword } },
          { idCard: { contains: params.keyword } },
          { position: { contains: params.keyword } },
          { code: { contains: params.keyword } },
        ];
      }
      if (params.status) where.status = params.status;

      return repo.findMany(where, {
        page: params.page,
        limit: params.limit,
        orderBy: { createdAt: "desc" },
      });
    },

    async getAll() {
      return repo.findAll({ status: "ACTIVE" }, { orderBy: { name: "asc" } });
    },

    async getById(id: string) {
      return repo.findById(id);
    },

    async create(rawdata: unknown, tx?: TxContext) {
      const parse = createWorkerSchema.parse(rawdata);
      return runInTransaction(tx, prisma, async (txCtx) => {
        const code = await seqService.getFormattedWorkerCode();
        return repo.create({ ...parse, code }, txCtx);
      });
    },

    async update(id: string, rawdata: unknown, tx?: TxContext) {
      const parse = updateWorkerSchema.parse(rawdata);
      return runInTransaction(tx, prisma, async (txCtx) => {
        return repo.update({ id }, parse, txCtx);
      });
    },

    async deactivate(id: string, tx?: TxContext) {
      return runInTransaction(tx, prisma, async (txCtx) => {
        return repo.update({ id }, { status: "INACTIVE" }, txCtx);
      });
    },
  };
};
