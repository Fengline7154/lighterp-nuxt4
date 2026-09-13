// server/api/setup/init.post.ts
import { usePrisma } from "~~/server/config/prisma";
import { createUserService } from "~~/server/services/user.service";
import { createError, readBody } from "h3";
import { z } from "zod";
import { isPassword } from "~~/shared/utils/validators/password";
import { redis } from "~~/server/infrastructure/redis";
import { createRedisClient } from "~~/server/infrastructure/redis";
const initSchema = z.object({
  setupSecret: z.string().min(1, "初始化密钥不能为空"),
  name: z.string().min(1, "管理员名称不能为空").max(50),
  email: z.string().email("邮箱格式不正确").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  password: z.string().min(1, "密码不能为空"),
});

export default defineEventHandler(async (event) => {
  const prisma = usePrisma();
  const config = useRuntimeConfig();

  // 二次校验：已有用户则拒绝
  const count = await prisma.user.count();
  if (count > 0) {
    throw createError({ statusCode: 403, message: "系统已初始化" });
  }

  const body = await readBody(event);
  const { setupSecret, name, email, phone, password } = initSchema.parse(body);

  // 校验初始化密钥
  if (setupSecret !== config.setupSecret) {
    throw createError({
      statusCode: 403,
      message: "初始化密钥错误",
    });
  }

  // 密码强度校验
  if (!isPassword(password, "secure")) {
    throw createError({
      statusCode: 400,
      message: "密码强度不足：需至少8位，包含大小写字母、数字和特殊字符",
    });
  }

  // 创建管理员
  const userService = createUserService(prisma);
  const user = {
    name: name.trim(),
    email: email || undefined,
    phone: phone || undefined,
    password,
    role: "admin",
    permissions: ["*"],
  };

  const result = await userService.createUser(
    {
      operatorId: "setup",
      department: null,
    },
    user,
  );
  
  // 写入初始化状态缓存
  const sessionRedis = createRedisClient("session");
  await sessionRedis.set("system:initialized", true, 180 * 24 * 3600);

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
