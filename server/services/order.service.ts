// server/services/order.service.ts
import { createOrderRepository } from "~~/server/repositories/postgres/order.repository";
import { createOrderItemRepository } from "~~/server/repositories/postgres/order-item.repository";
import { createSequenceService } from "~~/server/services/sequence.service";
import {
  createOrderSchema,
  updateOrderSchema,
  shipOrderSchema,
  changeOrderStatusSchema,
} from "~~/shared/schemas/api/order.schema";
import type { ListQueryParams } from "~~/shared/schemas/common/pagination.schema";
import type { PrismaClient } from "~~/prisma/generated/client";
import {
  createPrismaTxContext,
  type TxContext,
} from "~~/server/infrastructure/tx";
import type { RequestContext } from "~~/shared/types/request";
import { createError } from "h3";
import { createCustomerRepository } from "../repositories/postgres/customer.repository";
import { createProductRepository } from "../repositories/postgres/product.repository";
import {
  createDecimal,
  toPrismaDecimal,
} from "~~/shared/mappers/baseRepoType/decimal";
import { runInTransaction } from "~~/server/utils/transaction";

const STATUS_TRANSITIONS: Record<string, Record<string, string[]>> = {
  STANDARD: {
    PENDING: ["APPROVED", "CANCELLED"],
    APPROVED: ["PRODUCING", "READY", "CANCELLED"],
    PRODUCING: ["READY", "CANCELLED"],
    READY: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
  },
  VARIANT: {
    PENDING: ["APPROVED", "CANCELLED"],
    APPROVED: ["SAMPLING", "CANCELLED"],
    SAMPLING: ["SAMPLED", "CANCELLED"],
    SAMPLED: ["PRODUCING", "READY", "CANCELLED"],
    PRODUCING: ["READY", "CANCELLED"],
    READY: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
  },
  CUSTOM: {
    PENDING: ["APPROVED", "CANCELLED"],
    APPROVED: ["SAMPLING", "CANCELLED"],
    SAMPLING: ["SAMPLED", "CANCELLED"],
    SAMPLED: ["PRODUCING", "READY", "CANCELLED"],
    PRODUCING: ["READY", "CANCELLED"],
    READY: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
  },
};

export const createOrderService = (prisma: PrismaClient) => {
  const orderRepo = createOrderRepository(prisma);
  const orderItemRepo = createOrderItemRepository(prisma);
  const seqService = createSequenceService(prisma);
  const customerRepo = createCustomerRepository(prisma);
  const productRepo = createProductRepository(prisma);

  return {
    // ==================== 读操作 ====================

    async getOrderList(filter: Record<string, any>, options: ListQueryParams) {
      const where: any = {};

      // 权限
      if (filter.createdById) where.createdById = filter.createdById;
      if (filter.department) where.department = filter.department;

      // 状态
      if (filter.statuses?.length) where.status = { in: filter.statuses };

      // 关键词
      if (filter.keyword) {
        where.OR = [
          { orderCode: { contains: filter.keyword } },
          { customer: { name: { contains: filter.keyword } } },
          { items: { some: { productName: { contains: filter.keyword } } } },
        ];
      }

      const orderBy: any = {};
      orderBy[options.sortField || "createdAt"] = options.sortDir || "desc";

      return orderRepo.findMany(where, {
        page: options.page,
        limit: options.limit,
        orderBy,
        include: {
          items: true,
          customer: { select: { id: true, name: true } },
          creator: { select: { badgeCode: true, name: true } },
        },
      });
    },
    async findByOrderCode(orderCode: string, tx?: TxContext) {
      const client = tx?.prisma ?? prisma;
      return client.order.findFirst({
        where: { orderCode },
        select: { id: true, orderCode: true, status: true },
      });
    },

    async getOrderById(id: string) {
      const order = await orderRepo.findById(id, {
        items: true,
        customer: { select: { id: true, name: true, phone: true } },
        creator: { select: { badgeCode: true, name: true } },
      });

      if (!order) throw createError({ statusCode: 404, message: "订单不存在" });

      return {
        ...order,
        createdByBadge:
          (order as any).createdBy?.badgeCode || order.createdById,
        createdByName: (order as any).createdBy?.name || "",
        deadlineAt: order.deadlineAt?.toISOString() || null,
      };
    },
    /**
     * 获取订单信息（含工序计划，用于 PDF 打印）
     * 独立方法，避免影响其他调用方
     */
    async getOrderWithPlans(id: string) {
      const order = await orderRepo.findById(id, {
        customer: { select: { name: true } },
        items: {
          include: {
            product: {
              select: { code: true, name: true, unit: true, spec: true },
            },
          },
        },
      });

      if (!order) {
        throw createError({ statusCode: 404, message: "订单不存在" });
      }

      const orderProcessPlans = await prisma.orderProcessPlan.findMany({
        where: { orderId: id },
        orderBy: [
          { orderItemId: "asc" }, // 先按产品分组
          { sequence: "asc" }, // 再按工序顺序
        ],
        include: {
          orderItem: {
            select: { productName: true },
          },
        },
      });

      return {
        ...order,
        orderProcessPlans,
      };
    },
    // ==================== 写操作 ====================

    async createOrder(ctx: RequestContext, rawdata: unknown, tx?: TxContext) {
      const data = createOrderSchema.parse(rawdata);

      return runInTransaction(tx, prisma, async (txCtx) => {
        // 校验产品
        const productIds = data.items?.map((i) => i.productId) || [];
        if (productIds.length > 0) {
          const products = await productRepo.findActiveByIds(productIds, txCtx);
          if (products.length !== productIds.length) {
            throw createError({
              statusCode: 400,
              message: "存在无效或已停用的产品",
            });
          }
        }

        // 校验客户
        if (data.customerId) {
          const customer = await customerRepo.findActiveById(
            data.customerId,
            txCtx,
          );
          if (!customer)
            throw createError({
              statusCode: 400,
              message: "客户不存在或已停用",
            });
        }

        // 计算 totalAmount（服务层职责，全程 IDecimal）
        const totalAmount = (data.items || []).reduce((sum, item) => {
          const qty = createDecimal(item.quantity);
          const price = createDecimal(item.unitPrice);
          const lineTotal = qty.times(price);
          return sum.plus(lineTotal);
        }, createDecimal(0));

        // 创建订单
        const orderCode = await seqService.getFormattedOrderCode();
        return orderRepo.createOrder(
          {
            orderCode,
            createdById: ctx.operatorId,
            department: ctx.department || undefined,
            customerId: data.customerId,
            deadlineAt: data.deadlineAt ? new Date(data.deadlineAt) : undefined,
            orderType: data.orderType || "STANDARD",
            totalAmount: toPrismaDecimal(totalAmount),
            items: (data.items || []).map((item) => ({
              productId: item.productId,
              productName: item.productName,
              quantity: toPrismaDecimal(createDecimal(item.quantity)),
              unitPrice: toPrismaDecimal(createDecimal(item.unitPrice)),
            })),
          },
          txCtx,
        );
      });
    },

    /**
     * 更新订单信息（客户、交期、明细单价/数量、重算总金额）
     * 支持从应用层透传 tx
     */
    async updateOrder(ctx: RequestContext, rawdata: unknown, tx?: TxContext) {
      const data = updateOrderSchema.parse(rawdata);

      return runInTransaction(tx, prisma, async (txCtx) => {
        const order = await orderRepo.findById(data.orderId, undefined, txCtx);
        if (!order)
          throw createError({ statusCode: 404, message: "订单不存在" });
        if (["COMPLETED", "CANCELLED"].includes(order.status)) {
          throw createError({
            statusCode: 400,
            message: "已完成或已取消的订单不可修改",
          });
        }

        // 更新订单头
        const headerUpdate: any = {};
        if (data.customerId !== undefined) {
          if (data.customerId) {
            const customer = await customerRepo.findActiveById(
              data.customerId,
              txCtx,
            );
            if (!customer) {
              throw createError({
                statusCode: 400,
                message: "客户不存在或已停用",
              });
            }
          }
          headerUpdate.customerId = data.customerId || null;
        }
        if (data.deadlineAt !== undefined) {
          headerUpdate.deadlineAt = data.deadlineAt
            ? new Date(data.deadlineAt)
            : null;
        }
        if (Object.keys(headerUpdate).length > 0) {
          await orderRepo.updateOrder(data.orderId, headerUpdate, txCtx);
        }

        // 更新订单明细
        if (data.items?.length) {
          for (const itemData of data.items) {
            const itemUpdate: any = {};
            if (itemData.unitPrice !== undefined)
              itemUpdate.unitPrice = toPrismaDecimal(
                createDecimal(itemData.unitPrice),
              );
            if (itemData.quantity !== undefined)
              itemUpdate.quantity = toPrismaDecimal(
                createDecimal(itemData.quantity),
              );
            if (Object.keys(itemUpdate).length > 0) {
              await orderItemRepo.updateOrderItem(
                itemData.id,
                itemUpdate,
                txCtx,
              );
            }
          }
        }

        // 重算总金额（服务层职责，全程 IDecimal）
        const allItems = await orderItemRepo.findByOrderId(data.orderId, txCtx);
        const totalAmount = allItems.reduce((sum, item) => {
          const qty = createDecimal(String(item.quantity));
          const price = createDecimal(String(item.unitPrice));
          return sum.plus(qty.times(price));
        }, createDecimal(0));
        await orderRepo.updateOrder(
          data.orderId,
          { totalAmount: toPrismaDecimal(totalAmount) },
          txCtx,
        );

        return orderRepo.findById(data.orderId, { items: true }, txCtx);
      });
    },

    // 订单状态改变
    async changeStatus(ctx: RequestContext, rawdata: unknown, tx?: TxContext) {
      const data = changeOrderStatusSchema.parse(rawdata);
      const id = data.orderId;
      const order = await orderRepo.findById(id, undefined, tx);
      if (!order) throw createError({ statusCode: 404, message: "订单不存在" });

      const allowed = STATUS_TRANSITIONS[order.orderType]?.[order.status] || [];
      if (!allowed.includes(data.status)) {
        throw createError({
          statusCode: 400,
          message: `不允许从 ${order.status} 变更到 ${data.status}`,
        });
      }

      return orderRepo.updateOrder(id, { status: data.status }, tx);
    },

    // 订单发货
    async shipOrder(ctx: RequestContext, rawdata: unknown, tx?: TxContext) {
      const data = shipOrderSchema.parse(rawdata);

      return runInTransaction(tx, prisma, async (txCtx) => {
        const order = await orderRepo.findById(data.orderId, undefined, txCtx);
        if (!order)
          throw createError({ statusCode: 404, message: "订单不存在" });
        if (!["APPROVED", "PRODUCING", "READY"].includes(order.status)) {
          throw createError({
            statusCode: 400,
            message: "当前订单状态不允许发货",
          });
        }

        for (const item of data.items) {
          const quantity = createDecimal(item.quantity);
          const orderItem = await (txCtx.prisma as any).orderItem.findUnique({
            where: { id: item.orderItemId },
          });
          if (!orderItem || orderItem.orderId !== data.orderId) {
            throw createError({ statusCode: 400, message: "订单明细不匹配" });
          }

          const currentShipped = createDecimal(
            String(orderItem.shippedQuantity),
          );
          const newShipped = currentShipped.plus(quantity);
          const maxQty = createDecimal(String(orderItem.quantity));

          if (newShipped.gt(maxQty)) {
            throw createError({
              statusCode: 400,
              message: `${orderItem.productName} 发货数量超限`,
            });
          }

          await (txCtx.prisma as any).orderItem.update({
            where: { id: orderItem.id },
            data: { shippedQuantity: toPrismaDecimal(newShipped) },
          });
        }
      });
    },
  };
};
