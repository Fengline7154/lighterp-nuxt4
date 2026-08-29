// server/api/production-logs/index.post.ts
//该端口为单条报工接口,使用场景为根据流转单扫码报工,由于小厂一般是车间主管统一报工,故该端口目前未被使用
import { usePrisma } from "~~/server/config/prisma";
import { createProductionApplication } from "~~/server/application/production.application";
import { requirePermission } from "~~/server/utils/requirePermission";
import { buildRequestContext } from "~~/server/utils/buildRequestContext";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "production:report");

  const ctx = buildRequestContext(event);
  const body = await readBody(event);

  const app = createProductionApplication(usePrisma());
  return app.submitLog(ctx, body);
});
