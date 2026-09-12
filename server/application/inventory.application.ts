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
import { createReceiptService } from "../services/receipt.service";
import { createBomService } from "../services/bom.service";

export const createInventoryApplication = (prisma: PrismaClient) => {
  const inventoryService = createInventoryService(prisma);
  const invLogService = createInventoryLogService(prisma);
  const costService = createCostService(prisma);
  const productService = createProductService(prisma);
  const auditService = createAuditService(prisma);
  const reservationService = createReservationService(prisma);
  const orderService = createOrderService(prisma);
  const orderItemService = createOrderItemService(prisma);
  const bomService = createBomService(prisma);

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

        // ==================== 生产领料专属逻辑 ====================
        if (type === "PRODUCTION_OUT") {
          if (!data.orderId) {
            throw createError({
              statusCode: 400,
              message: "生产领料必须关联订单",
            });
          }

          // 1. 校验订单状态
          const order = await orderService.getOrderById(data.orderId);
          if (!order || !["APPROVED", "PRODUCING"].includes(order.status)) {
            throw createError({
              statusCode: 400,
              message: "订单不存在或当前状态不允许领料",
            });
          }

          // 2. 校验物料属于订单明细产品或任一 BOM 直接子物料
          const orderItems = await orderItemService.findByOrderId(
            data.orderId,
            txCtx,
          );
          const allowedMaterialIds = new Set<string>();

          for (const item of orderItems) {
            allowedMaterialIds.add(item.productId);
            if (item.bomId) {
              const directIds = await bomService.findDirectMaterialIdsByBomId(
                item.bomId,
                txCtx,
              );
              for (const id of directIds) allowedMaterialIds.add(id);
            }
          }

          if (!allowedMaterialIds.has(data.productId)) {
            throw createError({
              statusCode: 400,
              message:
                "该物料不属于此订单产品或其 BOM 直接物料，请确认领料单或订单号",
            });
          }

          // 3. 查未消耗预留并消耗（软校验，允许超额）
          const reservations = await reservationService.findUnconsumed(
            data.orderId,
            data.productId,
            "MATERIAL_RESERVE",
            txCtx,
          );

          const qty = createDecimal(data.quantity);
          let remaining = qty;

          for (const res of reservations) {
            if (remaining.lte(0)) break;
            const total = createDecimal(String(res.quantity));
            const consumed = createDecimal(String(res.consumedQty));
            const released = createDecimal(String(res.released));
            const available = total.minus(consumed).minus(released);
            if (available.lte(0)) continue;

            const toConsume = remaining.lt(available) ? remaining : available;

            // 4a. 更新 OrderReservation.consumedQty
            await reservationService.incrementConsumedQty(
              res.id,
              toPrismaDecimal(toConsume),
              txCtx,
            );

            // 4b. 减少 Inventory.reservedQty（释放预留）
            await inventoryService.release(
              {
                productId: data.productId,
                qty: Number(toConsume.toString()),
                relatedCode: data.orderId,
              },
              txCtx,
            );

            remaining = remaining.minus(toConsume);
          }
        }

        // ==================== 通用出库主流程 ====================
        const result = await inventoryService.deduct(
          {
            productId: data.productId,
            quantity: data.quantity,
            type,
            locationId: data.locationId,
            remark: data.remark,
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

        // 1. 检查同一次请求里的重复产品
        const productIds = data.items.map((i) => i.productId);
        const duplicateIds = productIds.filter(
          (id, index) => productIds.indexOf(id) !== index,
        );
        if (duplicateIds.length > 0) {
          const dupNames = [...new Set(duplicateIds)]
            .map(
              (id) => data.items.find((i) => i.productId === id)?.productName,
            )
            .join("、");
          throw createError({
            statusCode: 400,
            message: `初始化列表中存在重复产品：${dupNames}，请删除一条或合并数量后重新提交`,
          });
        }

        // 2. 检查产品是否已有任何库存记录
        for (const item of data.items) {
          const existing = await prisma.inventory.findUnique({
            where: { productId: item.productId },
            select: { id: true },
          });
          if (existing) {
            throw createError({
              statusCode: 400,
              message: `产品 [${item.productName}] 已有库存记录，不能重复初始化，请使用普通入库`,
            });
          }
        }

        // 3. 执行初始化
        const results = await inventoryService.initStock(data.items, txCtx);

        // 4. 写流水和审计
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
