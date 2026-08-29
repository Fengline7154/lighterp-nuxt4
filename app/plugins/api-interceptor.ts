// plugins/auth.ts
import { defineNuxtPlugin } from "nuxt/app";
import { getAccessToken } from "../composables/useApi";

export default defineNuxtPlugin(() => {
  const originalFetch = globalThis.$fetch;

  globalThis.$fetch = ((url: string, opts: any = {}) => {
    const publicPaths = [
      "/api/setup/status",
      "/api/auth/login",
      "/api/auth/refresh",
      "/api/captcha",
    ];
    const isPublic = publicPaths.some((p) => url.includes(p));
    const token = getAccessToken();

    // 只注入 Authorization 头，不处理 401
    const headers: any = { ...opts.headers };
    if (!isPublic && token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return originalFetch(url, {
      ...opts,
      headers,
      credentials: "include",
    });
  }) as any;
});
