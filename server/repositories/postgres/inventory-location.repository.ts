// server/repositories/postgres/inventory-location.repository.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createPrismaBaseRepository } from "../base/prisma.base.repository";
import type { TxContext } from "~~/server/infrastructure/tx";

export const createInventoryLocationRepository = (prisma: PrismaClient) => {
  const baseRepo = createPrismaBaseRepository(prisma, "inventoryLocation");
  const getClient = (tx?: TxContext) => tx?.prisma ?? prisma;

  return {
    ...baseRepo,
    //根据产品id查询并返回库位编码和名称
    async findByProductId(productId: string, tx?: TxContext) {
      const client = getClient(tx);
      return client.inventoryLocation.findMany({
        where: { productId },
        include: { location: { select: { code: true, name: true } } },
        orderBy: { location: { code: "asc" } },
      });
    },
    //根据库位id查询并返回产品编码和名称
    async findByLocationId(locationId: string, tx?: TxContext) {
      const client = getClient(tx);
      return client.inventoryLocation.findMany({
        where: { locationId },
        include: { product: { select: { code: true, name: true } } },
        orderBy: { product: { code: "asc" } },
      });
    },
    //库位入库
    async addStock(
      productId: string,
      locationId: string,
      quantity: number | string,
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      return client.inventoryLocation.upsert({
        where: { productId_locationId: { productId, locationId } },
        create: { productId, locationId, quantity, lockVersion: 0 },
        update: {
          quantity: { increment: quantity },
          lockVersion: { increment: 1 },
        },
      });
    },
    //库位带乐观锁出库
    async deductWithLock(
      productId: string,
      locationId: string,
      quantity: number | string,
      currentVersion: number,
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      const result = await client.inventoryLocation.updateMany({
        where: {
          productId,
          locationId,
          lockVersion: currentVersion,
          quantity: { gte: quantity },
        },
        data: {
          quantity: { decrement: quantity },
          lockVersion: { increment: 1 },
        },
      });
      return result.count > 0;
    },
    //根据产品id统计数量
    async sumByProductId(productId: string, tx?: TxContext) {
      const client = getClient(tx);
      const result = await client.inventoryLocation.aggregate({
        where: { productId },
        _sum: { quantity: true },
      });
      return result._sum.quantity || 0;
    },
  };
};
