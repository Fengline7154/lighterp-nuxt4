// server/api/inventory/[productId]/transfer.post.ts
import { usePrisma } from "~~/server/config/prisma";
import { createInventoryApplication } from "~~/server/application/inventory.application";
import { requirePermission } from "~~/server/utils/requirePermission";
import { buildRequestContext } from "~~/server/utils/buildRequestContext";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "inventory:transfer");

  const ctx = buildRequestContext(event);
  const productId = getRouterParam(event, "productId")!;
  const body = await readBody(event);

  const app = createInventoryApplication(usePrisma());
  return app.transfer(ctx, { productId, ...body });
});
