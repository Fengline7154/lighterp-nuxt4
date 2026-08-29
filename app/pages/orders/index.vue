<template>
  <div>
    <div class="flex justify-between items-center mb-6 flex-wrap gap-2">
      <h1 class="text-xl lg:text-2xl font-bold">订单管理</h1>
      <NuxtLink
        to="/orders/create"
        class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm flex items-center"
        >+ 创建订单</NuxtLink
      >
    </div>

    <div class="flex flex-wrap gap-3 mb-4">
      <input
        v-model="keyword"
        @input="onKeywordInput"
        placeholder="搜索订单号/产品名..."
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition w-full sm:w-64"
      />
      <select
        v-model="statusFilter"
        @change="page = 1"
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
      >
        <option value="">全部状态</option>
        <option value="PENDING">待审核</option>
        <option value="APPROVED">已审核</option>
        <option value="SAMPLING">打样中</option>
        <option value="SAMPLED">打样完成</option>
        <option value="PRODUCING">生产中</option>
        <option value="READY">待发货</option>
        <option value="COMPLETED">已完成</option>
        <option value="CANCELLED">已取消</option>
      </select>
    </div>

    <!-- 桌面端表格 -->
    <div class="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full min-w-[900px] whitespace-nowrap">
        <thead>
          <tr class="border-b bg-slate-100">
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase cursor-pointer select-none"
              @click="toggleSort('orderCode')"
            >
              订单号 {{ sortIcon("orderCode") }}
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              客户
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              类型
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              状态
            </th>
            <th
              class="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase cursor-pointer select-none"
              @click="toggleSort('totalAmount')"
            >
              金额 {{ sortIcon("totalAmount") }}
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              制单人
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
            v-for="order in orders"
            :key="order.id"
            class="transition even:bg-slate-100 odd:bg-white hover:bg-blue-200"
          >
            <td class="px-4 py-3 text-sm font-mono">{{ order.orderCode }}</td>
            <td class="px-4 py-3 text-sm">{{ order.customer?.name || "-" }}</td>
            <td class="px-4 py-3 text-sm">
              <span
                :class="typeBadge(order.orderType)"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
                >{{ typeIcon(order.orderType) }}
                {{ typeLabel(order.orderType) }}</span
              >
            </td>
            <td class="px-4 py-3 text-sm">
              <span
                :class="statusBadge(order.status)"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
                >{{ statusIcon(order.status) }}
                {{ statusLabel(order.status) }}</span
              >
            </td>
            <td class="px-4 py-3 text-sm text-right">
              <template v-if="Number(order.totalAmount) > 0"
                >¥{{ order.totalAmount }}</template
              ><span v-else class="text-slate-400">待定价</span>
            </td>
            <td class="px-4 py-3 text-sm">
              {{ order.creator?.badgeCode }}-{{ order.creator?.name }}
            </td>
            <td class="px-4 py-3 text-sm text-slate-500">
              {{ formatDate(order.createdAt) }}
            </td>
            <td class="px-4 py-3 text-sm text-center">
              <NuxtLink
                :to="`/orders/${order.id}`"
                class="text-blue-600 hover:text-blue-800 font-medium text-sm min-h-[36px] inline-flex items-center"
                >详情</NuxtLink
              >
              <CommonPrintButton
                document-type="order"
                :document-id="order.id"
                @error="handlePrintError"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 移动端卡片 -->
    <div class="md:hidden space-y-3">
      <div
        v-for="order in orders"
        :key="order.id"
        class="bg-white rounded-xl shadow p-4 space-y-2"
      >
        <div class="flex items-center justify-between">
          <span
            :class="statusBadge(order.status)"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
            >{{ statusIcon(order.status) }}
            {{ statusLabel(order.status) }}</span
          >
          <span class="text-xs text-slate-400">{{
            formatDate(order.createdAt)
          }}</span>
        </div>
        <div class="text-sm font-mono font-medium">{{ order.orderCode }}</div>
        <div class="flex items-center gap-2 text-sm">
          <span
            :class="typeBadge(order.orderType)"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border"
            >{{ typeIcon(order.orderType) }}
            {{ typeLabel(order.orderType) }}</span
          >
          <span class="text-slate-500">{{ order.customer?.name || "-" }}</span>
        </div>
        <div class="flex justify-between items-center text-sm">
          <span class="font-medium">{{
            Number(order.totalAmount) > 0 ? `¥${order.totalAmount}` : "待定价"
          }}</span>
          <NuxtLink
            :to="`/orders/${order.id}`"
            class="text-blue-600 font-medium"
            >详情 →</NuxtLink
          >
        </div>
      </div>
    </div>

    <div v-if="orders.length === 0" class="text-center py-12 text-slate-400">
      暂无订单记录
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
const page = ref(1);
const limit = 10;
const keyword = ref("");
const statusFilter = ref("");
const sortField = ref("createdAt");
const sortDir = ref<"asc" | "desc">("desc");
const handlePrintError = (msg: string) => {
  toast.error(msg);
};
let debounceTimer: ReturnType<typeof setTimeout>;
const onKeywordInput = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    page.value = 1;
  }, 300);
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

const queryParams = computed(() => ({
  page: page.value,
  limit,
  keyword: keyword.value,
  status: statusFilter.value,
  sortField: sortField.value,
  sortDir: sortDir.value,
}));

const { data } = await useFetch("/api/orders", {
  query: queryParams,
  watch: [queryParams],
});
const orders = computed(() => (data.value as any)?.data || []);
const totalPages = computed(() => (data.value as any)?.totalPages || 1);

const typeLabel = (t: string) =>
  ({ STANDARD: "标准品", VARIANT: "变型品", CUSTOM: "定制品" })[t] || t;
const typeIcon = (t: string) =>
  ({ STANDARD: "📦", VARIANT: "🔧", CUSTOM: "🎨" })[t] || "";
const typeBadge = (t: string) => {
  const m: Record<string, string> = {
    STANDARD: "bg-blue-100 text-blue-800 border-blue-300",
    VARIANT: "bg-purple-100 text-purple-800 border-purple-300",
    CUSTOM: "bg-orange-100 text-orange-800 border-orange-300",
  };
  return m[t] || "bg-slate-100 text-slate-600 border-slate-300";
};
const statusLabel = (s: string) =>
  ({
    PENDING: "待审核",
    APPROVED: "已审核",
    SAMPLING: "打样中",
    SAMPLED: "打样完成",
    PRODUCING: "生产中",
    READY: "待发货",
    COMPLETED: "已完成",
    CANCELLED: "已取消",
  })[s] || s;
const statusIcon = (s: string) =>
  ({
    PENDING: "⏳",
    APPROVED: "✅",
    SAMPLING: "🔬",
    SAMPLED: "📋",
    PRODUCING: "🏭",
    READY: "📦",
    COMPLETED: "🏁",
    CANCELLED: "❌",
  })[s] || "";
const statusBadge = (s: string) => {
  const m: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800 border-amber-300",
    APPROVED: "bg-blue-100 text-blue-800 border-blue-300",
    SAMPLING: "bg-orange-100 text-orange-800 border-orange-300",
    SAMPLED: "bg-teal-100 text-teal-800 border-teal-300",
    PRODUCING: "bg-purple-100 text-purple-800 border-purple-300",
    READY: "bg-cyan-100 text-cyan-800 border-cyan-300",
    COMPLETED: "bg-green-100 text-green-800 border-green-300",
    CANCELLED: "bg-red-100 text-red-800 border-red-300",
  };
  return m[s] || "bg-slate-100 text-slate-600 border-slate-300";
};
const formatDate = (d: string) => new Date(d).toLocaleDateString("zh-CN");
</script>
