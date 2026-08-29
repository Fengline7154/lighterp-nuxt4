// server/api/setup/init.post.ts
import { usePrisma } from "~~/server/config/prisma";
import { createUserService } from "~~/server/services/user.service";
import { createAuthService } from "~~/server/services/auth.service";
import { createError, readBody } from "h3";
import { z } from "zod";
import { isPassword } from "~~/shared/utils/validators/password";

const initSchema = z.object({
  password: z.string().min(1, "密码不能为空"),
});

export default defineEventHandler(async (event) => {
  const prisma = usePrisma();
  const ctx = buildRequestContext(event);
  // 二次校验：已有用户则拒绝
  const count = await prisma.user.count();
  if (count > 0) {
    throw createError({ statusCode: 403, message: "系统已初始化" });
  }

  const body = await readBody(event);
  const { password } = initSchema.parse(body);

  // 复用已有的密码强度校验
  if (!isPassword(password, "secure")) {
    throw createError({
      statusCode: 400,
      message: "密码强度不足：需至少8位，包含大小写字母、数字和特殊字符",
    });
  }

  // 创建管理员
  const userService = createUserService(prisma);
  const user = {
    name: "管理员",
    email: "admin@localhost.com",
    password,
    role: "admin",
    permissions: ["*"],
  };
  const result = await userService.createUser(ctx, user);

  return {
    success: true,
    user: {
      id: result.id,
      name: result.name,
      badgeCode: result.badgeCode,
      role: result.role,
    },
  };
});
