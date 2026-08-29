// server/api/auth/me.get.ts
import { createUserService } from "~~/server/services/user.service";
import { usePrisma } from "~~/server/config/prisma";
import { TokenService } from "~~/server/services/token.service";
import { redis } from "~~/server/infrastructure/redis";

export default defineEventHandler(async (event) => {
  // 1. 中间件已注入
  if (event.context.auth?.user?.id) {
    return createUserService(usePrisma()).getUserById(
      event.context.auth.user.id,
    );
  }

  // 2. 从 Authorization 头取 token
  const authHeader = getHeader(event, "Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) throw createError({ statusCode: 401 });

  const tokenService = new TokenService();
  let payload;
  try {
    payload = tokenService.verifyAccessToken(token);
  } catch {
    throw createError({ statusCode: 401, message: "Token 无效" });
  }

  // 3. 从 Redis session 取用户信息（和中间件一致）
  const sessionData = await redis["session"].get(payload.jti);
  if (!sessionData?.userId)
    throw createError({ statusCode: 401, message: "会话已过期" });
  const res = await createUserService(usePrisma()).getUserById(
    sessionData.userId,
  );

  return res;
});
