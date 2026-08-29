import { z } from "zod";
import { LocationStatus } from "~~/prisma/generated/client";

export const createLocationSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "库位名称不能为空"),
  warehouse: z.string().optional(),
});

export const updateLocationSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1).optional(),
  warehouse: z.string().optional(),
  status: z.enum(LocationStatus).optional(),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
