<template>
  <div>
    <h1 class="text-xl lg:text-2xl font-bold mb-4">仓管工作台</h1>

    <!-- 单号直达 -->
    <div class="bg-white rounded-xl shadow p-4 mb-6">
      <label class="block text-sm font-medium text-slate-700 mb-2">
        🔍 单号直达
        <span class="text-xs text-slate-400 font-normal ml-1">
          （采购单 / 订单 / 入库单，回车搜索）
        </span>
      </label>
      <div class="flex gap-2">
        <input
          v-model="searchQuery"
          @keydown.enter="doSearch"
          placeholder="输入单号，如 PO-20250001 / RC-20250003"
          class="flex-1 min-h-[48px] border border-slate-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
        />
        <button
          @click="doSearch"
          :disabled="searching"
          class="min-h-[48px] px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50"
        >
          {{ searching ? "搜索中..." : "搜索" }}
        </button>
      </div>

      <!-- 搜索结果 -->
      <div v-if="searchResults.length > 0" class="mt-3 space-y-1">
        <button
          v-for="r in searchResults"
          :key="r.to"
          @click="navigateTo(r.to)"
          class="w-full text-left px-4 py-3 rounded-lg text-sm hover:bg-blue-50 transition border border-slate-200 flex items-center gap-3"
        >
          <span
            :class="typeBadge(r.type)"
            class="px-2 py-0.5 rounded text-xs font-medium shrink-0"
          >
            {{ typeLabel(r.type) }}
          </span>
          <span class="font-mono font-medium">{{ r.code }}</span>
          <span class="text-slate-500 text-xs truncate">{{ r.summary }}</span>
          <span class="ml-auto text-blue-600 text-xs shrink-0">查看 →</span>
        </button>
      </div>
      <p v-else-if="searched && !searching" class="mt-3 text-sm text-slate-400">
        未找到匹配的单号
      </p>
    </div>

    <!-- 大卡片 -->
    <h2 class="font-semibold text-sm text-slate-500 mb-3">常用操作</h2>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <NuxtLink
        to="/purchase-orders?status=APPROVED"
        class="group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl shadow-sm hover:shadow-md p-5 transition-all border border-blue-200/50"
      >
        <div
          class="text-3xl mb-2 group-hover:scale-110 transition-transform origin-left"
        >
          📥
        </div>
        <div class="font-semibold text-slate-800">采购收货</div>
        <div class="text-xs text-slate-500 mt-1">已审批待入库</div>
      </NuxtLink>
      <!-- 主卡片：待入库的订单列表（生产完工后入库的动作入口） -->
      <NuxtLink
        to="/orders?status=PRODUCING"
        class="group bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 rounded-xl shadow-sm hover:shadow-md p-5 transition-all border border-emerald-200/50"
      >
        <div
          class="text-3xl mb-2 group-hover:scale-110 transition-transform origin-left"
        >
          🏭
        </div>
        <div class="font-semibold text-slate-800">生产入库</div>
        <div class="text-xs text-slate-500 mt-1">待入库的完工订单</div>
      </NuxtLink>

      <!-- 原"销售出库"卡片，改为"发货"，指向预打开订单选择的出库弹窗 -->
      <NuxtLink
        to="/inventory?action=out&type=SALES_OUT&pickOrder=1"
        class="group bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-xl shadow-sm hover:shadow-md p-5 transition-all border border-orange-200/50"
      >
        <div
          class="text-3xl mb-2 group-hover:scale-110 transition-transform origin-left"
        >
          🚚
        </div>
        <div class="font-semibold text-slate-800">发货</div>
        <div class="text-xs text-slate-500 mt-1">选订单直接发货出库</div>
      </NuxtLink>
      <NuxtLink
        to="/inventory/outbound?type=PRODUCTION_OUT"
        class="group bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 rounded-xl shadow-sm hover:shadow-md p-5 transition-all border border-amber-200/50"
      >
        <div
          class="text-3xl mb-2 group-hover:scale-110 transition-transform origin-left"
        >
          🧰
        </div>
        <div class="font-semibold text-slate-800">生产领料</div>
        <div class="text-xs text-slate-500 mt-1">车间领用材料</div>
      </NuxtLink>
      <NuxtLink
        to="/inventory"
        class="group bg-gradient-to-br from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 rounded-xl shadow-sm hover:shadow-md p-5 transition-all border border-slate-200/50"
      >
        <div
          class="text-3xl mb-2 group-hover:scale-110 transition-transform origin-left"
        >
          🔁
        </div>
        <div class="font-semibold text-slate-800">库位调拨</div>
        <div class="text-xs text-slate-500 mt-1">进入库存管理操作</div>
      </NuxtLink>
      <NuxtLink
        to="/inventory"
        class="group bg-gradient-to-br from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200 rounded-xl shadow-sm hover:shadow-md p-5 transition-all border border-cyan-200/50"
      >
        <div
          class="text-3xl mb-2 group-hover:scale-110 transition-transform origin-left"
        >
          📦
        </div>
        <div class="font-semibold text-slate-800">库存总览</div>
        <div class="text-xs text-slate-500 mt-1">全部产品库存</div>
      </NuxtLink>
      <NuxtLink
        to="/locations/search"
        class="group bg-gradient-to-br from-violet-50 to-violet-100 hover:from-violet-100 hover:to-violet-200 rounded-xl shadow-sm hover:shadow-md p-5 transition-all border border-violet-200/50"
      >
        <div
          class="text-3xl mb-2 group-hover:scale-110 transition-transform origin-left"
        >
          📍
        </div>
        <div class="font-semibold text-slate-800">库位查询</div>
        <div class="text-xs text-slate-500 mt-1">按产品查库位</div>
      </NuxtLink>
      <NuxtLink
        to="/inventory-alerts"
        class="group bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 rounded-xl shadow-sm hover:shadow-md p-5 transition-all border border-red-200/50"
      >
        <div
          class="text-3xl mb-2 group-hover:scale-110 transition-transform origin-left"
        >
          ⚠️
        </div>
        <div class="font-semibold text-slate-800">库存预警</div>
        <div class="text-xs text-slate-500 mt-1">低库存物料</div>
      </NuxtLink>
    </div>
    <!-- 放在大卡片区之后、预警速览之前 -->
    <div class="flex gap-4 mb-6 text-sm">
      <NuxtLink to="/receipts" class="text-blue-600 hover:text-blue-800">
        📜 查看全部入库记录 →
      </NuxtLink>
      <NuxtLink to="/inventory-logs" class="text-blue-600 hover:text-blue-800">
        📋 库存流水 →
      </NuxtLink>
    </div>
    <!-- 库存预警速览 -->
    <div class="bg-white rounded-xl shadow p-4 lg:p-5">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-semibold text-sm text-slate-500">⚠️ 预警速览</h2>
        <NuxtLink
          to="/inventory-alerts"
          class="text-xs text-blue-600 hover:text-blue-800"
        >
          全部 →
        </NuxtLink>
      </div>
      <div v-if="alertsLoading" class="text-sm text-slate-400 text-center py-4">
        加载中...
      </div>
      <div
        v-else-if="alerts.length === 0"
        class="text-sm text-slate-400 text-center py-4"
      >
        暂无预警，库存充足 ✅
      </div>
      <div v-else class="space-y-2">
        <div
          v-for="a in alerts.slice(0, 5)"
          :key="a.id"
          class="flex items-center justify-between text-sm py-2 border-b last:border-0"
        >
          <div class="min-w-0 flex-1">
            <span class="font-mono text-xs text-slate-400 mr-2">{{
              a.product?.code
            }}</span>
            <span class="font-medium">{{ a.product?.name }}</span>
          </div>
          <div class="text-right shrink-0 ml-3">
            <span class="text-red-600 font-bold">{{ a.currentQuantity }}</span>
            <span class="text-slate-400 text-xs">
              / 安全线 {{ a.threshold }}</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const toast = useToast();
const { apiFetch } = useApi();

// ====== 单号直达 ======
const searchQuery = ref("");
const searchResults = ref<any[]>([]);
const searching = ref(false);
const searched = ref(false);

const typeLabel = (t: string) =>
  ({ order: "订单", purchase: "采购", receipt: "入库" })[t] || t;
const typeBadge = (t: string) => {
  const m: Record<string, string> = {
    order: "bg-blue-100 text-blue-700",
    purchase: "bg-purple-100 text-purple-700",
    receipt: "bg-emerald-100 text-emerald-700",
  };
  return m[t] || "bg-slate-100 text-slate-700";
};

const doSearch = async () => {
  const q = searchQuery.value.trim();
  if (!q) return;
  searching.value = true;
  searched.value = false;
  searchResults.value = [];

  const [orders, purchases, receipts] = await Promise.allSettled([
    apiFetch<any>(`/api/orders?keyword=${encodeURIComponent(q)}&limit=5`),
    apiFetch<any>(
      `/api/purchase-orders?keyword=${encodeURIComponent(q)}&limit=5`,
    ),
    apiFetch<any>(
      `/api/order-receipts?receiptCode=${encodeURIComponent(q)}&limit=5`,
    ),
  ]);

  const results: any[] = [];
  if (orders.status === "fulfilled") {
    (orders.value?.data || []).forEach((o: any) =>
      results.push({
        type: "order",
        code: o.orderCode,
        summary: o.customer?.name || "-",
        to: `/orders/${o.id}`,
      }),
    );
  }
  if (purchases.status === "fulfilled") {
    (purchases.value?.data || []).forEach((p: any) =>
      results.push({
        type: "purchase",
        code: p.orderCode,
        summary: p.supplier?.name || "-",
        to: `/purchase-orders/${p.id}`,
      }),
    );
  }
  if (receipts.status === "fulfilled") {
    (receipts.value?.data || []).forEach((r: any) =>
      results.push({
        type: "receipt",
        code: r.receiptCode,
        summary: r.orderItem?.product?.name || "-",
        to: `/receipts/${r.id}`,
      }),
    );
  }

  searchResults.value = results;
  searched.value = true;
  searching.value = false;

  // 唯一结果自动跳转
  if (results.length === 1) {
    await navigateTo(results[0].to);
  } else if (results.length === 0) {
    toast.error("未找到匹配的单号");
  }
};

// ====== 库存预警速览 ======
const alerts = ref<any[]>([]);
const alertsLoading = ref(true);

const loadAlerts = async () => {
  try {
    const res = await apiFetch<any>("/api/inventory-alerts");
    const all = res.data || [];
    alerts.value = all.filter((a: any) => a.isBelowThreshold);
  } catch {
    alerts.value = [];
  } finally {
    alertsLoading.value = false;
  }
};

onMounted(() => {
  loadAlerts();
});
</script>
