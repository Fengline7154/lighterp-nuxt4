<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100 p-4">
    <div
      v-if="!showSuccess"
      class="bg-white rounded-2xl shadow-lg p-6 lg:p-8 w-full max-w-md"
    >
      <h1 class="text-xl font-bold mb-2">系统初始化</h1>
      <p class="text-sm text-slate-500 mb-6">
        检测到系统中没有用户，请设置管理员信息。
      </p>

      <form @submit.prevent="handleSubmit">
        <!-- 初始化密钥 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">
            初始化密钥 <span class="text-red-500">*</span>
          </label>
          <input
            v-model="setupSecret"
            type="password"
            autocomplete="off"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            placeholder="请输入部署时配置的初始化密钥"
            required
          />
        </div>

        <!-- 管理员名称 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">
            管理员名称 <span class="text-red-500">*</span>
          </label>
          <input
            v-model="name"
            type="text"
            autocomplete="off"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            placeholder="如：张厂长"
            required
          />
        </div>

        <!-- 邮箱（可选） -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">
            邮箱 <span class="text-slate-400 text-xs">(可选)</span>
          </label>
          <input
            v-model="email"
            type="email"
            autocomplete="off"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            placeholder="用于登录或找回密码"
          />
        </div>

        <!-- 手机号（可选） -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">
            手机号 <span class="text-slate-400 text-xs">(可选)</span>
          </label>
          <input
            v-model="phone"
            type="tel"
            autocomplete="off"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            placeholder="用于登录或找回密码"
          />
        </div>

        <!-- 密码 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">
            管理员密码 <span class="text-red-500">*</span>
          </label>
          <input
            v-model="password"
            type="password"
            autocomplete="new-password"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            placeholder="至少8位，含大小写字母、数字和特殊字符"
            required
          />
        </div>

        <!-- 确认密码 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">
            确认密码 <span class="text-red-500">*</span>
          </label>
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

    <!-- 成功页 -->
    <div
      v-else
      class="bg-white rounded-2xl shadow-lg p-6 lg:p-8 w-full max-w-md text-center"
    >
      <div class="text-green-500 text-5xl mb-4">✓</div>
      <h2 class="text-lg font-bold mb-2">管理员账户创建成功</h2>
      <p class="text-sm text-slate-500 mb-2">请妥善保管以下登录信息</p>
      <div class="bg-slate-50 rounded-lg p-4 mb-6 text-left text-sm space-y-2">
        <div>
          <span class="text-slate-400">账号：</span>
          <span class="font-mono font-medium">{{
            createdEmail || "未设置"
          }}</span>
        </div>
        <div>
          <span class="text-slate-400">名称：</span>
          <span class="font-mono font-medium">{{ createdName }}</span>
        </div>
        <div>
          <span class="text-slate-400">密码：</span>
          <span class="font-mono font-medium">{{ createdPassword }}</span>
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

const setupSecret = ref("");
const name = ref("");
const email = ref("");
const phone = ref("");
const password = ref("");
const confirmPassword = ref("");
const error = ref("");
const loading = ref(false);
const showSuccess = ref(false);

const createdName = ref("");
const createdEmail = ref("");
const createdPassword = ref("");

onMounted(async () => {
  try {
    const res = await $fetch<any>("/api/setup/status");
    if (!res?.needSetup) await navigateTo("/login");
  } catch {
    // 忽略错误，允许停留在初始化页
  }
});

const handleSubmit = async () => {
  error.value = "";

  if (!setupSecret.value.trim()) {
    error.value = "请输入初始化密钥";
    return;
  }
  if (!name.value.trim()) {
    error.value = "请输入管理员名称";
    return;
  }
  if (password.value !== confirmPassword.value) {
    error.value = "两次密码不一致";
    return;
  }

  loading.value = true;
  try {
    await $fetch("/api/setup/init", {
      method: "POST",
      body: {
        setupSecret: setupSecret.value.trim(),
        name: name.value.trim(),
        email: email.value.trim() || undefined,
        phone: phone.value.trim() || undefined,
        password: password.value,
      },
    });

    createdName.value = name.value.trim();
    createdEmail.value = email.value.trim() || "未设置";
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
