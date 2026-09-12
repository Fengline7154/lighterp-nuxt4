<!-- pages/index.vue -->
<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl lg:text-2xl font-bold">工作台</h1>
      <div class="flex items-center gap-3">
        <div class="flex gap-1 bg-slate-100 rounded-lg p-0.5">
          <button
            v-for="p in periods"
            :key="p.key"
            @click="period = p.key"
            :class="[
              'px-3 py-1.5 text-xs rounded-md transition min-h-[32px]',
              period === p.key
                ? 'bg-white shadow text-slate-900 font-medium'
                : 'text-slate-500 hover:text-slate-700',
            ]"
          >
            {{ p.label }}
          </button>
        </div>
        <span
          v-if="authStore.lastLoginAt"
          class="text-xs text-slate-400 hidden sm:inline"
          >上次登录:
          {{ new Date(authStore.lastLoginAt).toLocaleString("zh-CN") }}</span
        >
      </div>
    </div>

    <!-- 核心指标 -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <div
        v-if="showPendingOrders"
        class="bg-white rounded-xl shadow p-4 lg:p-5"
      >
        <p class="text-slate-500 text-sm">待审核订单</p>
        <p class="text-2xl lg:text-3xl font-bold mt-2">
          {{ dashboard?.pendingOrders ?? "-" }}
        </p>
        <p class="text-xs text-slate-400 mt-1">笔待处理</p>
      </div>
      <div v-if="showProducing" class="bg-white rounded-xl shadow p-4 lg:p-5">
        <p class="text-slate-500 text-sm">生产中</p>
        <p class="text-2xl lg:text-3xl font-bold mt-2">
          {{ dashboard?.producingOrders ?? "-" }}
        </p>
        <p class="text-xs text-slate-400 mt-1">
          今日入库 {{ dashboard?.todayInbound ?? 0 }} 件
        </p>
      </div>
      <NuxtLink
        v-if="showLowStock"
        to="/inventory-alerts"
        class="bg-white rounded-xl shadow p-4 lg:p-5 hover:shadow-md transition block"
      >
        <p class="text-slate-500 text-sm">库存预警</p>
        <p class="text-2xl lg:text-3xl font-bold mt-2 text-red-500">
          {{ dashboard?.lowStock ?? "-" }}
        </p>
        <p class="text-xs text-slate-400 mt-1">个物料低于安全线</p>
      </NuxtLink>
      <NuxtLink
        v-if="showShortage"
        to="/shortage"
        class="bg-white rounded-xl shadow p-4 lg:p-5 hover:shadow-md transition block"
      >
        <p class="text-slate-500 text-sm">缺料预警</p>
        <p class="text-2xl lg:text-3xl font-bold mt-2 text-red-500">
          {{ shortageCount ?? "-" }}
        </p>
        <p class="text-xs text-slate-400 mt-1">种物料待采购</p>
      </NuxtLink>
    </div>

    <!-- 快捷入口 -->
    <div class="grid grid-cols-4 md:grid-cols-8 gap-2 mb-6">
      <NuxtLink
        v-for="entry in quickEntries"
        :key="entry.to"
        :to="entry.to"
        class="bg-white rounded-xl shadow p-3 hover:shadow-md transition text-center flex flex-col items-center gap-1"
      >
        <span class="text-xl">{{ entry.icon }}</span>
        <span class="text-xs text-slate-600">{{ entry.label }}</span>
      </NuxtLink>
    </div>

    <!-- 图表区 -->
    <div v-if="showCharts" class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <div class="bg-white rounded-xl shadow p-4 lg:p-5">
        <h3 class="font-semibold text-sm text-slate-500 mb-3">本月产量趋势</h3>
        <div class="h-64"><canvas ref="productionChartRef"></canvas></div>
      </div>
      <div class="bg-white rounded-xl shadow p-4 lg:p-5">
        <h3 class="font-semibold text-sm text-slate-500 mb-3">库存分类占比</h3>
        <div class="h-64"><canvas ref="categoryChartRef"></canvas></div>
      </div>
    </div>

    <!-- 进行中订单进度 -->
    <div class="bg-white rounded-xl shadow p-4 lg:p-5">
      <h3 class="font-semibold text-sm text-slate-500 mb-3">进行中订单进度</h3>
      <div
        v-if="orderProgress.length === 0"
        class="text-center py-8 text-slate-400"
      >
        暂无进行中订单
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="o in orderProgress"
          :key="o.id"
          class="flex items-center gap-3"
        >
          <NuxtLink
            :to="`/orders/${o.id}`"
            class="w-32 text-sm font-mono text-blue-600 hover:text-blue-800 truncate"
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
          <span
            class="text-xs font-medium w-10 text-right"
            :class="o.percent >= 100 ? 'text-green-600' : 'text-slate-600'"
            >{{ o.percent }}%</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Chart, registerables } from "chart.js";

definePageMeta({ middleware: ["auth" as any] });

const authStore = useAuthStore();

Chart.register(...registerables);

// ==================== 基础状态 ====================
const period = ref("month");
const periods = [
  { key: "week", label: "周" },
  { key: "month", label: "月" },
  { key: "year", label: "年" },
];

// ==================== 权限控制 ====================
const showCharts = computed(() =>
  authStore.hasRole([
    "admin",
    "manager",
    "seniorStaff",
    "warehouseKeeper",
    "accountant",
  ]),
);

const showPendingOrders = computed(() =>
  authStore.hasRole(["admin", "manager", "seniorStaff", "staff", "accountant"]),
);

const showProducing = computed(() =>
  authStore.hasRole(["admin", "manager", "seniorStaff", "staff"]),
);

const showLowStock = computed(() =>
  authStore.hasRole(["admin", "manager", "warehouseKeeper"]),
);

const showShortage = computed(() =>
  authStore.hasRole(["admin", "manager", "warehouseKeeper"]),
);

// ==================== 快捷入口 ====================
const quickEntries = computed(() => {
  const all = [
    {
      to: "/orders",
      icon: "📋",
      label: "订单",
      roles: [
        "admin",
        "manager",
        "seniorStaff",
        "staff",
        "accountant",
        "warehouseKeeper",
      ],
    },
    {
      to: "/inventory",
      icon: "📦",
      label: "库存",
      roles: ["admin", "manager", "warehouseKeeper"],
    },
    { to: "/bom", icon: "🔧", label: "BOM", roles: ["admin", "manager"] },
    {
      to: "/products",
      icon: "🏷️",
      label: "产品",
      roles: ["admin", "manager", "warehouseKeeper"],
    },
    { to: "/users", icon: "👥", label: "用户", roles: ["admin"] },
    {
      to: "/processes",
      icon: "🏭",
      label: "工序",
      roles: ["admin", "manager", "seniorStaff"],
    },
    {
      to: "/analytics",
      icon: "📊",
      label: "报表",
      roles: [
        "admin",
        "manager",
        "seniorStaff",
        "warehouseKeeper",
        "accountant",
      ],
    },
    { to: "/audit-logs", icon: "📝", label: "审计", roles: ["admin"] },
  ];
  return all.filter((e) => authStore.hasRole(e.roles));
});

// ==================== 数据加载 ====================
const dashboard = ref<any>(null);
const shortageData = ref<any>(null);
const orderProgressData = ref<any>(null);
const productionData = ref<any>(null);
const categoryData = ref<any>(null);

const shortageCount = computed(
  () => (shortageData.value as any)?.shortages?.length ?? null,
);

const orderProgress = computed(
  () => (orderProgressData.value as any)?.data || [],
);

const loadDashboard = async () => {
  try {
    dashboard.value = await $fetch("/api/analytics/dashboard");
  } catch {
    dashboard.value = null;
  }
};

const loadShortage = async () => {
  try {
    shortageData.value = await $fetch("/api/analytics/shortage");
  } catch {
    shortageData.value = null;
  }
};

const loadOrderProgress = async () => {
  try {
    orderProgressData.value = await $fetch("/api/analytics/order-progress");
  } catch {
    orderProgressData.value = null;
  }
};

const loadProductionData = async () => {
  try {
    productionData.value = await $fetch(
      "/api/analytics/monthly-production-summary",
      { query: { period: period.value } },
    );
  } catch {
    productionData.value = null;
  }
};

const loadCategoryData = async () => {
  try {
    categoryData.value = await $fetch("/api/analytics/inventory-category");
  } catch {
    categoryData.value = null;
  }
};

// ==================== 按权限按需加载 ====================
watch(
  () => authStore.user,
  async (user) => {
    if (!user) return;

    const loadTasks: Promise<void>[] = [];

    // 核心指标：有待审核、生产中、库存预警、缺料任一权限就加载
    if (
      showPendingOrders.value ||
      showProducing.value ||
      showLowStock.value ||
      showShortage.value
    ) {
      loadTasks.push(loadDashboard());
    }

    // 缺料预警：有权限才加载
    if (showShortage.value) {
      loadTasks.push(loadShortage());
    }

    // 订单进度：有待审核、生产中、缺料任一权限就加载
    if (showPendingOrders.value || showProducing.value || showShortage.value) {
      loadTasks.push(loadOrderProgress());
    }

    // 图表：有图表权限才加载
    if (showCharts.value) {
      loadTasks.push(loadProductionData());
      loadTasks.push(loadCategoryData());
    }

    await Promise.all(loadTasks);
  },
  { immediate: true },
);

// 周期切换时重新加载产量数据（仅在有图表权限时）
watch(period, () => {
  if (showCharts.value) {
    loadProductionData();
  }
});

// ==================== 图表渲染 ====================
const productionChartRef = ref<HTMLCanvasElement | null>(null);
const categoryChartRef = ref<HTMLCanvasElement | null>(null);
let productionChart: Chart | null = null;
let categoryChart: Chart | null = null;

// 产量趋势图
watch(
  [productionData, productionChartRef],
  () => {
    if (!productionChartRef.value || !productionData.value) return;
    if (productionChart) productionChart.destroy();
    const raw = (productionData.value as any)?.data || [];
    productionChart = new Chart(productionChartRef.value, {
      type: "line",
      data: {
        labels: raw.map((d: any) =>
          period.value === "year" ? d.date : d.date.slice(5),
        ),
        datasets: [
          {
            label: "产量",
            data: raw.map((d: any) => d.qty),
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59,130,246,0.1)",
            fill: true,
            tension: 0.3,
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

// 库存分类图
watch(
  [categoryData, categoryChartRef],
  () => {
    if (!categoryChartRef.value || !categoryData.value) return;
    if (categoryChart) categoryChart.destroy();
    const raw = (categoryData.value as any)?.data || [];
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#6b7280"];
    categoryChart = new Chart(categoryChartRef.value, {
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

// ==================== 清理 ====================
onUnmounted(() => {
  productionChart?.destroy();
  categoryChart?.destroy();
});
</script>
