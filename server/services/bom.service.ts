// server/services/bom.service.ts
import { createBomRepository } from "~~/server/repositories/postgres/bom.repository";
import { createSequenceService } from "~~/server/services/sequence.service";
import {
  cloneBomSchema,
  createBomSchema,
  obsoleteBomSchema,
  publishBomSchema,
  updateBomSchema,
} from "~~/shared/schemas/api/bom.schema";
import type { BomItem, PrismaClient } from "~~/prisma/generated/client";
import type { TxContext } from "~~/server/infrastructure/tx";
import type { RequestContext } from "~~/shared/types/request";
import { createError } from "h3";
import {
  createDecimal,
  toPrismaDecimal,
} from "~~/shared/mappers/baseRepoType/decimal";
import { runInTransaction } from "~~/server/utils/transaction";
import { createOrderItemService } from "./order-item.service";

export const createBomService = (prisma: PrismaClient) => {
  const bomRepo = createBomRepository(prisma);
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
        showAll?: string;
      },
    ) {
      const where: any = { ...filter };

      const allData = await bomRepo.findAll(where, {
        orderBy: [{ bomCode: "asc" }, { version: "desc" }],
        include: {
          product: { select: { name: true, code: true } },
          _count: { select: { items: true } },
        },
      });

      const isShowAll = options.showAll === "true";
      const seen = new Map<string, any>();

      for (const bom of allData) {
        if (isShowAll) {
          seen.set(`${bom.bomCode}_${bom.version}`, bom);
        } else if (!seen.has(bom.bomCode)) {
          seen.set(bom.bomCode, bom);
        } else {
          const existing = seen.get(bom.bomCode)!;
          if (existing.status === "OBSOLETED" && bom.status !== "OBSOLETED") {
            seen.set(bom.bomCode, bom);
          }
        }
      }

      const deduped = Array.from(seen.values());
      const total = deduped.length;
      const paged = deduped.slice(
        (options.page - 1) * options.limit,
        options.page * options.limit,
      );

      return {
        data: paged,
        total,
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(total / options.limit),
      };
    },

    async getById(id: string) {
      const bom = await bomRepo.findById(id, {
        approver: { select: { badgeCode: true, name: true } },
        product: { select: { code: true, name: true } },
        items: {
          include: {
            material: {
              select: { code: true, name: true, spec: true, unit: true },
            },
          },
        },
      });
      if (!bom) throw createError({ statusCode: 404, message: "BOM 不存在" });
      return bom;
    },

    async findActiveByProductId(productId: string, tx?: TxContext) {
      return bomRepo.findActiveByProductId(productId, tx);
    },
    //展开当前产品的bom(如果存在)
    async expandBomDirectMaterials(bomId: string, quantity: number) {
      const bom = await prisma.bom.findUnique({
        where: { id: bomId },
        include: {
          items: {
            include: {
              material: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  unit: true,
                  spec: true,
                },
              },
            },
          },
        },
      });

      if (!bom) return [];

      return bom.items.map((item) => ({
        materialId: item.materialId,
        materialName: item.material?.name || item.materialName,
        materialCode: item.material?.code || "",
        unit: item.unit || item.material?.unit || "",
        spec: item.material?.spec || "",
        demand: Number(item.quantity) * quantity,
      }));
    },

    // ==================== 写操作 ====================
    async create(ctx: RequestContext, rawdata: unknown, tx?: TxContext) {
      const data = createBomSchema.parse(rawdata);
      const bomCode = await seqService.getFormattedBomCode();

      return runInTransaction(tx, prisma, async (txCtx) => {
        const product = await txCtx.prisma.product.findUnique({
          where: { id: data.productId },
          select: { name: true },
        });
        if (!product)
          throw createError({ statusCode: 400, message: "产品不存在" });

        const existing = await bomRepo.findActiveByProductId(
          data.productId,
          txCtx,
        );
        if (existing) {
          throw createError({
            statusCode: 400,
            message: "该产品已有激活 BOM，请使用更新接口",
          });
        }

        return bomRepo.createWithItems(
          {
            bomCode,
            productId: data.productId,
            createdById: ctx.operatorId,
            items: data.items.map((item) => ({
              materialId: item.materialId!,
              materialName: item.materialName,
              quantity: toPrismaDecimal(createDecimal(item.quantity)),
              unit: item.unit || "pcs",
              scrapRate:
                item.scrapRate !== undefined
                  ? toPrismaDecimal(createDecimal(item.scrapRate))
                  : undefined,
            })),
          },
          txCtx,
        );
      });
    },

    async update(ctx: RequestContext, rawdata: unknown, tx?: TxContext) {
      const data = updateBomSchema.parse(rawdata);

      return runInTransaction(tx, prisma, async (txCtx) => {
        const old = await bomRepo.findById(data.id, { items: true }, txCtx);
        if (!old) throw createError({ statusCode: 404, message: "BOM 不存在" });
        if (old.status === "OBSOLETED") {
          throw createError({
            statusCode: 400,
            message: "已废弃的 BOM 不可修改",
          });
        }

        const mapItems = (items: typeof data.items) =>
          items.map((item) => ({
            materialId: item.materialId!,
            materialName: item.materialName,
            quantity: toPrismaDecimal(createDecimal(item.quantity)),
            unit: item.unit || "pcs",
            scrapRate:
              item.scrapRate !== undefined
                ? toPrismaDecimal(createDecimal(item.scrapRate))
                : undefined,
          }));

        if (old.status === "DRAFT") {
          return bomRepo.replaceItems(data.id, mapItems(data.items), txCtx);
        }

        // PUBLISHED → 废弃旧版 + 创建新版
        await bomRepo.obsoleteById(data.id, txCtx);
        return bomRepo.createWithItems(
          {
            bomCode: old.bomCode,
            productId: old.productId,
            version: old.version + 1,
            createdById: ctx.operatorId,
            bomType: old.bomType,
            orderId: old.orderId,
            items: mapItems(data.items),
          },
          txCtx,
        );
      });
    },

    async publish(ctx: RequestContext, rawdata: unknown, tx?: TxContext) {
      const data = publishBomSchema.parse(rawdata);

      return runInTransaction(tx, prisma, async (txCtx) => {
        const bom = await bomRepo.findById(data.id, undefined, txCtx);
        if (!bom) throw createError({ statusCode: 404, message: "BOM 不存在" });
        if (bom.status !== "DRAFT") {
          throw createError({
            statusCode: 400,
            message: "只能发布草稿状态的 BOM",
          });
        }

        return bomRepo.update(
          { id: data.id },
          {
            status: "PUBLISHED",
            approvedById: ctx.operatorId,
            approvedAt: new Date(),
          },
          txCtx,
        );
      });
    },

    async obsolete(ctx: RequestContext, rawdata: unknown, tx?: TxContext) {
      const data = obsoleteBomSchema.parse(rawdata);

      return runInTransaction(tx, prisma, async (txCtx) => {
        const bom = await bomRepo.findById(data.id, undefined, txCtx);
        if (!bom) throw createError({ statusCode: 404, message: "BOM 不存在" });

        return bomRepo.obsoleteById(data.id, txCtx);
      });
    },

    async cloneBom(ctx: RequestContext, rawdata: unknown, tx?: TxContext) {
      const { baseBomId, ...overrides } = cloneBomSchema.parse(rawdata);

      return runInTransaction(tx, prisma, async (txCtx) => {
        const baseBom = await bomRepo.findById(
          baseBomId,

          { items: true },

          txCtx,
        );
        if (!baseBom)
          throw createError({ statusCode: 404, message: "基础 BOM 不存在" });

        return bomRepo.createWithItems(
          {
            bomCode: overrides.bomCode,
            productId: overrides.productId,
            createdById: ctx.operatorId,
            bomType: overrides.bomType || "SAMPLE",
            orderId: overrides.orderId,
            items: baseBom.items.map((item: BomItem) => ({
              materialId: item.materialId,
              materialName: item.materialName,
              quantity: String(item.quantity),
              unit: item.unit,
              scrapRate:
                item.scrapRate !== null && item.scrapRate !== undefined
                  ? String(item.scrapRate)
                  : undefined,
            })),
          },
          txCtx,
        );
      });
    } /**
     * 锁定 BOM 快照到订单明细（审批/打样完成时调用）
     * orderItemRepo 需要通过 prisma 透传，这里直接调 txCtx.prisma
     */,
    async snapshotToOrderItems(
      items: Array<{ id: string; productId: string }>,
      tx?: TxContext,
    ) {
      const orderItemService = createOrderItemService(prisma);
      return runInTransaction(tx, prisma, async (txCtx) => {
        for (const item of items) {
          const publishedBom = await bomRepo.findActiveByProductId(
            item.productId,
            txCtx,
          );
          if (publishedBom) {
            await orderItemService.snapshotBom(
              item.id,
              publishedBom.id,
              publishedBom.version,
              txCtx,
            );
          }
        }
      });
    },
  };
};
