import { usePrisma } from "~~/server/config/prisma";
import { createAuthService } from "~~/server/services/auth.service";
import { redis } from "~~/server/infrastructure/redis";

export default defineEventHandler(async (event) => {
  // IP 速率限制
  const ip = getRequestIP(event);
  if (ip) {
    const rateKey = `refresh:ip:${ip}`;
    const rateCount = (await redis["security"].get(rateKey)) || 0;
    if (rateCount >= 10) {
      throw createError({
        statusCode: 429,
        message: "请求过于频繁，请稍后再试",
      });
    }
    await redis["security"].set(rateKey, rateCount + 1, 60);
  }

  const refreshToken = getCookie(event, "refresh_token");
  const csrfToken = getHeader(event, "X-CSRF-Token");

  if (!refreshToken)
    throw createError({ statusCode: 401, message: "缺少刷新令牌" });
  if (!csrfToken)
    throw createError({ statusCode: 401, message: "缺少 CSRF Token" });

  const authService = createAuthService(usePrisma());
  const result = await authService.refreshByRefreshToken(
    refreshToken,
    csrfToken,
  );

  // 更新 refresh token Cookie
  setCookie(event, "refresh_token", result.refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 3600,
    path: "/",
  });

  // 更新 CSRF token Cookie
  setCookie(event, "csrf_token", result.csrfToken, {
    httpOnly: false,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 3600,
    path: "/",
  });

  return {
    success: true,
    accessToken: result.accessToken,
    csrfToken: result.csrfToken,
    expiresIn: 15 * 60,
  };
});
