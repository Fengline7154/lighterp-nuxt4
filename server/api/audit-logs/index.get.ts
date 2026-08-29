import { createAuditService } from "~~/server/services/audit.service";
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "user:view");

  const query = getQuery(event);
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;

  const auditService = createAuditService(usePrisma());
  return await auditService.getList({
    page,
    limit,
    entity: query.entity as string,
    operatorId: query.operatorId as string,
    action: query.action as string,
    startDate: query.startDate as string,
    endDate: query.endDate as string,
  });
});
