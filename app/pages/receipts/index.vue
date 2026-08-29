<template>
  <div>
    <h1 class="text-xl lg:text-2xl font-bold mb-6">入库记录</h1>

    <div class="flex gap-3 mb-4 flex-wrap">
      <input
        v-model="keyword"
        @keydown.enter="doSearch"
        placeholder="搜索单号..."
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition w-48 lg:w-64"
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
      <table class="w-full min-w-[800px] whitespace-nowrap">
        <thead>
          <tr class="border-b bg-slate-100">
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase cursor-pointer select-none"
              @click="toggleSort('receiptCode')"
            >
              入库单号 {{ sortIcon("receiptCode") }}
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              订单号
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              产品
            </th>
            <th
              class="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              数量
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              操作人
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase cursor-pointer select-none"
              @click="toggleSort('createdAt')"
            >
              时间 {{ sortIcon("createdAt") }}
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
            v-for="r in items"
            :key="r.id"
            class="hover:bg-blue-50/30 even:bg-slate-50 transition"
          >
            <td class="px-4 py-3 text-sm font-mono">{{ r.receiptCode }}</td>
            <td class="px-4 py-3 text-sm">{{ r.order?.orderCode || "-" }}</td>
            <td class="px-4 py-3 text-sm">
              {{ r.orderItem?.product?.name || "-" }}
            </td>
            <td class="px-4 py-3 text-sm text-right font-medium">
              {{ r.quantity }}
            </td>
            <td class="px-4 py-3 text-sm">
              {{ r.operator?.badgeCode || r.operatorId
              }}{{ r.operator?.name ? `-${r.operator.name}` : "" }}
            </td>
            <td class="px-4 py-3 text-sm text-slate-500">
              {{ formatDate(r.createdAt) }}
            </td>
            <td class="px-4 py-3 text-sm text-center">
              <NuxtLink
                :to="`/receipts/${r.id}`"
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
        v-for="r in items"
        :key="r.id"
        class="bg-white rounded-xl shadow p-4 space-y-1"
      >
        <div class="flex justify-between items-center">
          <span class="font-mono text-sm">{{ r.receiptCode }}</span>
          <span class="text-sm font-bold">{{ r.quantity }}</span>
        </div>
        <div class="text-sm">{{ r.orderItem?.product?.name || "-" }}</div>
        <div class="text-xs text-slate-500">
          订单：{{ r.order?.orderCode || "-" }}
        </div>
        <div class="flex justify-between text-xs text-slate-500">
          <span
            >{{ r.operator?.badgeCode || r.operatorId
            }}{{ r.operator?.name ? `-${r.operator.name}` : "" }}</span
          >
          <span>{{ formatDate(r.createdAt) }}</span>
        </div>
        <NuxtLink
          :to="`/receipts/${r.id}`"
          class="block text-blue-600 text-sm pt-1 border-t"
          >详情 →</NuxtLink
        >
      </div>
    </div>

    <div v-if="items.length === 0" class="text-center py-12 text-slate-400">
      暂无入库记录
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
const sortField = ref("createdAt");
const sortDir = ref<"asc" | "desc">("desc");
const searchKeyword = ref("");
const doSearch = () => {
  searchKeyword.value = keyword.value;
  page.value = 1;
};
//搜索框防抖,鉴于产品受众的设备配置不高等原因,改用手动搜索
// let debounceTimer: ReturnType<typeof setTimeout>;
// const onKeywordInput = () => {
//   clearTimeout(debounceTimer);
//   debounceTimer = setTimeout(() => {
//     page.value = 1;
//   }, 300);
// };

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
  receiptCode: searchKeyword.value,
  sortField: sortField.value,
  sortDir: sortDir.value,
}));

watch(keyword, (val) => {
  if (!val.trim()) {
    searchKeyword.value = "";
    page.value = 1;
  }
});

const { data } = await useFetch("/api/order-receipts", {
  query: queryParams,
  watch: [queryParams],
});

const items = computed(() => (data.value as any)?.data || []);
const totalPages = computed(
  () =>
    (data.value as any)?.pagination?.totalPages ||
    (data.value as any)?.totalPages ||
    1,
);
const formatDate = (d: string) => new Date(d).toLocaleDateString("zh-CN");
</script>
