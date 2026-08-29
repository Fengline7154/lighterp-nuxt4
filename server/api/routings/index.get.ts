// server/api/routings/index.get.ts
import { usePrisma } from "~~/server/config/prisma";
import { createProductProcessTemplateService } from "~~/server/services/product-process-template.service";
import { requirePermission } from "~~/server/utils/requirePermission";
export default defineEventHandler(async (event) => {
  await requirePermission(event, "process:view");
  const query = getQuery(event);
  const productId = query.productId as string;
  const service = createProductProcessTemplateService(usePrisma());

  if (productId) {
    const data = await service.getByProductId(productId);
    return { data };
  }

  const products = await service.getProductsWithTemplates();
  return {
    data: products.map((p: any) => ({
      ...p,
      templateCount: p._count.productProcessTemplates,
    })),
  };
});
