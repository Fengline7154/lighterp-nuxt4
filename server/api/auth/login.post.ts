import { usePrisma } from "~~/server/config/prisma";
import { createAuthService } from "~~/server/services/auth.service";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  if (!body.account)
    throw createError({ statusCode: 400, message: "请输入账号" });
  if (!body.password)
    throw createError({ statusCode: 400, message: "请输入密码" });

  const authService = createAuthService(usePrisma());
  const result = await authService.login(body.account, body.password, event);

  setCookie(event, "refresh_token", result.refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 3600,
    path: "/",
  });
  // 设置防CSRF-Token
  setCookie(event, "csrf_token", result.csrfToken, {
    httpOnly: false, // JS 可读
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 3600,
    path: "/",
  });
  return {
    success: true,
    accessToken: result.accessToken,
    expiresIn: 15 * 60,
    user: result.user,
  };
});
