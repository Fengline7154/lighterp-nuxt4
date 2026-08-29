import type { PrismaClient } from "~~/prisma/generated/client";
import { createPrismaBaseRepository } from "../base/prisma.base.repository";

export const createLocationRepository = (prisma: PrismaClient) => {
  return createPrismaBaseRepository(prisma, "location");
};
