import { z } from "zod";

export const submitProductionLogSchema = z.object({
  planId: z.string(),
  orderId: z.string(),
  productId: z.string(),
  processId: z.string().optional(),
  processName: z.string().min(1),
  completedQty: z.coerce.number().min(0),
  qualifiedQty: z.coerce.number().min(0),
  defectiveQty: z.coerce.number().min(0).default(0),
  wageType: z.enum(["HOURLY", "PIECE"]).default("HOURLY"),
  laborHours: z.coerce.number().min(0).optional(),
  hourlyRate: z.coerce.number().min(0).optional(),
  unitPrice: z.coerce.number().min(0).optional(),
  startTime: z.iso.datetime().optional(),
  endTime: z.iso.datetime().optional(),
  workerId: z.string().optional(),
  remark: z.string().optional(),
});

export const editProductionLogSchema = submitProductionLogSchema
  .partial()
  .extend({
    planId: z.string().optional(),
    orderId: z.string().optional(),
    productId: z.string().optional(),
    processName: z.string().optional(),
  });

export type SubmitProductionLogInput = z.infer<
  typeof submitProductionLogSchema
>;
export type EditProductionLogInput = z.infer<typeof editProductionLogSchema>;
