// server/application/purchase-order.application.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createPurchaseOrderService } from "~~/server/services/purchase-order.service";
import { createSupplierService } from "~~/server/services/supplier.service";
import { createInventoryService } from "~~/server/services/inventory.service";
import { createInventoryLogService } from "~~/server/services/inventory-log.service";
import { createCostService } from "~~/server/services/cost.service";
import { createPurchaseReceiptService } from "~~/server/services/purchase-receipt.service";
import { createInventoryLocationService } from "~~/server/services/inventory-location.service";
import { createAuditService } from "~~/server/services/audit.service";
import { createPrismaTxContext } from "~~/server/infrastructure/tx";
import {
  createDecimal,
  toPrismaDecimal,
} from "~~/shared/mappers/baseRepoType/decimal";
import type { RequestContext } from "~~/shared/types/request";
import { createError } from "h3";
import { createProductService } from "../services/product.service";

export const createPurchaseOrderApplication = (prisma: PrismaClient) => {
  const purchaseOrderService = createPurchaseOrderService(prisma);
  const supplierService = createSupplierService(prisma);
  const inventoryService = createInventoryService(prisma);
  const invLogService = createInventoryLogService(prisma);
  const costService = createCostService(prisma);
  const receiptService = createPurchaseReceiptService(prisma);
  const invLocService = createInventoryLocationService(prisma);
  const auditService = createAuditService(prisma);

  return {
    /** 创建采购单 */
    async create(ctx: RequestContext, rawdata: unknown) {
      const data = rawdata as {
        supplierId: string;
        expectedDate?: string;
        remark?: string;
        items: Array<{
          productId?: string;
          productName: string;
          spec?: string;
          unit?: string;
          category?: string;
          quantity: number;
          unitPrice: number;
        }>;
      };

      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        const supplier = await supplierService.getById(data.supplierId);
        if (!supplier || supplier.status !== "ACTIVE") {
          throw createError({
            statusCode: 400,
            message: "供应商不存在或已停用",
          });
        }

        // 新建产品：productId 为空时自动创建
        const productService = createProductService(prisma);
        const resolvedItems: Array<{
          productId: string;
          productName: string;
          spec?: string;
          unit?: string;
          category?: string;
          quantity: number;
          unitPrice: number;
        }> = [];

        for (const item of data.items) {
          if (
            (!item.productId || item.productId === "__NEW__") &&
            item.productName
          ) {
            const newProduct = await productService.create(
              ctx,
              {
                name: item.productName,
                spec: item.spec,
                unit: item.unit || "PCS",
                category: item.category || "RAW",
              },
              txCtx,
            );
            resolvedItems.push({
              ...item,
              productId: newProduct.id,
              productName: newProduct.name,
            });
          } else if (item.productId) {
            resolvedItems.push({ ...item, productId: item.productId });
          }
        }

        const order = await purchaseOrderService.create(
          { ...data, items: resolvedItems, createdById: ctx.operatorId },
          txCtx,
        );

        await auditService.log(
          ctx.operatorId,
          "PurchaseOrder",
          order.id,
          "CREATE",
          {
            remark: `创建采购单 ${order.orderCode}`,
          },
        );

        return order;
      });
    },

    /** 审批通过 */
    async approve(ctx: RequestContext, rawdata: unknown) {
      const { id } = rawdata as { id: string };

      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        const order = await purchaseOrderService.getById(id);
        if (!order)
          throw createError({ statusCode: 404, message: "采购单不存在" });
        if (order.status !== "PENDING")
          throw createError({
            statusCode: 400,
            message: "只能审批待审批的采购单",
          });

        const approved = await purchaseOrderService.approve(
          id,
          ctx.operatorId,
          txCtx,
        );

        await auditService.log(ctx.operatorId, "PurchaseOrder", id, "APPROVE", {
          remark: `审批通过采购单 ${order.orderCode}`,
        });

        return approved;
      });
    },

    /** 取消 */
    async cancel(ctx: RequestContext, rawdata: unknown) {
      const { id } = rawdata as { id: string };

      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        const order = await purchaseOrderService.getById(id);
        if (!order)
          throw createError({ statusCode: 404, message: "采购单不存在" });
        if (["COMPLETED", "CANCELLED"].includes(order.status)) {
          throw createError({ statusCode: 400, message: "该采购单不可取消" });
        }

        const cancelled = await purchaseOrderService.updateStatus(
          id,
          "CANCELLED",
          txCtx,
        );

        await auditService.log(ctx.operatorId, "PurchaseOrder", id, "CANCEL", {
          remark: `取消采购单 ${order.orderCode}`,
        });

        return cancelled;
      });
    },

    /** 采购入库 */
    async addReceipt(ctx: RequestContext, rawdata: unknown) {
      const { orderId, orderItemId, quantity, unitCost, locationId, remark } =
        rawdata as {
          orderId: string;
          orderItemId: string;
          quantity: number;
          unitCost: number;
          locationId?: string;
          remark?: string;
        };

      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        // 校验采购单
        const order = await purchaseOrderService.getById(orderId);
        if (!order)
          throw createError({ statusCode: 404, message: "采购单不存在" });
        if (!["APPROVED", "PARTIAL"].includes(order.status)) {
          throw createError({
            statusCode: 400,
            message: `采购单状态 ${order.status} 不允许入库`,
          });
        }

        // 校验明细
        const orderItem = order.items.find((i: any) => i.id === orderItemId);
        if (!orderItem)
          throw createError({ statusCode: 400, message: "采购明细不匹配" });

        // 防超收
        const qty = createDecimal(quantity);
        const received = createDecimal(String(orderItem.receivedQty));
        const total = createDecimal(String(orderItem.quantity));
        if (received.plus(qty).gt(total)) {
          throw createError({
            statusCode: 400,
            message: `入库数量超限！采购: ${total.toString()}, 已入库: ${received.toString()}, 本次: ${qty.toString()}`,
          });
        }

        // 1. 创建入库记录
        const receipt = await receiptService.create(
          {
            orderId,
            orderItemId,
            productId: orderItem.productId,
            quantity: toPrismaDecimal(qty),
            unitCost: toPrismaDecimal(createDecimal(unitCost)),
            locationId,
            operatorId: ctx.operatorId,
            remark,
          },
          txCtx,
        );

        // 2. 增加库存
        const stockResult = await inventoryService.addStock(
          {
            productId: orderItem.productId,
            quantity,
            type: "PURCHASE_IN",
            locationId,
          },
          txCtx,
        );

        // 3. 库位库存同步
        if (locationId) {
          await invLocService.addStock(
            orderItem.productId,
            locationId,
            toPrismaDecimal(qty),
            txCtx,
          );
        }

        // 4. 写流水
        const logEntry = await invLogService.createLog(
          {
            productId: orderItem.productId,
            type: "PURCHASE_IN",
            quantity: toPrismaDecimal(stockResult.changedQty),
            beforeQty: toPrismaDecimal(stockResult.beforeQty),
            afterQty: toPrismaDecimal(stockResult.afterQty),
            relatedCode: receipt.receiptCode,
            remark: remark || "采购入库",
            operatorId: ctx.operatorId,
          },
          txCtx,
        );

        // 5. 记成本
        await costService.recordInboundCost(
          {
            inventoryLogId: logEntry.id,
            productId: orderItem.productId,
            quantity: toPrismaDecimal(qty),
            unitCost: unitCost,
            direction: "IN",
            sourceType: "PURCHASE",
            remark,
          },
          txCtx,
        );

        // 6. 更新已入库数量
        await purchaseOrderService.incrementReceivedQty(
          orderItemId,
          toPrismaDecimal(qty),
          txCtx,
        );

        // 7. 判断是否全部入库
        const updatedItem = order.items.find((i: any) => i.id === orderItemId);
        const newReceived = received.plus(qty);
        if (newReceived.gte(total)) {
          await purchaseOrderService.updateStatus(orderId, "COMPLETED", txCtx);
        } else if (order.status === "APPROVED") {
          await purchaseOrderService.updateStatus(orderId, "PARTIAL", txCtx);
        }

        await auditService.log(
          ctx.operatorId,
          "PurchaseOrder",
          orderId,
          "RECEIPT",
          {
            remark: `采购入库 ${orderItem.productName} ×${quantity}，单号 ${receipt.receiptCode}`,
          },
        );

        return receipt;
      });
    },

    // 预留：未来操作记录服务
    // async recordOperation(...) { }
    // async rollbackOperation(...) { }
  };
};
