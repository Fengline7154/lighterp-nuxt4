// composables/useApi.ts

let accessToken: string | null = null;

export const setAccessToken = (token: string) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export const resetAccessToken = () => {
  accessToken = "";
};

let csrfToken: string | null = null;

export const setCsrfToken = (token: string) => {
  csrfToken = token;
};

export const getCsrfToken = (): string | null => {
  if (csrfToken) return csrfToken;

  if (import.meta.client) {
    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
    if (match) {
      csrfToken = match[1]!;
    }
  }
  return csrfToken;
};

export const resetCsrfToken = () => {
  csrfToken = "";
  // 不清除 Cookie！Cookie 由后端设置和清除
};

// ==================== 导出的 refresh 函数（供 useAuth.ts 使用） ====================

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * 调 refresh 接口换新 token（带并发锁）
 * @returns 是否成功
 */
export const refreshAccessToken = async (): Promise<boolean> => {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = $fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
    headers: {
      "X-CSRF-Token": getCsrfToken() || "",
    },
  })
    .then((res: any) => {
      const newToken = res?.accessToken;
      const newCsrf = res?.csrfToken;
      if (newToken) {
        setAccessToken(newToken);
        if (newCsrf) setCsrfToken(newCsrf);
        return true;
      }
      return false;
    })
    .catch(() => {
      return false;
    })
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });
  return refreshPromise;
};

// ==================== API 请求工具 ====================

export const useApi = () => {
  const apiFetch = async <T = any>(url: string, opts: any = {}): Promise<T> => {
    try {
      const response = await $fetch<T>(url, {
        ...opts,
        credentials: "include",
      });
      return response;
    } catch (error: any) {
      if (
        error?.response?.status === 401 &&
        !url.includes("/api/auth/refresh")
      ) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          const retryResponse = await $fetch<T>(url, {
            ...opts,
            credentials: "include",
          });
          return retryResponse;
        }
        // refresh 失败，跳转登录页
        if (import.meta.client) {
          await navigateTo("/login");
        }
        throw error;
      }
      throw error;
    }
  };

  return { apiFetch };
};
