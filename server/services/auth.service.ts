// server/services/auth.service.ts

import bcrypt from "bcrypt";
import crypto from "crypto";
import { TokenService } from "~~/server/services/token.service";
import { redis } from "~~/server/infrastructure/redis";
import { createUserRepository } from "~~/server/repositories/postgres/user.repository";
import { accountType, formatAccount } from "~~/shared/utils/validators/account";
import { loginSchema } from "~~/shared/schemas/user.schema";
import { createError } from "h3";
import { RefreshTokenPayload } from "~~/shared/types/tokenType";
import { PrismaClient } from "~~/prisma/generated/client";
const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
export const createAuthService = (prisma: PrismaClient) => {
  const userRepo = createUserRepository(prisma);
  const tokenService = new TokenService();

  return {
    async login(rawAccount: string, rawPassword: string, event?: any) {
      // 1. 校验登录请求参数是否合法
      const { account, password } = loginSchema.parse({
        account: rawAccount,
        password: rawPassword,
      });
      // 2. 判断账号是邮箱还是手机号
      const type = accountType(account);
      if (type === "either") {
        throw createError({
          statusCode: 400,
          message: "请输入有效的邮箱或手机号",
        });
      }

      // 3. 规范化账号
      const formatted = formatAccount(account, type);

      // 4. 根据账号类型查询用户
      const user =
        type === "email"
          ? await userRepo.findByEmail(formatted)
          : await userRepo.findByPhone(formatted);

      // 5. IP 频率限制
      if (event) {
        const ip = getRequestIP(event);
        if (ip) {
          const ipKey = `login:ip:${ip}`;
          const ipCount = (await redis["security"].get(ipKey)) || 0;
          if (ipCount >= 10) {
            throw createError({
              statusCode: 429,
              message: "请求过于频繁，请15分钟后再试",
            });
          }
        }
      }

      if (!user) {
        // 账号不存在也计入 IP 限制，防止暴力枚举
        if (event) {
          const ip = getRequestIP(event);
          if (ip) {
            const ipKey = `login:ip:${ip}`;
            const ipCount = (await redis["security"].get(ipKey)) || 0;
            await redis["security"].set(ipKey, ipCount + 1, 15 * 60);
          }
        }
        throw createError({ statusCode: 400, message: "账号未注册" });
      }

      // 6. 检查账号是否被锁定
      const lockKey = `login:lock:${user.id}`;
      if (await redis["security"].get(lockKey)) {
        throw createError({
          statusCode: 403,
          message: "账号已被锁定，请30分钟后再试",
        });
      }

      // 7. 检查账号状态是否合法
      if (user.status === "INACTIVE") {
        throw createError({ statusCode: 403, message: "账号已被禁用" });
      }

      // 8. 验证密码是否正确
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        // 登录失败计数
        const failKey = `login:fail:${user.id}`;
        const failCount = (await redis["security"].get(failKey)) || 0;
        const newCount = failCount + 1;
        await redis["security"].set(failKey, newCount, 15 * 60);

        // IP 计数增加
        if (event) {
          const ip = getRequestIP(event);
          if (ip) {
            const ipKey = `login:ip:${ip}`;
            const ipCount = (await redis["security"].get(ipKey)) || 0;
            await redis["security"].set(ipKey, ipCount + 1, 15 * 60);
          }
        }

        if (newCount >= 5) {
          // 锁定账号 30 分钟
          await redis["security"].set(`login:lock:${user.id}`, 1, 30 * 60);
          throw createError({
            statusCode: 403,
            message: "账号已被锁定30分钟，请稍后再试",
          });
        }

        throw createError({
          statusCode: 401,
          message: `密码不正确，还剩${5 - newCount}次尝试机会`,
        });
      }

      // 9. 登录成功，清除锁定和失败记录
      await redis["security"].del(`login:fail:${user.id}`);
      await redis["security"].del(`login:lock:${user.id}`);
      if (event) {
        const ip = getRequestIP(event);
        if (ip) {
          await redis["security"].del(`login:ip:${ip}`);
        }
      }

      // 10. 生成 token
      // 10. 生成 token
      const { accessToken, refreshToken, sessionId } =
        tokenService.issueTokenPair({
          userId: user.id,
          role: user.role ?? "staff",
        });

      // 生成 CSRF token
      const csrfToken = crypto.randomUUID();
      const refreshTokenHash = hashToken(refreshToken);

      // 11. 写入 Redis session（包含 csrfToken 和 refreshTokenHash）
      await redis["session"].set(
        sessionId,
        {
          userId: user.id,
          role: user.role,
          csrfToken,
          refreshTokenHash,
        },
        7 * 24 * 3600,
      );

      // 12. 异步更新最后登录时间
      userRepo.updateLastLogin(user.id).catch((err: any) => {
        console.error("更新最后登录时间失败:", err);
      });

      return {
        accessToken,
        refreshToken,
        csrfToken,
        sessionId,
        user: {
          id: user.id,
          badgeCode: user.badgeCode,
          name: user.name,
          role: user.role,
          department: user.department,
        },
      };
    },

    async refreshByRefreshToken(refreshToken: string, csrfToken: string) {
      let payload: RefreshTokenPayload;
      try {
        payload = tokenService.verifyRefreshToken(refreshToken);
      } catch {
        throw createError({ statusCode: 401, message: "Token 已过期" });
      }

      const jti = payload.jti;
      const sessionData = await redis["session"].get(jti);
      const {
        userId,
        role,
        csrfToken: storedCsrf,
        refreshTokenHash,
      } = sessionData || {};
      if (!userId)
        throw createError({ statusCode: 401, message: "会话数据异常" });

      // CSRF 校验
      if (csrfToken && storedCsrf && csrfToken !== storedCsrf) {
        // CSRF token 不匹配，可能被攻击
        await redis["session"].del(jti);
        throw createError({
          statusCode: 401,
          message: "CSRF 校验失败，请重新登录",
        });
      }

      // Refresh Token 轮换校验
      const submittedHash = hashToken(refreshToken);
      if (refreshTokenHash && refreshTokenHash !== submittedHash) {
        // 旧 token 被重用，作废整个 session
        await redis["session"].del(jti);
        throw createError({
          statusCode: 401,
          message: "Token 已失效，请重新登录",
        });
      }

      // 签发新 token
      const tokens = tokenService.issueTokenPair({
        userId,
        role,
        sessionId: jti,
      });

      // 生成新的 CSRF token 和 refresh token hash
      const newCsrfToken = crypto.randomUUID();
      const newRefreshHash = hashToken(tokens.refreshToken);

      await redis["session"].set(
        jti,
        {
          userId,
          role,
          csrfToken: newCsrfToken,
          refreshTokenHash: newRefreshHash,
        },
        7 * 24 * 3600,
      );

      return {
        ...tokens,
        csrfToken: newCsrfToken,
      };
    },
  };
};
//已弃用,改为无状态的token,仅保留会话id-用户id实现多设备管理
// async refresh(accessToken: string, sessionId: string) {
//   // 1. 解码 access token
//   let jti: string;
//   try {
//     const payload = tokenService.verifyAccessToken(accessToken);
//     jti = payload.jti;
//   } catch {
//     const decoded = tokenService.decodeAccessToken(accessToken);
//     if (!decoded?.jti) {
//       throw createError({ statusCode: 401, message: "请重新登录" });
//     }
//     jti = decoded.jti;
//   }
//   // 2. 校验 sessionId 和 jti 一致
//   if (jti !== sessionId) {
//     throw createError({ statusCode: 401, message: "会话不匹配" });
//   }

//   // 2. 从 Redis 读存储的 refreshToken
//   const storedRefreshToken = await redis["refreshToken"].get(jti);
//   if (!storedRefreshToken) {
//     throw createError({
//       statusCode: 401,
//       message: "会话已过期，请重新登录",
//     });
//   }

//   // 4. 验 refreshToken 签名
//   let payload: RefreshTokenPayload;
//   try {
//     payload = tokenService.verifyRefreshToken(storedRefreshToken);
//   } catch {
//     await redis["refreshToken"].del(jti);
//     throw createError({
//       statusCode: 401,
//       message: "Token 已过期，请重新登录",
//     });
//   }

//   // 5. 删除旧 refreshToken，防止重用
//   await redis["refreshToken"].del(jti);

//   // 6. 从 Redis session 拿用户信息
//   const sessionData = await redis["session"].get(jti);
//   const { userId, role } = sessionData || {};
//   if (!userId) {
//     throw createError({ statusCode: 401, message: "会话数据异常" });
//   }

//   // 7. 签发新双 token（sessionId 不变）
//   const tokens = tokenService.issueTokenPair({
//     userId,
//     role,
//     sessionId: jti,
//   });

//   // 8. 写入 Redis
//   await redis["refreshToken"].set(jti, tokens.refreshToken, 7 * 24 * 3600);
//   await redis["session"].set(jti, { userId, role }, 7 * 24 * 3600);

//   return { success: true, tokens };
// },
//已废弃,同上
// async refreshBySessionId(sessionId: string) {
//   const storedRefreshToken = await redis["refreshToken"].get(sessionId);
//   if (!storedRefreshToken) {
//     throw createError({ statusCode: 401, message: "会话已过期" });
//   }

//   let payload: RefreshTokenPayload;
//   try {
//     payload = tokenService.verifyRefreshToken(storedRefreshToken);
//   } catch {
//     await redis["refreshToken"].del(sessionId);
//     throw createError({ statusCode: 401, message: "Token 已过期" });
//   }

//   await redis["refreshToken"].del(sessionId);

//   const sessionData = await redis["session"].get(sessionId);
//   const { userId, role } = sessionData || {};
//   if (!userId)
//     throw createError({ statusCode: 401, message: "会话数据异常" });

//   const tokens = tokenService.issueTokenPair({ userId, role, sessionId });
//   await redis["refreshToken"].set(
//     sessionId,
//     tokens.refreshToken,
//     7 * 24 * 3600,
//   );
//   await redis["session"].set(sessionId, { userId, role }, 7 * 24 * 3600);
//   return tokens;
// },
