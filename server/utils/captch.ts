/**
 * 验证码生成组件，采用redis缓存map{会话id，验证码}形式
 * 以实现一对一生成以及防自动脚本
 * 添加了单次生成验证码的过期时间以及最大尝试次数
 * 若过期或尝试次数过多，则强制刷新二维码
 * 未来可在服务器端新增请求规则以防止单个ip频繁刷新验证码增加服务器负担
 */
//引入svg生成器
import svgCaptcha from "svg-captcha";
//验证码生成与redis链接工具
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
//导入Nuxt运行时配置
const config = useRuntimeConfig();
//创建 redis客户端配置
const captchaStorage = useStorage("captcha");
//验证码配置接口

interface CaptchaConfig {
  length: number; //验证码长度
  ttl: number; //过期时间（秒）
  maxAttempts: number; // 最大尝试次数
}

// 验证码存储接口
export interface CaptchaData {
  code: string; // 验证码明文（加密存储）
  attempts: number; // 已尝试次数
  createdAt: number; // 创建时间戳
}

//定义默认配置，如有需要，可自行在下方新建验证码配置
const DefaultConfig: CaptchaConfig = {
  length: 4, //
  ttl: 300,
  maxAttempts: 3,
};

/**
 * 生成会话ID并存储验证码
 * @returns 会话ID和验证码图片数据（实际项目中验证码图片由前端生成或返回base64）
 */

export async function createCaptcha() {
  const sessionId = uuidv4();
  const captcha = svgCaptcha.create({
    size: 4,
    noise: 2,
    color: true, // 启用彩色
    background: "#f0f4f8", // 浅灰蓝背景，和登录页协调
    width: 120,
    height: 44,
    fontSize: 50,
    ignoreChars: "0o1il", // 排除容易混淆的字符
  });

  const captchaCode = captcha.text;
  const captchaCodeHash = await bcrypt.hash(
    captchaCode.toLowerCase(),
    config.brcyptSalt,
  );

  // 存 Redis
  await captchaStorage.set(
    `captcha:${sessionId}`,
    { code: captchaCodeHash, attempts: 0, createdAt: Date.now() },
    { ttl: DefaultConfig.ttl },
  );

  return {
    sessionId,
    captchaSvgData: captcha.data, // 用 svgCaptcha 生成的 SVG
    expiresIn: DefaultConfig.ttl,
  };
}
/**
 * 验证验证码
 * @param sessionId 会话ID
 * @param userInput 用户输入的验证码
 * @returns 验证结果
 */

export async function verifyCaptcha(
  sessionId: string,
  userInput: string,
): Promise<{
  success: boolean;
  message: string;
  remainingAttempts?: number;
  shouldRegenerate?: boolean;
}> {
  try {
    const key = `captcha:${sessionId}`;
    const data = await captchaStorage.get(key);

    if (!data) {
      return {
        success: false,
        message: "验证码已过期,请重新输入新验证码",
        shouldRegenerate: true,
      };
    }

    const captchaData: CaptchaData =
      typeof data === "string" ? JSON.parse(data) : data;

    if (captchaData.attempts >= DefaultConfig.maxAttempts) {
      await captchaStorage.del(key);
      return {
        success: false,
        message: "尝试次数过多，请重新获取验证码",
        shouldRegenerate: true,
      };
    }

    const isvalid = await bcrypt.compare(
      userInput.toLowerCase(),
      captchaData.code,
    );

    if (isvalid) {
      await captchaStorage.del(key);
      return {
        success: true,
        message: "验证成功",
      };
    }

    // 验证失败
    captchaData.attempts += 1;
    const remainingAttempts = DefaultConfig.maxAttempts - captchaData.attempts;
    await captchaStorage.setItem(`captcha:${sessionId}`, captchaData, {
      ttl: DefaultConfig.ttl,
    });

    if (captchaData.attempts >= DefaultConfig.maxAttempts) {
      await captchaStorage.del(key);
      return {
        success: false,
        message: "尝试次数过多，请重新获取验证码",
        shouldRegenerate: true,
      };
    }

    return {
      success: false,
      message: `验证码错误，还剩${remainingAttempts}次机会`,
      remainingAttempts,
      shouldRegenerate: false,
    };
  } catch (error) {
    console.error("验证码验证失败:", error);
    return {
      success: false,
      message: "验证过程出错，请重试",
      shouldRegenerate: true,
    };
  }
}
