import { z } from "zod";
import { LogRelatedType } from "~~/prisma/generated/client";

// 入库
export const addStockSchema = z.object({
  productId: z.uuid(),
  quantity: z.coerce.number().positive("入库数量必须大于0"),
  type: z.enum(LogRelatedType).default("PURCHASE_IN"),
  remark: z.string().max(200).optional(),
  relatedCode: z.string().optional(),
  unitCost: z.coerce.number().min(0).optional(),
  locationId: z.uuid().optional(),
});

// 出库
export const deductStockSchema = z.object({
  productId: z.uuid(),
  quantity: z.coerce.number().positive("出库数量必须大于0"),
  type: z.enum(LogRelatedType).default("SALES_OUT"),
  remark: z.string().max(200).optional(),
  relatedCode: z.string().optional(),
  locationId: z.uuid().optional(),
});
//调配
export const allocateStockSchema = z.object({
  productId: z.uuid(),
  quantity: z.coerce.number().positive("出库数量必须大于0"),
  orderCode: z.string().optional(),
});
// 红冲
export const reversalSchema = z.object({
  productId: z.uuid(),
  quantity: z.coerce.number(),
  remark: z.string().min(1, "红冲原因必填").max(200),
  relatedCode: z.string().optional(),
  locationId: z.uuid().optional(),
});

// 初始化库存
export const initStockSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        productName: z.string().min(1),
        quantity: z.coerce.number().min(0),
      }),
    )
    .min(1, "至少需要一条初始库存记录"),
  remark: z.string().optional(),
});

export const transferSchema = z.object({
  productId: z.uuid(),
  fromLocationId: z.uuid("源库位ID无效"),
  toLocationId: z.uuid("目标库位ID无效"),
  quantity: z.coerce.number().positive("调拨数量必须大于0"),
  remark: z.string().max(200).optional(),
});
/** 预留库存 */
export const reserveSchema = z.object({
  productId: z.string().uuid(),
  qty: z.coerce.number().positive("预留数量必须大于0"),
  relatedCode: z.string().optional(),
});

/** 释放预留 */
export const releaseSchema = z.object({
  productId: z.string().uuid(),
  qty: z.coerce.number().positive("释放数量必须大于0"),
  relatedCode: z.string().optional(),
});

/** 冲销预留 */
export const fulfillSchema = z.object({
  productId: z.string().uuid(),
  qty: z.coerce.number().positive("冲销数量必须大于0"),
  relatedCode: z.string().optional(),
});
// 类型推导
export type AddStockInput = z.infer<typeof addStockSchema>;
export type DeductStockInput = z.infer<typeof deductStockSchema>;
export type ReversalInput = z.infer<typeof reversalSchema>;
export type AllocateInput = z.infer<typeof allocateStockSchema>;
export type InitStockInput = z.infer<typeof initStockSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
export type ReserveInput = z.infer<typeof reserveSchema>;
export type ReleaseInput = z.infer<typeof releaseSchema>;
export type FulfillInput = z.infer<typeof fulfillSchema>;
