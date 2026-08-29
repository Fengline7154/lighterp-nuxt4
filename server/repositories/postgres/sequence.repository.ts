// server/repositories/postgres/sequence.repository.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createPrismaBaseRepository } from "../base/prisma.base.repository";
import type { TxContext } from "~~/server/infrastructure/tx";

export const createSequenceRepository = (prisma: PrismaClient) => {
  const baseRepo = createPrismaBaseRepository(prisma, "sequence");
  const getClient = (tx?: TxContext) => tx?.prisma ?? prisma;

  return {
    ...baseRepo,

    /**
     * 获取下一个序列值（原子自增）
     * PostgreSQL INSERT ... ON CONFLICT 保证原子性
     * @param key 序列键，如 employee_code:2026, order_code:2026
     * @returns 自增后的值
     */
    async getNextSequence(key: string, tx?: TxContext): Promise<number> {
      const client = getClient(tx);
      const result = await client.$queryRaw<Array<{ current_value: number }>>`
        INSERT INTO "sequences" ("key", "current_value", "updated_at")
        VALUES (${key}, 1, NOW())
        ON CONFLICT ("key")
        DO UPDATE SET "current_value" = "sequences"."current_value" + 1, "updated_at" = NOW()
        RETURNING "current_value"
      `;
      return result[0]!.current_value;
    },

    /**
     * 获取当前序列值（不自增）
     * @param key 序列键
     * @returns 当前值，不存在则返回 0
     */
    async getCurrentValue(key: string, tx?: TxContext): Promise<number> {
      const client = getClient(tx);
      const seq = await client.sequence.findUnique({ where: { key } });
      return seq?.currentValue ?? 0;
    },
  };
};
