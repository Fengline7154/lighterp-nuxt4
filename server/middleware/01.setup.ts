// server/middleware/setup.ts
import { usePrisma } from "~~/server/config/prisma";

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

  const prisma = usePrisma();
  const count = await prisma.user.count();

  if (count === 0) {
    // 清除可能残留的旧 token，防止认证中间件卡住
    deleteCookie(event, "access_token");
    deleteCookie(event, "refresh_token");
    await sendRedirect(event, "/setup", 302);
  }
});
