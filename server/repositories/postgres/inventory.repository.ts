// server/repositories/postgres/inventory.repository.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createPrismaBaseRepository } from "../base/prisma.base.repository";
import type { TxContext } from "~~/server/infrastructure/tx";

export const createInventoryRepository = (prisma: PrismaClient) => {
  const baseRepo = createPrismaBaseRepository(prisma, "inventory");
  const getClient = (tx?: TxContext) => tx?.prisma ?? prisma;

  return {
    ...baseRepo,

    /**
     * 增加库存 (Upsert 操作)
     */
    async addStock(
      params: {
        productId: string;
        productName: string;
        quantity: number | string;
      },
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      return client.inventory.upsert({
        where: { productId: params.productId },
        create: {
          productId: params.productId,
          productName: params.productName,
          quantity: params.quantity,
          lockVersion: 0,
        },
        update: {
          quantity: { increment: params.quantity },
          lockVersion: { increment: 1 },
        },
      });
    },

    /**
     * 乐观锁扣减库存
     */
    async deductWithLock(
      params: {
        productId: string;
        quantity: number | string;
        currentVersion: number;
      },
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      const result = await client.inventory.updateMany({
        where: {
          productId: params.productId,
          lockVersion: params.currentVersion,
          quantity: { gte: params.quantity },
        },
        data: {
          quantity: { decrement: params.quantity },
          lockVersion: { increment: 1 },
        },
      });

      if (result.count === 0) return null;
      return client.inventory.findUnique({
        where: { productId: params.productId },
      });
    },

    /**
     * 乐观锁调整库存 (直接设定新值)
     */
    async adjustWithLock(
      params: {
        productId: string;
        productName: string;
        newQuantity: number | string;
        currentVersion: number;
      },
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      const result = await client.inventory.updateMany({
        where: {
          productId: params.productId,
          lockVersion: params.currentVersion,
        },
        data: {
          productName: params.productName,
          quantity: params.newQuantity,
          lockVersion: { increment: 1 },
        },
      });

      if (result.count === 0) return null;
      return client.inventory.findUnique({
        where: { productId: params.productId },
      });
    },

    /**
     * 根据 productId 查询库存记录
     */
    async findByProductId(productId: string, tx?: TxContext) {
      return this.findFirst({ productId }, undefined, tx);
    },

    /**
     * 预留库存（审批时调用）
     */
    async reserve(
      params: {
        productId: string;
        qty: number | string;
        version: number;
      },
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      const result = await client.inventory.updateMany({
        where: { productId: params.productId, lockVersion: params.version },
        data: {
          reservedQty: { increment: params.qty },
          lockVersion: { increment: 1 },
        },
      });
      return result.count > 0
        ? client.inventory.findUnique({
            where: { productId: params.productId },
          })
        : null;
    },

    /**
     * 释放预留（取消时调用）
     */
    async release(
      params: {
        productId: string;
        qty: number | string;
        version: number;
      },
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      const result = await client.inventory.updateMany({
        where: { productId: params.productId, lockVersion: params.version },
        data: {
          reservedQty: { decrement: params.qty },
          lockVersion: { increment: 1 },
        },
      });
      return result.count > 0
        ? client.inventory.findUnique({
            where: { productId: params.productId },
          })
        : null;
    },

    /**
     * 入库冲销预留（生产入库时调用）
     */
    async fulfill(
      params: {
        productId: string;
        qty: number | string;
        version: number;
      },
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      const result = await client.inventory.updateMany({
        where: { productId: params.productId, lockVersion: params.version },
        data: {
          quantity: { increment: params.qty },
          reservedQty: { decrement: params.qty },
          lockVersion: { increment: 1 },
        },
      });
      return result.count > 0
        ? client.inventory.findUnique({
            where: { productId: params.productId },
          })
        : null;
    },

    /**
     * 批量根据产品 ID 查询库存（用于缺料分析）
     */
    async findByProductIds(productIds: string[], tx?: TxContext) {
      const client = getClient(tx);
      return client.inventory.findMany({
        where: { productId: { in: productIds } },
      });
    },

    /**
     * 按条件批量更新（乐观锁）
     */
    async updateManyByCondition(
      where: { productId: string; lockVersion: number },
      data: Record<string, any>,
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      const result = await client.inventory.updateMany({
        where: {
          productId: where.productId,
          lockVersion: where.lockVersion,
        },
        data,
      });
      return result;
    },
  };
};
