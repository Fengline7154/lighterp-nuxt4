// server/application/product.application.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createProductService } from "~~/server/services/product.service";
import { createAuditService } from "~~/server/services/audit.service";
import { createPrismaTxContext } from "~~/server/infrastructure/tx";
import type { RequestContext } from "~~/shared/types/request";

export const createProductApplication = (prisma: PrismaClient) => {
  const productService = createProductService(prisma);
  const auditService = createAuditService(prisma);

  return {
    async getList(filter: Record<string, any>, options: any) {
      return productService.getList(filter, options);
    },

    async getById(id: string) {
      return productService.getById(id);
    },

    async create(ctx: RequestContext, rawdata: unknown) {
      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);
        const product = await productService.create(ctx, rawdata, txCtx);

        await auditService.log(
          ctx.operatorId,
          "Product",
          product.id,
          "CREATE",
          {
            remark: `创建产品 ${product.code} ${product.name}`,
          },
        );

        return product;
      });
    },

    async update(ctx: RequestContext, rawdata: unknown) {
      const data = rawdata as { id: string; [key: string]: any };

      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        // 查旧值
        const oldProduct = await productService.getById(data.id);

        // 更新
        const product = await productService.update(ctx, rawdata, txCtx);

        // 逐字段对比，记录变更
        const fieldMap: Record<string, string> = {
          name: "名称",
          spec: "规格",
          unit: "单位",
          category: "分类",
          status: "状态",
          tags: "标签",
          attributes: "备注",
        };

        for (const [field, label] of Object.entries(fieldMap)) {
          if (data[field] === undefined) continue;

          let oldVal = oldProduct[field];
          let newVal = product[field];

          // tags 和 attributes 是对象/数组，需要序列化比较
          if (field === "tags") {
            oldVal = JSON.stringify(oldVal || []);
            newVal = JSON.stringify(newVal || []);
          }
          if (field === "attributes") {
            oldVal = JSON.stringify(oldVal || {});
            newVal = JSON.stringify(newVal || {});
          }

          const oldStr = String(oldVal ?? "");
          const newStr = String(newVal ?? "");

          if (oldStr !== newStr) {
            await auditService.log(
              ctx.operatorId,
              "Product",
              data.id,
              "UPDATE",
              {
                field: field,
                oldValue: oldStr,
                newValue: newStr,
              },
            );
          }
        }

        return product;
      });
    },

    async changeStatus(ctx: RequestContext, rawdata: unknown) {
      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);
        const product = await productService.changeStatus(ctx, rawdata, txCtx);

        await auditService.log(
          ctx.operatorId,
          "Product",
          product.id,
          "STATUS_CHANGE",
          {
            field: "status",
            newValue: product.status,
            remark: `产品 ${product.name} 状态变更`,
          },
        );

        return product;
      });
    },

    async batchCreate(ctx: RequestContext, rawdata: unknown) {
      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);
        const results = [];
        const data = rawdata as { items: any[] };

        for (const item of data.items) {
          const product = await productService.create(ctx, item, txCtx);
          results.push(product);
        }

        await auditService.log(ctx.operatorId, "Product", "batch", "CREATE", {
          remark: `批量创建 ${results.length} 个产品`,
        });

        return { success: true, count: results.length, data: results };
      });
    },

    async batchChangeStatus(ctx: RequestContext, rawdata: unknown) {
      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);
        const { ids, status } = rawdata as { ids: string[]; status: string };

        for (const id of ids) {
          await productService.changeStatus(ctx, { id, status }, txCtx);
        }

        await auditService.log(
          ctx.operatorId,
          "Product",
          "batch",
          "STATUS_CHANGE",
          {
            field: "status",
            newValue: status,
            remark: `批量变更 ${ids.length} 个产品状态为 ${status}`,
          },
        );

        return { success: true };
      });
    },
  };
};
