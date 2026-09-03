// server/api/export/products.get.ts
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";

const categoryLabel = (c: string) =>
  ({
    FINISHED: "成品",
    SEMI: "半成品",
    RAW: "原材料",
    PACKAGING: "包材",
  })[c] ||
  c ||
  "-";

const statusLabel = (s: string) =>
  ({ ACTIVE: "启用", INACTIVE: "停用" })[s] || s;

export default defineEventHandler(async (event) => {
  await requirePermission(event, "data:export");

  const prisma = usePrisma();
  const products = await prisma.product.findMany({
    orderBy: { code: "asc" },
  });

  const headers = [
    "产品编码",
    "产品名称",
    "规格",
    "类别",
    "单位",
    "包装单位",
    "状态",
    "标签",
    "创建时间",
    "更新时间",
  ];

  const rows = products.map((p: any) => [
    p.code,
    p.name,
    p.spec || "",
    categoryLabel(p.category),
    p.unit,
    p.packUnit || "",
    statusLabel(p.status),
    (p.tags || []).join("; "),
    new Date(p.createdAt).toLocaleString("zh-CN"),
    new Date(p.updatedAt).toLocaleString("zh-CN"),
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  setHeader(event, "Content-Type", "text/csv; charset=utf-8");
  setHeader(
    event,
    "Content-Disposition",
    `attachment; filename="products_${new Date().toISOString().split("T")[0]}.csv"`,
  );

  return csv;
});
