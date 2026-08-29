// server/api/customers/index.get.ts
import { createCustomerService } from "~~/server/services/customer.service";
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";
import {
  paginationParamsSchema,
  sortParamsSchema,
  keywordParamsSchema,
} from "~~/shared/schemas/common/pagination.schema";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "customer:view");

  const query = getQuery(event);
  const { page, limit } = paginationParamsSchema.parse(query);
  const { sortField, sortDir } = sortParamsSchema.parse(query);
  const { keyword } = keywordParamsSchema.parse(query);

  const filter: any = {};
  if (keyword) {
    filter.OR = [
      { name: { contains: keyword } },
      { code: { contains: keyword } },
      { phone: { contains: keyword } },
    ];
  }

  const service = createCustomerService(usePrisma());
  return service.getList(filter, { page, limit, sortField, sortDir });
});
