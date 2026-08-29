// server/services/inventory-location.service.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createInventoryLocationRepository } from "~~/server/repositories/postgres/inventory-location.repository";
import type { TxContext } from "~~/server/infrastructure/tx";
import { runInTransaction } from "~~/server/utils/transaction";

export const createInventoryLocationService = (prisma: PrismaClient) => {
  const repo = createInventoryLocationRepository(prisma);

  return {
    /** 获取产品在所有库位的库存分布 */
    async getProductStock(productId: string) {
      return repo.findByProductId(productId);
    },

    /** 获取库位中所有产品的库存 */
    async getByLocationId(locationId: string) {
      return repo.findByLocationId(locationId);
    },

    /** 根据产品名称或编码反查库位分布 */
    async searchByProduct(query: string) {
      return prisma.inventoryLocation.findMany({
        where: {
          product: {
            OR: [{ code: { contains: query } }, { name: { contains: query } }],
          },
        },
        include: {
          product: { select: { code: true, name: true } },
          location: { select: { code: true, name: true, warehouse: true } },
        },
        orderBy: { location: { code: "asc" } },
      });
    },

    /** 库位入库（upsert） */
    async addStock(
      productId: string,
      locationId: string,
      quantity: number | string,
      tx?: TxContext,
    ) {
      return runInTransaction(tx, prisma, async (txCtx) => {
        return repo.addStock(productId, locationId, quantity, txCtx);
      });
    },

    /** 库位出库（乐观锁） */
    async deductWithLock(
      productId: string,
      locationId: string,
      quantity: number | string,
      currentVersion: number,
      tx?: TxContext,
    ) {
      return runInTransaction(tx, prisma, async (txCtx) => {
        return repo.deductWithLock(
          productId,
          locationId,
          quantity,
          currentVersion,
          txCtx,
        );
      });
    },

    /** 查询库位中某产品的库存 */
    async findFirst(
      where: { productId: string; locationId: string },
      tx?: TxContext,
    ) {
      return runInTransaction(tx, prisma, async (txCtx) => {
        const client = txCtx.prisma ?? prisma;
        return client.inventoryLocation.findFirst({ where });
      });
    },

    /** 按产品统计库位总量 */
    async sumByProductId(productId: string, tx?: TxContext) {
      return runInTransaction(tx, prisma, async (txCtx) => {
        return repo.sumByProductId(productId, txCtx);
      });
    },
  };
};
