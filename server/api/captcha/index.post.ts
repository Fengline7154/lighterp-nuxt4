import { verifyCaptcha } from "~~/server/utils/captch";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { sessionId, userInput } = body;

  if (!sessionId || !userInput) {
    throw createError({
      statusCode: 400,
      message: "参数不完整",
    });
  }

  const result = await verifyCaptcha(sessionId, userInput);
  return {
    code: result.success ? 200 : 400,
    data: {
      success: result.success,
      remainingAttempts: result.remainingAttempts,
      shouldRegenerate: result.shouldRegenerate,
      message: result.message,
    },
  };
});
