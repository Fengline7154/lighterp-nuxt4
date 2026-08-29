import { redis } from "~~/server/infrastructure/redis";
import { H3Event } from "h3";
import { TokenService } from "../services/token.service";
/**
 *
 * @param event 从cookies中读取会话id并在redis中查询得到用户id
 * 若无相关会话，则返回null
 */
export async function getUserIdFromRequest(
  event: H3Event,
): Promise<string | null> {
  //从cookies中获取token
  const token = getCookie(event, "access_token");
  if (token) {
    const tokenService = new TokenService();
    const payload = tokenService.verifyAccessToken(token);
    if (payload) {
      return redis[2].get(payload.jti);
    }
  }
  return null;
}

/**
 * 直接通过已知sessionid获取用户id
 * @param sessionId
 * @returns 若有则返回用户id，否则返回null
 */
export async function getUseridFromRedis(
  sessionId: string,
): Promise<string | null> {
  if (!sessionId) return null;
  return redis[2].get(sessionId);
}
