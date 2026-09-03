import { z } from "zod";

// 库存列表项（从 /api/inventory 返回的单条数据）
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
  // 库位分布（可选）
  locations: z
    .array(
      z.object({
        id: z.string(),
        code: z.string(),
        name: z.string(),
        quantity: z.coerce.number(),
      }),
    )
    .optional(),
});

// 库存流水列表项（用于 /api/inventory-logs 返回）
export const inventoryLogItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  productCode: z.string().optional(),
  productName: z.string().optional(),
  quantity: z.coerce.number(),
  beforeQty: z.coerce.number(),
  afterQty: z.coerce.number(),
  relatedCode: z.string().nullable(),
  remark: z.string().nullable(),
  operatorBadge: z.string().optional(),
  operatorName: z.string().optional(),
  location: z
    .object({ code: z.string(), name: z.string() })
    .nullable()
    .optional(),
  createdAt: z.string(),
});

export const inventoryLogListResponseSchema = z.object({
  data: z.array(inventoryLogItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

// 推导类型
export type InventoryListItem = z.infer<typeof inventoryListItemSchema>;
export type InventoryLogItem = z.infer<typeof inventoryLogItemSchema>;
export type InventoryLogListResponse = z.infer<
  typeof inventoryLogListResponseSchema
>;
