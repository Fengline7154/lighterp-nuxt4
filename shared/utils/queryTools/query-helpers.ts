/**
 * 将前端的 sortField/sortDir 转换为 Prisma orderBy 格式
 * @param sortField - 排序字段
 * @param sortDir - 排序方向，默认 desc
 * @param defaultField - 无 sortField 时的默认排序字段
 */
export function buildOrderBy(
  sortField: string | undefined,
  sortDir: "asc" | "desc" | undefined,
  defaultField?: string, // 可选：如果不传，sortField 为空时就不排序
): Record<string, "asc" | "desc"> {
  if (!sortField && !defaultField) return {};
  const field = sortField || defaultField!;
  const orderBy: Record<string, "asc" | "desc"> = {};
  orderBy[field] = sortDir || "desc";
  return orderBy;
}
