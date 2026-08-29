// server/application/bom.application.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createBomService } from "~~/server/services/bom.service";
import { createAuditService } from "~~/server/services/audit.service";
import { createPrismaTxContext, TxContext } from "~~/server/infrastructure/tx";
import type { RequestContext } from "~~/shared/types/request";
import { createProductService } from "~~/server/services/product.service";
export const createBomApplication = (prisma: PrismaClient) => {
  const bomService = createBomService(prisma);
  const auditService = createAuditService(prisma);

  return {
    /** BOM 列表 */
    async getList(filter: Record<string, any>, options: any) {
      return bomService.getList(filter, options);
    },

    /** BOM 详情 */
    async getById(id: string) {
      return bomService.getById(id);
    },

    /** 创建 BOM */
    async create(ctx: RequestContext, rawdata: unknown) {
      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        const bom = await bomService.create(ctx, rawdata, txCtx);

        await auditService.log(ctx.operatorId, "Bom", bom.id, "CREATE", {
          remark: `创建 BOM ${bom.bomCode} v${bom.version}，产品 ${bom.productId}`,
        });

        return bom;
      });
    },

    async createBomWithNewMaterials(ctx: RequestContext, rawdata: unknown) {
      const data = rawdata as {
        productId?: string;
        productName?: string;
        items: Array<{
          materialId?: string;
          materialName: string;
          quantity: number;
          spec?: string;
          unit?: string;
          category?: string;
          scrapRate?: number;
        }>;
        orderId?: string;
      };

      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);
        const productService = createProductService(prisma);

        // 1. 母产品：没选已有产品 → 自动创建
        let finalProductId = data.productId;
        if (!finalProductId && data.productName) {
          const newProduct = await productService.create(
            ctx,
            {
              name: data.productName,
              category: "FINISHED",
              unit: "PCS",
            },
            txCtx,
          );
          finalProductId = newProduct.id;
        }
        if (!finalProductId)
          throw createError({
            statusCode: 400,
            message: "产品ID或新产品名称不能同时为空",
          });

        // 2. 子物料：materialId 为空的自动创建
        const resolvedItems = [];
        for (const item of data.items) {
          if (!item.materialId) {
            const newMaterial = await productService.create(
              ctx,
              {
                name: item.materialName,
                spec: item.spec,
                unit: item.unit || "PCS",
                category: item.category || "RAW",
              },
              txCtx,
            );
            resolvedItems.push({ ...item, materialId: newMaterial.id });
          } else {
            resolvedItems.push({ ...item, materialId: item.materialId });
          }
        }

        // 3. 创建 BOM
        const bom = await bomService.create(
          ctx,
          {
            productId: finalProductId,
            items: resolvedItems.map((i) => ({
              materialId: i.materialId!,
              materialName: i.materialName,
              quantity: i.quantity,
              unit: i.unit || "PCS",
              scrapRate: i.scrapRate ?? 0,
            })),
            orderId: data.orderId,
          },
          txCtx,
        );

        await auditService.log(ctx.operatorId, "Bom", bom.id, "CREATE", {
          remark:
            `创建 BOM ${bom.bomCode} v${bom.version}，含 ${resolvedItems.length} 个物料` +
            (data.productName ? `，同时创建母产品 ${data.productName}` : ""),
        });

        return bom;
      });
    },

    /** 更新 BOM（DRAFT 直接改，PUBLISHED 废弃+新建） */
    // bom.application.ts 加 update 方法

    async update(ctx: RequestContext, rawdata: unknown) {
      const data = rawdata as {
        id: string;
        items: Array<{
          materialId?: string;
          materialName: string;
          quantity: number;
          spec?: string;
          unit?: string;
          category?: string;
          scrapRate?: number;
        }>;
      };

      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);
        const productService = createProductService(prisma);

        // 1. 新建物料：materialId 为空的自动创建产品
        for (const item of data.items) {
          if (!item.materialId && item.materialName) {
            const newProduct = await productService.create(
              ctx,
              {
                name: item.materialName,
                spec: item.spec,
                unit: item.unit || "PCS",
                category: item.category || "RAW",
              },
              txCtx,
            );
            item.materialId = newProduct.id;
          }
        }

        // 2. 更新 BOM
        const bom = await bomService.update(ctx, data, txCtx);

        await auditService.log(ctx.operatorId, "Bom", bom.id, "UPDATE", {
          remark: `更新 BOM ${bom.bomCode} v${bom.version}`,
        });

        return bom;
      });
    },

    /** 发布 BOM */
    async publish(ctx: RequestContext, rawdata: unknown) {
      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        const bom = await bomService.publish(ctx, rawdata, txCtx);

        await auditService.log(ctx.operatorId, "Bom", bom.id, "PUBLISH", {
          remark: `发布 BOM ${bom.bomCode} v${bom.version}`,
        });

        return bom;
      });
    },

    /** 废弃 BOM */
    async obsolete(ctx: RequestContext, rawdata: unknown) {
      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        const bom = await bomService.obsolete(ctx, rawdata, txCtx);

        await auditService.log(ctx.operatorId, "Bom", bom.id, "OBSOLETE", {
          remark: `废弃 BOM ${bom.bomCode} v${bom.version}`,
        });

        return bom;
      });
    },

    /** 克隆 BOM（用于变型品/定制品） */
    async cloneBom(ctx: RequestContext, rawdata: unknown) {
      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        const bom = await bomService.cloneBom(ctx, rawdata, txCtx);

        await auditService.log(ctx.operatorId, "Bom", bom.id, "CLONE", {
          remark: `克隆 BOM ${bom.bomCode} v${bom.version}`,
        });

        return bom;
      });
    },

    /** BOM 快照到订单明细（供 order.application 调用） */
    async snapshotToOrderItems(
      items: Array<{ id: string; productId: string }>,
      tx?: any,
    ) {
      return bomService.snapshotToOrderItems(items, tx);
    },

    /** 查询产品激活 BOM */
    async findActiveByProductId(productId: string, tx?: any) {
      return bomService.findActiveByProductId(productId, tx);
    },
  };
};
