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
  /** 边展边判断累加缺口 */
  async function accumulateShortageRecursive(
    productId: string,
    demandQty: IDecimal,
    targetProductIds: string[],
    shortageMap: Map<string, IDecimal>,
    visited: Set<string>,
  ) {
    if (demandQty.lte(0) || visited.has(productId)) return;
    visited.add(productId);

    // 查该产品库存和预留
    const stock = await prisma.inventory.findUnique({
      where: { productId },
      select: { quantity: true, reservedQty: true },
    });

    const totalQty = stock
      ? createDecimal(String(stock.quantity))
      : createDecimal(0);
    const reservedQty = stock
      ? createDecimal(String(stock.reservedQty))
      : createDecimal(0);
    const availableQty = totalQty.minus(reservedQty);

    if (availableQty.gt(0)) {
      // 可用库存能覆盖需求，无缺口
      if (availableQty.gte(demandQty)) return;

      // 可用库存不够，记录缺口，剩余需求向下展开
      const shortage = demandQty.minus(availableQty);
      if (targetProductIds.includes(productId)) {
        const current = shortageMap.get(productId) || createDecimal(0);
        shortageMap.set(productId, current.plus(shortage));
      }

      // 向下展开剩余需求
      const bom = await prisma.bom.findFirst({
        where: { productId, status: "PUBLISHED" },
        include: { items: true },
      });
      if (!bom) return;

      for (const bomItem of bom.items) {
        const childDemand = createDecimal(String(bomItem.quantity)).times(
          shortage,
        );
        await accumulateShortageRecursive(
          bomItem.materialId,
          childDemand,
          targetProductIds,
          shortageMap,
          visited,
        );
      }
    } else {
      // 无可用库存，全部需求都是缺口
      if (targetProductIds.includes(productId)) {
        const current = shortageMap.get(productId) || createDecimal(0);
        shortageMap.set(productId, current.plus(demandQty));
      }

      // 向下展开全部需求
      const bom = await prisma.bom.findFirst({
        where: { productId, status: "PUBLISHED" },
        include: { items: true },
      });
      if (!bom) return;

      for (const bomItem of bom.items) {
        const childDemand = createDecimal(String(bomItem.quantity)).times(
          demandQty,
        );
        await accumulateShortageRecursive(
          bomItem.materialId,
          childDemand,
          targetProductIds,
          shortageMap,
          visited,
        );
      }
    }
    visited.delete(productId);
  }
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
        include: { product: { select: { code: true, category: true } } },
      });

      // 收集当前页产品 ID
      const productIds = result.data.map((i: any) => i.productId);

      // 计算缺口 Map
      const shortageMap = await this.getShortageMap(productIds);

      result.data = result.data.map((i: any) => {
        const qty = createDecimal(String(i.quantity));
        const reserved = createDecimal(String(i.reservedQty));
        const available = qty.minus(reserved);
        const shortage = shortageMap.get(i.productId) || createDecimal(0);

        return {
          ...i,
          productCode: i.product?.code || i.productId,
          category: i.product?.category || "",
          availableQty: available.toString(),
          shortageQty: shortage.toString(),
        };
      });

      return result;
    },

    /** 计算产品缺口量（边展边判断，和预留逻辑一致） */
    async getShortageMap(productIds: string[]): Promise<Map<string, IDecimal>> {
      const shortageMap = new Map<string, IDecimal>();

      if (productIds.length === 0) return shortageMap;

      // 1. 查所有进行中订单及明细
      const activeOrders = await prisma.order.findMany({
        where: { status: { in: ["APPROVED", "PRODUCING"] } },
        include: {
          items: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              fulfilledQuantity: true,
              bomId: true,
            },
          },
        },
      });

      // 2. 对每个订单明细，边展边判断计算缺口
      for (const order of activeOrders) {
        for (const item of order.items) {
          const totalQty = createDecimal(String(item.quantity));
          const fulfilled = createDecimal(String(item.fulfilledQuantity));
          const remaining = totalQty.minus(fulfilled);
          if (remaining.lte(0) || !item.bomId) continue;

          // 从 BOM 直接子物料开始，边展边判断
          const bom = await prisma.bom.findUnique({
            where: { id: item.bomId },
            include: { items: true },
          });
          if (!bom) continue;

          for (const bomItem of bom.items) {
            const childDemand = createDecimal(String(bomItem.quantity)).times(
              remaining,
            );
            await accumulateShortageRecursive(
              bomItem.materialId,
              childDemand,
              productIds,
              shortageMap,
              new Set(),
            );
          }
        }
      }

      // 3. 减去未消耗预留
      // 3. 减去未消耗预留，并检查预留被抽调的情况
      for (const productId of productIds) {
        const reserved = await prisma.orderReservation.aggregate({
          where: {
            productId,
            type: "MATERIAL_RESERVE",
            order: { status: { in: ["APPROVED", "PRODUCING"] } },
          },
          _sum: {
            quantity: true,
            consumedQty: true,
            released: true,
          },
        });

        const totalReserved = createDecimal(
          String(reserved._sum.quantity || 0),
        );
        const consumed = createDecimal(String(reserved._sum.consumedQty || 0));
        const released = createDecimal(String(reserved._sum.released || 0));
        const unreservedConsumed = totalReserved
          .minus(consumed)
          .minus(released);

        // 查当前库存
        const inv = await prisma.inventory.findUnique({
          where: { productId },
          select: { quantity: true, reservedQty: true },
        });

        const totalStock = inv
          ? createDecimal(String(inv.quantity))
          : createDecimal(0);
        const inventoryReserved = inv
          ? createDecimal(String(inv.reservedQty))
          : createDecimal(0);

        // 计算缺口
        let shortage = shortageMap.get(productId) || createDecimal(0);
        shortage = shortage.minus(unreservedConsumed);

        // 检查预留被抽调：未消耗预留 > 总库存
        if (unreservedConsumed.gt(totalStock)) {
          const reserveGap = unreservedConsumed.minus(totalStock);
          shortage = shortage.plus(reserveGap);
        }

        // 缺口最小为 0
        if (shortage.lt(0)) shortage = createDecimal(0);

        shortageMap.set(productId, shortage);
      }

      return shortageMap;
    },

    /** 展开 BOM 计算原料需求（复用现有逻辑） */
    async expandBomForShortage(
      bomId: string,
      multiplier: IDecimal,
    ): Promise<Map<string, IDecimal>> {
      const materialMap = new Map<string, IDecimal>();

      const expand = async (bomId: string, mult: IDecimal, depth: number) => {
        if (depth > 10) return;
        const bom = await prisma.bom.findUnique({
          where: { id: bomId },
          include: { items: true },
        });
        if (!bom) return;

        for (const item of bom.items) {
          const childQty = createDecimal(String(item.quantity)).times(mult);
          const subBom = await prisma.bom.findFirst({
            where: { productId: item.materialId, status: "PUBLISHED" },
          });
          if (subBom) {
            await expand(subBom.id, childQty, depth + 1);
          } else {
            const existing = materialMap.get(item.materialId);
            materialMap.set(
              item.materialId,
              existing ? existing.plus(childQty) : childQty,
            );
          }
        }
      };

      await expand(bomId, multiplier, 0);
      return materialMap;
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
      return {
        ...inv,
        quantity: qty,
        reservedQty: reserved,
        availableQty: qty.minus(reserved),
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
