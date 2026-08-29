// server/utils/transaction.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import {
  createPrismaTxContext,
  type TxContext,
} from "~~/server/infrastructure/tx";

/**
 * 事务执行器
 *
 * 职责：
 * 1. 如果调用方传入了 tx（外部事务），直接使用它
 * 2. 如果没传 tx，自动开启一个新事务，执行完毕后提交/回滚
 *
 * 使用方式：
 *   const result = await runInTransaction(tx, async (txCtx) => {
 *     // 所有数据库操作都通过 txCtx 进行
 *     return someResult;
 *   });
 */
export async function runInTransaction<T>(
  tx: TxContext | undefined,
  prisma: PrismaClient,
  fn: (txCtx: TxContext) => Promise<T>,
): Promise<T> {
  // 外部已传入事务 → 直接使用
  if (tx) {
    return fn(tx);
  }

  // 没有外部事务 → 自己开一个新事务
  return prisma.$transaction(async (innerTx) => {
    const txCtx = createPrismaTxContext(innerTx);
    return fn(txCtx);
  });
}
