import { createCaptcha } from "~~/server/utils/captch";

//验证码生成端点
export default defineEventHandler(async (event) => {
  try {
    const result = await createCaptcha();
    return {
      code: 200,
      data: {
        sessionId: result.sessionId,
        captchaImage: result.captchaSvgData,
        expireIn: result.expiresIn,
      },
      message: "验证码生成成功",
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: "验证码生成失败",
    });
  }
});
