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

  async function reserveMaterials(
    orderId: string,
    materialMap: Map<string, IDecimal>,
    txCtx: TxContext,
  ): Promise<string[]> {
    const warnings: string[] = [];

    for (const [materialId, demand] of materialMap) {
      const stock = await inventoryService.getAvailableStock(materialId, txCtx);
      if (!stock) {
        warnings.push(`物料 ${materialId}: 无库存记录`);
        continue;
      }
      if (stock.availableQty.lte(0)) {
        warnings.push(
          `物料 ${stock.productName}: 可用库存为 0，需求 ${demand.toString()}`,
        );
        continue;
      }

      const toReserve = stock.availableQty.lt(demand)
        ? stock.availableQty
        : demand;

      try {
        await inventoryService.reserve(
          {
            productId: materialId,
            qty: Number(toReserve.toString()),
            relatedCode: orderId,
          },
          txCtx,
        );
        await reservationService.createMany(
          [
            {
              orderId,
              productId: materialId,
              type: "MATERIAL_RESERVE",
              quantity: toPrismaDecimal(toReserve),
            },
          ],
          txCtx,
        );

        if (toReserve.lt(demand)) {
          const shortage = demand.minus(toReserve);
          warnings.push(
            `物料 ${stock.productName}: 预留不足，需求 ${demand.toString()}，实际预留 ${toReserve.toString()}，缺 ${shortage.toString()}`,
          );
        }
      } catch {
        warnings.push(
          `物料 ${stock.productName}: 预留失败，需求 ${demand.toString()}`,
        );
      }
    }

    return warnings;
  }

  async function releaseAllReservations(orderId: string, txCtx: TxContext) {
    const result = await reservationService.findByOrderId(orderId, txCtx);

    for (const res of result.data) {
      const remaining = createDecimal(String(res.quantity)).minus(
        createDecimal(String(res.released)),
      );
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
      } else if (res.type === "ALLOCATE") {
        const currentAllocated = createDecimal(String(stock.allocatedQty));
        const actual = remaining.lt(currentAllocated)
          ? remaining
          : currentAllocated;
        if (actual.gt(0)) {
          await inventoryService.markAllocated(
            res.productId,
            actual.negated(),
            stock.lockVersion,
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
      const publishedBom = await bomService.findActiveByProductId(
        item.productId,
      );
      if (!publishedBom) continue;

      const totalDemand = createDecimal(item.quantity);
      const productReservedQty =
        productReserved.get(item.productId) || createDecimal(0);
      const remainingDemand = totalDemand.minus(productReservedQty);
      if (remainingDemand.lte(0)) continue;

      const materialMap = await receiptService.expandBomMaterials(
        publishedBom.id,
        remainingDemand.toString(),
        txCtx,
      );
      const materialWarnings = await reserveMaterials(
        order.id,
        materialMap,
        txCtx,
      );
      warnings.push(...materialWarnings);
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

    // 补物料预留
    for (const item of order.items) {
      const publishedBom = await bomService.findActiveByProductId(
        item.productId,
      );
      if (!publishedBom) continue;

      const materialMap = await receiptService.expandBomMaterials(
        publishedBom.id,
        Number(item.quantity),
        txCtx,
      );

      const materialWarnings = await reserveMaterials(
        order.id,
        materialMap,
        txCtx,
      );
      warnings.push(...materialWarnings);
    }

    // 缺料预警

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

    const result = await reservationService.findByOrderId(order.id, txCtx);
    for (const rec of result.data) {
      const qty = createDecimal(String(rec.quantity));
      const released = createDecimal(String(rec.released));
      if (released.lt(qty)) {
        await reservationService.incrementReleased(
          rec.id,
          toPrismaDecimal(qty.minus(released)),
          txCtx,
        );
      }
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
        // 查询本订单对该产品的预留和调配量
        const reservations = await reservationService.findByOrderId(
          orderId,
          txCtx,
        );
        const orderReserved = reservations.data
          .filter(
            (r: any) =>
              r.productId === orderItem.productId &&
              r.type === "PRODUCT_RESERVE",
          )
          .reduce((sum: IDecimal, r: any) => {
            return sum.plus(
              createDecimal(String(r.quantity)).minus(
                createDecimal(String(r.released)),
              ),
            );
          }, createDecimal(0));
        const orderAllocated = reservations.data
          .filter(
            (r: any) =>
              r.productId === orderItem.productId && r.type === "ALLOCATE",
          )
          .reduce((sum: IDecimal, r: any) => {
            return sum.plus(
              createDecimal(String(r.quantity)).minus(
                createDecimal(String(r.released)),
              ),
            );
          }, createDecimal(0));

        // 防超完工校验
        const producedQty = createDecimal(String(orderItem.producedQty || 0));
        const effectiveProduced = producedQty
          .plus(orderReserved)
          .plus(orderAllocated);

        if (fulfilled.plus(qty).gt(effectiveProduced)) {
          throw createError({
            statusCode: 400,
            message: `入库数量超限！有效完工: ${effectiveProduced.toString()}（生产 ${producedQty.toString()} + 预留 ${orderReserved.toString()} + 调配 ${orderAllocated.toString()}），已入库: ${fulfilled.toString()}，本次: ${qty.toString()}`,
          });
        }

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

        // 库位库存同步
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

        if (orderItem.bomId) {
          const materialMap = await receiptService.expandBomMaterials(
            orderItem.bomId,
            quantity,
            txCtx,
          );
          // 校验物料库存是否充足
          for (const [materialId, needed] of materialMap) {
            const stock = await inventoryService.getAvailableStock(
              materialId,
              txCtx,
            );
            const neededQty = createDecimal(needed.toString());
            if (!stock || stock.availableQty.lt(neededQty)) {
              throw createError({
                statusCode: 400,
                message: `物料库存不足，无法入库！物料: ${stock?.productName || materialId}，需要: ${neededQty.toString()}，可用: ${stock?.availableQty.toString() || "0"}`,
              });
            }
          }
          await reservationService.consumeMaterials(
            orderId,
            materialMap,
            txCtx,
          );
        }

        await auditService.log(ctx.operatorId, "Order", orderId, "RECEIPT", {
          remark: `生产入库 ${orderItem.product?.name || orderItem.productId} ×${quantity}，单号 ${receipt.receiptCode}`,
        });

        return receipt;
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
  };
};
