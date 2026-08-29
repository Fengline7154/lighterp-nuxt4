// server/api/bom/index.get.ts
import { createBomService } from "~~/server/services/bom.service";
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";
import {
  paginationParamsSchema,
  sortParamsSchema,
  keywordParamsSchema,
} from "~~/shared/schemas/common/pagination.schema";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "bom:view");

  const query = getQuery(event);
  const { page, limit } = paginationParamsSchema.parse(query);
  const { sortField, sortDir } = sortParamsSchema.parse(query);
  const { keyword } = keywordParamsSchema.parse(query);

  const status = query.status as string;
  const productId = query.productId as string;
  const showAll = query.showAll as string;

  const filter: any = {};
  if (status) filter.status = status;
  if (productId) filter.productId = productId;
  if (keyword) {
    filter.OR = [
      { bomCode: { contains: keyword } },
      { product: { name: { contains: keyword } } },
    ];
  }

  const service = createBomService(usePrisma());
  return service.getList(filter, { page, limit, sortField, sortDir, showAll });
});
