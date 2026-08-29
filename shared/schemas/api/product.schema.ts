import { z } from "zod";
import {
  ProductUnit,
  ProductCategory,
  ProductStatus,
} from "~~/prisma/generated/client";

export const createProductSchema = z.object({
  name: z.string().min(1, "产品名称不能为空"),
  unit: z.enum(ProductUnit).default("PCS"),
  spec: z.string().optional(),
  category: z.enum(ProductCategory).optional(),
  tags: z.array(z.string()).default([]),
  attributes: z.record(z.string(), z.any()).optional(),
  packUnit: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.uuid("PRODUCT ID无效"),
  status: z.enum(ProductStatus).optional(),
});

export const changeProductStatusSchema = z.object({
  id: z.uuid("PRODUCT ID无效"),
  status: z.enum(ProductStatus).optional(),
});
export const batchCreateProductSchema = z.object({
  items: z.array(createProductSchema).min(1, "至少需要一个产品"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type BatchCreateProductInput = z.infer<typeof batchCreateProductSchema>;
