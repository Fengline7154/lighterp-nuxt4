import type { PrismaClient } from "~~/prisma/generated/client";
import { createPrismaBaseRepository } from "../base/prisma.base.repository";
import { TxContext } from "~~/server/infrastructure/tx";

export const createProductLogRepository = (prisma: PrismaClient) => {
  const baseRepo = createPrismaBaseRepository(prisma, "productLog");
  const getClient = (tx?: TxContext) => tx?.prisma ?? prisma;

  return {
    ...baseRepo,
  };
};
