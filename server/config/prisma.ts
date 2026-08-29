// server/config/prisma.ts
import { PrismaClient } from "~~/prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const usePrisma = () => {
  if (!globalForPrisma.prisma) {
    const config = useRuntimeConfig();
    const pool = new Pool({ connectionString: config.postgresUrl });
    const adapter = new PrismaPg(pool);
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.prisma;
};
