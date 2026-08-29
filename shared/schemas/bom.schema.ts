import { z } from "zod";
import { ProductUnit } from "~~/prisma/generated/client";
export const bomItemSchema = z.object({
  materialId: z.string().min(1, "物料ID不能为空"),
  materialName: z.string().min(1, "物料名不能为空"),
  quantity: z.coerce.number().positive("用量必须大于0"),
  unit: z.enum(ProductUnit).default(ProductUnit.PCS),
  scrapRate: z.coerce.number().min(0).max(1).default(0),
  isNew: z.boolean().optional(),
  spec: z.string().optional(),
  category: z.string().optional(),
});

export const createBomSchema = z.object({
  productId: z.string().min(1, "产品SKU不能为空"),
  productName: z.string().min(1, "产品名不能为空"),
  items: z.array(bomItemSchema).min(1, "物料明细不能为空"),
});

export const updateBomSchema = z.object({
  productName: z.string().min(1, "产品名不能为空").optional(),
  items: z.array(bomItemSchema).min(1, "物料明细不能为空"),
});

//bom列表项
export const bomListItemSchema = z.object({
  id: z.string(),
  bomCode: z.string(),
  productName: z.string(),
  version: z.number(),
  status: z.string(),
  createdAt: z.string(),
  _count: z.object({ items: z.number() }).optional(),
  product: z.object({ name: z.string(), code: z.string() }).optional(),
});
//bom列表响应
export const bomListResponseSchema = z.object({
  data: z.array(bomListItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export type BomListItem = z.infer<typeof bomListItemSchema>;
export type BomListResponse = z.infer<typeof bomListResponseSchema>;

export type CreateBomInput = z.infer<typeof createBomSchema>;
export type UpdateBomInput = z.infer<typeof updateBomSchema>;
