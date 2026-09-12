// server/api/material-substitutions/index.get.ts
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "inventory:view");

  const prisma = usePrisma();
  const query = getQuery(event);
  const orderId = query.orderId as string | undefined;

  const where: any = {};
  if (orderId) where.orderId = orderId;

  const records = await prisma.materialSubstitution.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return { data: records };
});
