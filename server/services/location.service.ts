// server/services/location.service.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createLocationRepository } from "~~/server/repositories/postgres/location.repository";
import { createSequenceService } from "~~/server/services/sequence.service";
import type { TxContext } from "~~/server/infrastructure/tx";
import { runInTransaction } from "~~/server/utils/transaction";

export const createLocationService = (prisma: PrismaClient) => {
  const repo = createLocationRepository(prisma);

  return {
    /** 获取库位列表（分页） */
    async getList(params: {
      page: number;
      limit: number;
      keyword?: string;
      status?: string;
    }) {
      const where: any = {};
      if (params.keyword) {
        where.OR = [
          { code: { contains: params.keyword } },
          { name: { contains: params.keyword } },
          { warehouse: { contains: params.keyword } },
        ];
      }
      if (params.status) where.status = params.status;

      return repo.findMany(where, {
        page: params.page,
        limit: params.limit,
        orderBy: { code: "asc" },
      });
    },

    /** 获取所有启用的库位（用于下拉选择） */
    async getAll() {
      return repo.findAll({ status: "ACTIVE" }, { orderBy: { code: "asc" } });
    },

    /** 根据 ID 获取库位 */
    async getById(id: string) {
      return repo.findById(id);
    },

    /** 创建库位 */
    async create(
      data: { code?: string; name: string; warehouse?: string },
      tx?: TxContext,
    ) {
      return runInTransaction(tx, prisma, async (txCtx) => {
        let code = data.code?.trim();
        if (!code) {
          const seqService = createSequenceService(prisma);
          code = await seqService.getFormattedLocationCode();
        }

        const existing = await repo.findFirst({ code }, undefined, txCtx);
        if (existing) {
          throw createError({ statusCode: 400, message: "库位编码已存在" });
        }

        return repo.create({ ...data, code }, txCtx);
      });
    },

    /** 更新库位 */
    async update(
      id: string,
      data: {
        code?: string;
        name?: string;
        warehouse?: string;
        status?: "ACTIVE" | "INACTIVE";
      },
      tx?: TxContext,
    ) {
      return runInTransaction(tx, prisma, async (txCtx) => {
        if (data.code) {
          const existing = await repo.findFirst(
            { code: data.code },
            undefined,
            txCtx,
          );
          if (existing && existing.id !== id) {
            throw createError({ statusCode: 400, message: "库位编码已存在" });
          }
        }
        return repo.update({ id }, data, txCtx);
      });
    },

    /** 停用库位 */
    async deactivate(id: string, tx?: TxContext) {
      return runInTransaction(tx, prisma, async (txCtx) => {
        return repo.update({ id }, { status: "INACTIVE" }, txCtx);
      });
    },
  };
};
