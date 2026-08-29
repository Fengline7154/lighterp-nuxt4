<template>
  <div class="max-w-2xl mx-auto">
    <div class="flex items-center gap-4 mb-6 flex-wrap">
      <NuxtLink to="/users" class="text-slate-500 hover:text-slate-700"
        >&larr; 返回</NuxtLink
      >
      <h1 class="text-xl lg:text-2xl font-bold">用户详情</h1>
      <button
        @click="editing = !editing"
        class="ml-auto min-h-[44px] px-4 py-2 border rounded-lg text-sm hover:bg-slate-50 transition"
      >
        {{ editing ? "取消" : "编辑" }}
      </button>
    </div>

    <div v-if="user" class="space-y-6">
      <!-- 查看模式 -->
      <div v-if="!editing">
        <div class="bg-white rounded-xl shadow p-4 lg:p-6">
          <h2 class="font-semibold text-sm text-slate-500 mb-3">基本信息</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Info label="工号" :value="user.badgeCode" />
            <Info label="姓名" :value="user.name" />
            <Info label="邮箱" :value="user.email || '-'" />
            <Info label="手机号" :value="user.phone || '-'" />
            <Info label="角色" :value="roleLabel(user.role)" />
            <Info label="部门" :value="user.department || '-'" />
            <Info label="状态">
              <span
                :class="statusBadge(user.status)"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
                >{{ statusIcon(user.status) }}
                {{ user.status === "ACTIVE" ? "正常" : "已禁用" }}</span
              >
            </Info>
            <Info label="创建时间" :value="formatDate(user.createdAt)" />
            <Info
              label="最后登录"
              :value="user.lastLoginAt ? formatDate(user.lastLoginAt) : '-'"
            />
          </div>
        </div>

        <div class="bg-white rounded-xl shadow p-4 lg:p-6 mt-6">
          <h2 class="font-semibold text-sm text-slate-500 mb-3">当前权限</h2>
          <div
            v-if="user.permissions?.includes('*')"
            class="text-sm text-blue-600 bg-blue-50 rounded-lg px-4 py-2 inline-block"
          >
            超级管理员（全部权限）
          </div>
          <div
            v-else-if="user.permissions?.length"
            class="flex flex-wrap gap-2"
          >
            <span
              v-for="perm in user.permissions"
              :key="perm"
              class="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs"
              >{{ permLabel(perm) || perm }}</span
            >
          </div>
          <div v-else class="text-sm text-slate-400">暂无权限</div>
        </div>

        <div class="flex gap-2 mt-6">
          <button
            v-if="user.status === 'ACTIVE'"
            @click="handleDisable"
            class="min-h-[44px] px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
          >
            禁用账号
          </button>
          <button
            v-else
            @click="handleEnable"
            class="min-h-[44px] px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
          >
            启用账号
          </button>
          <button
            @click="handleResetPassword"
            class="min-h-[44px] px-4 py-2 border border-amber-500 text-amber-600 rounded-lg hover:bg-amber-50 transition text-sm"
          >
            重置密码
          </button>
        </div>
      </div>

      <!-- 编辑模式 -->
      <div v-else class="bg-white rounded-xl shadow p-4 lg:p-6 space-y-4">
        <h2 class="font-semibold text-sm text-slate-500 mb-3">编辑用户信息</h2>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >姓名</label
          >
          <input
            v-model="editForm.name"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >邮箱</label
          >
          <input
            v-model="editForm.email"
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
            v-model="editForm.phone"
            type="tel"
            autocomplete="off"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >部门</label
          >
          <input
            v-model="editForm.department"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >角色</label
          >
          <select
            v-model="editForm.role"
            @change="onRoleChange"
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
            >状态</label
          >
          <select
            v-model="editForm.status"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
          >
            <option value="ACTIVE">正常</option>
            <option value="INACTIVE">禁用</option>
          </select>
        </div>

        <!-- 自定义权限 -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >自定义权限
            <span class="text-slate-400 text-xs font-normal"
              >(在角色权限基础上追加，切换角色后清空)</span
            ></label
          >
          <button
            type="button"
            @click="showPermissionPanel = !showPermissionPanel"
            class="min-h-[44px] w-full border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:text-blue-500 hover:border-blue-400 transition"
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
                    v-model="editForm.customPermissions"
                    class="w-4 h-4 text-blue-600 rounded"
                  />
                  <span class="text-xs text-slate-700">{{ perm.label }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <button
          @click="handleSave"
          class="w-full min-h-[48px] bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition font-medium text-sm"
        >
          保存
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth" as any] });
const toast = useToast();
const { apiFetch } = useApi();
const route = useRoute();

const {
  data: user,
  loading,
  execute: loadUser,
} = useApiFetch<any>(() => `/api/users/${route.params.id}`);
await loadUser();

const editing = ref(false);
const showPermissionPanel = ref(false);
const editForm = reactive({
  name: "",
  email: "",
  phone: "",
  department: "",
  role: "",
  status: "",
  customPermissions: [] as string[],
});
const getDefaultPermissionsByRole = (role: string): string[] => {
  const m: Record<string, string[]> = {
    admin: ["*"],
    manager: [
      "order:view",
      "order:detail",
      "order:create",
      "order:edit",
      "order:approve",
      "order:cancel",
      "order:export",
      "order:ship",
      "inventory:view",
      "inventory:adjust",
      "inventory:transfer",
      "inventory:check",
      "bom:view",
      "bom:create",
      "bom:edit",
      "staff:view",
      "staff:schedule",
      "data:view-cost",
      "data:view-profit",
      "report:view",
      "report:export",
    ],
    seniorStaff: [
      "order:view",
      "order:detail",
      "order:create",
      "order:edit",
      "inventory:view",
      "inventory:adjust",
      "bom:view",
      "staff:view",
      "report:view",
    ],
    staff: [
      "order:view",
      "order:detail",
      "order:create",
      "inventory:view",
      "bom:view",
      "staff:view",
    ],
    warehouseKeeper: [
      "order:view",
      "order:ship",
      "inventory:view",
      "inventory:adjust",
      "inventory:transfer",
      "inventory:check",
      "inventory:import",
      "inventory:export",
      "bom:view",
    ],
    accountant: [
      "order:view",
      "order:detail",
      "data:view-cost",
      "data:view-profit",
      "data:view-margin",
      "report:view",
      "report:view-financial",
      "report:export",
    ],
  };
  return m[role] || [];
};

watch(
  user,
  (val: any) => {
    if (val?.id) {
      editForm.name = val.name || "";
      editForm.email = val.email || "";
      editForm.phone = val.phone || "";
      editForm.department = val.department || "";
      editForm.role = val.role || "";
      editForm.status = val.status || "";
      const defaults = new Set(getDefaultPermissionsByRole(val.role));
      editForm.customPermissions = (val.permissions || []).filter(
        (p: string) => !defaults.has(p) && p !== "*",
      );
    }
  },
  { immediate: true },
);

const onRoleChange = () => {
  editForm.customPermissions = [];
  showPermissionPanel.value = false;
};

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

const handleSave = async () => {
  if (!editForm.name.trim()) return toast.error("姓名不能为空");
  try {
    await apiFetch(`/api/users/${route.params.id}`, {
      method: "PATCH" as any,
      body: {
        name: editForm.name,
        email: editForm.email || undefined,
        phone: editForm.phone || undefined,
        department: editForm.department || undefined,
        role: editForm.role,
        status: editForm.status,
        customPermissions:
          editForm.customPermissions.length > 0
            ? editForm.customPermissions
            : [],
      },
    });
    toast.success("保存成功");
    editing.value = false;
    await loadUser();
  } catch (e: any) {
    toast.error(e, "保存失败");
  }
};

const handleDisable = async () => {
  if (!confirm("确认禁用该用户？")) return;
  try {
    await apiFetch(`/api/users/${route.params.id}/status`, {
      method: "PATCH",
      body: { status: "INACTIVE" },
    });
    toast.success("已禁用");
    await loadUser();
  } catch (e: any) {
    toast.error(e, "操作失败");
  }
};

const handleEnable = async () => {
  try {
    await apiFetch(`/api/users/${route.params.id}/status`, {
      method: "PATCH",
      body: { status: "ACTIVE" },
    });
    toast.success("已启用");
    await loadUser();
  } catch (e: any) {
    toast.error(e, "操作失败");
  }
};

const handleResetPassword = async () => {
  const newPwd = prompt("请输入新密码（至少6位）：");
  if (!newPwd || newPwd.length < 6) return toast.error("密码至少6位");
  try {
    await apiFetch(`/api/users/${route.params.id}`, {
      method: "PATCH" as any,
      body: { password: newPwd },
    });
    toast.success("密码已重置");
  } catch (e: any) {
    toast.error(e, "重置失败");
  }
};

const roleLabel = (r: string) =>
  ({
    admin: "管理员",
    manager: "经理",
    seniorStaff: "高级员工",
    staff: "员工",
    warehouseKeeper: "仓管",
    accountant: "财务",
  })[r] || r;
const statusIcon = (s: string) => (s === "ACTIVE" ? "✅" : "🚫");
const statusBadge = (s: string) =>
  s === "ACTIVE"
    ? "bg-green-100 text-green-800 border-green-300"
    : "bg-red-100 text-red-800 border-red-300";
const formatDate = (d: string) => new Date(d).toLocaleDateString("zh-CN");

const permLabel = (p: string) => {
  const m: Record<string, string> = {
    "order:view": "查看订单列表",
    "order:detail": "查看订单详情",
    "order:create": "创建订单",
    "order:edit": "编辑订单",
    "order:delete": "删除订单",
    "order:approve": "审批订单",
    "order:cancel": "取消订单",
    "order:ship": "订单发货",
    "order:export": "导出订单",
    "order:print": "打印订单",
    "inventory:view": "查看库存",
    "inventory:adjust": "调整库存",
    "inventory:transfer": "调拨库存",
    "inventory:check": "盘点库存",
    "inventory:warning": "库存预警设置",
    "inventory:import": "导入库存",
    "inventory:export": "导出库存",
    "bom:view": "查看BOM",
    "bom:create": "创建BOM",
    "bom:edit": "编辑BOM",
    "bom:delete": "删除BOM",
    "bom:copy": "复制BOM",
    "bom:version": "BOM版本管理",
    "staff:view": "查看员工",
    "staff:manage": "管理员工",
    "staff:schedule": "排班管理",
    "staff:attendance": "考勤管理",
    "user:view": "查看用户列表",
    "user:create": "创建用户",
    "user:edit": "编辑用户",
    "user:delete": "删除用户",
    "user:assign-role": "分配角色",
    "user:reset-password": "重置密码",
    "data:view-cost": "查看成本价",
    "data:view-profit": "查看利润",
    "data:view-margin": "查看毛利率",
    "data:view-supplier": "查看供应商信息",
    "report:view": "查看报表",
    "report:create": "创建报表",
    "report:export": "导出报表",
    "report:view-financial": "查看财务报表",
    "system:config": "系统配置",
    "system:log": "查看日志",
    "system:backup": "备份数据",
    "system:restore": "恢复数据",
  };
  return m[p] || p;
};
</script>
