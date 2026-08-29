import { z } from "zod";

export const createBomItemSchema = z.object({
  //物料id为空,则视为新物料,由应用层解析并创建
  materialId: z.uuid().optional(),
  materialName: z.string().min(1, "物料名不能为空"),
  quantity: z.coerce.number().positive("用量必须大于0"),
  unit: z.string().default("pcs"),
  spec: z.string().optional(),
  category: z.string().optional(),
  scrapRate: z.coerce.number().min(0).max(1).default(0),
});

export const createBomSchema = z.object({
  productId: z.uuid("产品ID无效"),
  items: z.array(createBomItemSchema).min(1, "至少需要一个物料"),
  orderId: z.uuid().optional(),
});

export const updateBomSchema = z.object({
  id: z.uuid("BOM ID无效"),
  items: z.array(createBomItemSchema).min(1),
});

export const publishBomSchema = z.object({
  id: z.uuid("BOM ID无效"),
});

export const obsoleteBomSchema = z.object({
  id: z.uuid("BOM ID无效"),
});

export const cloneBomSchema = z.object({
  baseBomId: z.uuid("基础 BOM ID 无效"),
  bomCode: z.string().min(1, "BOM 编码不能为空"),
  productId: z.uuid("产品 ID 无效"),
  bomType: z.enum(["PRODUCTION", "SAMPLE", "CUSTOM"]).default("SAMPLE"),
  orderId: z.uuid().optional(),
});

export type CreateBomInput = z.infer<typeof createBomSchema>;
export type UpdateBomInput = z.infer<typeof updateBomSchema>;
export type CloneBomInput = z.infer<typeof cloneBomSchema>;
