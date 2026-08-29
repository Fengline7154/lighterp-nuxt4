import { redis } from "~~/server/infrastructure/redis";

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, "session_id");
  if (sessionId) {
    await redis["session"].del(sessionId);
  }

  deleteCookie(event, "refresh_token", { path: "/" });
  deleteCookie(event, "csrf_token", { path: "/" });
  return { success: true };
});
