// server/application/inventory.application.ts
import { Prisma, type PrismaClient } from "~~/prisma/generated/client";
import { createInventoryService } from "~~/server/services/inventory.service";
import { createInventoryLogService } from "~~/server/services/inventory-log.service";
import { createCostService } from "~~/server/services/cost.service";
import { createProductService } from "~~/server/services/product.service";
import { createAuditService } from "~~/server/services/audit.service";
import { createPrismaTxContext } from "~~/server/infrastructure/tx";
import { createReservationService } from "../services/reservation.service";
import {
  createDecimal,
  toPrismaDecimal,
} from "~~/shared/mappers/baseRepoType/decimal";
import type { RequestContext } from "~~/shared/types/request";
import { createError } from "h3";
import { createOrderService } from "../services/order.service";
import { createOrderItemService } from "../services/order-item.service";
import { createOrderItemRepository } from "../repositories/postgres/order-item.repository";

export const createInventoryApplication = (prisma: PrismaClient) => {
  const inventoryService = createInventoryService(prisma);
  const invLogService = createInventoryLogService(prisma);
  const costService = createCostService(prisma);
  const productService = createProductService(prisma);
  const auditService = createAuditService(prisma);
  const reservationService = createReservationService(prisma);
  const orderService = createOrderService(prisma);
  const orderItemService = createOrderItemService(prisma);
  const orderItemRepo = createOrderItemRepository(prisma);
  // ==================== 工具函数 ====================

  function typeLabel(type: string): string {
    const map: Record<string, string> = {
      PURCHASE_IN: "采购入库",
      PRODUCTION_IN: "生产入库",
      RETURN_IN: "退货入库",
      TRANSFER_IN: "调拨入库",
      CHECK_IN: "盘盈入库",
      SALES_OUT: "销售出库",
      PRODUCTION_OUT: "生产领料",
      SAMPLE_OUT: "打样领料",
      SCRAP_OUT: "报废出库",
      TRANSFER_OUT: "调拨出库",
      CHECK_OUT: "盘亏出库",
      REVERSAL: "红冲",
      OTHER: "其他",
      ALLOCATE: "调配",
      INIT: "初始化",
    };
    return map[type] || type;
  }

  function toCostSourceType(type: string, isInbound: boolean): string {
    if (isInbound) {
      switch (type) {
        case "PURCHASE_IN":
          return "PURCHASE";
        case "PRODUCTION_IN":
          return "PRODUCTION";
        case "RETURN_IN":
          return "PURCHASE";
        default:
          return "ADJUSTMENT";
      }
    } else {
      switch (type) {
        case "SALES_OUT":
        case "PRODUCTION_OUT":
        case "SAMPLE_OUT":
          return "PRODUCTION";
        case "SCRAP_OUT":
          return "ADJUSTMENT";
        default:
          return "ADJUSTMENT";
      }
    }
  }

  // ==================== 对外暴露 ====================

  return {
    async addStock(ctx: RequestContext, rawdata: unknown) {
      const data = rawdata as {
        productId: string;
        quantity: number;
        type?: string;
        remark?: string;
        relatedCode?: string;
        locationId?: string;
        unitCost?: number;
      };
      const type = data.type || "PURCHASE_IN";

      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        const product = await productService.getById(data.productId);
        if (!product || product.status !== "ACTIVE") {
          throw createError({ statusCode: 400, message: "产品不存在或已停用" });
        }

        const result = await inventoryService.addStock(
          {
            productId: data.productId,
            quantity: data.quantity,
            type,
            locationId: data.locationId,
          },
          txCtx,
        );

        const logEntry = await invLogService.createLog(
          {
            productId: data.productId,
            type: type as any,
            quantity: toPrismaDecimal(result.changedQty),
            beforeQty: toPrismaDecimal(result.beforeQty),
            afterQty: toPrismaDecimal(result.afterQty),
            relatedCode: data.relatedCode,
            remark: data.remark || typeLabel(type),
            operatorId: ctx.operatorId,
            locationId: data.locationId,
          },
          txCtx,
        );

        if (type === "PURCHASE_IN" || type === "INIT") {
          await costService.recordInboundCost(
            {
              inventoryLogId: logEntry.id,
              productId: data.productId,
              quantity: toPrismaDecimal(result.changedQty),
              unitCost: type === "PURCHASE_IN" ? (data.unitCost ?? 0) : 0,
              direction: "IN",
              sourceType: toCostSourceType(type, true) as any,
              remark: data.remark,
            },
            txCtx,
          );
        }

        await auditService.log(
          ctx.operatorId,
          "Inventory",
          data.productId,
          "STOCK_IN",
          {
            field: "quantity",
            oldValue: result.beforeQty.toString(),
            newValue: result.afterQty.toString(),
            remark: `${typeLabel(type)}，变动量 ${result.changedQty.toString()}`,
          },
        );

        return result;
      });
    },

    async deductStock(ctx: RequestContext, rawdata: unknown) {
      const data = rawdata as {
        productId: string;
        quantity: number;
        type?: string;
        remark?: string;
        relatedCode?: string;
        locationId?: string;
        orderId?: string;
      };
      const type = data.type || "SALES_OUT";

      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        const product = await productService.getById(data.productId);
        if (!product || product.status !== "ACTIVE") {
          throw createError({ statusCode: 400, message: "产品不存在或已停用" });
        }

        const result = await inventoryService.deduct(
          {
            productId: data.productId,
            quantity: data.quantity,
            type,
            locationId: data.locationId,
          },
          txCtx,
        );

        const logEntry = await invLogService.createLog(
          {
            productId: data.productId,
            type: type as any,
            quantity: toPrismaDecimal(result.changedQty),
            beforeQty: toPrismaDecimal(result.beforeQty),
            afterQty: toPrismaDecimal(result.afterQty),
            relatedCode: data.relatedCode,
            remark: data.remark || typeLabel(type),
            operatorId: ctx.operatorId,
            locationId: data.locationId,
          },
          txCtx,
        );

        if (
          ["SALES_OUT", "PRODUCTION_OUT", "SAMPLE_OUT", "SCRAP_OUT"].includes(
            type,
          )
        ) {
          await costService.recordOutboundCost(
            {
              inventoryLogId: logEntry.id,
              productId: data.productId,
              quantity: toPrismaDecimal(result.changedQty.abs()),
              direction: "OUT",
              sourceType: toCostSourceType(type, false) as any,
              orderId: data.orderId,
              remark: data.remark,
            },
            txCtx,
          );
        }

        await auditService.log(
          ctx.operatorId,
          "Inventory",
          data.productId,
          "STOCK_OUT",
          {
            field: "quantity",
            oldValue: result.beforeQty.toString(),
            newValue: result.afterQty.toString(),
            remark: `${typeLabel(type)}，变动量 ${result.changedQty.toString()}`,
          },
        );

        return result;
      });
    },

    async transfer(ctx: RequestContext, rawdata: unknown) {
      const data = rawdata as {
        productId: string;
        fromLocationId: string;
        toLocationId: string;
        quantity: number;
        remark?: string;
      };

      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        const result = await inventoryService.transfer(
          {
            productId: data.productId,
            fromLocationId: data.fromLocationId,
            toLocationId: data.toLocationId,
            quantity: data.quantity,
            remark: data.remark,
          },
          txCtx,
        );

        if (result.locationChanges) {
          for (const loc of result.locationChanges) {
            await invLogService.createLog(
              {
                productId: data.productId,
                type: loc.changedQty.gt(0) ? "TRANSFER_IN" : "TRANSFER_OUT",
                quantity: toPrismaDecimal(loc.changedQty),
                beforeQty: toPrismaDecimal(loc.beforeQty),
                afterQty: toPrismaDecimal(loc.afterQty),
                locationId: loc.locationId,
                remark:
                  data.remark ||
                  `调拨 ${data.fromLocationId} → ${data.toLocationId}`,
                operatorId: ctx.operatorId,
              },
              txCtx,
            );
          }
        }

        await auditService.log(
          ctx.operatorId,
          "Inventory",
          data.productId,
          "TRANSFER",
          {
            remark: `调拨 ${data.fromLocationId} → ${data.toLocationId}，数量 ${data.quantity}`,
          },
        );

        return { success: true };
      });
    },

    async reversal(ctx: RequestContext, rawdata: unknown) {
      const data = rawdata as {
        productId: string;
        quantity: number;
        remark: string;
        locationId?: string;
      };

      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        const result = await inventoryService.reversal(
          {
            productId: data.productId,
            quantity: data.quantity,
            remark: data.remark,
            locationId: data.locationId,
          },
          txCtx,
        );

        const logEntry = await invLogService.createLog(
          {
            productId: data.productId,
            type: "REVERSAL",
            quantity: toPrismaDecimal(result.changedQty),
            beforeQty: toPrismaDecimal(result.beforeQty),
            afterQty: toPrismaDecimal(result.afterQty),
            remark: data.remark,
            operatorId: ctx.operatorId,
            locationId: data.locationId,
          },
          txCtx,
        );

        const qty = createDecimal(data.quantity);
        if (qty.gt(0)) {
          await costService.recordInboundCost(
            {
              inventoryLogId: logEntry.id,
              productId: data.productId,
              quantity: toPrismaDecimal(qty),
              unitCost: 0,
              direction: "IN",
              sourceType: "ADJUSTMENT",
              remark: data.remark || "红冲调整",
            },
            txCtx,
          );
        } else {
          await costService.recordOutboundCost(
            {
              inventoryLogId: logEntry.id,
              productId: data.productId,
              quantity: toPrismaDecimal(qty.abs()),
              direction: "OUT",
              sourceType: "ADJUSTMENT",
              remark: data.remark || "红冲调整",
            },
            txCtx,
          );
        }

        await auditService.log(
          ctx.operatorId,
          "Inventory",
          data.productId,
          "REVERSAL",
          {
            field: "quantity",
            oldValue: result.beforeQty.toString(),
            newValue: result.afterQty.toString(),
            remark: data.remark,
          },
        );

        return result;
      });
    },

    async initStock(ctx: RequestContext, rawdata: unknown) {
      const data = rawdata as {
        items: Array<{
          productId: string;
          productName: string;
          quantity: number;
          locationId?: string;
        }>;
        remark?: string;
      };

      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        // 校验：已有出入库记录的产品不能初始化
        for (const item of data.items) {
          const existingLog = await invLogService.findFirst(
            {
              productId: item.productId,
              type: { not: "INIT" },
            },
            txCtx,
          );
          if (existingLog) {
            throw createError({
              statusCode: 400,
              message: `产品 [${item.productName}] 已有正式出入库记录，不能使用初始化类型，请通过普通入库录入`,
            });
          }
        }

        const results = await inventoryService.initStock(data.items, txCtx);

        for (const result of results) {
          await invLogService.createLog(
            {
              productId: result.productId,
              type: "INIT",
              quantity: toPrismaDecimal(result.changedQty),
              beforeQty: toPrismaDecimal(result.beforeQty),
              afterQty: toPrismaDecimal(result.afterQty),
              remark: data.remark || "初始化库存",
              operatorId: ctx.operatorId,
            },
            txCtx,
          );

          await auditService.log(
            ctx.operatorId,
            "Inventory",
            result.productId,
            "INIT",
            {
              field: "quantity",
              oldValue: result.beforeQty.toString(),
              newValue: result.afterQty.toString(),
              remark: data.remark || "初始化库存",
            },
          );
        }

        return { success: true, count: results.length };
      });
    },

    /**
     * 调配库存（修改 allocatedQty，不改变总库存数量）
     */
    async allocate(ctx: RequestContext, rawdata: unknown) {
      const { productId, orderCode, quantity } = rawdata as {
        productId: string;
        orderCode: string;
        quantity: number;
      };

      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        // 1. 查订单
        const order = await orderService.findByOrderCode?.(orderCode, txCtx);
        if (!order)
          throw createError({ statusCode: 404, message: "订单不存在" });

        // 2. 查订单明细
        const orderItem = await orderItemService.findByOrderIdAndProductId(
          order.id,
          productId,
          txCtx,
        );
        if (!orderItem)
          throw createError({ statusCode: 400, message: "该订单不包含此产品" });

        // 3. 汇总已调配量
        const allocations = await reservationService.findByOrderId(
          order.id,
          txCtx,
        );
        const allocatedQty = allocations.data
          .filter((r) => r.productId === productId && r.type === "ALLOCATE")
          .reduce((sum, r) => {
            const q = createDecimal(String(r.quantity));
            const rel = createDecimal(String(r.released));
            return sum.plus(q.minus(rel));
          }, createDecimal(0));

        // 4. 计算上限：需求量 - 已入库量 - 已调配量
        const demand = createDecimal(String(orderItem.quantity));
        const fulfilled = createDecimal(String(orderItem.fulfilledQuantity));
        const maxAllocate = demand.minus(fulfilled).minus(allocatedQty);
        if (maxAllocate.lte(0)) {
          throw createError({
            statusCode: 400,
            message: "该订单此产品无需更多调配",
          });
        }

        let qty = createDecimal(quantity);
        if (qty.gt(maxAllocate)) qty = maxAllocate;

        // 5. 检查可用库存
        const stock = await inventoryService.getAvailableStock(
          productId,
          txCtx,
        );
        if (!stock)
          throw createError({ statusCode: 404, message: "库存记录不存在" });
        if (stock.availableQty.lt(qty)) {
          throw createError({
            statusCode: 400,
            message: `可用库存不足，当前可用: ${stock.availableQty.toString()}`,
          });
        }

        // 6. 更新 allocatedQty
        const updated = await inventoryService.markAllocated(
          productId,
          qty,
          stock.lockVersion,
          txCtx,
        );
        if (!updated)
          throw createError({ statusCode: 409, message: "操作冲突，请重试" });

        // 7. 更新订单明细：fulfilledQuantity（调配视为既有成品）
        await orderItemService.incrementFulfilledQty(
          orderItem.id,
          toPrismaDecimal(qty),
          txCtx,
        );

        // 8. 记录调配预留
        await reservationService.createMany(
          [
            {
              orderId: order.id,
              productId,
              type: "ALLOCATE",
              quantity: toPrismaDecimal(qty),
            },
          ],
          txCtx,
        );

        // 9. 审计
        await auditService.log(
          ctx.operatorId,
          "Inventory",
          productId,
          "ALLOCATE",
          {
            remark: `调配 ${qty.toString()} 至订单 ${orderCode}${qty.lt(createDecimal(quantity)) ? `（申请 ${quantity}，已达上限）` : ""}`,
          },
        );

        return {
          success: true,
          allocatedQty: qty.toString(),
          maxAllocate: maxAllocate.toString(),
        };
      });
    },

    /**
     * 预留库存（审批/调配时调用）
     */
    async reserve(ctx: RequestContext, rawdata: unknown) {
      const data = rawdata as {
        productId: string;
        qty: number;
        relatedCode?: string;
      };

      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        const result = await inventoryService.reserve(
          {
            productId: data.productId,
            qty: data.qty,
            relatedCode: data.relatedCode,
          },
          txCtx,
        );

        await auditService.log(
          ctx.operatorId,
          "Inventory",
          data.productId,
          "RESERVE",
          {
            remark: `预留 ${createDecimal(data.qty).toString()}，可用 ${result.beforeQty.toString()} → ${result.afterQty.toString()}${data.relatedCode ? `，关联 ${data.relatedCode}` : ""}`,
          },
        );

        return result;
      });
    },

    /**
     * 释放预留（取消/完成时调用）
     */
    async release(ctx: RequestContext, rawdata: unknown) {
      const data = rawdata as {
        productId: string;
        qty: number;
        relatedCode?: string;
      };

      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        const result = await inventoryService.release(
          {
            productId: data.productId,
            qty: data.qty,
            relatedCode: data.relatedCode,
          },
          txCtx,
        );

        await auditService.log(
          ctx.operatorId,
          "Inventory",
          data.productId,
          "RELEASE",
          {
            remark: `释放预留 ${createDecimal(data.qty).toString()}，可用 ${result.beforeQty.toString()} → ${result.afterQty.toString()}${data.relatedCode ? `，关联 ${data.relatedCode}` : ""}`,
          },
        );

        return result;
      });
    },
  };
};
