import { codec, z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(1, "客户名称不能为空").max(100),
  contact: z.string().max(50).optional(),
  phone: z
    .string()
    .regex(/^1[3-9]\d{9}$/, "手机号格式无效")
    .optional()
    .or(z.literal("")),
  email: z.email("邮箱格式无效").optional().or(z.literal("")),
  address: z.string().max(200).optional(),
});

//客户列表项
export const customerListItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  contact: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  status: z.string(),
  createdAt: z.string(),
});
//客户列表页响应
export const customerListResponseSchema = z.object({
  data: z.array(customerListItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});
export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerListItem = z.infer<typeof customerListItemSchema>;
export type CustomerListResponse = z.infer<typeof customerListResponseSchema>;
