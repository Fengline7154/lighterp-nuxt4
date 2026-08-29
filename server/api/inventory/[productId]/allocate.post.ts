// server/api/inventory/[productId]/allocate.post.ts
import { usePrisma } from "~~/server/config/prisma";
import { createInventoryApplication } from "~~/server/application/inventory.application";
import { requirePermission } from "~~/server/utils/requirePermission";
import { buildRequestContext } from "~~/server/utils/buildRequestContext";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "inventory:adjust");

  const ctx = buildRequestContext(event);
  const productId = getRouterParam(event, "productId");
  if (!productId) throw createError({ statusCode: 400 });

  const body = await readBody(event);
  const { orderCode, quantity } = body;
  if (!orderCode || !quantity || quantity <= 0) {
    throw createError({ statusCode: 400, message: "参数错误" });
  }

  const app = createInventoryApplication(usePrisma());
  return app.allocate(ctx, { productId, orderCode, quantity });
});
