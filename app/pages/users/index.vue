<template>
  <div>
    <div class="flex justify-between items-center mb-6 flex-wrap gap-2">
      <h1 class="text-xl lg:text-2xl font-bold">用户管理</h1>
      <div class="flex gap-2">
        <NuxtLink
          to="/users/create"
          class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm flex items-center"
          >+ 创建用户</NuxtLink
        >
        <NuxtLink
          to="/users/batch-create"
          class="min-h-[44px] px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition text-sm flex items-center"
          >批量创建</NuxtLink
        >
      </div>
    </div>

    <div class="flex flex-wrap gap-3 mb-4">
      <input
        v-model="keyword"
        @keydown.enter="doSearch"
        placeholder="搜索工号/姓名/手机/邮箱..."
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition w-full sm:w-56"
      />
      <button
        @click="doSearch"
        class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
      >
        搜索
      </button>
      <select
        v-model="roleFilter"
        @change="page = 1"
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
      >
        <option value="">全部角色</option>
        <option value="admin">管理员</option>
        <option value="manager">经理</option>
        <option value="seniorStaff">高级员工</option>
        <option value="staff">员工</option>
        <option value="warehouseKeeper">仓管</option>
        <option value="accountant">财务</option>
      </select>
      <select
        v-model="deptFilter"
        @change="page = 1"
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
      >
        <option value="">全部部门</option>
        <option v-for="d in departments" :key="d" :value="d">{{ d }}</option>
      </select>
      <select
        v-model="statusFilter"
        @change="page = 1"
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
      >
        <option value="ACTIVE">正常</option>
        <option value="INACTIVE">已禁用</option>
      </select>
    </div>

    <!-- 桌面端表格 -->
    <div class="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full min-w-[800px] whitespace-nowrap">
        <thead>
          <tr class="border-b bg-slate-100">
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase cursor-pointer select-none"
              @click="toggleSort('badgeCode')"
            >
              工号 {{ sortIcon("badgeCode") }}
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase cursor-pointer select-none"
              @click="toggleSort('name')"
            >
              姓名 {{ sortIcon("name") }}
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              邮箱
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              手机号
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              角色
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              部门
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              状态
            </th>
            <th
              class="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              操作
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr
            v-for="user in users"
            :key="user.id"
            class="hover:bg-blue-50/30 odd:bg-white even:bg-slate-50 transition"
          >
            <td class="px-4 py-3 text-sm font-mono">{{ user.badgeCode }}</td>
            <td class="px-4 py-3 text-sm font-medium">{{ user.name }}</td>
            <td class="px-4 py-3 text-sm text-slate-600">
              {{ user.email || "-" }}
            </td>
            <td class="px-4 py-3 text-sm text-slate-600">
              {{ user.phone || "-" }}
            </td>
            <td class="px-4 py-3 text-sm">
              <span
                class="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
                >{{ roleLabel(user.role) }}</span
              >
            </td>
            <td class="px-4 py-3 text-sm">{{ user.department || "-" }}</td>
            <td class="px-4 py-3 text-sm">
              <span
                :class="statusBadge(user.status)"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
                >{{ statusIcon(user.status) }}
                {{ user.status === "ACTIVE" ? "正常" : "禁用" }}</span
              >
            </td>
            <td class="px-4 py-3 text-sm text-center">
              <NuxtLink
                :to="`/users/${user.id}`"
                class="text-blue-600 hover:text-blue-800 font-medium text-sm min-h-[36px] inline-flex items-center"
                >详情</NuxtLink
              >
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 移动端卡片 -->
    <div class="md:hidden space-y-3">
      <div
        v-for="user in users"
        :key="user.id"
        class="bg-white rounded-xl shadow p-4 space-y-2"
      >
        <div class="flex items-center justify-between">
          <span
            :class="statusBadge(user.status)"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
            >{{ statusIcon(user.status) }}
            {{ user.status === "ACTIVE" ? "正常" : "禁用" }}</span
          >
          <span class="font-mono text-sm text-slate-500">{{
            user.badgeCode
          }}</span>
        </div>
        <div class="text-sm font-medium">{{ user.name }}</div>
        <div class="flex items-center gap-3 text-xs text-slate-500">
          <span>{{ roleLabel(user.role) }}</span>
          <span>{{ user.department || "-" }}</span>
        </div>
        <div class="text-xs text-slate-400">
          {{ user.email || "-" }} | {{ user.phone || "-" }}
        </div>
        <NuxtLink
          :to="`/users/${user.id}`"
          class="block text-blue-600 text-sm font-medium pt-2 border-t"
          >详情 →</NuxtLink
        >
      </div>
    </div>

    <div v-if="users.length === 0" class="text-center py-12 text-slate-400">
      暂无用户记录
    </div>

    <div class="flex justify-between items-center mt-4">
      <button
        :disabled="page <= 1"
        @click="page--"
        class="min-h-[44px] min-w-[44px] px-4 py-2 text-sm border rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center"
      >
        上一页
      </button>
      <span class="text-sm text-slate-500"
        >第 {{ page }} / {{ totalPages }} 页</span
      >
      <button
        :disabled="page >= totalPages"
        @click="page++"
        class="min-h-[44px] min-w-[44px] px-4 py-2 text-sm border rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth" as any] });

const page = ref(1);
const limit = 10;
const keyword = ref("");
const roleFilter = ref("");
const deptFilter = ref("");
const statusFilter = ref("ACTIVE");
const sortField = ref("createdAt");
const sortDir = ref<"asc" | "desc">("desc");
const searchKeyword = ref("");
const doSearch = () => {
  searchKeyword.value = keyword.value;
  page.value = 1;
};

const toggleSort = (field: string) => {
  if (sortField.value === field) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortField.value = field;
    sortDir.value = "asc";
  }
};
const sortIcon = (field: string) =>
  sortField.value !== field ? "↕" : sortDir.value === "asc" ? "↑" : "↓";

const { data: deptData } = await useFetch("/api/users/departments");
const departments = computed(() => (deptData.value as string[]) || []);

const queryParams = computed(() => ({
  page: page.value,
  limit,
  keyword: searchKeyword.value,
  role: roleFilter.value,
  department: deptFilter.value,
  status: statusFilter.value,
  sortField: sortField.value,
  sortDir: sortDir.value,
}));
watch(keyword, (val) => {
  if (!val.trim()) {
    searchKeyword.value = "";
    page.value = 1;
  }
});
const { data } = await useFetch("/api/users", {
  query: queryParams,
  watch: [queryParams],
});

const users = computed(() => (data.value as any)?.data || []);
const totalPages = computed(() => (data.value as any)?.totalPages || 1);

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
</script>
