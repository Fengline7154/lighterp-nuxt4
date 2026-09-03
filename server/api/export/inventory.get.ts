// server/api/export/inventory.get.ts
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

export default defineEventHandler(async (event) => {
  await requirePermission(event, "data:export");

  const prisma = usePrisma();
  const inventories = await prisma.inventory.findMany({
    include: {
      product: {
        select: {
          code: true,
          name: true,
          spec: true,
          unit: true,
          category: true,
        },
      },
    },
    orderBy: { productId: "asc" },
  });

  const headers = [
    "产品编码",
    "产品名称",
    "规格",
    "类别",
    "单位",
    "总库存",
    "预留量",
    "可用量",
    "更新时间",
  ];

  const rows = inventories.map((inv: any) => {
    const totalQty = Number(inv.quantity);
    const reservedQty = Number(inv.reservedQty);
    const availableQty = totalQty - reservedQty;

    return [
      inv.product?.code || "",
      inv.product?.name || inv.productName,
      inv.product?.spec || "",
      categoryLabel(inv.product?.category),
      inv.product?.unit || "",
      totalQty.toFixed(4),
      reservedQty.toFixed(4),
      availableQty.toFixed(4),
      new Date(inv.updatedAt).toLocaleString("zh-CN"),
    ];
  });

  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  setHeader(event, "Content-Type", "text/csv; charset=utf-8");
  setHeader(
    event,
    "Content-Disposition",
    `attachment; filename="inventory_${new Date().toISOString().split("T")[0]}.csv"`,
  );

  return csv;
});
