//验证码相关的可组合函数，在页面中调用

import { useCaptchaStore } from "~/stores/captchaStore";
import { $fetch } from "ofetch";
export const useCaptcha = () => {
  const captchaStore = useCaptchaStore(); //引入pinia状态管理

  /**
   * 获取验证码
   * @returns 包含sessionId和图片数据的对象
   */

  const fetchCaptcha = async () => {
    try {
      //captcha的api符合RESTfulApi，其中post为验证，get为获取，$fetch默认方法是get
      const response = await $fetch("/api/captcha");
      if (response.code === 200) {
        //将sessionId储存在pinia中
        captchaStore.setSessionId(response.data.sessionId);
        return response.data;
      }
      throw createError({
          statusCode: 400,
          message: `${response.message}`,
        });
    } catch (error) {
      console.error("获取验证码失败", error);
      return null;
    }
  };

  /**
   * 验证用户输入的验证码
   * @param userInput 用户输入的验证码
   * @returns 验证结果
   */

  const verifyUserCaptcha = async (userInput: string) => {
    const sessionId = captchaStore.getSessionId();

    if (!sessionId) {
      return {
        success: false,
        message: "验证码已过期,请重新输入新验证码",
        shouldRegenerate: true,
      };
    }

    try {
      const response = await $fetch("/api/captcha", {
        method: "post",
        body: {
          sessionId,
          userInput,
        },
      });

      if (response.data.success) {
        captchaStore.clearSessionId();
      }

      if (response.data.shouldRegenerate) {
        await fetchCaptcha();
      }
      return response.data;
    } catch (error) {
      console.error("验证码验证失败:", error);
      return {
        success: false,
        message: "验证失败，请重试",
        shouldRegenerate: false,
      };
    }
  };

  return {
    fetchCaptcha,
    verifyUserCaptcha,
  };
};
