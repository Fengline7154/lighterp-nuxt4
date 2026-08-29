// server/api/customers/[id].get.ts
import { createCustomerService } from "~~/server/services/customer.service";
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "customer:view");
  const id = getRouterParam(event, "id")!;
  const service = createCustomerService(usePrisma());
  return service.getById(id);
});
