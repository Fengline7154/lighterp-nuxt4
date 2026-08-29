// stores/auth.ts
import { defineStore } from "pinia";
import {
  setAccessToken,
  resetAccessToken,
  setCsrfToken,
  resetCsrfToken,
  getAccessToken,
} from "~/composables/useApi";
import { useApi } from "~/composables/useApi";

interface User {
  id: string;
  badgeCode: string;
  name: string;
  role: string;
  department: string | null;
  permissions: string[];
  lastLoginAt: string | null;
}

export const useAuthStore = defineStore(
  "auth",
  () => {
    const user = ref<User | null>(null);
    const error = ref<string | null>(null);
    const loading = ref(false);
    const isAuthenticated = ref(false);
    const isLoaded = ref(false);

    const role = computed(() => user.value?.role || "");
    const permissions = computed(() => user.value?.permissions || []);
    const hasPermission = computed(() => (perm: string) => {
      if (!user.value) return false;
      if (user.value.permissions.includes("*")) return true;
      return user.value.permissions.includes(perm);
    });
    const hasRole = computed(() => (roles: string[]) => {
      if (!user.value) return false;
      return roles.includes(user.value.role);
    });
    const lastLoginAt = computed(() => user.value?.lastLoginAt || null);

    async function login(credentials: { account: string; password: string }) {
      loading.value = true;
      try {
        const response = await $fetch<{
          success: boolean;
          user: {
            id: string;
            badgeCode: string;
            name: string;
            role: string;
            department: string | null;
            lastLoginAt?: string;
          };
          accessToken: string;
          csrfToken: string;
          expiresIn: number;
        }>("/api/auth/login", { method: "POST", body: credentials });

        setAccessToken(response.accessToken);
        setCsrfToken(response.csrfToken);
        isAuthenticated.value = true;
        error.value = null;

        const { apiFetch } = useApi();
        const me = await apiFetch<any>("/api/auth/me");
        user.value = {
          id: me.id,
          badgeCode: me.badgeCode,
          name: me.name,
          role: me.role,
          department: me.department,
          permissions: me.permissions || [],
          lastLoginAt: me.lastLoginAt || null,
        };
        isLoaded.value = true;

        await navigateTo("/dashboard");
      } catch (err: any) {
        error.value = err.data?.message || "登录失败";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function loadUser() {
      // 已加载直接返回
      if (isLoaded.value && user.value) return;

      try {
        const { apiFetch } = useApi();
        const me = await apiFetch<any>("/api/auth/me");
        user.value = {
          id: me.id,
          badgeCode: me.badgeCode,
          name: me.name,
          role: me.role,
          department: me.department,
          permissions: me.permissions || [],
          lastLoginAt: me.lastLoginAt || null,
        };
        isLoaded.value = true;
        isAuthenticated.value = true;
      } catch (err) {
        // 失败只抛异常，由 useAuth.ts 决定是否清空
        throw err;
      }
    }

    function resetState() {
      user.value = null;
      isAuthenticated.value = false;
      isLoaded.value = false;
      error.value = null;
      loading.value = false;

      resetAccessToken();
      // 不清 csrf token！Cookie 由后端管理

      if (import.meta.client) {
        localStorage.removeItem("auth-store");
      }
    }

    return {
      user,
      error,
      loading,
      isAuthenticated,
      isLoaded,
      role,
      permissions,
      hasPermission,
      hasRole,
      lastLoginAt,
      login,
      loadUser,
      resetState,
    };
  },
  {
    persist: {
      key: "auth-store",
      storage: import.meta.client ? localStorage : undefined,
      pick: ["user", "isAuthenticated", "isLoaded"],
    },
  },
);
