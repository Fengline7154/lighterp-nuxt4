// composables/useAuth.ts
import { useAuthStore } from "~/stores/auth";
import {
  getAccessToken,
  setAccessToken,
  setCsrfToken,
  getCsrfToken,
  refreshAccessToken,
} from "~/composables/useApi";

// ==================== 工具函数 ====================

export const decodeJwt = (token: string): any => {
  try {
    const payload = token.split(".")[1]!;
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

export const isTokenValid = (token: string): boolean => {
  const payload = decodeJwt(token);
  if (!payload?.exp) return false;
  return Date.now() < payload.exp * 1000;
};

export const isTokenExpiringSoon = (token: string): boolean => {
  const payload = decodeJwt(token);
  if (!payload?.exp) return false;
  return Date.now() > payload.exp * 1000 - 2 * 60 * 1000;
};

// ==================== 认证状态枚举 ====================

type AuthState =
  | "AUTHENTICATED" // 已认证，直接放行
  | "TOKEN_EXPIRED" // token 过期，需要 refresh
  | "TOKEN_EXPIRING" // token 快过期，提前 refresh
  | "NO_TOKEN" // 无 token，需要 refresh
  | "USER_NOT_LOADED" // 有 token 但用户信息未加载
  | "REFRESH_FAILED" // refresh 失败
  | "LOAD_FAILED"; // loadUser 失败

// ==================== 状态判定函数 ====================

/**
 * 根据当前状态确定认证状态
 */
export const getAuthState = (): AuthState => {
  const authStore = useAuthStore();
  const token = getAccessToken();

  // 已认证：token 有效 + 用户信息已加载
  if (
    authStore.isAuthenticated &&
    authStore.isLoaded &&
    authStore.user &&
    token &&
    isTokenValid(token)
  ) {
    // token 快过期但还不算过期 → 提前刷新
    if (isTokenExpiringSoon(token)) {
      return "TOKEN_EXPIRING";
    }
    return "AUTHENTICATED";
  }

  // 有 token 但已过期 → 刷新
  if (token && !isTokenValid(token)) {
    return "TOKEN_EXPIRED";
  }

  // 无 token → 刷新
  if (!token) {
    return "NO_TOKEN";
  }

  // 有 token 但用户信息未加载 → 加载
  if (token && !authStore.isLoaded) {
    return "USER_NOT_LOADED";
  }

  // 兜底：视为已认证（token 有效但缺少某些条件）
  return "AUTHENTICATED";
};

// ==================== 动作函数 ====================

const loadUserInfo = async (): Promise<boolean> => {
  const authStore = useAuthStore();
  try {
    await authStore.loadUser();
    return authStore.isAuthenticated && authStore.isLoaded;
  } catch {
    authStore.resetState();
    return false;
  }
};

// ==================== 状态处理器映射表 ====================

const stateHandlers: Record<AuthState, () => Promise<boolean>> = {
  AUTHENTICATED: async () => true,

  TOKEN_EXPIRED: async () => {
    const authStore = useAuthStore();
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      authStore.resetState();
      return false;
    }
    return loadUserInfo();
  },

  TOKEN_EXPIRING: async () => {
    // 提前刷新，失败不影响（token 还有效）
    await refreshAccessToken();
    return true;
  },

  NO_TOKEN: async () => {
    const authStore = useAuthStore();
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      authStore.resetState();
      return false;
    }
    return loadUserInfo();
  },

  USER_NOT_LOADED: async () => {
    const authStore = useAuthStore();
    const loaded = await loadUserInfo();
    if (!loaded) {
      authStore.resetState();
      return false;
    }
    return true;
  },

  REFRESH_FAILED: async () => {
    const authStore = useAuthStore();
    authStore.resetState();
    return false;
  },

  LOAD_FAILED: async () => {
    const authStore = useAuthStore();
    authStore.resetState();
    return false;
  },
};

// ==================== 唯一入口 ====================

export const restoreAuth = async (): Promise<boolean> => {
  const state = getAuthState();
  const handler = stateHandlers[state];
  return handler();
};
