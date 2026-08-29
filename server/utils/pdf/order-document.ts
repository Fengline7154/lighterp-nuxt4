// server/utils/pdf/order-document.ts
import autoTable from "jspdf-autotable";
import type { jsPDF } from "jspdf";

const orderTypeLabel = (type: string) =>
  ({ STANDARD: "标准品", VARIANT: "变型品", CUSTOM: "定制品" })[type] || type;

const orderStatusLabel = (status: string) =>
  ({
    PENDING: "待审核",
    APPROVED: "已审核",
    SAMPLING: "打样中",
    SAMPLED: "已打样",
    PRODUCING: "生产中",
    READY: "待发货",
    COMPLETED: "已完成",
    CANCELLED: "已取消",
  })[status] || status;

const formatQty = (value: any): string => {
  const num = Number(value);
  if (isNaN(num)) return String(value ?? "");
  return Number.isInteger(num)
    ? String(num)
    : String(parseFloat(num.toFixed(4)));
};

export const buildOrderPdfRenderer = (order: any) => {
  return (doc: jsPDF) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginLeft = 15;
    const marginRight = pageWidth - 15;

    const drawFooter = () => {
      const currentPage = doc.getCurrentPageInfo().pageNumber;
      doc.setFont("NotoSansSC", "normal");
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `打印时间：${new Date().toLocaleString("zh-CN")}`,
        marginLeft,
        pageHeight - 8,
      );
      doc.text("内部使用", pageWidth / 2, pageHeight - 8, { align: "center" });
      doc.text(`第 ${currentPage} 页`, marginRight, pageHeight - 8, {
        align: "right",
      });
    };

    const checkAndAddPage = (gap: number): number => {
      const lastY = (doc as any).lastAutoTable?.finalY || 72;
      const candidateY = lastY + gap;
      if (pageHeight - candidateY < 60) {
        doc.addPage();
        return 30;
      }
      return candidateY;
    };

    // ==================== 标题 ====================
    doc.setFont("NotoSansSC", "bold");
    doc.setFontSize(20);
    doc.text("生 产 任 务 单", pageWidth / 2, 25, { align: "center" });

    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.8);
    doc.line(marginLeft, 30, marginRight, 30);

    // ==================== 基本信息 ====================
    doc.setFont("NotoSansSC", "normal");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);

    const infoLeft = [
      `订单号：${order.orderCode}`,
      `客户：${order.customer?.name || "-"}`,
      `订单类型：${orderTypeLabel(order.orderType)}`,
    ];

    const infoRight = [
      `创建日期：${new Date(order.createdAt).toLocaleDateString("zh-CN")}`,
      `交货日期：${order.deadlineAt ? new Date(order.deadlineAt).toLocaleDateString("zh-CN") : "-"}`,
      `状态：${orderStatusLabel(order.status)}`,
    ];

    infoLeft.forEach((text, i) => {
      doc.text(text, marginLeft, 42 + i * 8);
    });

    infoRight.forEach((text, i) => {
      doc.text(text, 110, 42 + i * 8);
    });

    // ==================== 产品明细 ====================
    autoTable(doc, {
      tableWidth: 180, // 加这一行
      startY: 72,
      head: [["产品编码", "产品名称", "规格", "单位", "需求数量", "备注"]],
      body: order.items.map((item: any) => [
        item.product?.code || "",
        item.productName,
        item.product?.spec || "-",
        item.product?.unit || "-",
        formatQty(item.quantity),
        "",
      ]),
      columnStyles: {
        0: { halign: "left" },
        1: { halign: "left" },
        2: { halign: "left" },
        3: { halign: "center" },
        4: { halign: "center" },
        5: { halign: "left" },
      },
      styles: {
        font: "NotoSansSC",
        fontSize: 10,
        cellPadding: { top: 8, bottom: 8, left: 4, right: 4 },
        textColor: [50, 50, 50],
        lineColor: [180, 180, 180],
        lineWidth: 0.4,
      },
      headStyles: {
        font: "NotoSansSC",
        fontStyle: "bold",
        fontSize: 10,
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        halign: "center",
        cellPadding: { top: 6, bottom: 6, left: 3, right: 3 },
      },
      bodyStyles: {
        font: "NotoSansSC",
        fontSize: 10,
        cellPadding: { top: 8, bottom: 8, left: 4, right: 4 },
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      margin: { left: marginLeft, right: marginRight },
      didDrawPage: drawFooter,
    });

    // ==================== BOM 物料清单 ====================
    if (order.bomMaterials && order.bomMaterials.length > 0) {
      const bomStartY = checkAndAddPage(12);

      doc.setFont("NotoSansSC", "bold");
      doc.setFontSize(11);
      doc.setTextColor(50, 50, 50);
      doc.text("BOM 物料清单", marginLeft, bomStartY);

      autoTable(doc, {
        tableWidth: 180, // 加这一行
        startY: bomStartY + 4,
        head: [
          [
            "物料编码",
            "物料名称",
            "规格",
            "单位",
            "需求数量",
            "发料数",
            "备注",
          ],
        ],
        body: order.bomMaterials.map((mat: any) => [
          mat.materialCode || "",
          mat.materialName,
          mat.spec || "-",
          mat.unit || "-",
          formatQty(mat.demand),
          "",
          "",
        ]),
        columnStyles: {
          0: { halign: "left" },
          1: { halign: "left" },
          2: { halign: "left" },
          3: { halign: "center" },
          4: { halign: "center" },
          5: { halign: "center" },
          6: { halign: "left" },
        },
        styles: {
          font: "NotoSansSC",
          fontSize: 9,
          cellPadding: { top: 6, bottom: 6, left: 3, right: 3 },
          textColor: [50, 50, 50],
          lineColor: [200, 200, 200],
          lineWidth: 0.3,
        },
        headStyles: {
          font: "NotoSansSC",
          fontStyle: "bold",
          fontSize: 9,
          fillColor: [234, 179, 8],
          textColor: [255, 255, 255],
          halign: "center",
          cellPadding: { top: 5, bottom: 5, left: 3, right: 3 },
        },
        bodyStyles: {
          font: "NotoSansSC",
          fontSize: 9,
          cellPadding: { top: 6, bottom: 6, left: 3, right: 3 },
        },
        alternateRowStyles: {
          fillColor: [254, 249, 231],
        },
        margin: { left: marginLeft, right: marginRight },
        didDrawPage: drawFooter,
      });
    }

    // ==================== 工序计划 ====================
    if (order.orderProcessPlans && order.orderProcessPlans.length > 0) {
      const processStartY = checkAndAddPage(12);

      doc.setFont("NotoSansSC", "bold");
      doc.setFontSize(11);
      doc.setTextColor(50, 50, 50);
      doc.text("工序计划", marginLeft, processStartY);

      autoTable(doc, {
        tableWidth: 180, // 加这一行
        startY: processStartY + 4,
        head: [["产品", "工序", "薪资类型", "工价", "标准工时", "备注"]],
        body: order.orderProcessPlans.map((plan: any) => [
          plan.orderItem?.productName || "-",
          plan.processName,
          plan.wageType === "HOURLY" ? "计时" : "计件",
          plan.wageType === "HOURLY"
            ? `¥${Number(plan.hourlyRate || 0).toFixed(2)}/时`
            : `¥${Number(plan.unitPrice || 0).toFixed(2)}/件`,
          plan.wageType === "HOURLY" && plan.standardHours
            ? `${Number(plan.standardHours).toFixed(1)}h`
            : "-",
          "",
        ]),
        columnStyles: {
          0: { halign: "left" },
          1: { halign: "left" },
          2: { halign: "center" },
          3: { halign: "center" },
          4: { halign: "center" },
          5: { halign: "left" },
        },
        styles: {
          font: "NotoSansSC",
          fontSize: 9,
          cellPadding: { top: 6, bottom: 6, left: 3, right: 3 },
          textColor: [50, 50, 50],
          lineColor: [200, 200, 200],
          lineWidth: 0.3,
        },
        headStyles: {
          font: "NotoSansSC",
          fontStyle: "bold",
          fontSize: 9,
          fillColor: [100, 116, 139],
          textColor: [255, 255, 255],
          halign: "center",
          cellPadding: { top: 5, bottom: 5, left: 3, right: 3 },
        },
        bodyStyles: {
          font: "NotoSansSC",
          fontSize: 9,
          cellPadding: { top: 6, bottom: 6, left: 3, right: 3 },
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        margin: { left: marginLeft, right: marginRight },
        didDrawPage: drawFooter,
      });
    }

    // ==================== 签名区 ====================
    const lastTableY = (doc as any).lastAutoTable?.finalY || 72;
    const signatureY = Math.min(lastTableY + 15, pageHeight - 25);

    doc.setFont("NotoSansSC", "normal");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.text("制单：____________", marginLeft + 20, signatureY, {
      align: "center",
    });
    doc.text("审核：____________", pageWidth / 2, signatureY, {
      align: "center",
    });
    doc.text("领料人：____________", marginRight - 20, signatureY, {
      align: "center",
    });

    drawFooter();
  };
};
