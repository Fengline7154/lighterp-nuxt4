import { createReceiptService } from "~~/server/services/receipt.service";
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "order:view");

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400 });

  return createReceiptService(usePrisma()).getById(id);
});
