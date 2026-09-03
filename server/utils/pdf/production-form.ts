// server/utils/pdf/production-form.ts
import autoTable from "jspdf-autotable";
import type { jsPDF } from "jspdf";

export const buildProductionFormRenderer = (
  order: any,
  orderItemId?: string,
  blankRowsCount: number = 20,
) => {
  const wageLabel = (w: string) => (w === "HOURLY" ? "计时" : "计件");

  // 确定目标订单明细
  const targetItem = orderItemId
    ? order.items?.find((i: any) => i.id === orderItemId)
    : order.items?.[0];

  // 过滤出该明细的工序计划
  const targetPlans = (order.orderProcessPlans || []).filter(
    (p: any) => p.orderItemId === targetItem?.id,
  );

  return (doc: jsPDF) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginLeft = 15;
    const marginRight = 15;

    // ==================== 标题 ====================
    doc.setFont("NotoSansSC", "bold");
    doc.setFontSize(18);
    doc.setTextColor(50, 50, 50);
    doc.text("生产报工单", pageWidth / 2, 20, { align: "center" });

    // ==================== 表头信息 ====================
    doc.setFont("NotoSansSC", "normal");
    doc.setFontSize(10);
    const headerLeft = marginLeft;
    const headerRight = marginLeft + (pageWidth - marginLeft - marginRight) / 2;
    const headerY1 = 30;
    const headerY2 = 38;

    doc.text(`订单号：${order.orderCode}`, headerLeft, headerY1);
    doc.text(
      `产品名称：${targetItem?.productName || "-"}`,
      headerRight,
      headerY1,
    );
    doc.text(`订单数量：${targetItem?.quantity || "-"}`, headerLeft, headerY2);
    doc.text("报工日期：____年____月____日", headerRight, headerY2);

    // ==================== 上表：工序模板 ====================
    const templateRows = targetPlans.map((plan: any, index: number) => [
      String(index + 1),
      plan.processName,
      wageLabel(plan.wageType || "HOURLY"),
    ]);

    autoTable(doc, {
      startY: 46,
      margin: { left: marginLeft, right: marginRight },
      head: [["序号", "工序名称", "计价方式"]],
      body: templateRows.length > 0 ? templateRows : [["", "", ""]],
      theme: "grid",
      styles: {
        font: "NotoSansSC",
        fontSize: 9,
        cellPadding: 4,
        textColor: [0, 0, 0],
      },
      headStyles: {
        font: "NotoSansSC",
        fontStyle: "bold",
        fontSize: 9,
        fillColor: [241, 245, 249],
        textColor: [71, 85, 105],
      },
      columnStyles: {
        0: { cellWidth: 20, halign: "center" },
        1: { cellWidth: "auto" },
        2: { cellWidth: 30, halign: "center" },
      },
    });

    const templateTableEnd = (doc as any).lastAutoTable?.finalY || 100;

    // ==================== 下表：手动填写区 ====================
    const blankRows = Array.from({ length: blankRowsCount }, (_, i) => [
      String(i + 1),
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    autoTable(doc, {
      startY: templateTableEnd + 8,
      margin: { left: marginLeft, right: marginRight },
      head: [
        [
          "序号",
          "工序名称",
          "操作工",
          "完工数/\n工时",
          "合格数/\n有效工时",
          "不良数",
          "备注",
        ],
      ],
      body: blankRows,
      theme: "grid",
      styles: {
        font: "NotoSansSC",
        fontSize: 9,
        cellPadding: 5,
        minCellHeight: 10,
        textColor: [0, 0, 0],
      },
      headStyles: {
        font: "NotoSansSC",
        fontStyle: "bold",
        fontSize: 9,
        fillColor: [241, 245, 249],
        textColor: [71, 85, 105],
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 15, halign: "center" },
        1: { cellWidth: 40 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30, halign: "center" },
        4: { cellWidth: 30, halign: "center" },
        5: { cellWidth: 20, halign: "center" },
        6: { cellWidth: "auto" },
      },
    });

    const blankTableEnd = (doc as any).lastAutoTable?.finalY || 200;

    // ==================== 签字栏 ====================
    const signY = Math.min(blankTableEnd + 10, pageHeight - 15);
    doc.setFont("NotoSansSC", "normal");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text("负责人签字：____________________", marginLeft, signY);
  };
};
