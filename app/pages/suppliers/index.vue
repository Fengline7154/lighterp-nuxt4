<!-- pages/suppliers/index.vue -->
<template>
  <div>
    <div class="flex justify-between items-center mb-6 flex-wrap gap-2">
      <h1 class="text-xl lg:text-2xl font-bold">供应商管理</h1>
      <NuxtLink
        to="/suppliers/create"
        class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm flex items-center"
        >+ 新增供应商</NuxtLink
      >
    </div>

    <div class="flex flex-wrap gap-3 mb-4">
      <input
        v-model="keyword"
        @keydown.enter="doSearch"
        placeholder="搜索名称/编码/电话..."
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition w-full sm:w-64"
      />
      <button
        @click="doSearch"
        class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
      >
        搜索
      </button>
      <select
        v-model="statusFilter"
        @change="page = 1"
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
      >
        <option value="">全部状态</option>
        <option value="ACTIVE">正常</option>
        <option value="INACTIVE">停用</option>
      </select>
    </div>

    <!-- 桌面端表格 -->
    <div class="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full min-w-[700px] whitespace-nowrap">
        <thead>
          <tr class="border-b bg-slate-100">
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              编码
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              名称
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
            v-for="s in suppliers"
            :key="s.id"
            class="hover:bg-blue-50/30 odd:bg-white even:bg-slate-50 transition"
          >
            <td class="px-4 py-3 text-sm font-mono">{{ s.code }}</td>
            <td class="px-4 py-3 text-sm font-medium">{{ s.name }}</td>
            <td class="px-4 py-3 text-sm text-slate-500">
              {{ s.contact || "-" }}
            </td>
            <td class="px-4 py-3 text-sm">{{ s.phone || "-" }}</td>
            <td class="px-4 py-3 text-sm">
              <span
                :class="statusBadge(s.status)"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
                >{{ statusIcon(s.status) }}
                {{ s.status === "ACTIVE" ? "正常" : "停用" }}</span
              >
            </td>
            <td class="px-4 py-3 text-sm text-center space-x-2">
              <NuxtLink
                :to="`/suppliers/${s.id}`"
                class="text-blue-600 hover:text-blue-800 text-sm font-medium min-h-[36px] inline-flex items-center"
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
        v-for="s in suppliers"
        :key="s.id"
        class="bg-white rounded-xl shadow p-4 space-y-2"
      >
        <div class="flex items-center justify-between">
          <span
            :class="statusBadge(s.status)"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
            >{{ statusIcon(s.status) }}
            {{ s.status === "ACTIVE" ? "正常" : "停用" }}</span
          >
          <span class="font-mono text-sm text-slate-500">{{ s.code }}</span>
        </div>
        <div class="text-sm font-medium">{{ s.name }}</div>
        <div class="text-xs text-slate-500">
          {{ s.contact || "-" }} | {{ s.phone || "-" }}
        </div>
        <NuxtLink
          :to="`/suppliers/${s.id}`"
          class="block text-blue-600 text-sm font-medium pt-2 border-t"
          >详情 →</NuxtLink
        >
      </div>
    </div>

    <div v-if="suppliers.length === 0" class="text-center py-12 text-slate-400">
      暂无供应商
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
const limit = 20;
const keyword = ref("");
const statusFilter = ref("");
const searchKeyword = ref("");
const doSearch = () => {
  searchKeyword.value = keyword.value;
  page.value = 1;
};

const queryParams = computed(() => ({
  page: page.value,
  limit,
  keyword: searchKeyword.value,
  status: statusFilter.value,
}));
watch(keyword, (val) => {
  if (!val.trim()) {
    searchKeyword.value = "";
    page.value = 1;
  }
});
const { data } = await useFetch("/api/suppliers", {
  query: queryParams,
  watch: [queryParams],
});
const suppliers = computed(() => (data.value as any)?.data || []);
const totalPages = computed(() => (data.value as any)?.totalPages || 1);

const statusIcon = (s: string) => (s === "ACTIVE" ? "✅" : "🚫");
const statusBadge = (s: string) =>
  s === "ACTIVE"
    ? "bg-green-100 text-green-800 border-green-300"
    : "bg-red-100 text-red-800 border-red-300";
</script>
