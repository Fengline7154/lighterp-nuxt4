import { z } from "zod";
import { Status } from "~~/prisma/generated/client";

// 基础校验规则（复用）
const passwordRule = z.string().min(6, "密码至少6位");
const nameRule = z.string().min(2, "用户名至少2位").max(20, "用户名最多20位");
const emailRule = z.email("邮箱格式无效").optional().or(z.literal(""));
const phoneRule = z
  .string()
  .regex(/^1[3-9]\d{9}$/, "手机号格式无效")
  .optional()
  .or(z.literal(""));
const roleRule = z
  .string()
  .min(1, "角色不能为空")
  .max(50, "角色标识不能过长")
  .default("staff");

// 创建用户
export const createUserSchema = z
  .object({
    name: nameRule,
    password: passwordRule,
    email: emailRule,
    phone: phoneRule,
    role: roleRule,
    department: z.string().optional(),
    customPermissions: z.array(z.string().min(1)).optional().default([]),
    lastLoginAt: z.iso.datetime().optional(),
  })
  .refine(
    (data) => {
      const hasEmail = data.email && data.email.length > 0;
      const hasPhone = data.phone && data.phone.length > 0;
      return hasEmail || hasPhone;
    },
    { message: "邮箱或手机号至少填写一项", path: ["phone"] },
  );

// 更新用户
export const updateUserSchema = z.object({
  name: nameRule.optional(),
  email: emailRule,
  phone: phoneRule,
  role: roleRule.optional(),
  department: z.string().optional(),
  customPermissions: z.array(z.string().min(1)).optional(),
  status: z.enum(Status).optional(),
});

// 修改密码
export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "请输入旧密码"),
  newPassword: z.string().min(6, "新密码至少6位"),
});

// 修改个人信息
export const updateProfileSchema = z.object({
  name: nameRule.optional(),
  email: emailRule,
  phone: phoneRule,
  oldPassword: z.string().optional(),
  newPassword: passwordRule.optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
