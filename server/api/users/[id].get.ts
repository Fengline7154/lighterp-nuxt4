import { createUserService } from "~~/server/services/user.service";
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";
import { requireDataAccess } from "~~/server/utils/requireDataAccess";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "user:view");

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "缺少用户ID" });

  const userService = createUserService(usePrisma());
  const user = await userService.getUserById(id);

  await requireDataAccess(event, {
    ownerUserId: user.id,
    ownerDepartment: user.department,
  });

  return user;
});
