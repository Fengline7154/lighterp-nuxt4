// shared/schemas/api/receipt.schema.ts
import { z } from "zod";

/**
 * 入库操作参数（operatorId 由 ctx 统一注入，不在此定义）
 */
export const addReceiptSchema = z.object({
  type: z.string().default("PRODUCTION_IN"),
  productId: z.string().min(1, "产品ID不能为空"),
  quantity: z.coerce.number().positive("入库数量必须大于0"),
  remark: z.string().max(200).optional(),
  orderId: z.string().optional(),
  orderItemId: z.string().optional(),
  relatedCode: z.string().optional(),
});

/**
 * 入库单列表查询参数
 */
export const receiptListSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  receiptCode: z.string().optional(),
  orderId: z.string().optional(),
  productId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// 类型导出
export type AddReceiptInput = z.infer<typeof addReceiptSchema>;
export type ReceiptListInput = z.infer<typeof receiptListSchema>;
