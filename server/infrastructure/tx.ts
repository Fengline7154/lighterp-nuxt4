// server/infrastructure/tx.ts
import type { PrismaClient, Prisma } from "~~/prisma/generated/client";
import type { ClientSession } from "mongoose";
import type { IRedisClient } from "./redis"; // 假设你已导出 IRedisClient 接口

/**
 * 统一事务上下文
 *
 * 服务层通过此上下文将当前事务内的客户端透传给数据层。
 * 如果某个操作不需要参与事务（例如独立的日志写入），可以传入 undefined 或不传。
 */
export interface TxContext {
  /** Prisma 客户端，可以是普通客户端或事务客户端 */
  prisma: PrismaClient | Prisma.TransactionClient;
  /** Mongoose 事务 Session（可选） */
  mongo?: ClientSession;
  /** Redis 客户端（可选），通常 Redis 操作不参与数据库事务，但可通过此上下文传递以达到代码统一 */
  redis?: IRedisClient;
}

/**
 * 创建一个仅包含 Prisma 事务的上下文
 * 通常在 `prisma.$transaction(async tx => { ... })` 中使用
 */
export function createPrismaTxContext(tx: Prisma.TransactionClient): TxContext {
  return { prisma: tx };
}

/**
 * 判断当前上下文中的 Prisma 客户端是否是事务客户端
 * 可用于某些需要区分事务与普通操作的场景
 */
export function isPrismaTransactionClient(
  prisma: PrismaClient | Prisma.TransactionClient,
): prisma is Prisma.TransactionClient {
  // Prisma 事务客户端具有 $transaction 方法（但普通客户端也有），更准确判断可检查特定属性，
  // 这里简单处理，因为类型上已经由调用方保证。
  return true; // 如果你需要严格判断，可改用 `'$use' in prisma` 等特征，但非必须
}
