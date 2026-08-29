import { z } from "zod";
import { id } from "zod/v4/locales";
import { OrderStatus, OrderType } from "~~/prisma/generated/client";

// 订单明细项
export const createOrderItemSchema = z.object({
  productId: z.uuid("产品ID无效"),
  productName: z.string().min(1, "产品名不能为空"),
  quantity: z.coerce.number().positive("数量必须大于0"),
  unitPrice: z.coerce.number().min(0, "单价不能为负数"),
});

// 创建订单
export const createOrderSchema = z.object({
  customerId: z.string().optional(),
  orderType: z.enum(OrderType).default("STANDARD"),
  items: z.array(createOrderItemSchema).optional(),
  deadlineAt: z.iso.datetime().optional(),
  // 变型品
  variantProductName: z.string().optional(),
  baseProductId: z.uuid().optional(),
  // 定制品
  customProductName: z.string().optional(),
  customProductCategory: z.string().optional(),
  customProductUnit: z.string().optional(),
  // 变型品/定制品共用
  quantity: z.coerce.number().positive().optional(),
  unitPrice: z.coerce.number().min(0).optional(),
});

// 更新订单状态
export const updateOrderStatusSchema = z.object({
  orderId: z.uuid(),
  status: z.enum(OrderStatus),
  reservations: z
    .array(
      z.object({
        orderItemId: z.string(),
        quantity: z.coerce.number().min(0),
      }),
    )
    .optional(),
});

// 生产入库
export const addReceiptSchema = z.object({
  orderId: z.uuid(),
  orderItemId: z.uuid("无效的订单明细ID"),
  quantity: z.coerce.number().positive("入库数量必须大于0"),
  remark: z.string().max(200).optional(),
});

// 发货
export const shipOrderSchema = z.object({
  orderId: z.uuid(),
  items: z
    .array(
      z.object({
        orderItemId: z.string(),
        quantity: z.coerce.number().positive("发货数量必须大于0"),
      }),
    )
    .min(1),
});

// 更新订单信息（客户/交期/单价）
export const updateOrderSchema = z.object({
  orderId: z.uuid(),
  customerId: z.string().nullable().optional(),
  deadlineAt: z.iso.datetime().nullable().optional(),
  items: z
    .array(
      z.object({
        id: z.string(),
        unitPrice: z.coerce.number().min(0).optional(),
        quantity: z.coerce.number().positive().optional(),
      }),
    )
    .optional(),
});

export const changeOrderStatusSchema = z.object({
  orderId: z.uuid("OrderId error"),
  status: z.enum(OrderStatus),
});

// 类型导出
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type AddReceiptInput = z.infer<typeof addReceiptSchema>;
export type ShipOrderInput = z.infer<typeof shipOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type ChangeOrderStatusInput = z.infer<typeof changeOrderStatusSchema>;
