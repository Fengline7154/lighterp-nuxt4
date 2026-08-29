// server/services/inventory.service.ts
import { createInventoryRepository } from "~~/server/repositories/postgres/inventory.repository";
import { createProductRepository } from "~~/server/repositories/postgres/product.repository";
import { createInventoryLocationRepository } from "../repositories/postgres/inventory-location.repository";
import { createError } from "h3";
import type { PrismaClient } from "~~/prisma/generated/client";
import {
  addStockSchema,
  deductStockSchema,
  fulfillSchema,
  releaseSchema,
  reserveSchema,
  reversalSchema,
  transferSchema,
} from "~~/shared/schemas/api/inventory.schema";
import type { TxContext } from "~~/server/infrastructure/tx";
import {
  createDecimal,
  toPrismaDecimal,
  type IDecimal,
} from "~~/shared/mappers/baseRepoType/decimal";
import { runInTransaction } from "~~/server/utils/transaction";
import type {
  StockChangeResult,
  LocationChange,
} from "~~/shared/types/inventory";

export const createInventoryService = (prisma: PrismaClient) => {
  const invRepo = createInventoryRepository(prisma);
  const productRepo = createProductRepository(prisma);
  const invLocRepo = createInventoryLocationRepository(prisma);

  return {
    // ==================================读操作==================================
    async getList(
      page: number,
      limit: number,
      sortField?: string,
      sortDir?: string,
      keyword?: string,
    ) {
      const orderBy: any = {};
      orderBy[sortField || "updatedAt"] = sortDir || "desc";

      const filter: any = {};
      if (keyword) {
        filter.OR = [
          { product: { code: { contains: keyword } } },
          { product: { name: { contains: keyword } } },
        ];
      }

      const result = await invRepo.findMany(filter, {
        page,
        limit,
        orderBy,
        include: { product: { select: { code: true } } },
      });

      result.data = result.data.map((i: any) => {
        const qty = createDecimal(String(i.quantity));
        const reserved = createDecimal(String(i.reservedQty));
        const allocated = createDecimal(String(i.allocatedQty || 0));
        const available = qty.minus(reserved).minus(allocated);

        return {
          ...i,
          productCode: i.product?.code || i.productId,
          availableQty: available.toString(),
          allocatableQty: available.toString(),
        };
      });

      return result;
    },

    async getByProductId(productId: string) {
      const inv = await invRepo.findUnique({ where: { productId } });
      if (!inv)
        throw createError({ statusCode: 404, message: "库存记录不存在" });
      return inv;
    },
    async getAvailableStock(productId: string, tx?: TxContext) {
      const inv = await invRepo.findByProductId(productId, tx);
      if (!inv) return null;
      const qty = createDecimal(String(inv.quantity));
      const reserved = createDecimal(String(inv.reservedQty));
      const allocated = createDecimal(String(inv.allocatedQty || 0));
      return {
        ...inv,
        quantity: qty,
        reservedQty: reserved,
        allocatedQty: allocated,
        availableQty: qty.minus(reserved).minus(allocated),
      };
    },
    // ==================================写操作（纯库存变动，不写流水/成本）==================================

    /** 通用入库 — 只改库存，返回变动前后数量 */
    async addStock(
      rawdata: unknown,
      tx?: TxContext,
    ): Promise<StockChangeResult> {
      const data = addStockSchema.parse(rawdata);
      const { productId, quantity: rawQty, locationId, type } = data;
      const quantity = createDecimal(rawQty);

      if (type === "CHECK_IN" && !data.remark) {
        throw createError({ statusCode: 400, message: "盘点入库必须填写备注" });
      }

      return runInTransaction(tx, prisma, async (txCtx) => {
        const product = await productRepo.findActiveById(productId);
        if (!product)
          throw createError({ statusCode: 400, message: "产品不存在或已停用" });

        const updatedInv = await invRepo.addStock(
          {
            productId,
            productName: product.name,
            quantity: toPrismaDecimal(quantity),
          },
          txCtx,
        );

        const afterQty = createDecimal(String(updatedInv.quantity));
        const beforeQty = afterQty.minus(quantity);

        const locationChanges: LocationChange[] = [];
        if (locationId) {
          const locAfter = await invLocRepo.addStock(
            productId,
            locationId,
            toPrismaDecimal(quantity),
            txCtx,
          );
          const locAfterQty = createDecimal(String(locAfter.quantity));
          locationChanges.push({
            locationId,
            changedQty: quantity,
            beforeQty: locAfterQty.minus(quantity),
            afterQty: locAfterQty,
          });
        }

        return {
          productId,
          productName: product.name,
          changedQty: quantity,
          beforeQty,
          afterQty,
          locationChanges:
            locationChanges.length > 0 ? locationChanges : undefined,
        };
      });
    },

    /** 通用出库 — 只改库存，返回变动前后数量 */
    async deduct(rawdata: unknown, tx?: TxContext): Promise<StockChangeResult> {
      const data = deductStockSchema.parse(rawdata);
      const { productId, locationId } = data;
      const quantity = createDecimal(data.quantity);

      if (data.type === "CHECK_OUT" && !data.remark) {
        throw createError({ statusCode: 400, message: "盘点出库必须填写备注" });
      }

      return runInTransaction(tx, prisma, async (txCtx) => {
        const current = await invRepo.findByProductId(productId, txCtx);
        if (!current)
          throw createError({ statusCode: 404, message: "库存记录不存在" });

        const updatedInv = await invRepo.deductWithLock(
          {
            productId,
            quantity: toPrismaDecimal(quantity),
            currentVersion: current.lockVersion,
          },
          txCtx,
        );
        if (!updatedInv)
          throw createError({ statusCode: 409, message: "库存不足或操作冲突" });

        const afterQty = createDecimal(String(updatedInv.quantity));
        const beforeQty = afterQty.plus(quantity);

        const locationChanges: LocationChange[] = [];
        if (locationId) {
          const locInv = await invLocRepo.findFirst(
            { productId, locationId },
            undefined,
            txCtx,
          );
          if (!locInv)
            throw createError({
              statusCode: 400,
              message: "该库位无此产品库存",
            });
          const success = await invLocRepo.deductWithLock(
            productId,
            locationId,
            toPrismaDecimal(quantity),
            locInv.lockVersion,
            txCtx,
          );
          if (!success)
            throw createError({
              statusCode: 409,
              message: "库位库存不足或冲突",
            });
          const locBefore = createDecimal(String(locInv.quantity));
          locationChanges.push({
            locationId,
            changedQty: quantity.negated(),
            beforeQty: locBefore,
            afterQty: locBefore.minus(quantity),
          });
        }

        return {
          productId,
          productName: current.productName,
          changedQty: quantity.negated(),
          beforeQty,
          afterQty,
          locationChanges:
            locationChanges.length > 0 ? locationChanges : undefined,
        };
      });
    },

    /** 库位调拨 — 总库存不变，只改库位分布 */
    async transfer(
      rawdata: unknown,
      tx?: TxContext,
    ): Promise<StockChangeResult> {
      const data = transferSchema.parse(rawdata);
      const {
        productId,
        fromLocationId,
        toLocationId,
        quantity: rawQty,
      } = data;
      const quantity = createDecimal(rawQty);

      return runInTransaction(tx, prisma, async (txCtx) => {
        const fromLoc = await invLocRepo.findFirst(
          { productId, locationId: fromLocationId },
          undefined,
          txCtx,
        );
        if (!fromLoc)
          throw createError({ statusCode: 400, message: "源库位无此产品库存" });

        const success = await invLocRepo.deductWithLock(
          productId,
          fromLocationId,
          toPrismaDecimal(quantity),
          fromLoc.lockVersion,
          txCtx,
        );
        if (!success)
          throw createError({
            statusCode: 409,
            message: "源库位库存不足或冲突",
          });

        const toLoc = await invLocRepo.addStock(
          productId,
          toLocationId,
          toPrismaDecimal(quantity),
          txCtx,
        );

        const fromBefore = createDecimal(String(fromLoc.quantity));
        const toBefore = createDecimal(String(toLoc.quantity)).minus(quantity);

        return {
          productId,
          productName: "", // 调拨不涉及产品名变更
          changedQty: createDecimal(0), // 总库存不变
          beforeQty: createDecimal(0),
          afterQty: createDecimal(0),
          locationChanges: [
            {
              locationId: fromLocationId,
              changedQty: quantity.negated(),
              beforeQty: fromBefore,
              afterQty: fromBefore.minus(quantity),
            },
            {
              locationId: toLocationId,
              changedQty: quantity,
              beforeQty: toBefore,
              afterQty: createDecimal(String(toLoc.quantity)),
            },
          ],
        };
      });
    },

    /** 红冲 — 只改库存 */
    async reversal(
      rawdata: unknown,
      tx?: TxContext,
    ): Promise<StockChangeResult> {
      const data = reversalSchema.parse(rawdata);
      const { productId, quantity: rawQty, locationId } = data;
      const quantity = createDecimal(rawQty);

      if (!data.remark)
        throw createError({ statusCode: 400, message: "红冲必须填写备注" });

      return runInTransaction(tx, prisma, async (txCtx) => {
        const current = await invRepo.findByProductId(productId, txCtx);
        if (!current)
          throw createError({ statusCode: 404, message: "库存记录不存在" });

        const updatedInv = await invRepo.update(
          { id: current.id },
          {
            quantity: { increment: toPrismaDecimal(quantity) },
            lockVersion: { increment: 1 },
          },

          txCtx,
        );

        const locationChanges: LocationChange[] = [];
        if (locationId) {
          if (quantity.gt(0)) {
            const locAfter = await invLocRepo.addStock(
              productId,
              locationId,
              toPrismaDecimal(quantity),
              txCtx,
            );
            locationChanges.push({
              locationId,
              changedQty: quantity,
              beforeQty: createDecimal(String(locAfter.quantity)).minus(
                quantity,
              ),
              afterQty: createDecimal(String(locAfter.quantity)),
            });
          } else {
            const locInv = await invLocRepo.findFirst(
              { productId, locationId },
              txCtx,
            );
            if (!locInv)
              throw createError({
                statusCode: 400,
                message: "该库位无此产品库存",
              });
            const absQty = quantity.abs();
            const success = await invLocRepo.deductWithLock(
              productId,
              locationId,
              toPrismaDecimal(absQty),
              locInv.lockVersion,
              txCtx,
            );
            if (!success)
              throw createError({
                statusCode: 409,
                message: "库位库存不足或冲突",
              });
            const locBefore = createDecimal(String(locInv.quantity));
            locationChanges.push({
              locationId,
              changedQty: quantity,
              beforeQty: locBefore,
              afterQty: locBefore.plus(quantity),
            });
          }
        }

        const currentQty = createDecimal(String(current.quantity));
        const afterQty = createDecimal(String(updatedInv.quantity));

        return {
          productId,
          productName: current.productName,
          changedQty: quantity,
          beforeQty: currentQty,
          afterQty,
          locationChanges:
            locationChanges.length > 0 ? locationChanges : undefined,
        };
      });
    },

    /** 调配 — 只改 allocatedQty */
    async markAllocated(
      productId: string,
      quantity: IDecimal,
      version: number,
      tx?: TxContext,
    ) {
      return runInTransaction(tx, prisma, async (txCtx) => {
        const result = await invRepo.updateManyByCondition(
          { productId, lockVersion: version },
          {
            allocatedQty: { increment: toPrismaDecimal(quantity) },
            lockVersion: { increment: 1 },
          },
          txCtx,
        );
        if (result.count === 0) return null;
        return invRepo.findByProductId(productId, txCtx);
      });
    },

    /** 预留 — 只改 reservedQty */
    async reserve(
      rawdata: unknown,
      tx?: TxContext,
    ): Promise<StockChangeResult> {
      const data = reserveSchema.parse(rawdata);
      const quantity = createDecimal(data.qty);

      return runInTransaction(tx, prisma, async (txCtx) => {
        const current = await invRepo.findByProductId(data.productId, txCtx);
        if (!current) throw createError({ statusCode: 404 });

        const currentQty = createDecimal(String(current.quantity));
        const currentReserved = createDecimal(String(current.reservedQty));
        const available = currentQty.minus(currentReserved);

        if (available.lt(quantity))
          throw createError({ statusCode: 400, message: "可用库存不足" });

        const updated = await invRepo.reserve(
          {
            productId: data.productId,
            qty: toPrismaDecimal(quantity),
            version: current.lockVersion,
          },
          txCtx,
        );
        if (!updated)
          throw createError({ statusCode: 409, message: "操作冲突" });

        const afterQty = createDecimal(String(updated.quantity));
        const afterReserved = createDecimal(String(updated.reservedQty));

        return {
          productId: data.productId,
          productName: current.productName,
          changedQty: createDecimal(0), // 总库存不变，只是预留标记变更
          beforeQty: available,
          afterQty: afterQty.minus(afterReserved),
        };
      });
    },

    /** 释放预留 */
    async release(
      rawdata: unknown,
      tx?: TxContext,
    ): Promise<StockChangeResult> {
      const data = releaseSchema.parse(rawdata);
      const quantity = createDecimal(data.qty);

      return runInTransaction(tx, prisma, async (txCtx) => {
        const current = await invRepo.findByProductId(data.productId, txCtx);
        if (!current) throw createError({ statusCode: 404 });

        const currentQty = createDecimal(String(current.quantity));
        const currentReserved = createDecimal(String(current.reservedQty));

        const updated = await invRepo.release(
          {
            productId: data.productId,
            qty: toPrismaDecimal(quantity),
            version: current.lockVersion,
          },
          txCtx,
        );
        if (!updated)
          throw createError({ statusCode: 409, message: "操作冲突" });

        const afterQty = createDecimal(String(updated.quantity));
        const afterReserved = createDecimal(String(updated.reservedQty));

        return {
          productId: data.productId,
          productName: current.productName,
          changedQty: createDecimal(0),
          beforeQty: currentQty.minus(currentReserved),
          afterQty: afterQty.minus(afterReserved),
        };
      });
    },

    /** 入库冲销预留 — 库存增加 + 预留减少 */
    async fulfill(
      rawdata: unknown,
      tx?: TxContext,
    ): Promise<StockChangeResult> {
      const data = fulfillSchema.parse(rawdata);
      const quantity = createDecimal(data.qty);

      return runInTransaction(tx, prisma, async (txCtx) => {
        const current = await invRepo.findByProductId(data.productId, txCtx);
        if (!current) throw createError({ statusCode: 404 });

        const beforeQty = createDecimal(String(current.quantity));

        const updated = await invRepo.fulfill(
          {
            productId: data.productId,
            qty: toPrismaDecimal(quantity),
            version: current.lockVersion,
          },
          txCtx,
        );
        if (!updated)
          throw createError({ statusCode: 409, message: "操作冲突" });

        const afterQty = createDecimal(String(updated.quantity));

        return {
          productId: data.productId,
          productName: current.productName,
          changedQty: quantity,
          beforeQty,
          afterQty,
        };
      });
    },

    /** 初始化库存 */
    async initStock(
      items: Array<{
        productId: string;
        productName: string;
        quantity: number;
        locationId?: string;
      }>,
      tx?: TxContext,
    ): Promise<StockChangeResult[]> {
      return runInTransaction(tx, prisma, async (txCtx) => {
        const results: StockChangeResult[] = [];

        for (const item of items) {
          const quantity = createDecimal(item.quantity);

          const existing = await invRepo.findByProductId(item.productId, txCtx);

          if (existing) {
            const beforeQty = createDecimal(String(existing.quantity));
            await invRepo.update(
              { id: existing.id },
              {
                quantity: { increment: toPrismaDecimal(quantity) },
                lockVersion: { increment: 1 },
              },
              txCtx,
            );
            results.push({
              productId: item.productId,
              productName: item.productName,
              changedQty: quantity,
              beforeQty,
              afterQty: beforeQty.plus(quantity),
            });
          } else {
            await invRepo.addStock(
              {
                productId: item.productId,
                productName: item.productName,
                quantity: toPrismaDecimal(quantity),
              },
              txCtx,
            );
            results.push({
              productId: item.productId,
              productName: item.productName,
              changedQty: quantity,
              beforeQty: createDecimal(0),
              afterQty: quantity,
            });
          }

          // 库位库存同步
          if (item.locationId) {
            await invLocRepo.addStock(
              item.productId,
              item.locationId,
              toPrismaDecimal(quantity),
              txCtx,
            );
          }
        }

        return results;
      });
    },
  };
};
