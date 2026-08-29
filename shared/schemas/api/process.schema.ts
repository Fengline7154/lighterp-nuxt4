// shared/schemas/api/process.schema.ts
import { z } from "zod";

/**
 * 创建工序
 */
export const createProcessSchema = z.object({
  name: z.string().min(1, "工序名称不能为空"),
  description: z.string().optional(),
});

/**
 * 更新工序
 */
export const updateProcessSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

// 类型导出
export type CreateProcessInput = z.infer<typeof createProcessSchema>;
export type UpdateProcessInput = z.infer<typeof updateProcessSchema>;
