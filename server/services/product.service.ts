// server/services/product.service.ts
import { createProductRepository } from "~~/server/repositories/postgres/product.repository";
import { createSequenceService } from "~~/server/services/sequence.service";
import {
  changeProductStatusSchema,
  createProductSchema,
  updateProductSchema,
} from "~~/shared/schemas/api/product.schema";
import type { PrismaClient } from "~~/prisma/generated/client";
import type { RequestContext } from "~~/shared/types/request";
import type { TxContext } from "~~/server/infrastructure/tx";
import { createError } from "h3";
import { runInTransaction } from "~~/server/utils/transaction";

export const createProductService = (prisma: PrismaClient) => {
  const repo = createProductRepository(prisma);
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
    async getActiveByIds(ids: string[], tx?: TxContext) {
      const client = tx?.prisma ?? prisma;
      return client.product.findMany({
        where: { id: { in: ids }, status: "ACTIVE" },
        select: { id: true, name: true, unit: true },
      });
    },

    async getById(id: string) {
      const product = await repo.findById(id, {
        inventories: true,
        bomProducts: { where: { status: { not: "OBSOLETED" } } },
      });
      if (!product)
        throw createError({ statusCode: 404, message: "产品不存在" });
      return product;
    },

    // ==================== 写操作 ====================

    async create(ctx: RequestContext, rawdata: unknown, tx?: TxContext) {
      const data = createProductSchema.parse(rawdata);

      return runInTransaction(tx, prisma, async (txCtx) => {
        const code = await seqService.getFormattedProductCode();
        return repo.createWithCode(
          {
            code,
            name: data.name,
            spec: data.spec,
            unit: data.unit,
            category: data.category,
            tags: data.tags,
            attributes: data.attributes || undefined,
            packUnit: data.packUnit,
          },
          txCtx,
        );
      });
    },

    async update(ctx: RequestContext, rawdata: unknown, tx?: TxContext) {
      const data = updateProductSchema.parse(rawdata);

      return runInTransaction(tx, prisma, async (txCtx) => {
        const old = await repo.findById(data.id, undefined, txCtx);
        if (!old) throw createError({ statusCode: 404, message: "产品不存在" });
        return repo.update({ id: data.id }, data, txCtx);
      });
    },

    async changeStatus(ctx: RequestContext, rawdata: unknown, tx?: TxContext) {
      const data = changeProductStatusSchema.parse(rawdata);

      return runInTransaction(tx, prisma, async (txCtx) => {
        const old = await repo.findById(data.id, undefined, txCtx);
        if (!old) throw createError({ statusCode: 404, message: "产品不存在" });
        return repo.update({ id: data.id }, { status: data.status }, txCtx);
      });
    },
  };
};
