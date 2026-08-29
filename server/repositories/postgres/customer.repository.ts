import type { PrismaClient } from "~~/prisma/generated/client";
import { createPrismaBaseRepository } from "../base/prisma.base.repository";
import { TxContext } from "~~/server/infrastructure/tx";

export const createCustomerRepository = (prisma: PrismaClient) => {
  const baseRepo = createPrismaBaseRepository(prisma, "customer");
  const getClient = (tx?: TxContext) => tx?.prisma ?? prisma;

  return {
    ...baseRepo,

    async findActiveById(id: string, tx?: TxContext) {
      const client = getClient(tx);
      return client.customer.findUnique({
        where: { id: id, status: "ACTIVE" },
      });
    },
  };
};
