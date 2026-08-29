<template>
  <div>
    <h1 class="text-xl lg:text-2xl font-bold mb-6">库存流水</h1>

    <!-- 筛选区 -->
    <div class="flex flex-wrap gap-3 mb-4">
      <input
        v-model="keyword"
        @keydown.enter="doSearch"
        placeholder="搜索产品/单号/备注..."
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition w-full sm:w-56"
      />
      <button
        @click="doSearch"
        class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
      >
        搜索
      </button>
      <select
        v-model="typeFilter"
        @change="page = 1"
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
      >
        <option value="">全部类型</option>
        <option v-for="(label, value) in typeMap" :key="value" :value="value">
          {{ label }}
        </option>
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
    </div>

    <!-- 桌面端表格 -->
    <div class="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full min-w-[900px] whitespace-nowrap">
        <thead>
          <tr class="border-b bg-slate-100">
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              时间
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              类型
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              产品
            </th>
            <th
              class="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              变动量
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              关联单号
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              操作人
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              备注
            </th>
            <th
              class="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              详情
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr
            v-for="l in items"
            :key="l.id"
            class="hover:bg-blue-50/30 even:bg-slate-50/50 transition"
          >
            <td class="px-4 py-3 text-sm text-slate-600">
              {{ formatDate(l.createdAt) }}
            </td>
            <td class="px-4 py-3 text-sm">
              <span
                :class="typeBadge(l.type)"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
              >
                {{ typeIcon(l.type) }} {{ typeLabel(l.type) }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm">
              <span class="font-mono text-xs text-slate-400">{{
                l.product?.code || l.productId?.substring(0, 8) + "..."
              }}</span>
              <span class="ml-1">{{ l.product?.name || "-" }}</span>
            </td>
            <td
              class="px-4 py-3 text-sm text-right font-medium"
              :class="
                Number(l.quantity) > 0 ? 'text-green-600' : 'text-red-600'
              "
            >
              {{ Number(l.quantity) > 0 ? "+" : "" }}{{ l.quantity }}
            </td>
            <td class="px-4 py-3 text-sm font-mono text-slate-500">
              {{ l.relatedCode || "-" }}
            </td>
            <td class="px-4 py-3 text-sm">
              {{ l.operator?.badgeCode || l.operatorId
              }}{{ l.operator?.name ? `-${l.operator.name}` : "" }}
            </td>
            <td class="px-4 py-3 text-sm text-slate-500 max-w-[180px] truncate">
              {{ l.remark || "-" }}
            </td>
            <td class="px-4 py-3 text-sm text-center">
              <button
                @click="openDetail(l)"
                class="text-blue-600 hover:text-blue-800 text-xs font-medium min-h-[36px]"
              >
                查看
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 移动端卡片 -->
    <div class="md:hidden space-y-3">
      <div
        v-for="l in items"
        :key="l.id"
        class="bg-white rounded-xl shadow p-4 space-y-2"
      >
        <div class="flex items-center justify-between">
          <span
            :class="typeBadge(l.type)"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
          >
            {{ typeIcon(l.type) }} {{ typeLabel(l.type) }}
          </span>
          <span class="text-xs text-slate-400">{{
            formatDate(l.createdAt)
          }}</span>
        </div>
        <div class="text-sm">
          <span class="font-mono text-xs text-slate-400">{{
            l.productCode
          }}</span>
          <span class="font-medium">{{ l.productName }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span
            class="font-medium"
            :class="Number(l.quantity) > 0 ? 'text-green-600' : 'text-red-600'"
            >{{ Number(l.quantity) > 0 ? "+" : "" }}{{ l.quantity }}</span
          >
          <span class="text-xs text-slate-400">{{ l.relatedCode || "-" }}</span>
        </div>
        <div class="flex items-center justify-between text-xs text-slate-500">
          <span>操作人：{{ l.operatorBadge }}</span>
          <button @click="openDetail(l)" class="text-blue-600 font-medium">
            详情
          </button>
        </div>
      </div>
    </div>

    <div v-if="items.length === 0" class="text-center py-12 text-slate-400">
      暂无流水记录
    </div>

    <!-- 分页 -->
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

    <!-- 详情弹窗 -->
    <div
      v-if="showDetailModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showDetailModal = false"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[85vh] overflow-auto"
      >
        <h2 class="text-lg font-bold mb-4">流水详情</h2>
        <dl class="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt class="text-xs text-slate-400 mb-0.5">类型</dt>
            <dd>
              <span
                :class="typeBadge(detail?.type)"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border"
                >{{ typeIcon(detail?.type) }}
                {{ typeLabel(detail?.type) }}</span
              >
            </dd>
          </div>
          <div>
            <dt class="text-xs text-slate-400 mb-0.5">时间</dt>
            <dd>{{ formatDate(detail?.createdAt) }}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-400 mb-0.5">产品编号</dt>
            <dd class="font-mono">{{ detail?.product.code }}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-400 mb-0.5">产品名</dt>
            <dd>{{ detail?.product.name }}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-400 mb-0.5">库位</dt>
            <dd>
              {{
                detail?.location?.code
                  ? `${detail.location.code} ${detail.location.name || ""}`
                  : "未指定"
              }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-slate-400 mb-0.5">变动量</dt>
            <dd
              class="font-medium"
              :class="
                Number(detail?.quantity) > 0 ? 'text-green-600' : 'text-red-600'
              "
            >
              {{ detail?.quantity }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-slate-400 mb-0.5">关联单号</dt>
            <dd class="font-mono">{{ detail?.relatedCode || "-" }}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-400 mb-0.5">变动前</dt>
            <dd>{{ detail?.beforeQty }}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-400 mb-0.5">变动后</dt>
            <dd>{{ detail?.afterQty }}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-400 mb-0.5">操作人</dt>
            <dd>
              {{ detail?.operator.badgeCode }}-{{ detail?.operator.name }}
            </dd>
          </div>
          <div class="lg:col-span-2">
            <dt class="text-xs text-slate-400 mb-0.5">备注</dt>
            <dd class="text-xs">{{ detail?.remark || "-" }}</dd>
          </div>
        </dl>
        <button
          @click="showDetailModal = false"
          class="mt-6 w-full min-h-[44px] border py-2 rounded-lg hover:bg-slate-50 transition text-sm"
        >
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth" as any] });

const showDetailModal = ref(false);
const detail = ref<any>(null);
const openDetail = (log: any) => {
  detail.value = log;
  showDetailModal.value = true;
};

const page = ref(1);
const limit = 20;
const keyword = ref("");
const typeFilter = ref("");
const startDate = ref("");
const endDate = ref("");
const searchKeyword = ref("");
const doSearch = () => {
  searchKeyword.value = keyword.value;
  page.value = 1;
};

const queryParams = computed(() => ({
  page: page.value,
  limit,
  keyword: searchKeyword.value,
  type: typeFilter.value,
  startDate: startDate.value,
  endDate: endDate.value,
}));

watch(keyword, (val) => {
  if (!val.trim()) {
    searchKeyword.value = "";
    page.value = 1;
  }
});

const { data } = await useFetch("/api/inventory-logs", {
  query: queryParams,
  watch: [queryParams],
});

const items = computed(() => (data.value as any)?.data || []);
const totalPages = computed(() => (data.value as any)?.totalPages || 1);

const typeMap: Record<string, string> = {
  INIT: "初始化",
  PURCHASE_IN: "采购入库",
  PRODUCTION_IN: "生产入库",
  RETURN_IN: "退货入库",
  TRANSFER_IN: "调拨入库",
  CHECK_IN: "盘盈入库",
  SALES_OUT: "销售出库",
  PRODUCTION_OUT: "生产领料",
  SAMPLE_OUT: "打样领料",
  SCRAP_OUT: "报废出库",
  TRANSFER_OUT: "调拨出库",
  CHECK_OUT: "盘亏出库",
  REVERSAL: "红冲",
  OTHER: "其他",
  ALLOCATE: "调配",
  DEALLOCATE: "撤回调配",
};

const typeLabel = (t: string) => typeMap[t] || t;

const typeIcon = (t: string) => {
  const m: Record<string, string> = {
    INIT: "🏁",
    PURCHASE_IN: "📥",
    PRODUCTION_IN: "🏭",
    RETURN_IN: "↩️",
    TRANSFER_IN: "📦",
    CHECK_IN: "➕",
    SALES_OUT: "📤",
    PRODUCTION_OUT: "🔧",
    SAMPLE_OUT: "🔬",
    SCRAP_OUT: "🗑️",
    TRANSFER_OUT: "📦",
    CHECK_OUT: "➖",
    REVERSAL: "↩️",
    ALLOCATE: "📋",
  };
  return m[t] || "📌";
};

const typeBadge = (t: string) => {
  const isIn = [
    "PURCHASE_IN",
    "PRODUCTION_IN",
    "RETURN_IN",
    "TRANSFER_IN",
    "CHECK_IN",
    "INIT",
    "REVERSAL",
  ].includes(t);
  const isOut = [
    "SALES_OUT",
    "PRODUCTION_OUT",
    "SAMPLE_OUT",
    "SCRAP_OUT",
    "TRANSFER_OUT",
    "CHECK_OUT",
  ].includes(t);
  if (isIn) return "bg-green-100 text-green-800 border-green-300";
  if (isOut) return "bg-red-100 text-red-800 border-red-300";
  return "bg-slate-100 text-slate-600 border-slate-300";
};

const formatDate = (d: string) => new Date(d).toLocaleString("zh-CN");
</script>
