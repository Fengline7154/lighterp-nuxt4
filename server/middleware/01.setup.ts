// server/middleware/01.setup.ts
import { usePrisma } from "~~/server/config/prisma";
import { redis } from "~~/server/infrastructure/redis";
import { createRedisClient } from "~~/server/infrastructure/redis";
const CACHE_KEY = "system:initialized";
const CACHE_TTL = 180 * 24 * 3600; // 半年

export default defineEventHandler(async (event) => {
  // 只拦截页面请求，放行 API 和静态资源
  const path = getRequestURL(event).pathname;
  if (
    path.startsWith("/api/") ||
    path.startsWith("/_nuxt/") ||
    path.includes(".")
  ) {
    return;
  }

  // setup 页面本身放行
  if (path === "/setup" || path.startsWith("/api/setup")) {
    return;
  }

  const sessionRedis = createRedisClient("session");
  const cached = (await sessionRedis.get(CACHE_KEY)) as boolean | null;
  if (cached === true) {
    return; // 已初始化，直接放行
  }

  if (cached === false) {
    deleteCookie(event, "access_token");
    deleteCookie(event, "refresh_token");
    await sendRedirect(event, "/setup", 302);
    return;
  }

  // 缓存未命中，回源数据库
  const prisma = usePrisma();
  const count = await prisma.user.count();
  const initialized = count > 0;

  // 回写缓存
  await sessionRedis.set(CACHE_KEY, initialized, CACHE_TTL);

  if (!initialized) {
    // 清除可能残留的旧 token，防止认证中间件卡住
    deleteCookie(event, "access_token");
    deleteCookie(event, "refresh_token");
    await sendRedirect(event, "/setup", 302);
  }
});
