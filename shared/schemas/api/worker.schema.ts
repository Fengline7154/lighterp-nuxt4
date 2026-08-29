import { z } from "zod";
import { WorkerStatus } from "~~/prisma/generated/client";

export const createWorkerSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "姓名不能为空"),
  phone: z.string().optional(),
  idCard: z.string().optional(),
  position: z.string().optional(),
  entryDate: z.iso.datetime().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  hourlyRate: z.coerce.number().min(0).optional(),
  unitPrice: z.coerce.number().min(0).optional(),
  remark: z.string().optional(),
});

export const updateWorkerSchema = createWorkerSchema.partial().extend({
  status: z.enum(WorkerStatus).optional(),
});

export const batchCreateWorkerSchema = z.object({
  workers: z.array(createWorkerSchema).min(1, "至少需要一名员工"),
});

export type CreateWorkerInput = z.infer<typeof createWorkerSchema>;
export type UpdateWorkerInput = z.infer<typeof updateWorkerSchema>;
export type BatchCreateWorkerInput = z.infer<typeof batchCreateWorkerSchema>;
