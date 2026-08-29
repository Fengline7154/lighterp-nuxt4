import { z } from "zod";

// 登录
export const loginSchema = z.object({
  account: z.string().min(1, "账号不能为空"),
  password: z.string().min(1, "密码不能为空"),
});

// 系统初始化
export const setupSchema = z.object({
  password: z.string().min(6, "密码至少6位"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SetupInput = z.infer<typeof setupSchema>;
