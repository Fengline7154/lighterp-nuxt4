import { createUserService } from "~~/server/services/user.service";
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";
import { requireDataAccess } from "~~/server/utils/requireDataAccess";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "user:delete");

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400 });

  const body = await readBody(event);
  const newStatus = body.status;
  if (!["ACTIVE", "INACTIVE"].includes(newStatus)) {
    throw createError({ statusCode: 400, message: "无效状态" });
  }

  const userService = createUserService(usePrisma());
  const target = await userService.getUserById(id);

  await requireDataAccess(event, {
    ownerUserId: target.id,
    ownerDepartment: target.department,
  });

  return userService.changeStatus(id, newStatus, event.context.auth.user.id);
});
