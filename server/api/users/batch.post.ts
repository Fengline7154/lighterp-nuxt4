import { usePrisma } from "~~/server/config/prisma";
import { createUserApplication } from "~~/server/application/user.application";
import { requirePermission } from "~~/server/utils/requirePermission";
import { buildRequestContext } from "~~/server/utils/buildRequestContext";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "user:create");

  const ctx = buildRequestContext(event);
  const body = await readBody(event);

  const app = createUserApplication(usePrisma());
  return await app.batchCreateUsers(ctx, body);
});
