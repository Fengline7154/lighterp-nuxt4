import { z } from "zod";
import { WageType } from "~~/prisma/generated/client";
// 提交报工
export const submitProductionLogSchema = z.object({
  planId: z.uuid("无效的工序计划ID"),
  orderId: z.uuid("无效的订单ID"),
  productId: z.uuid("无效的产品ID").optional(),
  processId: z.uuid().optional(),
  processName: z.string().min(1, "工序名称不能为空"),
  completedQty: z.coerce.number().positive("完成数量必须大于0"),
  qualifiedQty: z.coerce.number().min(0, "合格数量不能为负"),
  defectiveQty: z.coerce.number().min(0).default(0),
  wageType: z.enum(WageType).default("HOURLY"),
  laborHours: z.coerce.number().min(0).optional(),
  hourlyRate: z.coerce.number().min(0).optional(),
  unitPrice: z.coerce.number().min(0).optional(),
  workerId: z.string().min(1, "操作工不能为空"),
  remark: z.string().max(200).optional(),
});

// 编辑报工
export const editProductionLogSchema = z.object({
  id: z.uuid("无效的ID"),
  completedQty: z.coerce.number().positive("完成数量必须大于0"),
  qualifiedQty: z.coerce.number().min(0),
  defectiveQty: z.coerce.number().min(0).default(0),
  wageType: z.enum(WageType).optional(),
  laborHours: z.coerce.number().min(0).optional(),
  hourlyRate: z.coerce.number().min(0).optional(),
  unitPrice: z.coerce.number().min(0).optional(),
  workerId: z.string().min(1, "操作工不能为空"),
  remark: z.string().max(200).optional(),
});

// 批量提交报工
export const batchSubmitSchema = z.object({
  reports: z
    .array(
      submitProductionLogSchema.omit({ workerId: true }).extend({
        workerId: z.string().min(1, "操作工不能为空"),
      }),
    )
    .min(1, "至少需要一条报工记录"),
});

// 类型导出
export type SubmitProductionLogInput = z.infer<
  typeof submitProductionLogSchema
>;
export type EditProductionLogInput = z.infer<typeof editProductionLogSchema>;
export type BatchSubmitInput = z.infer<typeof batchSubmitSchema>;
