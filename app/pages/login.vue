<!-- pages/login/index.vue -->
<template>
  <div class="min-h-screen flex flex-col">
    <div
      v-if="checking"
      class="fixed inset-0 z-50 flex items-center justify-center bg-white"
    >
      <div
        class="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"
      ></div>
    </div>

    <!-- 主内容占满剩余空间 -->
    <div v-else class="flex-1">
      <Loginform />
    </div>

    <!-- 备案号固定底部 -->
    <div class="text-center py-4">
      <a
        href="https://beian.miit.gov.cn/"
        target="_blank"
        rel="noopener noreferrer"
        class="text-xs text-slate-400 hover:text-slate-500 transition"
      >
        浙ICP备2026070174号-1
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import Loginform from "~/components/auth/loginform.vue";
import { restoreAuth } from "~/composables/useAuth";

definePageMeta({ layout: "blank" });

const checking = ref(true);

onMounted(async () => {
  const authed = await restoreAuth();

  if (authed) {
    await navigateTo("/dashboard");
    return;
  }

  checking.value = false;
});
</script>
