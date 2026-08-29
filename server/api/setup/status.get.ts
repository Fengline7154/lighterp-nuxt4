// server/api/setup/status.get.ts
import { usePrisma } from "~~/server/config/prisma";

export default defineEventHandler(async () => {
  const prisma = usePrisma();
  const count = await prisma.user.count();
  return { needSetup: count === 0 };
});
