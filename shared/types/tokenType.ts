import type { JwtPayload } from "jsonwebtoken";

export interface AccessTokenPayload extends JwtPayload {
  /** 强制要求 sub 存在 */
  sub: string;
  /** 前端 UI 控制用的角色 */
  role: string;
  /** token 类型，前端据此分流 */
  type: "access";
  /** sessionId，用于吊销 */
  jti: string;
}
export interface RefreshTokenPayload extends JwtPayload {
  /** 唯一标识，用于吊销 */
  jti: string;
  /** sessionId，用于吊销 */
  sessionId: string;
  /** token 类型，前端据此分流 */
  type: "refresh";
}
