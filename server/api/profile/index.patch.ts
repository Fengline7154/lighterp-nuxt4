import { createUserService } from "~~/server/services/user.service";
import { usePrisma } from "~~/server/config/prisma";

export default defineEventHandler(async (event) => {
  const auth = event.context.auth;
  if (!auth?.user?.id) throw createError({ statusCode: 401 });

  const body = await readBody(event);
  const userService = createUserService(usePrisma());
  return userService.updateProfile(auth.user.id, body);
});
