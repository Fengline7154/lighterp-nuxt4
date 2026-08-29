<template>
  <div class="max-w-lg mx-auto">
    <h1 class="text-xl lg:text-2xl font-bold mb-6">个人中心</h1>

    <div class="bg-white rounded-xl shadow p-4 lg:p-6 space-y-6">
      <!-- 基本信息 -->
      <div>
        <h2 class="font-semibold text-sm text-slate-500 mb-3">基本信息</h2>
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >姓名</label
            ><input
              v-model="form.name"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >邮箱</label
            ><input
              v-model="form.email"
              type="email"
              autocomplete="off"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >手机号</label
            ><input
              v-model="form.phone"
              type="tel"
              autocomplete="off"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >当前密码
              <span class="text-red-500 text-xs"
                >（修改联系方式必填）</span
              ></label
            ><input
              v-model="form.oldPassword"
              type="password"
              autocomplete="off"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
        </div>
        <button
          @click="saveProfile"
          class="mt-3 min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
        >
          保存基本信息
        </button>
      </div>

      <!-- 修改密码 -->
      <div class="border-t pt-6">
        <h2 class="font-semibold text-sm text-slate-500 mb-3">修改密码</h2>
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >旧密码</label
            ><input
              v-model="pwd.old"
              type="password"
              autocomplete="off"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >新密码</label
            ><input
              v-model="pwd.new"
              type="password"
              autocomplete="new-password"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <div v-if="pwd.new" class="flex items-center gap-2">
            <div class="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                :class="strengthBarClass"
                class="h-full transition-all duration-300"
                :style="{ width: strengthPercent + '%' }"
              ></div>
            </div>
            <span class="text-xs" :class="strengthTextClass">{{
              strengthLabel
            }}</span>
          </div>
        </div>
        <button
          @click="savePassword"
          class="mt-3 min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
        >
          修改密码
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth" as any] });
const toast = useToast();
const { apiFetch } = useApi();
const authStore = useAuthStore();
const pwd = reactive({ old: "", new: "" });
const form = reactive({ name: "", email: "", phone: "", oldPassword: "" });

const strengthPercent = computed(() => {
  if (!pwd.new) return 0;
  let score = 0;
  if (pwd.new.length >= 8) score += 25;
  if (/[a-z]/.test(pwd.new)) score += 25;
  if (/[A-Z]/.test(pwd.new)) score += 25;
  if (/\d/.test(pwd.new) || /[^a-zA-Z\d]/.test(pwd.new)) score += 25;
  return score;
});
const strengthLabel = computed(() =>
  strengthPercent.value <= 25
    ? "弱"
    : strengthPercent.value <= 50
      ? "一般"
      : strengthPercent.value <= 75
        ? "良好"
        : "强",
);
const strengthBarClass = computed(() =>
  strengthPercent.value <= 25
    ? "bg-red-500"
    : strengthPercent.value <= 50
      ? "bg-orange-500"
      : strengthPercent.value <= 75
        ? "bg-yellow-500"
        : "bg-green-500",
);
const strengthTextClass = computed(() =>
  strengthPercent.value <= 25
    ? "text-red-500"
    : strengthPercent.value <= 50
      ? "text-orange-500"
      : strengthPercent.value <= 75
        ? "text-yellow-500"
        : "text-green-500",
);

const { data: me } = await useFetch("/api/auth/me");
if (me.value) {
  form.name = (me.value as any).name || "";
  form.email = (me.value as any).email || "";
  form.phone = (me.value as any).phone || "";
}

const saveProfile = async () => {
  const body: any = { name: form.name };

  // 脱敏值不提交
  if (form.email && !form.email.includes("*")) {
    body.email = form.email;
  }
  if (form.phone && !form.phone.includes("*")) {
    body.phone = form.phone;
  }

  // 修改联系方式时提交旧密码
  if (body.email !== undefined || body.phone !== undefined) {
    body.oldPassword = form.oldPassword;
  }

  try {
    await apiFetch("/api/profile", { method: "PATCH", body });
    toast.success("保存成功");
    form.oldPassword = "";
  } catch (e: any) {
    toast.error(e, "保存失败");
  }
};

const savePassword = async () => {
  if (!pwd.old || !pwd.new) return toast.error("请填写旧密码和新密码");
  if (pwd.new.length < 8) return toast.error("新密码长度至少8位");
  if (pwd.old === pwd.new) return toast.error("新密码不能与旧密码相同");
  let complexity = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z\d]/].filter((r) =>
    r.test(pwd.new),
  ).length;
  if (complexity < 3)
    return toast.error("密码需包含大写字母、小写字母、数字、符号中的至少三类");
  try {
    await apiFetch("/api/profile", {
      method: "PATCH",
      body: { oldPassword: pwd.old, newPassword: pwd.new },
    });
    toast.success("密码修改成功");
    pwd.old = "";
    pwd.new = "";
  } catch (e: any) {
    toast.error(e, "修改失败");
  }
};
</script>
