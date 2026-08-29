import { H3Event } from "#imports";
//已弃用,直接使用nuxt自带的setCookies方法更方便,且代码量少,无需封装
export const setAuthCookies = (
  event: H3Event,
  tokens: {
    accessToken: string;
    refreshToken?: string | null;
    rememberMe?: boolean;
  },
) => {
  const { accessToken, refreshToken, rememberMe = false } = tokens;

  //设置Access Token（httpOnly,一小时）
  setCookie(event, "access_token", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60,
    path: "/",
  });
};
