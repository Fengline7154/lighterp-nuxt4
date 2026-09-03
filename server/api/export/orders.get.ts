// server/api/export/orders.get.ts
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";

const typeLabel = (t: string) =>
  ({ STANDARD: "标准品", VARIANT: "变型品", CUSTOM: "定制品" })[t] || t;

const statusLabel = (s: string) =>
  ({
    PENDING: "待审核",
    APPROVED: "已审核",
    SAMPLING: "打样中",
    SAMPLED: "打样完成",
    PRODUCING: "生产中",
    READY: "备货完成",
    COMPLETED: "已完成",
    CANCELLED: "已取消",
  })[s] || s;

export default defineEventHandler(async (event) => {
  await requirePermission(event, "data:export");

  const prisma = usePrisma();
  const orders = await prisma.order.findMany({
    include: {
      customer: { select: { name: true } },
      items: true,
      creator: { select: { badgeCode: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "订单号",
    "类型",
    "状态",
    "客户",
    "总额",
    "制单人",
    "创建时间",
    "交期",
    "产品明细",
  ];

  const rows = orders.map((o: any) => [
    o.orderCode,
    typeLabel(o.orderType),
    statusLabel(o.status),
    o.customer?.name || "",
    o.totalAmount,
    `${o.creator?.badgeCode}-${o.creator?.name}`,
    new Date(o.createdAt).toLocaleString("zh-CN"),
    o.deadlineAt ? new Date(o.deadlineAt).toLocaleString("zh-CN") : "",
    o.items
      .map((i: any) => `${i.productName} x${i.quantity} @¥${i.unitPrice}`)
      .join("; "),
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
    `attachment; filename="orders_${new Date().toISOString().split("T")[0]}.csv"`,
  );

  return csv;
});
