// server/api/export/workers.get.ts
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";

const statusLabel = (s: string) =>
  ({ ACTIVE: "在职", INACTIVE: "离职" })[s] || s;

export default defineEventHandler(async (event) => {
  await requirePermission(event, "data:export");

  const prisma = usePrisma();
  const workers = await prisma.worker.findMany({
    orderBy: { code: "asc" },
  });

  const headers = [
    "工号",
    "姓名",
    "电话",
    "身份证号",
    "职位",
    "部门",
    "入职日期",
    "紧急联系人",
    "紧急联系电话",
    "小时工资",
    "计件单价",
    "状态",
    "备注",
    "创建时间",
  ];

  const rows = workers.map((w: any) => [
    w.code,
    w.name,
    w.phone || "",
    w.idCard || "",
    w.position || "",
    w.department || "",
    w.entryDate ? new Date(w.entryDate).toLocaleDateString("zh-CN") : "",
    w.emergencyContact || "",
    w.emergencyPhone || "",
    w.hourlyRate ? w.hourlyRate.toString() : "",
    w.unitPrice ? w.unitPrice.toString() : "",
    statusLabel(w.status),
    w.remark || "",
    new Date(w.createdAt).toLocaleString("zh-CN"),
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
    `attachment; filename="workers_${new Date().toISOString().split("T")[0]}.csv"`,
  );

  return csv;
});
