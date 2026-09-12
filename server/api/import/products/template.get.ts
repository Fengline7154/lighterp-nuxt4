// server/api/import/products/template.get.ts
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "data:export");

  const headers: string[] = ["名称", "规格", "单位", "类别", "包装单位"];

  const examples: string[][] = [
    ["帐篷布(示例,可删除本行)", "210D牛津布", "M", "原材料", "卷"],
  ];

  const allRows: string[][] = [headers, ...examples];

  const csv = allRows
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  setHeader(event, "Content-Type", "text/csv; charset=utf-8");
  setHeader(
    event,
    "Content-Disposition",
    'attachment; filename="product_import_template.csv"',
  );

  return csv;
});
