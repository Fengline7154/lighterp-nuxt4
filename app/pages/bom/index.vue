<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-xl lg:text-2xl font-bold">BOM 管理</h1>
      <NuxtLink
        to="/bom/create"
        class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm flex items-center"
        >+ 创建 BOM</NuxtLink
      >
    </div>

    <!-- 筛选区 -->
    <div class="flex flex-wrap gap-3 mb-4">
      <input
        v-model="keyword"
        @keydown.enter="doSearch"
        placeholder="搜索 BOM 编号 / 产品名..."
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
        <option value="DRAFT">草稿</option>
        <option value="PUBLISHED">已发布</option>
        <option value="OBSOLETED">已废弃</option>
      </select>
      <label
        class="flex items-center gap-2 text-sm text-slate-600 min-h-[44px] px-2 cursor-pointer"
      >
        <input
          type="checkbox"
          v-model="showAll"
          @change="page = 1"
          class="w-4 h-4 rounded"
        />
        查看全部版本
      </label>
    </div>

    <!-- 桌面端：表格 -->
    <div class="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full min-w-[700px] whitespace-nowrap">
        <thead>
          <tr class="border-b bg-slate-100">
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase cursor-pointer select-none"
              @click="toggleSort('bomCode')"
            >
              BOM 编号 {{ sortIcon("bomCode") }}
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              产品名
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase cursor-pointer select-none"
              @click="toggleSort('version')"
            >
              版本 {{ sortIcon("version") }}
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              状态
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              物料数
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
            v-for="bom in items"
            :key="bom.id"
            class="hover:bg-blue-50/30 even:bg-slate-50/50 transition"
          >
            <td class="px-4 py-3 text-sm font-mono">{{ bom.bomCode }}</td>
            <td class="px-4 py-3 text-sm font-medium">
              {{ bom.product?.name || bom.productName }}
            </td>
            <td class="px-4 py-3 text-sm">V{{ bom.version }}</td>
            <td class="px-4 py-3 text-sm">
              <span
                :class="statusBadge(bom.status)"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
              >
                {{ statusIcon(bom.status) }} {{ statusLabel(bom.status) }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm">{{ bom._count?.items ?? 0 }}</td>
            <td class="px-4 py-3 text-sm text-slate-500">
              {{ formatDate(bom.createdAt) }}
            </td>
            <td class="px-4 py-3 text-sm text-center">
              <NuxtLink
                :to="`/bom/${bom.id}`"
                class="text-blue-600 hover:text-blue-800 font-medium text-sm min-h-[36px] min-w-[48px] inline-flex items-center"
                >详情</NuxtLink
              >
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 移动端：卡片列表 -->
    <div class="md:hidden space-y-3">
      <div
        v-for="bom in items"
        :key="bom.id"
        class="bg-white rounded-xl shadow p-4 space-y-2"
      >
        <div class="flex items-center justify-between">
          <span
            :class="statusBadge(bom.status)"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
          >
            {{ statusIcon(bom.status) }} {{ statusLabel(bom.status) }}
          </span>
          <span class="text-xs text-slate-400">V{{ bom.version }}</span>
        </div>
        <div class="text-sm font-mono font-medium">{{ bom.bomCode }}</div>
        <div class="text-sm">{{ bom.product?.name || bom.productName }}</div>
        <div class="flex items-center justify-between text-xs text-slate-500">
          <span>{{ bom._count?.items ?? 0 }} 个物料</span>
          <span>{{ formatDate(bom.createdAt) }}</span>
        </div>
        <NuxtLink
          :to="`/bom/${bom.id}`"
          class="block text-center text-blue-600 hover:text-blue-800 text-sm font-medium py-2 border-t mt-2"
          >查看详情</NuxtLink
        >
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="items.length === 0" class="text-center py-12 text-slate-400">
      暂无 BOM 记录
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
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth" as any] });

const page = ref(1);
const limit = 10;
const keyword = ref("");
const statusFilter = ref("");
const sortField = ref("createdAt");
const sortDir = ref<"asc" | "desc">("desc");
const showAll = ref(false);
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
  status: statusFilter.value,
  sortField: sortField.value,
  sortDir: sortDir.value,
  showAll: showAll.value,
}));

watch(keyword, (val) => {
  if (!val.trim()) {
    searchKeyword.value = "";
    page.value = 1;
  }
});

const { data } = await useFetch("/api/bom", {
  query: queryParams,
  watch: [queryParams],
});

const items = computed(() => (data.value as any)?.data || []);
const totalPages = computed(() => (data.value as any)?.totalPages || 1);

const statusLabel = (s: string) =>
  ({ DRAFT: "草稿", PUBLISHED: "已发布", OBSOLETED: "已废弃" })[s] || s;

const statusIcon = (s: string) =>
  ({ DRAFT: "📝", PUBLISHED: "✅", OBSOLETED: "📦" })[s] || "";

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    DRAFT: "bg-amber-100 text-amber-800 border-amber-300",
    PUBLISHED: "bg-green-100 text-green-800 border-green-300",
    OBSOLETED: "bg-slate-100 text-slate-600 border-slate-300",
  };
  return map[s] || "bg-slate-100 text-slate-600 border-slate-300";
};

const formatDate = (d: string) => new Date(d).toLocaleDateString("zh-CN");
</script>
