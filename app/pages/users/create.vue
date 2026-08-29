<template>
  <div class="max-w-lg mx-auto">
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink to="/users" class="text-slate-500 hover:text-slate-700"
        >&larr; 返回</NuxtLink
      >
      <h1 class="text-xl lg:text-2xl font-bold">创建用户</h1>
    </div>

    <div class="bg-white rounded-xl shadow p-4 lg:p-6">
      <form @submit.prevent="handleCreate" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >姓名 *</label
          >
          <input
            v-model="form.name"
            required
            autocomplete="off"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >邮箱</label
          >
          <input
            v-model="form.email"
            type="email"
            autocomplete="off"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >手机号</label
          >
          <input
            v-model="form.phone"
            type="tel"
            autocomplete="off"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >密码 *</label
          >
          <input
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            required
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >确认密码 *</label
          >
          <input
            v-model="form.ckpassword"
            type="password"
            autocomplete="new-password"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            required
          />
          <p
            v-if="!checkpassword && form.ckpassword"
            class="text-xs text-red-500 mt-1"
          >
            两次密码不一致
          </p>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >角色</label
          >
          <select
            v-model="form.role"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
          >
            <option value="staff">员工</option>
            <option value="seniorStaff">高级员工</option>
            <option value="manager">经理</option>
            <option value="warehouseKeeper">仓管</option>
            <option value="accountant">财务</option>
            <option value="admin">管理员</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >部门</label
          >
          <input
            v-model="form.department"
            autocomplete="off"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>

        <!-- 自定义权限 -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >自定义权限
            <span class="text-slate-400 text-xs font-normal"
              >(可选，在角色权限基础上追加)</span
            ></label
          >
          <button
            type="button"
            @click="showPermissionPanel = !showPermissionPanel"
            class="min-h-[44px] w-full border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:text-blue-500 hover:border-blue-400 transition flex items-center justify-center gap-1"
          >
            {{ showPermissionPanel ? "收起自定义权限" : "+ 添加自定义权限" }}
          </button>
          <div
            v-if="showPermissionPanel"
            class="mt-3 space-y-3 max-h-[400px] overflow-y-auto border rounded-lg p-3"
          >
            <div
              v-for="(perms, category) in permissionCategories"
              :key="category"
              class="border-b last:border-0 pb-2 last:pb-0"
            >
              <p class="text-xs font-semibold text-slate-500 mb-1.5">
                {{ categoryLabels[category] || category }}
              </p>
              <div class="flex flex-wrap gap-2">
                <label
                  v-for="perm in perms"
                  :key="perm.value"
                  class="flex items-center gap-1.5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :value="perm.value"
                    v-model="form.customPermissions"
                    class="w-4 h-4 text-blue-600 rounded"
                  />
                  <span class="text-xs text-slate-700">{{ perm.label }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          class="w-full min-h-[48px] bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition font-medium text-sm"
        >
          创建用户
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth" as any] });
const toast = useToast();
const { apiFetch } = useApi();
const showPermissionPanel = ref(false);
const form = reactive({
  name: "",
  email: "",
  phone: "",
  password: "",
  ckpassword: "",
  role: "staff",
  department: "",
  customPermissions: [] as string[],
});

const checkpassword = computed(() => form.password === form.ckpassword);

const permissionCategories = {
  order: [
    { value: "order:view", label: "查看订单列表" },
    { value: "order:detail", label: "查看订单详情" },
    { value: "order:create", label: "创建订单" },
    { value: "order:edit", label: "编辑订单" },
    { value: "order:delete", label: "删除订单" },
    { value: "order:approve", label: "审批订单" },
    { value: "order:cancel", label: "取消订单" },
    { value: "order:ship", label: "订单发货" },
    { value: "order:export", label: "导出订单" },
    { value: "order:print", label: "打印订单" },
  ],
  inventory: [
    { value: "inventory:view", label: "查看库存" },
    { value: "inventory:adjust", label: "调整库存" },
    { value: "inventory:transfer", label: "调拨库存" },
    { value: "inventory:check", label: "盘点库存" },
    { value: "inventory:warning", label: "库存预警设置" },
    { value: "inventory:import", label: "导入库存" },
    { value: "inventory:export", label: "导出库存" },
  ],
  bom: [
    { value: "bom:view", label: "查看BOM" },
    { value: "bom:create", label: "创建BOM" },
    { value: "bom:edit", label: "编辑BOM" },
    { value: "bom:delete", label: "删除BOM" },
    { value: "bom:copy", label: "复制BOM" },
    { value: "bom:version", label: "版本管理" },
  ],
  staff: [
    { value: "staff:view", label: "查看员工" },
    { value: "staff:manage", label: "管理员工" },
    { value: "staff:schedule", label: "排班管理" },
    { value: "staff:attendance", label: "考勤管理" },
  ],
  user: [
    { value: "user:view", label: "查看用户列表" },
    { value: "user:create", label: "创建用户" },
    { value: "user:edit", label: "编辑用户" },
    { value: "user:delete", label: "删除用户" },
    { value: "user:assign-role", label: "分配角色" },
    { value: "user:reset-password", label: "重置密码" },
  ],
  data: [
    { value: "data:view-cost", label: "查看成本价" },
    { value: "data:view-profit", label: "查看利润" },
    { value: "data:view-margin", label: "查看毛利率" },
    { value: "data:view-supplier", label: "查看供应商信息" },
  ],
  report: [
    { value: "report:view", label: "查看报表" },
    { value: "report:create", label: "创建报表" },
    { value: "report:export", label: "导出报表" },
    { value: "report:view-financial", label: "查看财务报表" },
  ],
  system: [
    { value: "system:config", label: "系统配置" },
    { value: "system:log", label: "查看日志" },
    { value: "system:backup", label: "备份数据" },
    { value: "system:restore", label: "恢复数据" },
  ],
};

const categoryLabels: Record<string, string> = {
  order: "订单管理",
  inventory: "库存管理",
  bom: "BOM管理",
  staff: "人员管理",
  user: "用户管理",
  data: "敏感数据",
  report: "报表管理",
  system: "系统设置",
};

const handleCreate = async () => {
  if (!form.name.trim()) return toast.error("姓名不能为空");
  if (!form.password) return toast.error("密码不能为空");
  if (!checkpassword.value) return toast.error("两次密码不一致");

  try {
    await apiFetch("/api/users", {
      method: "POST",
      body: {
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        password: form.password,
        role: form.role,
        department: form.department || undefined,
        customPermissions:
          form.customPermissions.length > 0
            ? form.customPermissions
            : undefined,
      },
    });
    toast.success("用户创建成功");
    await navigateTo("/users");
  } catch (e: any) {
    const msg = e?.data?.message || "";
    if (msg.includes("EMAIL_ALREADY_EXISTS")) toast.error("邮箱已被注册");
    else if (msg.includes("PHONE_ALREADY_EXISTS"))
      toast.error("手机号已被注册");
    else toast.error(msg || "创建失败");
  }
};
</script>
