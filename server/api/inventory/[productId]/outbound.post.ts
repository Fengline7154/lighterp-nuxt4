// server/api/inventory/[productId]/outbound.post.ts
import { usePrisma } from "~~/server/config/prisma";
import { createInventoryApplication } from "~~/server/application/inventory.application";
import { requirePermission } from "~~/server/utils/requirePermission";
import { buildRequestContext } from "~~/server/utils/buildRequestContext";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "inventory:adjust");

  const ctx = buildRequestContext(event);
  const productId = getRouterParam(event, "productId")!;
  const body = await readBody(event);

  const app = createInventoryApplication(usePrisma());
  return app.deductStock(ctx, { productId, ...body });
});
