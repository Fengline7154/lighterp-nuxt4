// server/repositories/postgres/bom.repository.ts
import type { BomType, PrismaClient } from "~~/prisma/generated/client";
import { createPrismaBaseRepository } from "../base/prisma.base.repository";
import type { TxContext } from "~~/server/infrastructure/tx";

export const createBomRepository = (prisma: PrismaClient) => {
  const baseRepo = createPrismaBaseRepository(prisma, "bom");
  const getClient = (tx?: TxContext) => tx?.prisma ?? prisma;

  return {
    ...baseRepo,

    /**
     * 创建 BOM 记录（含明细）
     */
    async createWithItems(
      data: {
        bomCode: string;
        productId: string;
        version?: number;
        createdById: string;
        bomType?: BomType;
        orderId?: string | null;
        items: Array<{
          materialId: string;
          materialName: string;
          quantity: number | string;
          unit?: string;
          scrapRate?: number | string;
        }>;
      },
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      return client.bom.create({
        data: {
          bomCode: data.bomCode,
          productId: data.productId,
          version: data.version ?? 1,
          createdById: data.createdById,
          bomType: data.bomType ?? "PRODUCTION",
          orderId: data.orderId,
          items: {
            create: data.items.map((item) => ({
              materialId: item.materialId,
              materialName: item.materialName,
              quantity: item.quantity,
              unit: item.unit || "pcs",
              scrapRate: item.scrapRate ?? 0,
            })),
          },
        },
        include: { items: true },
      });
    },

    /**
     * 根据 productId 查找非废弃版本的 BOM（含明细）
     */
    async findActiveByProductId(productId: string, tx?: TxContext) {
      const client = getClient(tx);
      return client.bom.findFirst({
        where: { productId, status: { not: "OBSOLETED" } },
        include: { items: true },
      });
    },

    /**
     * 将指定 BOM 标记为废弃
     */
    async obsoleteById(id: string, tx?: TxContext) {
      const client = getClient(tx);
      return client.bom.update({
        where: { id },
        data: { status: "OBSOLETED" },
      });
    },

    /**
     * 替换 BOM 的物料明细（删除旧明细并创建新明细，需在事务中调用）
     */
    async replaceItems(
      bomId: string,
      items: Array<{
        materialId: string;
        materialName: string;
        quantity: number | string;
        unit?: string;
        scrapRate?: number | string;
      }>,
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      await client.bomItem.deleteMany({ where: { bomId } });
      return client.bom.update({
        where: { id: bomId },
        data: {
          items: {
            create: items.map((item) => ({
              materialId: item.materialId,
              materialName: item.materialName,
              quantity: item.quantity,
              unit: item.unit || "pcs",
              scrapRate: item.scrapRate ?? 0,
            })),
          },
        },
        include: { items: true },
      });
    },

    /**
     * 克隆一个已发布的 BOM 作为新的草稿（用于变型品创建）
     */
    async cloneAsDraft(
      baseBomId: string,
      overrides: {
        bomCode: string;
        productId: string;
        createdById: string;
        bomType?: BomType;
        orderId?: string;
      },
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      const baseBom = await client.bom.findUnique({
        where: { id: baseBomId },
        include: { items: true },
      });
      if (!baseBom) {
        throw createError({
          statusCode: 400,
          message: "变型品的原型bom不存在,请先创建对应bom",
        });
      }

      return client.bom.create({
        data: {
          bomCode: overrides.bomCode,
          productId: overrides.productId,
          version: 1,
          status: "DRAFT",
          bomType: overrides.bomType || "SAMPLE",
          createdById: overrides.createdById,
          orderId: overrides.orderId,
          items: {
            create: baseBom.items.map((item) => ({
              materialId: item.materialId,
              materialName: item.materialName,
              quantity: item.quantity,
              unit: item.unit,
              scrapRate: item.scrapRate,
            })),
          },
        },
        include: { items: true },
      });
    },
  };
};
