// server/api/processes/index.get.ts
import { usePrisma } from "~~/server/config/prisma";
import { createProcessService } from "~~/server/services/process.service";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "process:view");

  const service = createProcessService(usePrisma());
  const processes = await service.getAllProcesses();
  return { data: processes };
});
