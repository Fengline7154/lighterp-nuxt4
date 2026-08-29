// // server/utils/token.ts
// import jwt from "jsonwebtoken";
// import { randomBytes } from "crypto";
// import type { IUser } from "~~/shared/types/meData";
// export interface AccessTokenPayload {
//   sessionId: string;
//   userid: string;
//   role: string;
//   type: "access";
// }

// export interface RefreshTokenPayload {
//   sessionId: string;
//   tokenId: string;
//   type: "refresh";
// }

// export class TokenService {
//   private config = useRuntimeConfig();
//   /**
//    * 用于生成用户认证相关token
//    */

//   // 生成短期访问令牌（1小时）
//   generateAccessToken(sessionId: string, user: IUser): string {
//     const payload: AccessTokenPayload = {
//       sessionId: sessionId, //使用uuid作为userid在redis中的映射，避免直接暴露userid
//       userid: user.id,
//       role: user.role,
//       type: "access",
//     };

//     return jwt.sign(payload, this.config.jwtAccessPrivateKey, {
//       algorithm: "RS256",
//       expiresIn: "1h", // 短期
//       issuer: "auth-service",
//     });
//   }

//   // 生成刷新令牌（7天）
//   generateRefreshToken(sessionId: string): { token: string; tokenId: string } {
//     const tokenId = randomBytes(32).toString("hex");
//     const payload: RefreshTokenPayload = {
//       sessionId,
//       tokenId,
//       type: "refresh",
//     };

//     const token = jwt.sign(payload, this.config.jwtRefreshPrivateKey, {
//       algorithm: "RS256",
//       expiresIn: "7d", // 长期
//       issuer: "auth-service",
//     });

//     return { token, tokenId };
//   }

//   // 验证访问令牌
//   verifyAccessToken(token: string): AccessTokenPayload | null {
//     try {
//       const decoded = jwt.verify(
//         token,
//         this.config.jwtAccessPublicKey.replace(/\\n/g, "\n"),
//         {
//           algorithms: ["RS256"], // 明确指定
//         },
//       );
//       return decoded as AccessTokenPayload;
//     } catch {
//       return null;
//     }
//   }

//   // 验证刷新令牌
//   verifyRefreshToken(token: string): RefreshTokenPayload | null {
//     try {
//       const decoded = jwt.verify(
//         token,
//         this.config.jwtRefreshPublicKey.replace(/\\n/g, "\n"),
//         {
//           algorithms: ["RS256"], // 明确指定
//         },
//       );
//       return decoded as RefreshTokenPayload;
//     } catch {
//       return null;
//     }
//   }
//   //解密令牌
//   decodeToken(token: string) {
//     return jwt.decode(token);
//   }
//   /**
//    * 后续可添加其他功能性token
//    */
// }
// 服务层 — token.service.ts
import jwt from "jsonwebtoken";
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
} from "~~/shared/types/tokenType";

export class TokenService {
  private accessPrivate: string;
  private accessPublic: string;
  private refreshPrivate: string;
  private refreshPublic: string;

  constructor() {
    const config = useRuntimeConfig();
    this.accessPrivate = config.jwtAccessPrivateKey;
    this.accessPublic = config.jwtAccessPublicKey;
    this.refreshPrivate = config.jwtRefreshPrivateKey;
    this.refreshPublic = config.jwtRefreshPublicKey;
  }

  /** 签发 Access Token */
  issueAccessToken(params: {
    userId: string;
    sessionId: string;
    role: string;
  }): string {
    const payload = {
      sub: params.userId,
      jti: params.sessionId,
      role: params.role,
      type: "access" as const,
    } satisfies Omit<AccessTokenPayload, "iat" | "exp">;

    return jwt.sign(payload, this.accessPrivate, {
      algorithm: "RS256",
      expiresIn: "30m",
    });
  }

  /** 签发 Refresh Token */
  issueRefreshToken(params: { userId: string; sessionId: string }): string {
    const payload = {
      sub: params.userId,
      jti: params.sessionId,
      type: "refresh" as const,
    } satisfies Omit<RefreshTokenPayload, "iat" | "exp">;

    return jwt.sign(payload, this.refreshPrivate, {
      algorithm: "RS256",
      expiresIn: "7d",
    });
  }

  /** 验证 Access Token */
  verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, this.accessPublic) as AccessTokenPayload;
  }

  /** 验证 Refresh Token */
  verifyRefreshToken(token: string): RefreshTokenPayload {
    return jwt.verify(token, this.refreshPublic) as RefreshTokenPayload;
  }

  /**
   * 签发一对 token，自动生成 sessionId
   * @param params - 签发参数
   * @param params.userId - 用户唯一标识，写入 token 的 sub 字段
   * @param params.role - 用户角色，前端用于 UI 控制
   *   角色可选值见 /infrastructure/permissionTemplate 枚举，
   *   注意此处仅做写入，不校验权限合法性
   * @returns 包含双 token 和 sessionId 的对象
   */
  issueTokenPair(params: {
    userId: string;
    role: string;
    sessionId?: string;
  }): {
    accessToken: string;
    refreshToken: string;
    sessionId: string;
  } {
    const sessionId = params.sessionId || crypto.randomUUID();

    const accessPayload = {
      sub: params.userId,
      jti: sessionId,
      role: params.role,
      type: "access" as const,
    } satisfies Omit<AccessTokenPayload, "iat" | "exp">;

    const refreshPayload = {
      sub: params.userId,
      jti: sessionId,
      type: "refresh" as const,
    } satisfies Omit<RefreshTokenPayload, "iat" | "exp">;

    const accessToken = jwt.sign(accessPayload, this.accessPrivate, {
      algorithm: "RS256",
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign(refreshPayload, this.refreshPrivate, {
      algorithm: "RS256",
      expiresIn: "7d",
    });

    return { accessToken, refreshToken, sessionId };
  }
  // server/services/token.service.ts
  /** 只解码不验证，用于过期 token 提取 jti */
  decodeAccessToken(token: string): AccessTokenPayload | null {
    try {
      return jwt.decode(token) as AccessTokenPayload;
    } catch {
      return null;
    }
  }
}
