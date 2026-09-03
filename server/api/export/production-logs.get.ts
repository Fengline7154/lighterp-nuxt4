// server/api/export/production-logs.get.ts
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";

const wageLabel = (w: string) => (w === "HOURLY" ? "计时" : "计件");

export default defineEventHandler(async (event) => {
  await requirePermission(event, "data:export");

  const prisma = usePrisma();
  const logs = await prisma.productionLog.findMany({
    include: {
      order: { select: { orderCode: true } },
      product: { select: { code: true, name: true, unit: true } },
      worker: { select: { code: true, name: true } },
      operator: { select: { badgeCode: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "订单号",
    "产品编码",
    "产品名称",
    "工序名称",
    "工资类型",
    "完工数",
    "合格数",
    "不良数",
    "工时",
    "小时工资",
    "计件单价",
    "人工成本",
    "操作工",
    "录入人",
    "报工时间",
    "备注",
  ];

  const rows = logs.map((l: any) => [
    l.order?.orderCode || "",
    l.product?.code || "",
    l.product?.name || "",
    l.processName,
    wageLabel(l.wageType),
    l.completedQty.toString(),
    l.qualifiedQty.toString(),
    l.defectiveQty.toString(),
    l.laborHours ? l.laborHours.toString() : "",
    l.hourlyRate ? l.hourlyRate.toString() : "",
    l.unitPrice ? l.unitPrice.toString() : "",
    l.laborCost ? l.laborCost.toString() : "",
    l.worker ? `${l.worker.code}-${l.worker.name}` : "",
    `${l.operator?.badgeCode}-${l.operator?.name}`,
    new Date(l.createdAt).toLocaleString("zh-CN"),
    l.remark || "",
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
    `attachment; filename="production-logs_${new Date().toISOString().split("T")[0]}.csv"`,
  );

  return csv;
});
