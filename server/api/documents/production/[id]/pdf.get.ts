// server/api/documents/production/[id]/pdf.get.ts
import { usePrisma } from "~~/server/config/prisma";
import { createOrderService } from "~~/server/services/order.service";
import { generatePdf } from "~~/server/utils/pdf/generator";
import { buildProductionFormRenderer } from "~~/server/utils/pdf/production-form";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  try {
    await requirePermission(event, "order:view");

    const orderId = getRouterParam(event, "id")!;
    const orderItemId = getQuery(event).orderItemId as string | undefined;

    const orderService = createOrderService(usePrisma());
    const order = await orderService.getOrderWithPlans(orderId);

    const blankRows = Number(getQuery(event).blankRows || 20);
    const pdfBuffer = await generatePdf({
      title: `生产报工单_${order.orderCode}`,
      render: buildProductionFormRenderer(order, orderItemId, blankRows),
    });

    setHeader(event, "Content-Type", "application/pdf");
    setHeader(
      event,
      "Content-Disposition",
      `attachment; filename="production-form-${order.orderCode}.pdf"`,
    );

    return pdfBuffer;
  } catch (error: any) {
    console.error("报工单生成失败:", error);
    throw createError({
      statusCode: 500,
      message: `生成失败: ${error.message}`,
    });
  }
});
