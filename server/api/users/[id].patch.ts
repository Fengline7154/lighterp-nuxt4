import { createUserService } from "~~/server/services/user.service";
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";
import { requireDataAccess } from "~~/server/utils/requireDataAccess";
import { redis } from "~~/server/infrastructure/redis";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "user:edit");

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "缺少用户ID" });

  const userService = createUserService(usePrisma());
  const target = await userService.getUserById(id);
  if (!target) {
    throw createError({
      statusCode: 404,
      message: "操作失败",
    });
  }

  await requireDataAccess(event, {
    ownerUserId: target.id,
    ownerDepartment: target.department,
  });

  const body = await readBody(event);
  const auth = event.context.auth;

  // 普通用户：只能改基本信息
  const basicFields = ["name", "email", "phone", "department"];
  // 管理员额外可以改
  const adminFields = ["role", "customPermissions", "status", "password"];

  const isAdmin =
    auth.user.role === "admin" ||
    auth.user.permissions?.includes("user:assign-role");

  const allowed = isAdmin ? [...basicFields, ...adminFields] : basicFields;

  const data: any = {};
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (isAdmin) {
    //如果是管理员对用户进行信息更新,解除其由于登录失败过多触发的封禁
    redis["security"].del(`login:lock:${id}`);
  }
  return await userService.updateUser(id, data, event.context.auth.user.id);
});
