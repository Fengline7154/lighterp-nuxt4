<!-- pages/login/index.vue -->
<template>
  <!-- 页面级遮罩 -->
  <div
    v-if="authStore.loading"
    class="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm"
  >
    <div class="text-center">
      <div
        class="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent mx-auto mb-3"
      ></div>
      <p class="text-sm text-slate-500">正在登录...</p>
    </div>
  </div>
  <div
    class="bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4"
  >
    <div
      class="w-full max-w-6xl bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-blue-100/50"
    >
      <div class="flex flex-col lg:flex-row">
        <!-- 左侧科技感图形区域 -->
        <div
          class="hidden lg:flex lg:w-1/2 bg-gradient-135 from-blue-600 to-blue-400 p-12 relative overflow-hidden"
        >
          <div class="absolute inset-0">
            <div
              class="absolute top-0 left-0 w-64 h-64 bg-blue-300/20 rounded-full blur-3xl"
            ></div>
            <div
              class="absolute bottom-0 right-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"
            ></div>
          </div>
          <div
            class="absolute inset-0"
            style="
              background-image:
                linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                linear-gradient(
                  90deg,
                  rgba(255, 255, 255, 0.1) 1px,
                  transparent 1px
                );
              background-size: 30px 30px;
            "
          ></div>
          <div
            class="absolute top-20 left-10 w-40 h-40 border-2 border-blue-200/30 rounded-lg rotate-45 animate-pulse"
          ></div>
          <div
            class="absolute bottom-20 right-10 w-60 h-60 border-2 border-blue-200/20 rounded-full"
          ></div>
          <div
            class="relative z-10 flex flex-col items-center justify-center h-full text-white"
          >
            <div
              class="w-32 h-32 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mb-8 border border-white/20"
            >
              <svg
                class="w-16 h-16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 7C4 5.89543 4.89543 5 6 5H18C19.1046 5 20 5.89543 20 7V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V7Z"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M8 3V7"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M16 3V7"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M4 11H20"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M4 15H20"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M4 19H20"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <circle cx="12" cy="17" r="1" fill="currentColor" />
                <circle cx="12" cy="13" r="1" fill="currentColor" />
              </svg>
            </div>
            <h2 class="text-3xl font-bold mb-2">ERP管理系统</h2>
            <p class="text-blue-100 text-center">智能 · 高效 · 安全</p>
          </div>
        </div>

        <!-- 右侧登录表单 -->
        <div class="w-full lg:w-1/2 p-8 lg:p-12">
          <div class="flex justify-end mb-6">
            <button
              class="group flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all duration-300"
              @click="showQrCode = !showQrCode"
            >
              <svg
                class="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="2"
                  stroke-width="2"
                />
                <path d="M8 8H16V16H8V8Z" stroke-width="2" />
                <path d="M12 12L16 16M8 16L12 12" stroke-width="2" />
              </svg>
              <span class="text-sm text-blue-600 font-medium">{{
                showQrCode ? "使用账号登录" : "二维码登录"
              }}</span>
            </button>
          </div>

          <div v-if="!showQrCode" class="space-y-6">
            <div class="text-center lg:text-left">
              <h2 class="text-3xl font-bold text-gray-800 mb-2">欢迎回来</h2>
              <p class="text-gray-500">请登录您的账号</p>
            </div>

            <form class="space-y-5" @submit.prevent="handleSubmit">
              <!-- 账号 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >账号</label
                >
                <input
                  v-model="formData.username"
                  type="text"
                  class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="请输入账号"
                  @blur="validateField('username')"
                />
                <p v-if="errors.username" class="text-red-500 text-xs mt-1">
                  {{ errors.username }}
                </p>
              </div>

              <!-- 密码 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >密码</label
                >
                <input
                  v-model="formData.password"
                  type="password"
                  class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="请输入密码"
                  @blur="validateField('password')"
                />
                <p v-if="errors.password" class="text-red-500 text-xs mt-1">
                  {{ errors.password }}
                </p>
              </div>

              <!-- 验证码 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >验证码(不区分大小写)</label
                >
                <div class="flex flex-col sm:flex-row gap-2">
                  <input
                    v-model="formData.captcha"
                    type="text"
                    class="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="请输入验证码"
                  />
                  <div
                    class="w-full sm:w-32 h-12 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden border border-gray-200 bg-white"
                    @click="refreshCaptcha"
                  >
                    <div
                      v-html="captchaSvg"
                      class="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                    />
                  </div>
                </div>
                <p v-if="errors.captcha" class="text-red-500 text-xs mt-1">
                  {{ errors.captcha }}
                </p>
              </div>

              <!-- 协议 -->
              <div class="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="agreement"
                  v-model="formData.agreed"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label for="agreement" class="text-sm text-gray-600"
                  >我已阅读并同意<a
                    href="#"
                    class="text-blue-600 hover:underline"
                    >《用户协议》</a
                  >和<a href="#" class="text-blue-600 hover:underline"
                    >《隐私政策》</a
                  ></label
                >
              </div>

              <!-- 按钮 -->

              <button
                type="submit"
                :disabled="!formData.agreed || authStore.loading"
                :class="[
                  'w-full py-3 px-4 rounded-xl font-medium transition-all duration-300',
                  formData.agreed
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed',
                ]"
              >
                <span
                  v-if="authStore.loading"
                  class="flex items-center justify-center gap-2"
                >
                  <span
                    class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"
                  ></span>
                  登录中...
                </span>
                <span v-else>登 录</span>
              </button>

              <div class="text-center mt-4">
                <a href="#" class="text-sm text-blue-600 hover:underline"
                  >还没有账号？去注册</a
                >
              </div>
            </form>
          </div>

          <div v-else class="text-center py-12">
            <div
              class="w-48 h-48 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-2 shadow-xl mb-6"
            >
              <div
                class="w-full h-full bg-white rounded-xl flex items-center justify-center"
              >
                <div class="grid grid-cols-7 gap-0.5">
                  <div
                    v-for="i in 49"
                    :key="i"
                    class="w-2 h-2"
                    :class="Math.random() > 0.5 ? 'bg-blue-600' : 'bg-blue-200'"
                  ></div>
                </div>
              </div>
            </div>
            <h3 class="text-lg font-medium text-gray-800 mb-2">扫码登录</h3>
            <p class="text-sm text-gray-500">使用手机扫描二维码即可登录</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useCaptcha } from "~/composables/utils/useCaptcha";
const { fetchCaptcha, verifyUserCaptcha } = useCaptcha();
const toast = useToast();

const captchaSvg = ref("");
const captchaSessionId = ref("");
const captchaLoading = ref(false);

const refreshCaptcha = async () => {
  captchaLoading.value = true;
  try {
    const data = await fetchCaptcha();
    if (data) {
      captchaSvg.value = data.captchaImage;
      captchaSessionId.value = data.sessionId;
    }
  } catch {
  } finally {
    captchaLoading.value = false;
  }
};

const showQrCode = ref(false);

interface LoginForm {
  username: string;
  password: string;
  captcha: string;
  agreed: boolean;
}

const formData = reactive<LoginForm>({
  username: "",
  password: "",
  captcha: "",
  agreed: false,
});

interface FormErrors {
  username?: string;
  password?: string;
  captcha?: string;
}

const errors = reactive<FormErrors>({});

const validateField = (field: keyof LoginForm) => {
  if (field === "username") {
    errors.username =
      formData.username.length < 3 ? "账号长度不能小于3位" : undefined;
  }
  if (field === "password") {
    errors.password =
      formData.password.length < 6 ? "密码长度不能小于6位" : undefined;
  }
};

const authStore = useAuthStore();

onMounted(() => {
  refreshCaptcha();
});

const handleSubmit = async () => {
  if (!formData.agreed) {
    toast.error("请先阅读并同意用户协议");
    return;
  }

  // 前置校验（输入框级别）
  errors.username =
    formData.username.length < 3 ? "账号长度不能小于3位" : undefined;
  errors.password =
    formData.password.length < 6 ? "密码长度不能小于6位" : undefined;
  if (errors.username || errors.password) return;

  // 验证码校验
  const captchaResult = await verifyUserCaptcha(formData.captcha);
  if (!captchaResult.success) {
    errors.captcha = captchaResult.message;
    toast.error(captchaResult.message);
    if (captchaResult.shouldRegenerate) await refreshCaptcha();
    return;
  }
  errors.captcha = undefined;

  try {
    await authStore.login({
      account: formData.username,
      password: formData.password,
    });
  } catch (error: any) {
    const msg = error?.data?.message || error?.message || "登录失败";

    // 非输入框相关的错误用 toast 弹窗
    if (
      msg.includes("账号已锁定") ||
      msg.includes("已被禁用") ||
      msg.includes("账号未注册") ||
      msg.includes("尝试机会")
    ) {
      toast.error(msg);
    } else if (msg.includes("密码")) {
      errors.password = msg;
    } else {
      toast.error(msg);
    }

    await refreshCaptcha();
  }
};
</script>

<style scoped>
.bg-gradient-135 {
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%);
}
@media (max-width: 1024px) {
  .bg-gradient-135 {
    min-height: 300px;
  }
}
</style>
