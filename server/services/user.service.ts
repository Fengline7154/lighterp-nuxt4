import bcrypt from "bcrypt";
import { createUserRepository } from "~~/server/repositories/postgres/user.repository";
import { createSequenceService } from "~~/server/services/sequence.service";
import {
  createUserSchema,
  UpdateProfileInput,
  updateProfileSchema,
  UpdateUserInput,
  updateUserSchema,
  type CreateUserInput,
} from "~~/shared/schemas/user.schema";
import { redis, type IRedisClient } from "~~/server/infrastructure/redis";
import {
  getDefaultPermissions,
  UserRole,
  filterValidPermissions,
} from "~~/server/infrastructure/permissionTemplate";
import { formatAccount } from "~~/shared/utils/validators/account";
import { PrismaClient } from "~~/prisma/generated/client";
import { isPassword } from "~~/shared/utils/validators/password";
import { createAuditService } from "./audit.service";
import type { TxContext } from "~~/server/infrastructure/tx";

const SALT_ROUNDS = 10;

const sanitizeUser = (user: any) => {
  if (!user) return null;
  const { password, salt, ...rest } = user;
  if (rest.phone)
    rest.phone = rest.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
  if (rest.email) {
    const [name, domain] = rest.email.split("@");
    const masked = name.charAt(0) + "***" + name.charAt(name.length - 1);
    rest.email = `${masked}@${domain}`;
  }
  return rest;
};

export const createUserService = (
  prisma: PrismaClient,
  redisClient?: IRedisClient,
) => {
  const userRepo = createUserRepository(prisma);
  const seqService = createSequenceService(prisma);
  const auditService = createAuditService(prisma);

  return {
    async createUser(ctx: RequestContext, rawdata: unknown, tx?: TxContext) {
      let data: CreateUserInput;
      try {
        data = createUserSchema.parse(rawdata);
      } catch (error: any) {
        throw createError({
          statusCode: 400,
          message: `校验错误: ${error.issues?.[0]?.message || "Invalid data"}`,
        });
      }

      const email = data.email ? formatAccount(data.email, "email") : undefined;
      const phone = data.phone ? formatAccount(data.phone, "phone") : undefined;

      const existingUser = await userRepo.findExistingUser(
        { email, phone },
        tx,
      );
      if (existingUser) {
        if (email && existingUser.email === email)
          throw createError({
          statusCode: 400,
          message: `邮箱 ${email} 已被使用`,
        });
        if (phone && existingUser.phone === phone)
          throw createError({
          statusCode: 400,
          message: `手机号 ${phone} 已被使用`,
        });
        throw createError({
          statusCode: 400,
          message: `用户创建失败:未知项已存在`,
        });
      }

      const customPermissions = filterValidPermissions(
        data.customPermissions || [],
      );
      let permissions = getDefaultPermissions(data.role as UserRole);
      if (permissions.includes("*") || customPermissions.includes("*")) {
        permissions = ["*"];
      } else {
        permissions = [...new Set([...permissions, ...customPermissions])];
      }

      const badgeCode = await seqService.getFormattedUserCode();
      const hashed = await bcrypt.hash(data.password, SALT_ROUNDS);

      const dbData = {
        badgeCode,
        name: data.name,
        password: hashed,
        department: data.department || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        role: data.role,
        permissions,
      };

      const user = await userRepo.create(dbData, tx);

      // 审计日志移到 Application 层统一处理
      return sanitizeUser(user);
    },

    async getUserList(
      filter: any,
      options: {
        page: number;
        limit: number;
        sortField?: string;
        sortDir?: string;
      },
    ) {
      const orderBy: any = {};
      orderBy[options.sortField || "createdAt"] = options.sortDir || "desc";
      const result = await userRepo.findMany(filter, {
        page: options.page,
        limit: options.limit,
        orderBy,
      });
      result.data = result.data.map(sanitizeUser);
      return result;
    },

    async getUserById(id: string) {
      const user = await userRepo.findById(id);
      if (!user) throw createError({ statusCode: 404, message: "用户不存在" });
      return sanitizeUser(user);
    },

    async updateUser(id: string, data: any, operatorId?: string) {
      let cleanData: UpdateUserInput;
      try {
        cleanData = updateUserSchema.parse(data);
      } catch (error: any) {
        throw createError({
          statusCode: 400,
          message: error.issues?.[0]?.message || "数据格式不正确",
        });
      }

      const old = await userRepo.findById(id);
      if (!old) throw createError({ statusCode: 404, message: "用户不存在" });

      // 转为可索引类型
      const cleanRecord = cleanData as Record<string, any>;

      // 过滤脱敏值
      for (const key of ["email", "phone"]) {
        const value = cleanRecord[key];
        if (
          value !== undefined &&
          value !== null &&
          (String(value).includes("*") || String(value).trim() === "")
        ) {
          delete cleanRecord[key];
        }
      }

      // 如果传了密码，加密
      if (cleanRecord.password) {
        cleanRecord.password = await bcrypt.hash(
          cleanRecord.password,
          SALT_ROUNDS,
        );
      }

      // 如果传了 customPermissions 或 role，重新计算 permissions
      if (cleanRecord.customPermissions !== undefined || cleanRecord.role) {
        const role = cleanRecord.role || old.role;
        const customPermissions = cleanRecord.customPermissions
          ? filterValidPermissions(cleanRecord.customPermissions)
          : [];
        const defaults = getDefaultPermissions(role as UserRole);
        if (defaults.includes("*") || customPermissions.includes("*")) {
          cleanRecord.permissions = ["*"];
        } else {
          cleanRecord.permissions = [
            ...new Set([...defaults, ...customPermissions]),
          ];
        }
        delete cleanRecord.customPermissions;
      }

      const updated = await userRepo.update({ id }, cleanRecord);

      if (operatorId) {
        for (const key of Object.keys(cleanRecord)) {
          const oldVal = String((old as any)[key] ?? "");
          const newVal = String((updated as any)[key] ?? "");
          if (oldVal !== newVal) {
            await auditService.log(operatorId, "User", id, "UPDATE", {
              field: key,
              oldValue: oldVal,
              newValue: newVal,
            });
          }
        }
      }

      return sanitizeUser(updated);
    },

    async changeStatus(
      id: string,
      status: "ACTIVE" | "INACTIVE",
      operatorId?: string,
    ) {
      const result = await userRepo.update({ id }, { status });
      if (!result)
        throw createError({ statusCode: 404, message: "no such user" });
      if (operatorId) {
        await auditService.log(operatorId, "User", id, "STATUS_CHANGE", {
          field: "status",
          oldValue: status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
          newValue: status,
        });
      }
      return result;
    },

    async updateProfile(
      id: string,
      body: {
        name?: string;
        email?: string;
        phone?: string;
        oldPassword?: string;
        newPassword?: string;
      },
    ) {
      // 格式校验
      let cleanBody: UpdateProfileInput;
      try {
        cleanBody = updateProfileSchema.parse(body);
      } catch (error: any) {
        throw createError({
          statusCode: 400,
          message: error.issues?.[0]?.message || "数据格式不正确",
        });
      }
      const user = await userRepo.findById(id);
      if (!user) throw createError({ statusCode: 404, message: "用户不存在" });
      // 用 cleanBody 替代 body
      if (cleanBody.email !== undefined || cleanBody.phone !== undefined) {
        const contactKey = `rate:contact:${id}`;
        const contactCount = (await redis["security"].get(contactKey)) || 0;
        if (contactCount >= 2)
          throw createError({
            statusCode: 429,
            message: "1小时内修改联系方式次数已达上限",
          });
        if (!cleanBody.oldPassword)
          throw createError({
            statusCode: 400,
            message: "修改联系方式需验证当前密码",
          });
        const valid = await bcrypt.compare(
          cleanBody.oldPassword,
          user.password,
        );
        if (!valid)
          throw createError({ statusCode: 400, message: "当前密码不正确" });
        await redis["security"].set(contactKey, contactCount + 1, 3600);
      }

      const data: any = {};
      if (cleanBody.name !== undefined) data.name = cleanBody.name;
      if (cleanBody.email !== undefined) data.email = cleanBody.email;
      if (cleanBody.phone !== undefined) data.phone = cleanBody.phone;

      if (cleanBody.newPassword) {
        const pwdKey = `rate:pwd:${id}`;
        const pwdCount = (await redis["security"].get(pwdKey)) || 0;
        if (pwdCount >= 2)
          throw createError({
            statusCode: 429,
            message: "24小时内修改密码次数已达上限",
          });
        if (!isPassword(cleanBody.newPassword, "secure"))
          throw createError({ statusCode: 400, message: "密码强度不足" });
        if (!cleanBody.oldPassword)
          throw createError({ statusCode: 400, message: "请输入旧密码" });
        const valid = await bcrypt.compare(
          cleanBody.oldPassword,
          user.password,
        );
        if (!valid)
          throw createError({ statusCode: 400, message: "旧密码不正确" });
        data.password = await bcrypt.hash(cleanBody.newPassword, SALT_ROUNDS);
        await redis["security"].set(pwdKey, pwdCount + 1, 24 * 3600);
      }

      const updated = await userRepo.update({ id }, data);
      return sanitizeUser(updated);
    },
  };
};
