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

    <!-- 备案号固定底部 - 同一行显示 -->
    <div
      class="py-4 px-4 border-t border-gray-100 bg-white/50 backdrop-blur-sm"
    >
      <div
        class="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs text-slate-400"
      >
        <!-- ICP备案号 -->
        <a
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-slate-600 transition-colors"
        >
          浙ICP备2026070174号-1
        </a>

        <!-- 分隔符 -->
        <span class="hidden sm:inline text-slate-300 select-none">|</span>
        <span class="sm:hidden w-8 h-px bg-slate-200"></span>

        <!-- 网安图标和备案号 -->
        <a
          href="https://beian.mps.gov.cn/#/query/webSearch?code=33082502000460"
          rel="noreferrer"
          target="_blank"
          class="flex items-center gap-1.5 hover:text-slate-600 transition-colors group"
        >
          <img
            src="/ico/beian.png"
            alt="公安联网备案"
            class="w-4 h-4 group-hover:scale-110 transition-transform"
          />
          <span>浙公网安备33082502000460号</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Loginform from "~/components/auth/loginform.vue";
import { restoreAuth } from "~/composables/useAuth";

definePageMeta({ layout: "blank" });

const checking = ref(true);

onMounted(async () => {
  // ① 先检查系统是否已初始化（覆盖所有到达 login 的路径）
  try {
    const status = await $fetch<any>("/api/setup/status");
    if (status?.needSetup) {
      await navigateTo("/setup");
      return;
    }
  } catch {
    // setup 接口失败不阻塞登录，避免 Redis/DB 抖动时卡死用户
  }

  // ② 原有认证检查
  const authed = await restoreAuth();
  if (authed) {
    await navigateTo("/dashboard");
    return;
  }

  checking.value = false;
});
</script>
