import { z } from "zod";
import { CustomerStatus } from "~~/prisma/generated/client";

export const createCustomerSchema = z.object({
  name: z.string().min(1, "客户名称不能为空"),
  contact: z.string().optional(),
  phone: z.string().optional(),
  email: z.email("邮箱格式不正确").optional().or(z.literal("")),
  address: z.string().optional(),
  remark: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  id: z.uuid("Customer ID无效"),
  status: z.enum(CustomerStatus).optional(),
});

export const changeStatusSchema = z.object({
  id: z.uuid("Customer ID无效"),
  status: z.enum(CustomerStatus).optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
