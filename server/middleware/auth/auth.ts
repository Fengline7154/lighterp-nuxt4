//从cookies中获取token并进行校验认证
import { TokenService } from "~~/server/services/token.service";
import { redis } from "~~/server/infrastructure/redis";

export default defineEventHandler(async (event) => {
  const publicPaths = [
    "/api/setup/status",
    "/api/auth/login",
    "/api/auth/refresh",
    "/api/captcha",
    "/api/auth/logout",
  ];
  if (publicPaths.some((p) => event.path.startsWith(p))) {
    return;
  }
  //若不存在token或token已经过期，则直接返回
  const authHeader = getHeader(event, "Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return;

  const tokenService = new TokenService();
  let payload;
  try {
    payload = tokenService.verifyAccessToken(token);
  } catch (error) {
    return;
  }

  const sessionData = await redis["session"].get(payload.jti);

  if (!sessionData) return;

  event.context.auth = {
    user: {
      id: sessionData.userId,
      role: sessionData.role,
      sessionId: payload.jti,
    },
  };
});
