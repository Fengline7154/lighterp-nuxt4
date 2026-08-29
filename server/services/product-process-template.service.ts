// server/services/product-process-template.service.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createProductProcessTemplateRepository } from "~~/server/repositories/postgres/product-process-template.repository";
import {
  createDecimal,
  toPrismaDecimal,
} from "~~/shared/mappers/baseRepoType/decimal";
import { saveProductProcessTemplateSchema } from "~~/shared/schemas/api/product-process-template.schema";
import { runInTransaction } from "~~/server/utils/transaction";
import type { TxContext } from "~~/server/infrastructure/tx";
import { createError } from "h3";

export const createProductProcessTemplateService = (prisma: PrismaClient) => {
  const repo = createProductProcessTemplateRepository(prisma);

  return {
    async getByProductId(productId: string) {
      return repo.findByProductId(productId);
    },

    async saveTemplates(rawdata: unknown, tx?: TxContext) {
      const { productId, processes } =
        saveProductProcessTemplateSchema.parse(rawdata);

      // 序号重复检查
      const seqs = processes.map((p) => p.sequence);
      const dupSeq = seqs.find((s, i) => seqs.indexOf(s) !== i);
      if (dupSeq !== undefined) {
        throw createError({
          statusCode: 400,
          message: `序号 ${dupSeq} 重复，请检查工序顺序`,
        });
      }

      // 工序名称重复检查
      const names = processes.map((p) => p.processName);
      const dupName = names.find((n, i) => names.indexOf(n) !== i);
      if (dupName) {
        throw createError({
          statusCode: 400,
          message: `工序 "${dupName}" 重复，请检查`,
        });
      }

      return runInTransaction(tx, prisma, async (txCtx) => {
        return repo.replaceTemplates(
          productId,
          processes.map((p) => ({
            processId: p.processId,
            processName: p.processName,
            sequence: p.sequence,
            wageType: p.wageType,
            standardHours:
              p.standardHours != null
                ? toPrismaDecimal(createDecimal(p.standardHours))
                : undefined,
            hourlyRate:
              p.hourlyRate != null
                ? toPrismaDecimal(createDecimal(p.hourlyRate))
                : undefined,
            unitPrice:
              p.unitPrice != null
                ? toPrismaDecimal(createDecimal(p.unitPrice))
                : undefined,
          })),
          txCtx,
        );
      });
    },

    async getProductsWithTemplates() {
      return prisma.product.findMany({
        where: { category: { in: ["FINISHED", "SEMI"] }, status: "ACTIVE" },
        select: {
          id: true,
          code: true,
          name: true,
          _count: { select: { productProcessTemplates: true } },
        },
        orderBy: { code: "asc" },
      });
    },
  };
};
