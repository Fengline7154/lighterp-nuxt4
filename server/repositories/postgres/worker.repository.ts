import type { PrismaClient } from "~~/prisma/generated/client";
import { createPrismaBaseRepository } from "../base/prisma.base.repository";
import type { TxContext } from "~~/server/infrastructure/tx";

export const createWorkerRepository = (prisma: PrismaClient) => {
  return createPrismaBaseRepository(prisma, "worker");
};
