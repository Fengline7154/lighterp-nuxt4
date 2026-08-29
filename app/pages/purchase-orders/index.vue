<!-- pages/purchase-orders/index.vue -->
<template>
  <div>
    <div class="flex justify-between items-center mb-6 flex-wrap gap-2">
      <h1 class="text-xl lg:text-2xl font-bold">采购单管理</h1>
      <NuxtLink
        to="/purchase-orders/create"
        class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm flex items-center"
        >+ 创建采购单</NuxtLink
      >
    </div>

    <div class="flex flex-wrap gap-3 mb-4">
      <input
        v-model="keyword"
        @keydown.enter="doSearch"
        placeholder="搜索单号/供应商..."
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition w-full sm:w-56"
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
        <option value="PENDING">待审批</option>
        <option value="APPROVED">已审批</option>
        <option value="PARTIAL">部分入库</option>
        <option value="COMPLETED">已完成</option>
        <option value="CANCELLED">已取消</option>
      </select>
      <input
        v-model="startDate"
        type="date"
        max="9999-12-30"
        @change="page = 1"
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition"
      />
      <span class="text-sm text-slate-500 self-center">至</span>
      <input
        v-model="endDate"
        type="date"
        max="9999-12-30"
        @change="page = 1"
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition"
      />
      <button
        @click="clearFilters"
        class="min-h-[44px] px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition"
      >
        清除筛选
      </button>
    </div>

    <!-- 桌面端表格 -->
    <div class="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full min-w-[800px] whitespace-nowrap">
        <thead>
          <tr class="border-b bg-slate-100">
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              采购单号
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              供应商
            </th>
            <th
              class="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              金额
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              状态
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              预计到货
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              创建时间
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
            v-for="o in orders"
            :key="o.id"
            class="hover:bg-blue-50/30 odd:bg-white even:bg-slate-50 transition"
          >
            <td class="px-4 py-3 text-sm font-mono">{{ o.orderCode }}</td>
            <td class="px-4 py-3 text-sm">{{ o.supplier?.name || "-" }}</td>
            <td class="px-4 py-3 text-sm text-right">¥{{ o.totalAmount }}</td>
            <td class="px-4 py-3 text-sm">
              <span
                :class="statusBadge(o.status)"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
                >{{ statusIcon(o.status) }} {{ statusLabel(o.status) }}</span
              >
            </td>
            <td class="px-4 py-3 text-sm text-slate-500">
              {{ o.expectedDate ? formatDate(o.expectedDate) : "-" }}
            </td>
            <td class="px-4 py-3 text-sm text-slate-500">
              {{ formatDate(o.createdAt) }}
            </td>
            <td class="px-4 py-3 text-sm text-center">
              <NuxtLink
                :to="`/purchase-orders/${o.id}`"
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
        v-for="o in orders"
        :key="o.id"
        class="bg-white rounded-xl shadow p-4 space-y-2"
      >
        <div class="flex items-center justify-between">
          <span
            :class="statusBadge(o.status)"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
            >{{ statusIcon(o.status) }} {{ statusLabel(o.status) }}</span
          >
          <span class="text-sm font-bold">¥{{ o.totalAmount }}</span>
        </div>
        <div class="text-sm font-mono font-medium">{{ o.orderCode }}</div>
        <div class="text-sm">{{ o.supplier?.name || "-" }}</div>
        <div class="flex justify-between text-xs text-slate-500">
          <span>{{ o.expectedDate ? formatDate(o.expectedDate) : "-" }}</span>
          <span>{{ formatDate(o.createdAt) }}</span>
        </div>
        <NuxtLink
          :to="`/purchase-orders/${o.id}`"
          class="block text-blue-600 text-sm font-medium pt-2 border-t"
          >详情 →</NuxtLink
        >
      </div>
    </div>

    <div v-if="orders.length === 0" class="text-center py-12 text-slate-400">
      暂无采购单
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
const statusFilter = ref("");
const searchKeyword = ref("");
const startDate = ref("");
const endDate = ref("");
const doSearch = () => {
  searchKeyword.value = keyword.value;
  page.value = 1;
};

const queryParams = computed(() => ({
  page: page.value,
  limit,
  keyword: searchKeyword.value,
  status: statusFilter.value,
  startDate: startDate.value,
  endDate: endDate.value,
}));
const clearFilters = () => {
  keyword.value = "";
  searchKeyword.value = "";
  statusFilter.value = "";
  startDate.value = "";
  endDate.value = "";
  page.value = 1;
};
watch(keyword, (val) => {
  if (!val.trim()) {
    searchKeyword.value = "";
    page.value = 1;
  }
});
const { data } = await useFetch("/api/purchase-orders", {
  query: queryParams,
  watch: [queryParams],
});

const orders = computed(() => (data.value as any)?.data || []);
const totalPages = computed(() => (data.value as any)?.totalPages || 1);

const statusLabel = (s: string) =>
  ({
    PENDING: "待审批",
    APPROVED: "已审批",
    PARTIAL: "部分入库",
    COMPLETED: "已完成",
    CANCELLED: "已取消",
  })[s] || s;
const statusIcon = (s: string) =>
  ({
    PENDING: "⏳",
    APPROVED: "✅",
    PARTIAL: "📥",
    COMPLETED: "🏁",
    CANCELLED: "❌",
  })[s] || "";
const statusBadge = (s: string) => {
  const m: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800 border-amber-300",
    APPROVED: "bg-blue-100 text-blue-800 border-blue-300",
    PARTIAL: "bg-teal-100 text-teal-800 border-teal-300",
    COMPLETED: "bg-green-100 text-green-800 border-green-300",
    CANCELLED: "bg-red-100 text-red-800 border-red-300",
  };
  return m[s] || "bg-slate-100 text-slate-600 border-slate-300";
};
const formatDate = (d: string) => new Date(d).toLocaleDateString("zh-CN");
</script>
