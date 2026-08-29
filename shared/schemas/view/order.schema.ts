// shared/schemas/view/order.schema.ts
import { z } from "zod";
import { paginationSchema } from "../common/pagination.schema";

// 订单列表项
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
export const orderListResponseSchema = paginationSchema(orderListItemSchema);

export type OrderListItem = z.infer<typeof orderListItemSchema>;
export type OrderListResponse = z.infer<typeof orderListResponseSchema>;
