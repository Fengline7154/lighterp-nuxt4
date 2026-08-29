// server/repositories/postgres/product-process-template.repository.ts
import type { PrismaClient, WageType } from "~~/prisma/generated/client";
import { createPrismaBaseRepository } from "../base/prisma.base.repository";
import type { TxContext } from "~~/server/infrastructure/tx";

export const createProductProcessTemplateRepository = (
  prisma: PrismaClient,
) => {
  const baseRepo = createPrismaBaseRepository(prisma, "productProcessTemplate");
  const getClient = (tx?: TxContext) => tx?.prisma ?? prisma;

  return {
    ...baseRepo,

    async findByProductId(productId: string, tx?: TxContext) {
      const client = getClient(tx);
      return client.productProcessTemplate.findMany({
        where: { productId },
        orderBy: { sequence: "asc" },
      });
    },

    async replaceTemplates(
      productId: string,
      items: Array<{
        processId?: string | null;
        sequence: number;
        processName: string;
        wageType?: WageType;
        standardHours?: number | string;
        hourlyRate?: number | string;
        unitPrice?: number | string;
      }>,
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      await client.productProcessTemplate.deleteMany({ where: { productId } });
      return client.productProcessTemplate.createMany({
        data: items.map((item) => ({ ...item, productId })),
      });
    },
  };
};
