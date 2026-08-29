import { z } from "zod";

/**
 * 通用分页响应工厂
 * 用法：paginationSchema(itemSchema) → 返回完整的分页响应 Schema
 */
export function paginationSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  });
}

/**
 * 通用分页参数（用于 API 入参）
 */
export const paginationParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
});

/**
 * 通用排序参数
 */
export const sortParamsSchema = z.object({
  sortField: z.string().optional(),
  sortDir: z.enum(["asc", "desc"]).optional().default("desc"),
});

/**
 * 通用关键词搜索参数
 */
export const keywordParamsSchema = z.object({
  keyword: z.string().optional(),
});

/**
 * 通用日期范围参数
 */
export const dateRangeParamsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
/**
 * 分页排序统合
 */
export const listQuerySchema = z.object({
  ...paginationParamsSchema.shape,
  ...sortParamsSchema.shape,
});
/**
 * 导出类型
 */
export type PaginationParams = z.infer<typeof paginationParamsSchema>;
export type SortParams = z.infer<typeof sortParamsSchema>;
export type KeywordParams = z.infer<typeof keywordParamsSchema>;
export type DateRangeParams = z.infer<typeof dateRangeParamsSchema>;
export type ListQueryParams = z.infer<typeof listQuerySchema>;
