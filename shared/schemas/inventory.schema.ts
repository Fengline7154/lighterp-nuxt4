import { z } from "zod";

// 入库 Schema
export const addStockSchema = z.object({
  relatedCode: z.string().optional(),
  quantity: z.coerce.number().positive("入库数量必须大于0"),
  unitCost: z.coerce.number().min(0).optional(),
  remark: z.string().max(200).optional(),
});

// 出库 Schema
export const deductStockSchema = z.object({
  productId: z.string(),
  type: z.string().optional(),
  quantity: z.coerce.number().positive("出库数量必须大于0"),
  remark: z.string().max(200).optional(),
  relatedCode: z.string().optional(),
  locationId: z.string().optional(),
  orderId: z.string().optional(),
});

// 盘点调整
export const adjustInventorySchema = z.object({
  relatedCode: z.string().optional(),
  productName: z.string().min(1, "产品名不能为空"),
  quantity: z.coerce.number().min(0, "库存数量不能为负数"),
  remark: z.string().max(200).optional(),
});

// 红冲
export const reversalSchema = z.object({
  relatedCode: z.string().optional(),
  quantity: z.coerce.number(),
  relatedId: z.uuid().optional(),
  remark: z.string().max(200).min(1, "红冲备注需填写具体原因"),
});

// 库存列表项
export const inventoryListItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productCode: z.string().optional(),
  productName: z.string(),
  quantity: z.coerce.number(),
  reservedQty: z.coerce.number(),
  availableQty: z.coerce.number(),
  lockVersion: z.number(),
  updatedAt: z.string(),
});

// 库存列表响应
export const inventoryListResponseSchema = z.object({
  data: z.array(inventoryListItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export type AddStockInput = z.infer<typeof addStockSchema>;
export type DeductStockInput = z.infer<typeof deductStockSchema>;
export type AdjustInventoryInput = z.infer<typeof adjustInventorySchema>;
export type InventoryListItem = z.infer<typeof inventoryListItemSchema>;
export type InventoryListResponse = z.infer<typeof inventoryListResponseSchema>;
