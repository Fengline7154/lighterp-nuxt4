import { z } from "zod";
// 引入你现有的原子校验函数
import { isUsername } from "~~/shared/utils/validators/username";
import { isPassword } from "~~/shared/utils/validators/password";

// 1. 定义基础 Schema
export const createUserSchema = z
  .object({
    name: z
      .string()
      .min(1, { message: "用户名不能为空" })
      .min(2, { message: "用户名至少2位" })
      .max(20, { message: "用户名最多20位" })
      .refine((val) => isUsername(val, "CN"), {
        message: "用户名格式不正确(支持中文、字母、数字)",
      }),

    password: z
      .string()
      .min(6, { message: "密码至少6位" })
      .refine((val) => isPassword(val, "medium"), {
        message: "密码强度不足,至少6位(需包含字母和数字)",
      }),

    email: z.email({ message: "邮箱格式无效" }).optional().or(z.literal("")),

    badgeCode: z.string().min(1).optional(),

    // 使用对象参数配置 regex 以消除弃用警告
    phone: z
      .string()
      .regex(/^1[3-9]\d{9}$/, { message: "手机号格式无效" })
      .optional()
      .or(z.literal("")),
    role: z
      .string()
      .min(1, { message: "角色不能为空" })
      .max(50, { message: "角色标识不能过长" })
      .default("staff"),
    department: z.string().optional(),
    customPermissions: z
      .array(z.string().min(1, { message: "权限标识不能为空字符串" }))
      .optional()
      .default([]),

    lastLoginAt: z.date().optional(),
  })
  .refine(
    (data) => {
      // 业务级校验：邮箱和手机号至少填一个
      const hasEmail = data.email && data.email.length > 0;
      const hasPhone = data.phone && data.phone.length > 0;

      if (!hasEmail && !hasPhone) {
        return false;
      }
      return true;
    },
    {
      message: "邮箱或手机号至少填写一项",
      path: ["phone"],
    },
  );
// 更新个人信息的 Schema（个人中心）
export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "用户名至少2位" })
      .max(20, { message: "用户名最多20位" })
      .refine((val) => isUsername(val, "CN"), {
        message: "用户名格式不正确(支持中文、字母、数字)",
      })
      .optional(),

    email: z.email({ message: "邮箱格式无效" }).optional().or(z.literal("")),

    phone: z
      .string()
      .regex(/^1[3-9]\d{9}$/, { message: "手机号格式无效" })
      .optional()
      .or(z.literal("")),

    oldPassword: z.string().min(1, { message: "旧密码不能为空" }).optional(),

    newPassword: z
      .string()
      .min(6, { message: "密码至少6位" })
      .refine((val) => isPassword(val, "medium"), {
        message: "密码强度不足,至少6位(需包含字母和数字)",
      })
      .optional(),
  })
  .refine(
    (data) => {
      // 修改联系方式必须提供旧密码
      if (
        (data.email !== undefined || data.phone !== undefined) &&
        !data.oldPassword
      ) {
        return false;
      }
      // 修改密码必须提供旧密码
      if (data.newPassword && !data.oldPassword) {
        return false;
      }
      return true;
    },
    {
      message: "修改联系方式或密码需验证当前密码",
      path: ["oldPassword"],
    },
  );

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// 管理员更新用户信息的 Schema
export const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, { message: "用户名至少2位" })
    .max(20, { message: "用户名最多20位" })
    .refine((val) => isUsername(val, "CN"), {
      message: "用户名格式不正确(支持中文、字母、数字)",
    })
    .optional(),

  email: z.email({ message: "邮箱格式无效" }).optional().or(z.literal("")),

  phone: z
    .string()
    .regex(/^1[3-9]\d{9}$/, { message: "手机号格式无效" })
    .optional()
    .or(z.literal("")),

  department: z.string().optional(),

  role: z
    .string()
    .min(1, { message: "角色不能为空" })
    .max(50, { message: "角色标识不能过长" })
    .optional(),

  customPermissions: z
    .array(z.string().min(1, { message: "权限标识不能为空字符串" }))
    .optional(),

  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),

  password: z
    .string()
    .min(6, { message: "密码至少6位" })
    .refine((val) => isPassword(val, "medium"), {
      message: "密码强度不足,至少6位(需包含字母和数字)",
    })
    .optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
// 2. 导出类型供 Service 使用
export type CreateUserInput = z.infer<typeof createUserSchema>;
//用于登录接口等的轻量级验证逻辑
export const loginSchema = z.object({
  account: z.string().min(1, { message: "账号不能为空" }),
  password: z.string().min(1, { message: "密码不能为空" }),
});

export type LoginInput = z.infer<typeof loginSchema>;
