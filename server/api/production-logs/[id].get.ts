// server/api/production-logs/[id].get.ts
import { usePrisma } from "~~/server/config/prisma";
import { createProductionApplication } from "~~/server/application/production.application";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "production:view");

  const id = getRouterParam(event, "id")!;
  const app = createProductionApplication(usePrisma());
  return app.getLogById(id);
});
