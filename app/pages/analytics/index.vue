<!-- pages/analytics/index.vue -->
<template>
  <div>
    <div class="flex items-center justify-between mb-6 flex-wrap gap-2">
      <h1 class="text-xl lg:text-2xl font-bold">报表中心</h1>
      <div class="flex gap-2 flex-wrap">
        <input
          v-model="startDate"
          type="date"
          max="9999-12-30"
          class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition"
        />
        <span class="text-sm text-slate-500 self-center">至</span>
        <input
          v-model="endDate"
          type="date"
          max="9999-12-30"
          class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition"
        />
      </div>
    </div>

    <!-- Tab 切换 -->
    <div class="flex gap-1 mb-4 border-b overflow-x-auto">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        :class="[
          'px-4 py-2 text-sm font-medium transition border-b-2 -mb-px whitespace-nowrap min-h-[44px]',
          activeTab === tab.key
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-slate-500 hover:text-slate-700',
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 产量报表 -->
    <div v-if="activeTab === 'production'">
      <div class="bg-white rounded-xl shadow p-4 lg:p-5 mb-6">
        <h3 class="font-semibold text-sm text-slate-500 mb-3">产量趋势</h3>
        <div class="h-72"><canvas ref="productionChartRef"></canvas></div>
      </div>
      <div class="bg-white rounded-xl shadow p-4 lg:p-5">
        <h3 class="font-semibold text-sm text-slate-500 mb-3">产量明细</h3>
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b bg-slate-100">
                <th
                  class="text-left px-4 py-2 text-xs font-medium text-slate-500 uppercase"
                >
                  日期
                </th>
                <th
                  class="text-left px-4 py-2 text-xs font-medium text-slate-500 uppercase"
                >
                  产品
                </th>
                <th
                  class="text-right px-4 py-2 text-xs font-medium text-slate-500 uppercase"
                >
                  入库数量
                </th>
                <th
                  class="text-left px-4 py-2 text-xs font-medium text-slate-500 uppercase"
                >
                  入库单号
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="r in productionDetails"
                :key="r.id"
                class="odd:bg-white even:bg-slate-50"
              >
                <td class="px-4 py-2">{{ formatDate(r.createdAt) }}</td>
                <td class="px-4 py-2">
                  {{ r.orderItem?.product?.name || "-" }}
                </td>
                <td class="px-4 py-2 text-right font-medium">
                  {{ r.quantity }}
                </td>
                <td class="px-4 py-2 font-mono text-xs">{{ r.receiptCode }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="md:hidden space-y-2">
          <div
            v-for="r in productionDetails"
            :key="r.id"
            class="bg-slate-50 rounded-lg p-3 border"
          >
            <div class="flex justify-between text-sm">
              <span class="font-mono text-xs">{{ r.receiptCode }}</span
              ><span class="font-bold">{{ r.quantity }}</span>
            </div>
            <div class="text-xs text-slate-500">
              {{ r.orderItem?.product?.name || "-" }} ·
              {{ formatDate(r.createdAt) }}
            </div>
          </div>
        </div>
        <div
          v-if="productionDetails.length === 0"
          class="text-center py-8 text-slate-400"
        >
          暂无数据
        </div>
      </div>
    </div>

    <!-- 订单报表 -->
    <div v-if="activeTab === 'order'">
      <div class="bg-white rounded-xl shadow p-4 lg:p-5 mb-6">
        <h3 class="font-semibold text-sm text-slate-500 mb-3">订单状态分布</h3>
        <div class="h-64"><canvas ref="orderStatusChartRef"></canvas></div>
      </div>
      <div class="bg-white rounded-xl shadow p-4 lg:p-5">
        <h3 class="font-semibold text-sm text-slate-500 mb-3">订单完成进度</h3>
        <div class="space-y-3">
          <div
            v-for="o in orderCompletion"
            :key="o.orderCode"
            class="flex items-center gap-3"
          >
            <NuxtLink
              :to="`/orders/${o.id}`"
              class="w-32 text-sm font-mono text-blue-600 truncate"
              >{{ o.orderCode }}</NuxtLink
            >
            <div class="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="
                  o.percent >= 100
                    ? 'bg-green-500'
                    : o.percent >= 50
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                "
                :style="{ width: o.percent + '%' }"
              ></div>
            </div>
            <span class="text-xs text-slate-500 w-16 text-right"
              >{{ o.fulfilledQty }}/{{ o.totalQty }}</span
            >
            <span class="text-xs font-medium w-10 text-right"
              >{{ o.percent }}%</span
            >
          </div>
        </div>
        <div
          v-if="orderCompletion.length === 0"
          class="text-center py-8 text-slate-400"
        >
          暂无数据
        </div>
      </div>
    </div>

    <!-- 库存报表 -->
    <div v-if="activeTab === 'inventory'">
      <div class="bg-white rounded-xl shadow p-4 lg:p-5 mb-6">
        <h3 class="font-semibold text-sm text-slate-500 mb-3">
          总库存物料类别占比
        </h3>
        <div class="h-64"><canvas ref="inventoryChartRef"></canvas></div>
      </div>
      <div class="bg-white rounded-xl shadow p-4 lg:p-5">
        <h3 class="font-semibold text-sm text-slate-500 mb-3">
          库存变动记录（所选时间段）
        </h3>
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b bg-slate-100">
                <th
                  class="text-left px-4 py-2 text-xs font-medium text-slate-500 uppercase"
                >
                  时间
                </th>
                <th
                  class="text-left px-4 py-2 text-xs font-medium text-slate-500 uppercase"
                >
                  产品
                </th>
                <th
                  class="text-left px-4 py-2 text-xs font-medium text-slate-500 uppercase"
                >
                  类型
                </th>
                <th
                  class="text-right px-4 py-2 text-xs font-medium text-slate-500 uppercase"
                >
                  变动量
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="l in inventoryLogs"
                :key="l.id"
                class="odd:bg-white even:bg-slate-50"
              >
                <td class="px-4 py-2 text-xs">{{ formatDate(l.createdAt) }}</td>
                <td class="px-4 py-2">{{ l.product?.name || "-" }}</td>
                <td class="px-4 py-2">
                  <span
                    :class="typeBadge(l.type)"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border"
                    >{{ typeLabel(l.type) }}</span
                  >
                </td>
                <td
                  class="px-4 py-2 text-right font-medium"
                  :class="
                    Number(l.quantity) > 0 ? 'text-green-600' : 'text-red-600'
                  "
                >
                  {{ Number(l.quantity) > 0 ? "+" : "" }}{{ l.quantity }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="md:hidden space-y-2">
          <div
            v-for="l in inventoryLogs"
            :key="l.id"
            class="bg-slate-50 rounded-lg p-3 border flex justify-between items-center"
          >
            <div>
              <div class="text-sm">{{ l.product?.name || "-" }}</div>
              <div class="text-xs text-slate-400">
                {{ formatDate(l.createdAt) }}
              </div>
            </div>
            <div class="text-right">
              <span
                :class="
                  Number(l.quantity) > 0 ? 'text-green-600' : 'text-red-600'
                "
                class="font-bold"
                >{{ Number(l.quantity) > 0 ? "+" : "" }}{{ l.quantity }}</span
              >
            </div>
          </div>
        </div>
        <div
          v-if="inventoryLogs.length === 0"
          class="text-center py-8 text-slate-400"
        >
          暂无数据
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Chart, registerables } from "chart.js";
import { valueLabels } from "~~/shared/utils/labels";
Chart.register(...registerables);

definePageMeta({ middleware: ["auth" as any] });

const tabs = [
  { key: "production", label: "产量报表" },
  { key: "order", label: "订单报表" },
  { key: "inventory", label: "库存报表" },
];
const activeTab = ref("production");

const now = new Date();
const startDate = ref(
  new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
);
const endDate = ref(now.toISOString().split("T")[0]);

const dateQueryParams = computed(() => ({
  startDate: startDate.value,
  endDate: endDate.value,
}));

// ==================== 产量报表 ====================
const productionChartRef = ref<HTMLCanvasElement | null>(null);
let productionChart: Chart | null = null;

const { data: productionTrend } = await useFetch(
  "/api/analytics/monthly-production",
  {
    query: dateQueryParams,
    watch: [dateQueryParams],
  },
);

const { data: productionDetailsRaw } = await useFetch("/api/order-receipts", {
  query: computed(() => ({
    limit: 50,
    startDate: startDate.value,
    endDate: endDate.value,
  })),
  watch: [startDate, endDate],
});
const productionDetails = computed(
  () => (productionDetailsRaw.value as any)?.data || [],
);

watch(
  [productionTrend, productionChartRef],
  () => {
    if (!productionChartRef.value || !productionTrend.value) return;
    if (productionChart) productionChart.destroy();
    const raw = (productionTrend.value as any)?.data || {
      dates: [],
      datasets: [],
    };
    productionChart = new Chart(productionChartRef.value, {
      type: "bar",
      data: {
        labels:
          raw.dates?.map((d: string) => {
            const [_, m, day] = d.split("-");
            return `${parseInt(m!)}月${parseInt(day!)}日`;
          }) || [],
        datasets: raw.datasets || [
          { label: "产量", data: [], backgroundColor: "#3b82f6" },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              title: (items) => {
                if (!items.length) return "";
                const idx = items[0]!.dataIndex;
                const fullDate = raw.dates?.[idx] || "";
                const [y, m, d] = fullDate.split("-");
                return `${y}年${parseInt(m!)}月${parseInt(d!)}日`;
              },
              label: (item) => {
                const total =
                  raw.datasets?.reduce(
                    (s: number, ds: any) => s + (ds.data[item.dataIndex] || 0),
                    0,
                  ) || 0;
                return `${item.dataset.label}: ${item.raw} (当日合计: ${total})`;
              },
            },
          },
        },
        scales: {
          x: { stacked: true, ticks: { maxTicksLimit: 15, autoSkip: true } },
          y: { stacked: true, beginAtZero: true },
        },
      },
    });
  },
  { immediate: true },
);

// ==================== 订单报表 ====================
const orderStatusChartRef = ref<HTMLCanvasElement | null>(null);
let orderStatusChart: Chart | null = null;

const { data: orderSummary } = await useFetch("/api/analytics/order-summary", {
  query: dateQueryParams,
  watch: [dateQueryParams],
});
const { data: orderProgressData } = await useFetch(
  "/api/analytics/order-progress",
  {
    query: dateQueryParams,
    watch: [dateQueryParams],
  },
);
const orderCompletion = computed(
  () => (orderProgressData.value as any)?.data || [],
);

watch(
  [orderSummary, orderStatusChartRef],
  () => {
    if (!orderStatusChartRef.value || !orderSummary.value) return;
    if (orderStatusChart) orderStatusChart.destroy();
    const raw = (orderSummary.value as any)?.items || [];
    const colors: Record<string, string> = {
      PENDING: "#f59e0b",
      APPROVED: "#3b82f6",
      PRODUCING: "#8b5cf6",
      READY: "#06b6d4",
      COMPLETED: "#10b981",
      CANCELLED: "#ef4444",
    };
    orderStatusChart = new Chart(orderStatusChartRef.value, {
      type: "bar",
      data: {
        labels: raw.map((i: any) => statusLabel(i.status)),
        datasets: [
          {
            label: "订单数",
            data: raw.map((i: any) => i.count),
            backgroundColor: raw.map((i: any) => colors[i.status] || "#6b7280"),
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });
  },
  { immediate: true },
);

// ==================== 库存报表 ====================
const inventoryChartRef = ref<HTMLCanvasElement | null>(null);
let inventoryChart: Chart | null = null;

const { data: categoryData } = await useFetch(
  "/api/analytics/inventory-category",
);
const { data: inventoryLogsRaw } = await useFetch("/api/inventory-logs", {
  query: computed(() => ({
    limit: 20,
    startDate: startDate.value,
    endDate: endDate.value,
  })),
  watch: [startDate, endDate],
});
const inventoryLogs = computed(
  () => (inventoryLogsRaw.value as any)?.data || [],
);

watch(
  [categoryData, inventoryChartRef],
  () => {
    if (!inventoryChartRef.value || !categoryData.value) return;
    if (inventoryChart) inventoryChart.destroy();
    const raw = (categoryData.value as any)?.data || [];
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#6b7280"];
    inventoryChart = new Chart(inventoryChartRef.value, {
      type: "doughnut",
      data: {
        labels: raw.map((d: any) => d.category),
        datasets: [
          {
            data: raw.map((d: any) => d.qty),
            backgroundColor: colors.slice(0, raw.length),
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } },
      },
    });
  },
  { immediate: true },
);

onUnmounted(() => {
  productionChart?.destroy();
  orderStatusChart?.destroy();
  inventoryChart?.destroy();
});

const statusLabel = (s: string) =>
  ({
    PENDING: "待审核",
    APPROVED: "已审核",
    SAMPLING: "打样中",
    SAMPLED: "打样完成",
    PRODUCING: "生产中",
    READY: "备货完成",
    COMPLETED: "已完成",
    CANCELLED: "已取消",
  })[s] || s;
const typeLabel = (t: string) => valueLabels.logRelatedType?.[t] || t;
const typeBadge = (t: string) => {
  const isIn = [
    "INIT",
    "PURCHASE_IN",
    "PRODUCTION_IN",
    "RETURN_IN",
    "TRANSFER_IN",
    "CHECK_IN",
  ].includes(t);
  const isOut = [
    "SALES_OUT",
    "PRODUCTION_OUT",
    "SAMPLE_OUT",
    "SCRAP_OUT",
    "TRANSFER_OUT",
    "CHECK_OUT",
    "ALLOCATE",
  ].includes(t);
  if (isIn) return "bg-green-100 text-green-800 border-green-300";
  if (isOut) return "bg-red-100 text-red-800 border-red-300";
  return "bg-slate-100 text-slate-600 border-slate-300";
};
const formatDate = (d: string) => new Date(d).toLocaleDateString("zh-CN");
</script>
