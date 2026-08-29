<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-xl lg:text-2xl font-bold">客户管理</h1>
      <NuxtLink
        to="/customers/create"
        class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm flex items-center"
        >+ 创建客户</NuxtLink
      >
    </div>

    <div class="flex flex-wrap gap-3 mb-4">
      <input
        v-model="keyword"
        @keydown.enter="doSearch"
        placeholder="搜索名称/电话..."
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition w-full sm:w-64"
      />
      <button
        @click="doSearch"
        class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
      >
        搜索
      </button>
    </div>

    <!-- 桌面端表格 -->
    <div class="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full min-w-[700px] whitespace-nowrap">
        <thead>
          <tr class="border-b bg-slate-100">
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase cursor-pointer select-none"
              @click="toggleSort('code')"
            >
              客户编号 {{ sortIcon("code") }}
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase cursor-pointer select-none"
              @click="toggleSort('name')"
            >
              名称 {{ sortIcon("name") }}
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              联系人
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              电话
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              邮箱
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              状态
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase cursor-pointer select-none"
              @click="toggleSort('createdAt')"
            >
              创建时间 {{ sortIcon("createdAt") }}
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
            v-for="c in customers"
            :key="c.id"
            class="hover:bg-blue-50/30 even:bg-slate-50/50 transition"
          >
            <td class="px-4 py-3 text-sm font-mono">{{ c.code }}</td>
            <td class="px-4 py-3 text-sm font-medium">{{ c.name }}</td>
            <td class="px-4 py-3 text-sm">{{ c.contact || "-" }}</td>
            <td class="px-4 py-3 text-sm">{{ c.phone || "-" }}</td>
            <td class="px-4 py-3 text-sm text-slate-600">
              {{ c.email || "-" }}
            </td>
            <td class="px-4 py-3 text-sm">
              <span
                :class="statusBadge(c.status)"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
              >
                {{ statusIcon(c.status) }}
                {{ c.status === "ACTIVE" ? "正常" : "停用" }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-slate-500">
              {{ formatDate(c.createdAt) }}
            </td>
            <td class="px-4 py-3 text-sm text-center space-x-2">
              <NuxtLink
                :to="`/customers/${c.id}`"
                class="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >详情</NuxtLink
              >
              <button
                @click="toggleStatus(c)"
                class="text-sm font-medium min-h-[36px]"
                :class="
                  c.status === 'ACTIVE'
                    ? 'text-red-500 hover:text-red-700'
                    : 'text-green-500 hover:text-green-700'
                "
              >
                {{ c.status === "ACTIVE" ? "停用" : "启用" }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 移动端卡片 -->
    <div class="md:hidden space-y-3">
      <div
        v-for="c in customers"
        :key="c.id"
        class="bg-white rounded-xl shadow p-4 space-y-2"
      >
        <div class="flex items-center justify-between">
          <span
            :class="statusBadge(c.status)"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
          >
            {{ statusIcon(c.status) }}
            {{ c.status === "ACTIVE" ? "正常" : "停用" }}
          </span>
          <span class="text-xs text-slate-400">{{
            formatDate(c.createdAt)
          }}</span>
        </div>
        <div class="text-sm font-mono font-medium">{{ c.code }}</div>
        <div class="text-sm">{{ c.name }}</div>
        <div class="text-xs text-slate-500">
          {{ c.contact || "-" }} | {{ c.phone || "-" }}
        </div>
        <div class="flex gap-3 pt-2 border-t">
          <NuxtLink
            :to="`/customers/${c.id}`"
            class="text-blue-600 text-sm font-medium"
            >详情</NuxtLink
          >
          <button
            @click="toggleStatus(c)"
            class="text-sm font-medium"
            :class="c.status === 'ACTIVE' ? 'text-red-500' : 'text-green-500'"
          >
            {{ c.status === "ACTIVE" ? "停用" : "启用" }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="customers.length === 0" class="text-center py-12 text-slate-400">
      暂无客户记录
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

const toast = useToast();
const { apiFetch } = useApi();
const page = ref(1);
const limit = 10;
const keyword = ref("");
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

const sortIcon = (field: string) => {
  if (sortField.value !== field) return "↕";
  return sortDir.value === "asc" ? "↑" : "↓";
};

const queryParams = computed(() => ({
  page: page.value,
  limit,
  keyword: searchKeyword.value,
  sortField: sortField.value,
  sortDir: sortDir.value,
}));
watch(keyword, (val) => {
  if (!val.trim()) {
    searchKeyword.value = "";
    page.value = 1;
  }
});
const { data, refresh } = await useFetch("/api/customers", {
  query: queryParams,
  watch: [queryParams],
});

const customers = computed(() => (data.value as any)?.data || []);
const totalPages = computed(() => (data.value as any)?.totalPages || 1);
const formatDate = (d: string) => new Date(d).toLocaleDateString("zh-CN");

const statusIcon = (s: string) => (s === "ACTIVE" ? "✅" : "🚫");
const statusBadge = (s: string) =>
  s === "ACTIVE"
    ? "bg-green-100 text-green-800 border-green-300"
    : "bg-red-100 text-red-800 border-red-300";

const toggleStatus = async (c: any) => {
  const newStatus = c.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  try {
    await apiFetch(`/api/customers/${c.id}/status`, {
      method: "PATCH",
      body: { status: newStatus },
    });
    toast.success(newStatus === "ACTIVE" ? "已启用" : "已停用");
    await refresh();
  } catch (e: any) {
    toast.error(e, "操作失败");
  }
};
</script>
