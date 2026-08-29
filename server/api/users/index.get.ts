import { createUserService } from "~~/server/services/user.service";
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "user:view");

  const query = getQuery(event);
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const keyword = query.keyword as string;
  const roleFilter = query.role as string;
  const deptFilter = query.department as string;
  const statusFilter = (query.status as string) || "ACTIVE";
  const sortField = (query.sortField as string) || "createdAt";
  const sortDir = (query.sortDir as string) || "desc";

  if (!["ACTIVE", "INACTIVE"].includes(statusFilter)) {
    throw createError({ statusCode: 400, message: "无效状态" });
  }

  const auth = event.context.auth.user;
  const scope = auth.dataScope;

  const scopeFilter: any = { status: statusFilter };

  if (keyword) {
    scopeFilter.OR = [
      { badgeCode: { contains: keyword } },
      { name: { contains: keyword } },
      { phone: { contains: keyword } },
      { email: { contains: keyword } },
    ];
  }
  if (roleFilter) scopeFilter.role = roleFilter;
  if (deptFilter) scopeFilter.department = deptFilter;

  if (scope.type === "self") {
    scopeFilter.id = auth.id;
  } else if (scope.type === "department" && auth.department) {
    scopeFilter.department = auth.department;
  }

  const userService = createUserService(usePrisma());
  return await userService.getUserList(scopeFilter, {
    page,
    limit,
    sortField,
    sortDir,
  });
});
