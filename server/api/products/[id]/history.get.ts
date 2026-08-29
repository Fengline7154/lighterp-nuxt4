// server/api/products/[id]/history.get.ts
import { usePrisma } from "~~/server/config/prisma";
import { createAuditService } from "~~/server/services/audit.service";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "product:view");
  const id = getRouterParam(event, "id")!;

  const auditService = createAuditService(usePrisma());
  return auditService.getList({
    page: 1,
    limit: 20,
    entity: "Product",
    entityId: id,
  });
});
