// server/api/orders/index.get.ts
import { createOrderService } from "~~/server/services/order.service";
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";
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

  // 解析通用参数
  const { page, limit } = paginationParamsSchema.parse(query);
  const { sortField, sortDir } = sortParamsSchema.parse(query);
  const { keyword } = keywordParamsSchema.parse(query);

  // 解析状态筛选
  const statusFilter = query.status as string;
  const statuses = statusFilter ? statusFilter.split(",") : [];

  // 构建 filter
  const filter: any = {};

  // 权限过滤
  if (scope.type === "self") {
    filter.createdById = auth.id;
  } else if (scope.type === "department" && auth.department) {
    filter.department = auth.department;
  }

  // 状态过滤
  if (statuses.length) {
    filter.statuses = statuses;
  }

  // 关键词搜索
  if (keyword) {
    filter.keyword = keyword;
  }

  const orderService = createOrderService(usePrisma());
  return orderService.getOrderList(filter, { page, limit, sortField, sortDir });
});
