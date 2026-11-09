<template>
  <div
    v-if="!authStore.isLoaded"
    class="flex items-center justify-center py-24"
  >
    <div
      class="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"
    ></div>
    <span class="ml-3 text-sm text-slate-400">加载中...</span>
  </div>
  <DashboardAdminPanel v-else-if="role === 'admin'" />
  <DashboardWarehousePanel v-else-if="role === 'warehouseKeeper'" />
  <DashboardAccountantPanel v-else-if="role === 'accountant'" />
  <DashboardStaffPanel v-else-if="role === 'staff' || role === 'seniorStaff'" />
  <DashboardLegacyDashboard v-else />
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth" as any] });

const authStore = useAuthStore();
const role = computed(() => authStore.user?.role || "");

watch(
  () => authStore.isLoaded,
  (loaded) => {
    if (loaded && !authStore.user) {
      navigateTo("/login");
    }
  },
  { immediate: true },
);
</script>
