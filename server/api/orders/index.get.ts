// server/api/orders/index.get.ts
import { createOrderService } from "~~/server/services/order.service";
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";
import { desensitizeOrderList } from "~~/server/utils/desensitize";
import {
  paginationParamsSchema,
  sortParamsSchema,
  keywordParamsSchema,
} from "~~/shared/schemas/common/pagination.schema";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "order:view");

  const query = getQuery(event);
  const auth = event.context.auth.user;
  const scope = auth.dataScope;

  const { page, limit } = paginationParamsSchema.parse(query);
  const { sortField, sortDir } = sortParamsSchema.parse(query);
  const { keyword } = keywordParamsSchema.parse(query);

  const statusFilter = query.status as string;
  const statuses = statusFilter ? statusFilter.split(",") : [];

  const filter: any = {};

  if (scope.type === "self") {
    filter.createdById = auth.id;
  } else if (scope.type === "department" && auth.department) {
    filter.department = auth.department;
  }

  if (statuses.length) {
    filter.statuses = statuses;
  }

  if (keyword) {
    filter.keyword = keyword;
  }

  const orderService = createOrderService(usePrisma());
  const result = await orderService.getOrderList(filter, {
    page,
    limit,
    sortField,
    sortDir,
  });

  const permissions = auth.permissions || [];
  return desensitizeOrderList(result, permissions);
});
