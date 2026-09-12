// server/api/inventory-alerts/[id].delete.ts
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "inventory:check");

  const id = getRouterParam(event, "id")!;
  const prisma = usePrisma();
  await prisma.inventoryAlert.delete({ where: { id } });

  return { success: true };
});
