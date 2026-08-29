import { createProductService } from "~~/server/services/product.service";
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";
import {
  paginationParamsSchema,
  sortParamsSchema,
  keywordParamsSchema,
} from "~~/shared/schemas/common/pagination.schema";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "product:view");

  const query = getQuery(event);
  const { page, limit } = paginationParamsSchema.parse(query);
  const { sortField, sortDir } = sortParamsSchema.parse(query);
  const { keyword } = keywordParamsSchema.parse(query);

  const category = query.category as string;
  const status = query.status as string;
  const tags = query.tags as string | string[];
  const tagsArray = Array.isArray(tags) ? tags : tags ? tags.split(",") : [];

  const filter: any = {};

  if (keyword)
    filter.OR = [
      { name: { contains: keyword } },
      { code: { contains: keyword } },
    ];
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (tagsArray.length > 0) filter.tags = { hasSome: tagsArray };

  const service = createProductService(usePrisma());
  return service.getList(filter, { page, limit, sortField, sortDir });
});
