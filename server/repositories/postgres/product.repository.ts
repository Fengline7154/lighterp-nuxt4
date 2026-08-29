// server/repositories/postgres/product.repository.ts
import type { PrismaClient, ProductUnit } from "~~/prisma/generated/client";
import { createPrismaBaseRepository } from "../base/prisma.base.repository";
import type { TxContext } from "~~/server/infrastructure/tx";

export const createProductRepository = (prisma: PrismaClient) => {
  const baseRepo = createPrismaBaseRepository(prisma, "product");
  const getClient = (tx?: TxContext) => tx?.prisma ?? prisma;

  return {
    ...baseRepo,

    /**
     * 创建产品并自动填充编码
     */
    async createWithCode(
      data: {
        code: string;
        name: string;
        spec?: string;
        unit?: ProductUnit;
        category?: string;
        tags?: string[];
        attributes?: Record<string, any>;
        packUnit?: string;
      },
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      return client.product.create({
        data: {
          code: data.code,
          name: data.name,
          spec: data.spec,
          unit: data.unit || "PCS",
          category: data.category as any,
          tags: data.tags || [],
          attributes: data.attributes || undefined,
          packUnit: data.packUnit,
        },
      });
    },

    /**
     * 查询单个激活的产品（仅返回名称和单位，用于库存操作校验）
     */
    async findActiveById(id: string, tx?: TxContext) {
      const client = getClient(tx);
      return client.product.findFirst({
        where: { id, status: "ACTIVE" },
        select: { name: true, unit: true },
      });
    },

    async findActiveByIds(ids: string[], tx?: TxContext) {
      const client = getClient(tx);
      return client.product.findMany({
        where: { id: { in: ids }, status: "ACTIVE" },
        select: { id: true, name: true, unit: true },
      });
    },
  };
};
