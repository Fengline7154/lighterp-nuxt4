// server/repositories/postgres/user.repository.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createPrismaBaseRepository } from "../base/prisma.base.repository";
import type { TxContext } from "~~/server/infrastructure/tx";

export const createUserRepository = (prisma: PrismaClient) => {
  const baseRepo = createPrismaBaseRepository(prisma, "user");
  const getClient = (tx?: TxContext) => tx?.prisma ?? prisma;

  return {
    ...baseRepo,

    async findByEmail(email: string, tx?: TxContext) {
      const client = getClient(tx);
      return client.user.findUnique({ where: { email } });
    },

    async findByUsername(badgeCode: string, tx?: TxContext) {
      const client = getClient(tx);
      return client.user.findUnique({ where: { badgeCode } });
    },

    async findByPhone(phone: string, tx?: TxContext) {
      const client = getClient(tx);
      return client.user.findUnique({ where: { phone } });
    },

    async findExistingUser(
      params: {
        badgeCode?: string;
        email?: string;
        phone?: string;
      },
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      const whereCondition: any[] = [];
      if (params.badgeCode)
        whereCondition.push({ badgeCode: params.badgeCode });
      if (params.email) whereCondition.push({ email: params.email });
      if (params.phone) whereCondition.push({ phone: params.phone });

      if (whereCondition.length === 0) return null;

      return client.user.findFirst({
        where: { OR: whereCondition },
        select: {
          id: true,
          badgeCode: true,
          name: true,
          email: true,
          phone: true,
        },
      });
    },

    async updateLastLogin(id: string, tx?: TxContext) {
      const client = getClient(tx);
      return client.user.update({
        where: { id },
        data: { lastLoginAt: new Date() },
      });
    },
  };
};
