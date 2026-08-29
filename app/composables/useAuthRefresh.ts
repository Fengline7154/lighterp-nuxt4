export const useAuthRefresh = async (redirectTo?: string) => {
  try {
    await $fetch("/api/auth/me", {
      credentials: "include",
    });
    return true;
  } catch {
    try {
      await $fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      refreshNuxtData();
      if (redirectTo) {
        await navigateTo(redirectTo);
      }
      return true;
    } catch {
      return false;
    }
  }
};
