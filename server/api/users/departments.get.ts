import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";
export default defineEventHandler(async (event) => {
  await requirePermission(event);
  const prisma = usePrisma();
  const result = await prisma.user.findMany({
    where: { department: { not: null } },
    distinct: ["department"],
    select: { department: true },
  });
  return result.map((r) => r.department).filter(Boolean);
});
