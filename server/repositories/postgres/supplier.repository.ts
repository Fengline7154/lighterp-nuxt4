// server/repositories/postgres/supplier.repository.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createPrismaBaseRepository } from "../base/prisma.base.repository";

export const createSupplierRepository = (prisma: PrismaClient) => {
  return createPrismaBaseRepository(prisma, "supplier");
};
