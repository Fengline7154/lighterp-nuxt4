// server/application/order.application.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createOrderService } from "~~/server/services/order.service";
import { createInventoryService } from "~~/server/services/inventory.service";
import { createCostService } from "~~/server/services/cost.service";
import { createProcessService } from "~~/server/services/process.service";
import { createAuditService } from "~~/server/services/audit.service";
import { createReceiptService } from "~~/server/services/receipt.service";
import { createInventoryLogService } from "~~/server/services/inventory-log.service";
import { createReservationService } from "~~/server/services/reservation.service";
import { createOrderItemService } from "~~/server/services/order-item.service";
import { createBomService } from "~~/server/services/bom.service";
import { createOrderMiscCostService } from "~~/server/services/order-misc-cost.service";
import {
  createPrismaTxContext,
  type TxContext,
} from "~~/server/infrastructure/tx";
import {
  createDecimal,
  toPrismaDecimal,
  type IDecimal,
} from "~~/shared/mappers/baseRepoType/decimal";
import type { RequestContext } from "~~/shared/types/request";
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from "~~/shared/schemas/api/order.schema";
import { createError } from "h3";
import { createInventoryLocationService } from "../services/inventory-location.service";
import { createSequenceService } from "../services/sequence.service";
import { createProductService } from "../services/product.service";
import { createCustomerService } from "../services/customer.service";

export const createOrderApplication = (prisma: PrismaClient) => {
  const orderService = createOrderService(prisma);
  const inventoryService = createInventoryService(prisma);
  const costService = createCostService(prisma);
  const processService = createProcessService(prisma);
  const auditService = createAuditService(prisma);
  const receiptService = createReceiptService(prisma);
  const invLogService = createInventoryLogService(prisma);
  const reservationService = createReservationService(prisma);
  const orderItemService = createOrderItemService(prisma);
  const bomService = createBomService(prisma);
  const invLocService = createInventoryLocationService(prisma);
  const productService = createProductService(prisma);
  const customerService = createCustomerService(prisma);
  // ==================== 公共编排函数 ====================
  // 在 order.application.ts 顶部定义类型
  //缺料警告结构化
  interface ShortageWarning {
    productId: string;
    productName: string;
    shortageQty: string;
  }

  async function reserveProducts(
    orderId: string,
    items: Array<{
      id: string;
      productId: string;
      productName: string;
      quantity: string | number;
    }>,
    reserveInputs: Record<string, number>,
    txCtx: TxContext,
  ): Promise<{ reserved: Map<string, IDecimal>; warnings: string[] }> {
    const reserved = new Map<string, IDecimal>();
    const warnings: string[] = [];

    for (const item of items) {
      const specifiedQty = createDecimal(reserveInputs[item.id] || 0);
      if (specifiedQty.lte(0)) continue;

      const demand = createDecimal(item.quantity);
      const toReserve = specifiedQty.gt(demand) ? demand : specifiedQty;

      try {
        await inventoryService.reserve(
          {
            productId: item.productId,
            qty: Number(toReserve.toString()),
            relatedCode: orderId,
          },
          txCtx,
        );
        reserved.set(item.productId, toReserve);

        await reservationService.createMany(
          [
            {
              orderId,
              orderItemId: item.id,
              productId: item.productId,
              type: "PRODUCT_RESERVE",
              quantity: toPrismaDecimal(toReserve),
            },
          ],
          txCtx,
        );
        await orderItemService.incrementFulfilledQty(
          item.id,
          toPrismaDecimal(toReserve),
          txCtx,
        );
      } catch {
        throw createError({
          statusCode: 400,
          message: `${item.productName}: 成品库存不足，可用库存小于 ${toReserve.toString()}，无法完成预留`,
        });
      }
    }

    return { reserved, warnings };
  }

  async function reserveMaterialRecursive(
    orderId: string,
    productId: string,
    demandQty: IDecimal,
    txCtx: TxContext,
    warnings: string[],
    depth: number = 0,
  ) {
    if (depth > 10 || demandQty.lte(0)) return;

    const stock = await inventoryService.getAvailableStock(productId, txCtx);
    if (!stock) {
      warnings.push(`物料 ${productId}: 无库存记录`);
      return;
    }
    if (stock.availableQty.lte(0)) {
      warnings.push(
        `物料 ${stock.productName}: 可用库存为 0，需求 ${demandQty.toString()}`,
      );
      return;
    }

    // 先预留当前层级产品
    const toReserve = stock.availableQty.lt(demandQty)
      ? stock.availableQty
      : demandQty;

    try {
      await inventoryService.reserve(
        {
          productId,
          qty: Number(toReserve.toString()),
          relatedCode: orderId,
        },
        txCtx,
      );
      await reservationService.createMany(
        [
          {
            orderId,
            productId,
            type: "MATERIAL_RESERVE",
            quantity: toPrismaDecimal(toReserve),
          },
        ],
        txCtx,
      );
    } catch {
      warnings.push(
        `物料 ${stock.productName}: 预留失败，需求 ${demandQty.toString()}`,
      );
      return;
    }

    // 如果预留量不足，剩余需求向下展开
    const remaining = demandQty.minus(toReserve);
    if (remaining.lte(0)) return;

    // 查当前产品的 BOM
    const bom = await bomService.findActiveByProductId(productId, txCtx);
    if (!bom) {
      if (toReserve.lt(demandQty)) {
        const shortage = demandQty.minus(toReserve);
        warnings.push(
          `物料 ${stock.productName}: 预留不足，需求 ${demandQty.toString()}，实际预留 ${toReserve.toString()}，缺 ${shortage.toString()}`,
        );
      }
      return;
    }

    // 向下展开：对每个子物料按比例计算剩余需求
    for (const item of bom.items) {
      const childDemand = createDecimal(String(item.quantity)).times(remaining);
      await reserveMaterialRecursive(
        orderId,
        item.materialId,
        childDemand,
        txCtx,
        warnings,
        depth + 1,
      );
    }
  }

  async function releaseAllReservations(orderId: string, txCtx: TxContext) {
    const result = await reservationService.findByOrderId(orderId, txCtx);

    for (const res of result.data) {
      const qty = createDecimal(String(res.quantity));
      const consumed = createDecimal(String(res.consumedQty));
      const released = createDecimal(String(res.released));
      const remaining = qty.minus(consumed).minus(released);

      if (remaining.lte(0)) continue;

      const stock = await inventoryService.getAvailableStock(
        res.productId,
        txCtx,
      );
      if (!stock) continue;

      if (res.type === "PRODUCT_RESERVE" || res.type === "MATERIAL_RESERVE") {
        const currentReserved = createDecimal(String(stock.reservedQty));
        const actual = remaining.lt(currentReserved)
          ? remaining
          : currentReserved;
        if (actual.gt(0)) {
          await inventoryService.release(
            {
              productId: res.productId,
              qty: Number(actual.toString()),
              relatedCode: orderId,
            },
            txCtx,
          );
        }
      }

      await reservationService.incrementReleased(
        res.id,
        toPrismaDecimal(remaining),
        txCtx,
      );
    }
  }
  async function backflushRecursive(
    orderId: string,
    productId: string,
    demandQty: IDecimal,
    txCtx: TxContext,
    warnings: Array<string | ShortageWarning>,
    depth: number,
  ) {
    if (depth > 10 || demandQty.lte(0)) return;

    // 1. 先消耗预留，同时扣真实库存
    const reservations = await reservationService.findUnconsumed(
      orderId,
      productId,
      "MATERIAL_RESERVE",
      txCtx,
    );

    let remaining = demandQty;
    for (const res of reservations) {
      if (remaining.lte(0)) break;
      const total = createDecimal(String(res.quantity));
      const consumed = createDecimal(String(res.consumedQty));
      const released = createDecimal(String(res.released));
      const available = total.minus(consumed).minus(released);
      if (available.lte(0)) continue;

      const toConsume = remaining.lt(available) ? remaining : available;

      // 1a. 更新 OrderReservation.consumedQty
      await reservationService.incrementConsumedQty(
        res.id,
        toPrismaDecimal(toConsume),
        txCtx,
      );

      // 1b. 释放库存预留 + 扣减真实库存（一次更新，避免乐观锁冲突）
      await prisma.inventory.update({
        where: { productId },
        data: {
          reservedQty: { decrement: toConsume.toString() },
          quantity: { decrement: toConsume.toString() },
        },
      });

      // 1c. 同步扣减区域库存（优先扣库存最多的区域）
      await deductFromLocations(productId, toConsume, txCtx);

      remaining = remaining.minus(toConsume);
    }

    if (remaining.lte(0)) return;

    // 2. 预留不够，扣剩余库存（直接更新总库存）
    const inv = await prisma.inventory.findUnique({
      where: { productId },
      select: { quantity: true, productName: true },
    });

    if (inv) {
      const totalQty = createDecimal(String(inv.quantity));
      const toDeduct = totalQty.lt(remaining) ? totalQty : remaining;

      if (toDeduct.gt(0)) {
        await prisma.inventory.update({
          where: { productId },
          data: { quantity: { decrement: toDeduct.toString() } },
        });

        // 同步扣减区域库存
        await deductFromLocations(productId, toDeduct, txCtx);

        remaining = remaining.minus(toDeduct);
      }

      // 总库存不够，记录缺口
      if (remaining.gt(0)) {
        warnings.push({
          productId,
          productName: inv.productName || productId,
          shortageQty: remaining.toString(),
        });
        return;
      }
    } else {
      warnings.push({
        productId,
        productName: productId,
        shortageQty: remaining.toString(),
      });
      return;
    }

    if (remaining.lte(0)) return;

    // 3. 库存不够，向下展开
    const bom = await bomService.findActiveByProductId(productId, txCtx);
    if (!bom) return;

    for (const bomItem of bom.items) {
      const childDemand = createDecimal(String(bomItem.quantity)).times(
        remaining,
      );
      await backflushRecursive(
        orderId,
        bomItem.materialId,
        childDemand,
        txCtx,
        warnings,
        depth + 1,
      );
    }
  }

  /** 按库存从多到少扣减区域库存 */
  async function deductFromLocations(
    productId: string,
    quantity: IDecimal,
    txCtx: TxContext,
  ) {
    const inventoryLocations = await prisma.inventoryLocation.findMany({
      where: { productId, quantity: { gt: 0 } },
      orderBy: { quantity: "desc" },
    });

    let remainingToDeduct = quantity;
    for (const loc of inventoryLocations) {
      if (remainingToDeduct.lte(0)) break;

      const locQty = createDecimal(String(loc.quantity));
      const deductFromLoc = locQty.lt(remainingToDeduct)
        ? locQty
        : remainingToDeduct;

      await prisma.inventoryLocation.update({
        where: { id: loc.id },
        data: { quantity: { decrement: deductFromLoc.toString() } },
      });

      remainingToDeduct = remainingToDeduct.minus(deductFromLoc);
    }
  }
  // ==================== 状态转移处理器 ====================

  async function handlePendingToApproved(
    ctx: RequestContext,
    order: any,
    data: any,
    txCtx: TxContext,
  ) {
    const warnings: string[] = [];

    await bomService.snapshotToOrderItems(
      order.items.map((i: any) => ({ id: i.id, productId: i.productId })),
      txCtx,
    );

    const reserveInputs: Record<string, number> = {};
    if (data.reservations) {
      for (const r of data.reservations)
        reserveInputs[r.orderItemId] = r.quantity;
    }

    const { reserved: productReserved, warnings: productWarnings } =
      await reserveProducts(order.id, order.items, reserveInputs, txCtx);
    warnings.push(...productWarnings);

    for (const item of order.items) {
      const totalDemand = createDecimal(item.quantity);
      const productReservedQty =
        productReserved.get(item.productId) || createDecimal(0);
      const remainingDemand = totalDemand.minus(productReservedQty);
      if (remainingDemand.lte(0)) continue;

      const bom = await bomService.findActiveByProductId(item.productId, txCtx);
      if (!bom) continue;

      // 从 BOM 直接子物料开始递归预留（半成品优先，不够向下展开原料）
      for (const bomItem of bom.items) {
        const childDemand = createDecimal(String(bomItem.quantity)).times(
          remainingDemand,
        );
        await reserveMaterialRecursive(
          order.id,
          bomItem.materialId,
          childDemand,
          txCtx,
          warnings,
        );
      }
    }

    // 4. 标准品审批通过后生成工序计划（变型品/定制品在 SAMPLED→PRODUCING 时生成）
    if (order.orderType === "STANDARD") {
      await processService.generateOrderPlans(
        order.id,
        order.items.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          quantity: Number(item.quantity),
        })),
        txCtx,
      );
    }

    await auditService.log(ctx.operatorId, "Order", order.id, "APPROVE", {
      field: "status",
      oldValue: "PENDING",
      newValue: "APPROVED",
      remark:
        `订单 ${order.orderCode} 审批通过` +
        (warnings.length > 0 ? `，缺料预警: ${warnings.join("; ")}` : ""),
    });

    return warnings;
  }

  async function handlePendingToCancelled(
    ctx: RequestContext,
    order: any,
    _data: any,
    txCtx: TxContext,
  ) {
    await auditService.log(ctx.operatorId, "Order", order.id, "CANCEL", {
      field: "status",
      oldValue: "PENDING",
      newValue: "CANCELLED",
      remark: `订单 ${order.orderCode} 已取消`,
    });
  }

  async function handleApprovedToProducing(
    ctx: RequestContext,
    order: any,
    _data: any,
    txCtx: TxContext,
  ) {
    await processService.generateOrderPlans(
      order.id,
      order.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        quantity: Number(item.quantity),
      })),
      txCtx,
    );

    await auditService.log(
      ctx.operatorId,
      "Order",
      order.id,
      "START_PRODUCTION",
      {
        field: "status",
        oldValue: "APPROVED",
        newValue: "PRODUCING",
        remark: `订单 ${order.orderCode} 开始生产`,
      },
    );
  }

  async function handleApprovedToReady(
    ctx: RequestContext,
    order: any,
    _data: any,
    txCtx: TxContext,
  ) {
    const unfulfilledItems = order.items.filter((item: any) => {
      return Number(item.fulfilledQuantity) < Number(item.quantity);
    });

    if (unfulfilledItems.length > 0) {
      const msg = unfulfilledItems
        .map(
          (i: any) => `${i.productName}: ${i.fulfilledQuantity}/${i.quantity}`,
        )
        .join("，");
      throw createError({
        statusCode: 400,
        message: `以下明细尚未满足，无法标记齐备：${msg}`,
      });
    }

    await auditService.log(ctx.operatorId, "Order", order.id, "MARK_READY", {
      field: "status",
      oldValue: "APPROVED",
      newValue: "READY",
      remark: `订单 ${order.orderCode} 标记为备齐`,
    });
  }

  async function handleApprovedToCancelled(
    ctx: RequestContext,
    order: any,
    _data: any,
    txCtx: TxContext,
  ) {
    await releaseAllReservations(order.id, txCtx);

    await auditService.log(ctx.operatorId, "Order", order.id, "CANCEL", {
      field: "status",
      oldValue: "APPROVED",
      newValue: "CANCELLED",
      remark: `订单 ${order.orderCode} 已取消，已释放预留`,
    });
  }

  async function handleProducingToReady(
    ctx: RequestContext,
    order: any,
    _data: any,
    txCtx: TxContext,
  ) {
    // 检查是否所有明细已满足
    const unfulfilledItems = order.items.filter((item: any) => {
      const fulfilled = Number(item.fulfilledQuantity);
      const demand = Number(item.quantity);
      return fulfilled < demand;
    });

    if (unfulfilledItems.length > 0) {
      const msg = unfulfilledItems
        .map(
          (i: any) => `${i.productName}: ${i.fulfilledQuantity}/${i.quantity}`,
        )
        .join("，");
      throw createError({
        statusCode: 400,
        message: `以下明细尚未满足，无法标记齐备：${msg}`,
      });
    }

    await auditService.log(ctx.operatorId, "Order", order.id, "MARK_READY", {
      field: "status",
      oldValue: "PRODUCING",
      newValue: "READY",
      remark: `订单 ${order.orderCode} 标记为备齐`,
    });
  }

  async function handleProducingToCancelled(
    ctx: RequestContext,
    order: any,
    _data: any,
    txCtx: TxContext,
  ) {
    await releaseAllReservations(order.id, txCtx);

    await auditService.log(ctx.operatorId, "Order", order.id, "CANCEL", {
      field: "status",
      oldValue: "PRODUCING",
      newValue: "CANCELLED",
      remark: `订单 ${order.orderCode} 已取消，已释放预留`,
    });
  }

  async function handleSamplingToSampled(
    ctx: RequestContext,
    order: any,
    _data: any,
    txCtx: TxContext,
  ) {
    const warnings: string[] = [];

    for (const item of order.items) {
      const publishedBom = await bomService.findActiveByProductId(
        item.productId,
      );
      if (!publishedBom) {
        throw createError({
          statusCode: 400,
          message: `${item.productName} 尚未创建并发布 BOM`,
        });
      }
    }

    // 锁定 BOM 快照
    await bomService.snapshotToOrderItems(
      order.items.map((i: any) => ({ id: i.id, productId: i.productId })),
      txCtx,
    );

    // 补物料预留（从 BOM 直接子物料开始，半成品优先，不够向下展开）
    for (const item of order.items) {
      const publishedBom = await bomService.findActiveByProductId(
        item.productId,
        txCtx,
      );
      if (!publishedBom) continue;

      for (const bomItem of publishedBom.items) {
        const childDemand = createDecimal(String(bomItem.quantity)).times(
          createDecimal(item.quantity),
        );
        await reserveMaterialRecursive(
          order.id,
          bomItem.materialId,
          childDemand,
          txCtx,
          warnings,
        );
      }
    }

    await auditService.log(ctx.operatorId, "Order", order.id, "SAMPLE_DONE", {
      field: "status",
      oldValue: "SAMPLING",
      newValue: "SAMPLED",
      remark:
        `订单 ${order.orderCode} 打样完成` +
        (warnings.length > 0 ? `，缺料预警: ${warnings.join("; ")}` : ""),
    });
  }

  async function handleSamplingToCancelled(
    ctx: RequestContext,
    order: any,
    _data: any,
    txCtx: TxContext,
  ) {
    await auditService.log(ctx.operatorId, "Order", order.id, "CANCEL", {
      field: "status",
      oldValue: "SAMPLING",
      newValue: "CANCELLED",
      remark: `订单 ${order.orderCode} 已取消`,
    });
  }

  async function handleSampledToProducing(
    ctx: RequestContext,
    order: any,
    _data: any,
    txCtx: TxContext,
  ) {
    await processService.generateOrderPlans(
      order.id,
      order.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        quantity: Number(item.quantity),
      })),
      txCtx,
    );

    await auditService.log(
      ctx.operatorId,
      "Order",
      order.id,
      "START_PRODUCTION",
      {
        field: "status",
        oldValue: "SAMPLED",
        newValue: "PRODUCING",
        remark: `订单 ${order.orderCode} 开始生产`,
      },
    );
  }

  async function handleSampledToCancelled(
    ctx: RequestContext,
    order: any,
    _data: any,
    txCtx: TxContext,
  ) {
    await releaseAllReservations(order.id, txCtx);

    await auditService.log(ctx.operatorId, "Order", order.id, "CANCEL", {
      field: "status",
      oldValue: "SAMPLED",
      newValue: "CANCELLED",
      remark: `订单 ${order.orderCode} 已取消，已释放预留`,
    });
  }

  async function handleReadyToCompleted(
    ctx: RequestContext,
    order: any,
    _data: any,
    txCtx: TxContext,
  ) {
    // 检查是否全部发货完成
    const unshippedItems = order.items.filter((item: any) => {
      return Number(item.shippedQuantity || 0) < Number(item.quantity);
    });

    if (unshippedItems.length > 0) {
      const msg = unshippedItems
        .map(
          (i: any) =>
            `${i.productName}: 已发货 ${i.shippedQuantity || 0}/${i.quantity}`,
        )
        .join("，");
      throw createError({
        statusCode: 400,
        message: `以下明细尚未发货完成，无法完结订单：${msg}`,
      });
    }

    await costService.summarizeOrderCost(order.id, order.totalAmount, txCtx);

    // 释放所有残留预留（同步更新 Inventory.reservedQty）
    const result = await reservationService.findByOrderId(order.id, txCtx);
    for (const rec of result.data) {
      const qty = createDecimal(String(rec.quantity));
      const consumed = createDecimal(String(rec.consumedQty));
      const released = createDecimal(String(rec.released));
      const remaining = qty.minus(consumed).minus(released);

      if (remaining.lte(0)) continue;

      // 同步释放库存预留
      if (rec.type === "PRODUCT_RESERVE" || rec.type === "MATERIAL_RESERVE") {
        const stock = await inventoryService.getAvailableStock(
          rec.productId,
          txCtx,
        );
        if (stock) {
          const currentReserved = createDecimal(String(stock.reservedQty));
          const actual = remaining.lt(currentReserved)
            ? remaining
            : currentReserved;
          if (actual.gt(0)) {
            await inventoryService.release(
              {
                productId: rec.productId,
                qty: Number(actual.toString()),
                relatedCode: order.id,
              },
              txCtx,
            );
          }
        }
      }

      await reservationService.incrementReleased(
        rec.id,
        toPrismaDecimal(remaining),
        txCtx,
      );
    }

    await auditService.log(ctx.operatorId, "Order", order.id, "COMPLETE", {
      field: "status",
      oldValue: "READY",
      newValue: "COMPLETED",
      remark: `订单 ${order.orderCode} 已完成`,
    });
  }

  async function handleReadyToCancelled(
    ctx: RequestContext,
    order: any,
    _data: any,
    txCtx: TxContext,
  ) {
    await releaseAllReservations(order.id, txCtx);

    await auditService.log(ctx.operatorId, "Order", order.id, "CANCEL", {
      field: "status",
      oldValue: "READY",
      newValue: "CANCELLED",
      remark: `订单 ${order.orderCode} 已取消，已释放预留`,
    });
  }

  // ==================== 状态转移映射表 ====================

  const handlers: Record<
    string,
    (
      ctx: RequestContext,
      order: any,
      data: any,
      txCtx: TxContext,
    ) => Promise<any>
  > = {
    "PENDING→APPROVED": handlePendingToApproved,
    "PENDING→CANCELLED": handlePendingToCancelled,
    "APPROVED→PRODUCING": handleApprovedToProducing,
    "APPROVED→READY": handleApprovedToReady,
    "APPROVED→CANCELLED": handleApprovedToCancelled,
    "PRODUCING→READY": handleProducingToReady,
    "PRODUCING→CANCELLED": handleProducingToCancelled,
    "SAMPLING→SAMPLED": handleSamplingToSampled,
    "SAMPLING→CANCELLED": handleSamplingToCancelled,
    "SAMPLED→PRODUCING": handleSampledToProducing,
    "SAMPLED→CANCELLED": handleSampledToCancelled,
    "READY→COMPLETED": handleReadyToCompleted,
    "READY→CANCELLED": handleReadyToCancelled,
    "SAMPLED→READY": handleApprovedToReady,
  };

  // ==================== 对外暴露 ====================

  return {
    async changeStatus(ctx: RequestContext, rawdata: unknown) {
      const data = updateOrderStatusSchema.parse(rawdata);

      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        const order = await orderService.getOrderById(data.orderId);
        const oldStatus = order.status;
        const newStatus = data.status;

        const updated = await orderService.changeStatus(ctx, data, txCtx);

        const key = `${oldStatus}→${newStatus}`;
        const handler = handlers[key];
        const warnings = handler ? await handler(ctx, order, data, txCtx) : [];

        await auditService.log(
          ctx.operatorId,
          "Order",
          data.orderId,
          "STATUS_CHANGE",
          {
            field: "status",
            oldValue: oldStatus,
            newValue: newStatus,
            remark: `订单 ${order.orderCode} 状态变更`,
          },
        );

        return { order: updated, warnings };
      });
    },
    async createOrder(ctx: RequestContext, rawdata: unknown) {
      const data = createOrderSchema.parse(rawdata);

      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        let finalItems = data.items || [];

        // 变型品：基于基础产品创建新产品
        if (
          data.orderType === "VARIANT" &&
          data.baseProductId &&
          data.variantProductName
        ) {
          const baseProduct = await productService.getById(data.baseProductId);
          const newProduct = await productService.create(
            ctx,
            {
              name: data.variantProductName,
              category: baseProduct.category || "FINISHED",
              unit: baseProduct.unit || "PCS",
              spec: baseProduct.spec || undefined,
            },
            txCtx,
          );
          finalItems = [
            {
              productId: newProduct.id,
              productName: newProduct.name,
              quantity: data.quantity || 1,
              unitPrice: data.unitPrice || 0,
            },
          ];
        }

        // 定制品：创建新产品
        if (data.orderType === "CUSTOM" && data.customProductName) {
          const newProduct = await productService.create(
            ctx,
            {
              name: data.customProductName,
              category: data.customProductCategory || "FINISHED",
              unit: data.customProductUnit || "PCS",
            },
            txCtx,
          );
          finalItems = [
            {
              productId: newProduct.id,
              productName: newProduct.name,
              quantity: data.quantity || 1,
              unitPrice: data.unitPrice || 0,
            },
          ];
        }

        // 校验产品
        if (finalItems.length > 0) {
          const productIds = finalItems.map((i) => i.productId);
          const products = await productService.getActiveByIds(
            productIds,
            txCtx,
          );
          if (!products || products.length !== productIds.length) {
            throw createError({
              statusCode: 400,
              message: "存在无效或已停用的产品",
            });
          }
        }

        // 校验客户
        if (data.customerId) {
          const customer = await customerService.getById(data.customerId);
          if (!customer || customer.status !== "ACTIVE") {
            throw createError({
              statusCode: 400,
              message: "客户不存在或已停用",
            });
          }
        }

        // 创建订单
        const order = await orderService.createOrder(
          ctx,
          {
            customerId: data.customerId,
            deadlineAt: data.deadlineAt,
            orderType: data.orderType || "STANDARD",
            items: finalItems,
          },
          txCtx,
        );

        // 变型品：基于基础产品克隆 BOM
        if (
          data.orderType === "VARIANT" &&
          data.baseProductId &&
          finalItems.length > 0
        ) {
          const baseBom = await bomService.findActiveByProductId(
            data.baseProductId,
          );
          if (baseBom) {
            const seqService = createSequenceService(prisma);
            const bomCode = await seqService.getFormattedBomCode();
            await bomService.cloneBom(
              ctx,
              {
                baseBomId: baseBom.id,
                bomCode,
                productId: finalItems[0]!.productId,
                bomType: "SAMPLE",
                orderId: order.id,
              },
              txCtx,
            );
          }
        }

        await auditService.log(ctx.operatorId, "Order", order.id, "CREATE", {
          remark: `创建${data.orderType === "VARIANT" ? "变型品" : data.orderType === "CUSTOM" ? "定制品" : "标准品"}订单 ${order.orderCode}`,
        });

        return order;
      });
    },

    async addReceipt(ctx: RequestContext, rawdata: unknown) {
      const { orderId, orderItemId, quantity, remark, locationId } =
        rawdata as {
          orderId: string;
          orderItemId: string;
          quantity: number;
          remark?: string;
          locationId?: string;
        };

      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        const order = await orderService.getOrderById(orderId);
        if (!["APPROVED", "PRODUCING"].includes(order.status)) {
          throw createError({
            statusCode: 400,
            message: `订单当前状态(${order.status})不允许入库`,
          });
        }

        const orderItem = await orderItemService.findByIdWithProduct(
          orderItemId,
          txCtx,
        );
        if (!orderItem || orderItem.orderId !== orderId) {
          throw createError({ statusCode: 400, message: "订单明细不匹配" });
        }

        const qty = createDecimal(quantity);
        const fulfilled = createDecimal(String(orderItem.fulfilledQuantity));
        const totalQty = createDecimal(String(orderItem.quantity));
        if (fulfilled.plus(qty).gt(totalQty)) {
          throw createError({
            statusCode: 400,
            message: `入库数量超限！需求: ${totalQty.toString()}, 已入库: ${fulfilled.toString()}, 本次: ${qty.toString()}`,
          });
        }

        // ==================== 软警告：完工数不足 ====================
        const producedQty = createDecimal(String(orderItem.producedQty || 0));
        const completionWarning = qty.gt(producedQty)
          ? `完工数 ${producedQty.toString()} 小于本次入库数 ${qty.toString()}`
          : undefined;

        // ==================== 倒冲物料消耗 ====================
        const warnings: Array<string | ShortageWarning> = [];
        if (orderItem.bomId) {
          const bom = await bomService.getById(orderItem.bomId);
          if (bom) {
            for (const bomItem of bom.items) {
              const childDemand = createDecimal(String(bomItem.quantity)).times(
                qty,
              );
              await backflushRecursive(
                orderId,
                bomItem.materialId,
                childDemand,
                txCtx,
                warnings,
                0,
              );
            }
          } else {
            warnings.push("BOM 不存在或已删除，无法倒冲物料");
          }
        }

        // ==================== 成品入库 ====================
        const receipt = await receiptService.createReceipt(
          {
            orderId,
            orderItemId,
            productId: orderItem.productId,
            quantity,
            operatorId: ctx.operatorId,
            remark,
            locationId: locationId || undefined,
          },
          txCtx,
        );

        await orderItemService.incrementFulfilledQty(
          orderItemId,
          toPrismaDecimal(qty),
          txCtx,
        );

        const stockResult = await inventoryService.addStock(
          {
            productId: orderItem.productId,
            quantity,
            type: "PRODUCTION_IN",
            locationId,
          },
          txCtx,
        );

        if (locationId) {
          await invLocService.addStock(
            orderItem.productId,
            locationId,
            toPrismaDecimal(stockResult.changedQty),
            txCtx,
          );
        }

        await invLogService.createLog(
          {
            productId: orderItem.productId,
            type: "PRODUCTION_IN",
            quantity: toPrismaDecimal(stockResult.changedQty),
            beforeQty: toPrismaDecimal(stockResult.beforeQty),
            afterQty: toPrismaDecimal(stockResult.afterQty),
            relatedCode: receipt.receiptCode,
            remark: remark || "生产入库",
            operatorId: ctx.operatorId,
          },
          txCtx,
        );

        await auditService.log(ctx.operatorId, "Order", orderId, "RECEIPT", {
          remark:
            `生产入库 ${orderItem.product?.name || orderItem.productId} ×${quantity}，单号 ${receipt.receiptCode}` +
            (completionWarning ? `，${completionWarning}` : "") +
            (warnings.length > 0 ? `，倒冲警告: ${warnings.join("; ")}` : ""),
        });

        return { receipt, warnings, completionWarning };
      });
    },
    //倒冲替代
    async replaceBomMaterials(ctx: RequestContext, rawdata: unknown) {
      const { orderItemId, replacements } = rawdata as {
        orderItemId: string;
        replacements: Array<{
          oldMaterialId: string;
          newMaterialId: string;
          newQuantity?: number; // 可选，不填默认和旧料一致
        }>;
      };

      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        // 1. 查订单明细
        const orderItem = await orderItemService.findByIdWithProduct(
          orderItemId,
          txCtx,
        );
        if (!orderItem) {
          throw createError({ statusCode: 404, message: "订单明细不存在" });
        }
        if (!orderItem.bomId) {
          throw createError({
            statusCode: 400,
            message: "该订单明细无 BOM 快照",
          });
        }

        // 1.1 查订单（用于生成 bomCode 标识）
        const order = await orderService.getOrderById(orderItem.orderId);

        // 2. 查当前 BOM
        const currentBom = await bomService.getById(orderItem.bomId);
        if (!currentBom) {
          throw createError({ statusCode: 404, message: "BOM 不存在" });
        }

        // 3. 校验替换项，并补全新用量（不填默认旧料用量）
        const currentMaterialIds = new Set(
          currentBom.items.map((i: any) => i.materialId),
        );
        const normalizedReplacements = replacements.map((r) => {
          if (!currentMaterialIds.has(r.oldMaterialId)) {
            throw createError({
              statusCode: 400,
              message: `物料 ${r.oldMaterialId} 不在当前 BOM 直接子物料中`,
            });
          }
          const oldItem = currentBom.items.find(
            (i: any) => i.materialId === r.oldMaterialId,
          );
          return {
            oldMaterialId: r.oldMaterialId,
            newMaterialId: r.newMaterialId,
            newQuantity: r.newQuantity ?? Number(oldItem?.quantity || 1),
          };
        });

        // 4. 构建新 BOM items（替换指定物料，其余保留）
        const newItems = currentBom.items.map((item: any) => {
          const replacement = normalizedReplacements.find(
            (r) => r.oldMaterialId === item.materialId,
          );
          if (replacement) {
            return {
              materialId: replacement.newMaterialId,
              materialName: "",
              quantity: toPrismaDecimal(createDecimal(replacement.newQuantity)),
              unit: item.unit,
              scrapRate:
                item.scrapRate != null ? String(item.scrapRate) : undefined,
            };
          }
          return {
            materialId: item.materialId,
            materialName: item.materialName,
            quantity: String(item.quantity),
            unit: item.unit,
            scrapRate:
              item.scrapRate != null ? String(item.scrapRate) : undefined,
          };
        });

        // 补全新物料名称
        for (const item of newItems) {
          if (!item.materialName) {
            const product = await prisma.product.findUnique({
              where: { id: item.materialId },
              select: { name: true },
            });
            item.materialName = product?.name || item.materialId;
          }
        }

        // 5. 判断是否已经有订单专用 BOM
        const isCustomBom =
          currentBom.bomType === "CUSTOM" &&
          currentBom.orderId === orderItem.orderId;

        let newBom;

        if (isCustomBom) {
          // 已经有订单专用 BOM，直接替换 items
          await bomService.replaceItems(currentBom.id, newItems, txCtx);
          newBom = currentBom;
        } else {
          // 第一次换料，克隆新 BOM
          const newBomCode = `${currentBom.bomCode}-${order.orderCode}-ALT`;
          newBom = await bomService.cloneBom(
            ctx,
            {
              baseBomId: currentBom.id,
              bomCode: newBomCode,
              productId: currentBom.productId,
              bomType: "CUSTOM",
              orderId: orderItem.orderId,
            },
            txCtx,
          );

          // 替换新 BOM 的 items
          await bomService.replaceItems(newBom.id, newItems, txCtx);

          // 更新订单明细的 BOM 快照
          await orderItemService.snapshotBom(
            orderItemId,
            newBom.id,
            newBom.version,
            txCtx,
          );
        }
        // 8. 计算未完工数
        const totalQty = createDecimal(String(orderItem.quantity));
        const fulfilledQty = createDecimal(String(orderItem.fulfilledQuantity));
        const remainingQty = totalQty.minus(fulfilledQty);

        // 9. 释放旧料未消耗预留
        for (const r of normalizedReplacements) {
          const reservations = await reservationService.findUnconsumed(
            orderItem.orderId,
            r.oldMaterialId,
            "MATERIAL_RESERVE",
            txCtx,
          );
          for (const res of reservations) {
            const total = createDecimal(String(res.quantity));
            const consumed = createDecimal(String(res.consumedQty));
            const released = createDecimal(String(res.released));
            const available = total.minus(consumed).minus(released);
            if (available.lte(0)) continue;

            const toRelease = available.lt(remainingQty)
              ? available
              : remainingQty;
            if (toRelease.lte(0)) continue;

            await reservationService.incrementReleased(
              res.id,
              toPrismaDecimal(toRelease),
              txCtx,
            );
            await inventoryService.release(
              {
                productId: r.oldMaterialId,
                qty: Number(toRelease.toString()),
                relatedCode: orderItem.orderId,
              },
              txCtx,
            );
          }
        }

        // 10. 预留新料（软处理，库存不够不阻断）
        const warnings: string[] = [];
        for (const r of normalizedReplacements) {
          const demandQty = createDecimal(r.newQuantity).times(remainingQty);
          await reserveMaterialRecursive(
            orderItem.orderId,
            r.newMaterialId,
            demandQty,
            txCtx,
            warnings,
          );
        }

        // 11. 审计
        await auditService.log(
          ctx.operatorId,
          "Order",
          orderItem.orderId,
          "BOM_REPLACE",
          {
            remark: `订单明细 ${orderItem.productName} 更换 BOM 物料：${normalizedReplacements
              .map(
                (r) =>
                  `${r.oldMaterialId} → ${r.newMaterialId} ×${r.newQuantity}`,
              )
              .join("; ")}`,
          },
        );

        return { newBomId: newBom.id, newBomcode: newBom.BomCode, warnings };
      });
    },
    async shipOrder(ctx: RequestContext, rawdata: unknown) {
      const { orderId, items } = rawdata as {
        orderId: string;
        items: Array<{ orderItemId: string; quantity: number }>;
      };

      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        const order = await orderService.getOrderById(orderId);
        if (!["APPROVED", "PRODUCING", "READY"].includes(order.status)) {
          throw createError({
            statusCode: 400,
            message: "当前订单状态不允许发货",
          });
        }

        for (const shipment of items) {
          const qty = createDecimal(shipment.quantity);
          if (qty.lte(0)) continue;

          const orderItem = await orderItemService.findByIdWithProduct(
            shipment.orderItemId,
            txCtx,
          );
          if (!orderItem || orderItem.orderId !== orderId) {
            throw createError({ statusCode: 400, message: "订单明细不匹配" });
          }

          const currentShipped = createDecimal(
            String(orderItem.shippedQuantity || 0),
          );
          const maxQty = createDecimal(String(orderItem.quantity));
          if (currentShipped.plus(qty).gt(maxQty)) {
            throw createError({
              statusCode: 400,
              message: `${orderItem.productName} 发货数量超限`,
            });
          }
          const fulfilledQty = createDecimal(
            String(orderItem.fulfilledQuantity),
          );
          if (currentShipped.plus(qty).gt(fulfilledQty)) {
            throw createError({
              statusCode: 400,
              message: `发货数量超过入库量！已入库: ${fulfilledQty.toString()}，已发货: ${currentShipped.toString()}，本次: ${qty.toString()}`,
            });
          }

          // 检查可用库存（含预留）
          const stock = await inventoryService.getAvailableStock(
            orderItem.productId,
            txCtx,
          );
          if (!stock || stock.availableQty.lt(qty)) {
            throw createError({
              statusCode: 400,
              message: `${orderItem.productName} 可用库存不足`,
            });
          }

          // 1. 先释放该订单的成品预留，减少 reservedQty
          const reservations = await reservationService.findByOrderId(
            orderId,
            txCtx,
          );
          const productReservations = reservations.data.filter(
            (r: any) =>
              r.productId === orderItem.productId &&
              r.type === "PRODUCT_RESERVE",
          );

          let remaining = qty;
          for (const res of productReservations) {
            if (remaining.lte(0)) break;
            const reserved = createDecimal(String(res.quantity));
            const released = createDecimal(String(res.released));
            const available = reserved.minus(released);
            if (available.lte(0)) continue;
            const toRelease = remaining.lt(available) ? remaining : available;
            await reservationService.incrementReleased(
              res.id,
              toPrismaDecimal(toRelease),
              txCtx,
            );
            await inventoryService.release(
              {
                productId: orderItem.productId,
                qty: Number(toRelease.toString()),
                relatedCode: orderId,
              },
              txCtx,
            );
            remaining = remaining.minus(toRelease);
          }

          // 2. 扣减总库存（发货 = 出库）
          await inventoryService.deduct(
            {
              productId: orderItem.productId,
              quantity: shipment.quantity,
              type: "SALES_OUT",
            },
            txCtx,
          );

          // 3. 写流水
          const logEntry = await invLogService.createLog(
            {
              productId: orderItem.productId,
              type: "SALES_OUT",
              quantity: toPrismaDecimal(qty.negated()),
              beforeQty: "0",
              afterQty: "0",
              relatedCode: order.orderCode,
              remark: `订单 ${order.orderCode} 发货`,
              operatorId: ctx.operatorId,
            },
            txCtx,
          );

          // 4. 记成本
          await costService.recordOutboundCost(
            {
              inventoryLogId: logEntry.id,
              productId: orderItem.productId,
              quantity: toPrismaDecimal(qty),
              direction: "OUT",
              sourceType: "PRODUCTION",
              orderId,
            },
            txCtx,
          );

          // 5. 更新 shippedQuantity
          await orderItemService.incrementShippedQty(
            shipment.orderItemId,
            toPrismaDecimal(qty),
            txCtx,
          );

          await auditService.log(ctx.operatorId, "Order", orderId, "SHIP", {
            remark: `发货 ${orderItem.productName} ×${shipment.quantity}`,
          });
        }

        const updatedOrder = await orderService.getOrderById(orderId);
        const allShipped = updatedOrder.items.every((i: any) =>
          createDecimal(String(i.shippedQuantity || 0)).gte(
            createDecimal(String(i.quantity)),
          ),
        );
        if (allShipped && updatedOrder.status === "READY") {
          await orderService.changeStatus(
            ctx,
            { id: orderId, status: "COMPLETED" },
            txCtx,
          );
        }

        return { success: true };
      });
    },

    async samplePick(ctx: RequestContext, rawdata: unknown) {
      const { productId, quantity, relatedCode, remark } = rawdata as {
        productId: string;
        quantity: number;
        relatedCode?: string;
        remark?: string;
      };

      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        const stockResult = await inventoryService.deduct(
          { productId, quantity, type: "SAMPLE_OUT" },
          txCtx,
        );

        const logEntry = await invLogService.createLog(
          {
            productId,
            type: "SAMPLE_OUT",
            quantity: toPrismaDecimal(stockResult.changedQty),
            beforeQty: toPrismaDecimal(stockResult.beforeQty),
            afterQty: toPrismaDecimal(stockResult.afterQty),
            relatedCode,
            remark: remark || "打样领料",
            operatorId: ctx.operatorId,
          },
          txCtx,
        );

        await costService.recordOutboundCost(
          {
            inventoryLogId: logEntry.id,
            productId,
            quantity: toPrismaDecimal(stockResult.changedQty.abs()),
            direction: "OUT",
            sourceType: "PRODUCTION",
            remark,
          },
          txCtx,
        );

        await auditService.log(
          ctx.operatorId,
          "Inventory",
          productId,
          "SAMPLE_OUT",
          {
            field: "quantity",
            oldValue: stockResult.beforeQty.toString(),
            newValue: stockResult.afterQty.toString(),
            remark: remark || "打样领料",
          },
        );

        return stockResult;
      });
    },

    async updateOrderPrice(ctx: RequestContext, rawdata: unknown) {
      const { orderId, items } = rawdata as {
        orderId: string;
        items: Array<{ id: string; unitPrice?: number; quantity?: number }>;
      };

      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        const updated = await orderService.updateOrder(
          ctx,
          { orderId, items },
          txCtx,
        );

        await auditService.log(ctx.operatorId, "Order", orderId, "UPDATE", {
          field: "items",
          remark: "修改订单价格/数量",
        });

        return updated;
      });
    },

    /** 添加杂项费用 */
    async addMiscCost(ctx: RequestContext, rawdata: unknown) {
      const { orderId, description, amount, costType } = rawdata as {
        orderId: string;
        costType: any;
        description: string;
        amount: number;
      };

      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        const miscCostService = createOrderMiscCostService(prisma);
        const cost = await miscCostService.addCost({
          costType,
          orderId,
          description,
          amount,
          operatorId: ctx.operatorId,
        });

        await auditService.log(
          ctx.operatorId,
          "Order",
          orderId,
          "MISC_COST_ADD",
          {
            remark: `添加杂项费用：${description} ¥${amount}`,
          },
        );

        return cost;
      });
    },

    /** 删除杂项费用 */
    async deleteMiscCost(ctx: RequestContext, id: string) {
      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        const miscCostService = createOrderMiscCostService(prisma);
        await miscCostService.voidCost(id, txCtx);

        await auditService.log(
          ctx.operatorId,
          "Order",
          id,
          "MISC_COST_DELETE",
          {
            remark: "删除杂项费用",
          },
        );

        return { success: true };
      });
    },

    async substituteMaterial(ctx: RequestContext, rawdata: unknown) {
      const {
        productId,
        substituteProductId,
        quantity,
        remark,
        orderId,
        orderItemId,
      } = rawdata as {
        productId: string; // 缺口物料 ID
        substituteProductId: string; // 替代料 ID
        quantity: number; // 替代数量
        remark?: string;
        orderId?: string; // 关联订单
        orderItemId?: string; // 关联订单明细
      };

      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);

        // 1. 校验替代料库存
        const stock = await inventoryService.getAvailableStock(
          substituteProductId,
          txCtx,
        );
        if (!stock || stock.availableQty.lt(createDecimal(quantity))) {
          throw createError({
            statusCode: 400,
            message: `替代料库存不足，当前可用: ${stock?.availableQty.toString() || "0"}`,
          });
        }

        // 2. 查原物料和替代料名称（用于记录冗余字段）
        const [originalProduct, substituteProduct] = await Promise.all([
          prisma.product.findUnique({
            where: { id: productId },
            select: { name: true },
          }),
          prisma.product.findUnique({
            where: { id: substituteProductId },
            select: { name: true },
          }),
        ]);

        // 3. 扣减替代料库存
        const result = await inventoryService.deduct(
          {
            productId: substituteProductId,
            quantity,
            type: "PRODUCTION_OUT",
          },
          txCtx,
        );

        // 4. 写库存流水，记录替代关系
        const logEntry = await invLogService.createLog(
          {
            productId: substituteProductId,
            type: "PRODUCTION_OUT",
            quantity: toPrismaDecimal(result.changedQty),
            beforeQty: toPrismaDecimal(result.beforeQty),
            afterQty: toPrismaDecimal(result.afterQty),
            relatedCode: productId, // 原缺口物料 ID
            remark:
              remark ||
              `替代料出库：替代 ${originalProduct?.name || productId} 缺口 ${quantity}`,
            operatorId: ctx.operatorId,
          },
          txCtx,
        );

        // 5. 记成本
        await costService.recordOutboundCost(
          {
            inventoryLogId: logEntry.id,
            productId: substituteProductId,
            quantity: toPrismaDecimal(result.changedQty.abs()),
            direction: "OUT",
            sourceType: "PRODUCTION",
            orderId,
            remark: remark || `替代 ${originalProduct?.name || productId}`,
          },
          txCtx,
        );

        // 6. 写替代记录表（用于追溯）
        await prisma.materialSubstitution.create({
          data: {
            orderId: orderId || "",
            orderItemId: orderItemId || null,
            originalProductId: productId,
            originalProductName: originalProduct?.name || productId,
            substituteProductId,
            substituteProductName:
              substituteProduct?.name || substituteProductId,
            quantity,
            operatorId: ctx.operatorId,
            remark: remark || `替代 ${originalProduct?.name || productId} 缺口`,
          },
        });

        // 7. 审计
        await auditService.log(
          ctx.operatorId,
          "Inventory",
          substituteProductId,
          "SUBSTITUTE",
          {
            field: "quantity",
            oldValue: result.beforeQty.toString(),
            newValue: result.afterQty.toString(),
            remark: `替代料出库 ${quantity}，替代物料 ${originalProduct?.name || productId}`,
          },
        );

        return { success: true };
      });
    },
  };
};
