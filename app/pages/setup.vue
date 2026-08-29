<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100 p-4">
    <div
      v-if="!showSuccess"
      class="bg-white rounded-2xl shadow-lg p-6 lg:p-8 w-full max-w-md"
    >
      <h1 class="text-xl font-bold mb-2">系统初始化</h1>
      <p class="text-sm text-slate-500 mb-6">
        检测到系统中没有用户，请设置管理员密码。
      </p>

      <form @submit.prevent="handleSubmit">
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">管理员密码</label>
          <input
            v-model="password"
            type="password"
            autocomplete="new-password"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            placeholder="至少8位，含大小写字母、数字和特殊字符"
            required
          />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">确认密码</label>
          <input
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            placeholder="再次输入密码"
            required
          />
        </div>
        <p v-if="error" class="text-red-500 text-sm mb-4">{{ error }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="w-full min-h-[48px] bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium"
        >
          {{ loading ? "初始化中..." : "创建管理员账户" }}
        </button>
      </form>
    </div>

    <div
      v-else
      class="bg-white rounded-2xl shadow-lg p-6 lg:p-8 w-full max-w-md text-center"
    >
      <div class="text-green-500 text-5xl mb-4">✓</div>
      <h2 class="text-lg font-bold mb-2">管理员账户创建成功</h2>
      <p class="text-sm text-slate-500 mb-2">请妥善保管以下登录信息</p>
      <div class="bg-slate-50 rounded-lg p-4 mb-6 text-left text-sm space-y-2">
        <div>
          <span class="text-slate-400">账号：</span
          ><span class="font-mono font-medium">admin@localhost.com</span>
        </div>
        <div>
          <span class="text-slate-400">密码：</span
          ><span class="font-mono font-medium">{{ createdPassword }}</span>
        </div>
      </div>
      <button
        @click="goToLogin"
        class="w-full min-h-[48px] bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
      >
        前往登录
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const password = ref("");
const confirmPassword = ref("");
const error = ref("");
const loading = ref(false);
const showSuccess = ref(false);
const createdPassword = ref("");

onMounted(async () => {
  const { data } = await useFetch("/api/setup/status");
  if (!(data.value as any)?.needSetup) await navigateTo("/");
});

const handleSubmit = async () => {
  error.value = "";
  if (password.value !== confirmPassword.value) {
    error.value = "两次密码不一致";
    return;
  }
  loading.value = true;
  try {
    await $fetch("/api/setup/init", {
      method: "POST",
      body: { password: password.value },
    });
    createdPassword.value = password.value;
    showSuccess.value = true;
  } catch (e: any) {
    error.value = e?.data?.message || "初始化失败";
  } finally {
    loading.value = false;
  }
};

const goToLogin = async () => {
  await navigateTo("/login");
};
</script>
