import { z } from "zod";

export const createOrderItemSchema = z.object({
  productId: z.string().min(1, "产品ID不能为空"),
  productName: z.string().min(1, "产品名不能为空"),
  quantity: z.coerce.number().positive("数量必须大于0"),
  unitPrice: z.coerce.number().min(0, "单价不能为负数"),
});

export const createOrderSchema = z.object({
  customerId: z.string().optional(),
  items: z.array(createOrderItemSchema).optional(),
  deadlineAt: z.iso.datetime().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "APPROVED",
    "READY",
    "PRODUCING",
    "COMPLETED",
    "SAMPLING",
    "SAMPLED",
    "CANCELLED",
  ]),
});

export const addReceiptSchema = z.object({
  orderItemId: z.uuid("无效的订单明细ID"),
  quantity: z.coerce.number().positive("入库数量必须大于0"),
  remark: z.string().max(200).optional(),
});

//订单列表项
export const orderListItemSchema = z.object({
  id: z.string(),
  orderCode: z.string(),
  orderType: z.string(),
  status: z.string(),
  totalAmount: z.coerce.number(),
  createdById: z.string(),
  createdByBadge: z.string().optional(),
  createdByName: z.string().optional(),
  department: z.string().nullable(),
  customer: z.object({ id: z.string(), name: z.string() }).nullable(),
  createdAt: z.string(),
});

// 订单列表响应
export const orderListResponseSchema = z.object({
  data: z.array(orderListItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export type AddReceiptInput = z.infer<typeof addReceiptSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type OrderListItem = z.infer<typeof orderListItemSchema>;
export type OrderListResponse = z.infer<typeof orderListResponseSchema>;
