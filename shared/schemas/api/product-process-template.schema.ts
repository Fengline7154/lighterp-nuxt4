// shared/schemas/api/product-process-template.schema.ts
import { z } from "zod";
import { WageType } from "~~/prisma/generated/client";

/**
 * 单个工序模板项
 */
export const processTemplateItemSchema = z.object({
  processId: z.string().nullable().optional(),
  processName: z.string().min(1, "工序名称不能为空"),
  sequence: z.number().int().positive("顺序号必须为正整数"),
  wageType: z.enum(WageType).default("HOURLY"),
  standardHours: z.coerce.number().min(0).optional(),
  hourlyRate: z.coerce.number().min(0).optional(),
  unitPrice: z.coerce.number().min(0).optional(),
});

/**
 * 保存产品工序模板
 */
export const saveProductProcessTemplateSchema = z.object({
  productId: z.string().min(1, "产品ID不能为空"),
  processes: z.array(processTemplateItemSchema).min(1, "至少需要一个工序"),
});

/**
 * 查询产品工序模板参数
 */
export const getProductProcessTemplateSchema = z.object({
  productId: z.string().min(1, "产品ID不能为空"),
});

// 类型导出
export type ProcessTemplateItem = z.infer<typeof processTemplateItemSchema>;
export type SaveProductProcessTemplateInput = z.infer<
  typeof saveProductProcessTemplateSchema
>;
export type GetProductProcessTemplateInput = z.infer<
  typeof getProductProcessTemplateSchema
>;
