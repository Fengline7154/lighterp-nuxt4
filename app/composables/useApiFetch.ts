// composables/useApiFetch.ts
import {
  getAccessToken,
  setAccessToken,
  getCsrfToken,
  setCsrfToken,
  refreshAccessToken,
} from "./useApi";

interface ApiFetchOptions {
  loading?: boolean;
  onError?: "toast" | "none";
}

export const useApiFetch = <T = any>(
  url: string | (() => string),
  opts: ApiFetchOptions = {},
) => {
  const data = ref<T | null>(null) as Ref<T | null>;
  const loading = ref(false);
  const error = ref<string | null>(null);

  const toast = useToast();

  const execute = async (query?: Record<string, any>) => {
    loading.value = true;
    error.value = null;

    const requestUrl = typeof url === "function" ? url() : url;
    const fullUrl = query
      ? `${requestUrl}?${new URLSearchParams(query as any).toString()}`
      : requestUrl;

    try {
      data.value = await $fetch<T>(fullUrl, { credentials: "include" });
    } catch (e: any) {
      if (
        e?.response?.status === 401 &&
        !requestUrl.includes("/api/auth/refresh")
      ) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          try {
            data.value = await $fetch<T>(fullUrl, { credentials: "include" });
            return;
          } catch {
            // 重试也失败
          }
        }
        error.value = "请重新登录";
        if (import.meta.client) await navigateTo("/login");
      } else {
        const msg = e?.data?.message || e?.message || "请求失败";
        error.value = msg;
        if (opts.onError !== "none") {
          toast.error(msg);
        }
      }
    } finally {
      loading.value = false;
    }
  };

  return { data, loading, error, execute };
};
