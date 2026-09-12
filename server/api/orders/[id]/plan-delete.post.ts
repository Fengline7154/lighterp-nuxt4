// server/api/orders/[id]/plan-delete.post.ts
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "order:update");

  const body = await readBody(event);

  const prisma = usePrisma();
  await prisma.orderProcessPlan.delete({
    where: { id: body.planId },
  });

  return { success: true };
});
