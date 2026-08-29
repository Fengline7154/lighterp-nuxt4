// server/repositories/postgres/process.repository.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createPrismaBaseRepository } from "../base/prisma.base.repository";
import type { TxContext } from "~~/server/infrastructure/tx";

export const createProcessRepository = (prisma: PrismaClient) => {
  const baseRepo = createPrismaBaseRepository(prisma, "process");
  const getClient = (tx?: TxContext) => tx?.prisma ?? prisma;

  return {
    ...baseRepo,

    /** 查询所有标准工序 */
    async findAll(tx?: TxContext) {
      const client = getClient(tx);
      return client.process.findMany({ orderBy: { name: "asc" } });
    },
  };
};
