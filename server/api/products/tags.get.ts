// server/api/products/tags.get.ts
import { usePrisma } from "~~/server/config/prisma";
import { createProductService } from "~~/server/services/product.service";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "product:view");

  const query = getQuery(event);
  const productService = createProductService(usePrisma());

  const result = await productService.getList(
    { status: (query.status as string) || "ACTIVE" },
    { page: 1, limit: 10000 },
  );

  const allTags = [...new Set(result.data.flatMap((p: any) => p.tags))];
  return allTags;
});
