import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "产品名称不能为空").max(100),
  spec: z.string().max(100).optional(),
  unit: z.string().default("pcs"),
  category: z.enum(["FINISHED", "SEMI", "RAW", "PACKAGING"]).optional(),
  tags: z.array(z.string()).optional(),
  attributes: z.record(z.string(), z.any()).optional(),
});

// 产品列表项
export const productListItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  spec: z.string().nullable(),
  unit: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  status: z.string(),
  createdAt: z.string(),
});

// 产品列表响应
export const productListResponseSchema = z.object({
  data: z.array(productListItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductListItem = z.infer<typeof productListItemSchema>;
export type ProductListResponse = z.infer<typeof productListResponseSchema>;
