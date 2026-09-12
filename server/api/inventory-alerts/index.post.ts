// server/api/inventory-alerts/index.post.ts
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";
import { z } from "zod";

const alertSchema = z.object({
  productId: z.string().uuid(),
  threshold: z.coerce.number().min(0, "阈值不能为负"),
  remark: z.string().max(200).optional(),
});

export default defineEventHandler(async (event) => {
  await requirePermission(event, "inventory:check");

  const prisma = usePrisma();
  const body = await readBody(event);
  const { productId, threshold, remark } = alertSchema.parse(body);

  const alert = await prisma.inventoryAlert.upsert({
    where: { productId },
    update: { threshold, remark },
    create: { productId, threshold, remark },
  });

  return { success: true, data: alert };
});
