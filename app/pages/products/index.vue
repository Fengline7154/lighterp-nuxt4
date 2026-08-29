<template>
  <div>
    <div class="flex justify-between items-center mb-6 flex-wrap gap-2">
      <h1 class="text-xl lg:text-2xl font-bold">产品管理</h1>
      <div class="flex gap-2 flex-wrap">
        <button
          @click="batchMode = !batchMode"
          class="min-h-[44px] px-4 py-2 border rounded-lg text-sm hover:bg-slate-50 transition"
        >
          {{ batchMode ? "取消" : "批量操作" }}
        </button>
        <NuxtLink
          to="/products/create"
          class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm flex items-center"
          >+ 创建产品</NuxtLink
        >
        <NuxtLink
          to="/products/batch-create"
          class="min-h-[44px] px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition text-sm flex items-center"
          >批量创建</NuxtLink
        >
      </div>
    </div>

    <div v-if="batchMode" class="flex gap-2 mb-4 flex-wrap">
      <button
        @click="batchChangeStatus('ACTIVE')"
        class="min-h-[44px] px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition"
      >
        批量启用
      </button>
      <button
        @click="batchChangeStatus('INACTIVE')"
        class="min-h-[44px] px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition"
      >
        批量停用
      </button>
      <span v-if="selectedIds.length" class="text-sm text-slate-500 self-center"
        >已选 {{ selectedIds.length }} 项</span
      >
    </div>

    <div class="flex flex-wrap gap-3 mb-4">
      <input
        v-model="keyword"
        @keydown.enter="doSearch"
        placeholder="搜索..."
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition w-full sm:w-48 lg:w-64"
      />
      <button
        @click="doSearch"
        class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
      >
        搜索
      </button>
      <select
        v-model="categoryFilter"
        @change="page = 1"
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
      >
        <option value="">全部分类</option>
        <option value="FINISHED">成品</option>
        <option value="SEMI">半成品</option>
        <option value="RAW">原材料</option>
        <option value="PACKAGING">包材</option>
      </select>
      <select
        v-model="statusFilter"
        @change="page = 1"
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
      >
        <option value="ACTIVE">正常</option>
        <option value="INACTIVE">停用</option>
      </select>
      <button
        @click="clearFilters"
        class="min-h-[44px] px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition"
      >
        清除筛选
      </button>
      <div class="flex flex-wrap gap-1.5 items-center py-1">
        <span
          v-for="tag in allTags"
          :key="tag"
          @click="toggleTag(tag)"
          :class="
            selectedTags.includes(tag)
              ? 'bg-blue-500 text-white'
              : 'bg-slate-100 text-slate-600'
          "
          class="px-2.5 py-1 rounded-full text-xs cursor-pointer whitespace-nowrap min-h-[32px] flex items-center transition"
          >{{ tag }}</span
        >

        <span v-if="allTags.length === 0" class="text-xs text-slate-400 px-2"
          >暂无标签</span
        >
      </div>
    </div>

    <!-- 桌面端表格 -->
    <div class="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full min-w-[800px] whitespace-nowrap">
        <thead>
          <tr class="border-b bg-slate-100">
            <th v-if="batchMode" class="w-10 px-3 py-3"></th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase cursor-pointer select-none"
              @click="toggleSort('code')"
            >
              编码 {{ sortIcon("code") }}
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
              规格
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              分类
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              单位
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              标签
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
            v-for="p in items"
            :key="p.id"
            class="transition even:bg-slate-100 odd:bg-white hover:bg-blue-200"
          >
            <td v-if="batchMode" class="px-3 py-3">
              <input
                type="checkbox"
                :checked="selectedIds.includes(p.id)"
                @change="toggleSelect(p.id)"
                class="w-4 h-4 text-blue-600 rounded"
              />
            </td>
            <td class="px-4 py-3 text-sm font-mono">{{ p.code }}</td>
            <td class="px-4 py-3 text-sm font-medium">{{ p.name }}</td>
            <td class="px-4 py-3 text-sm text-slate-500">
              {{ p.spec || "-" }}
            </td>
            <td class="px-4 py-3 text-sm">{{ categoryLabel(p.category) }}</td>
            <td class="px-4 py-3 text-sm">{{ p.unit }}</td>
            <td class="px-4 py-3 text-sm">
              <div v-if="p.tags?.length" class="flex flex-wrap gap-1">
                <span
                  v-for="(tag, i) in showAllTags[p.id]
                    ? p.tags
                    : p.tags.slice(0, 2)"
                  :key="i"
                  class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs whitespace-nowrap"
                  >{{ tag }}</span
                >
                <button
                  v-if="p.tags.length > 2 && !showAllTags[p.id]"
                  @click="showAllTags[p.id] = true"
                  class="text-blue-500 hover:text-blue-700 text-xs min-h-[28px]"
                >
                  +{{ p.tags.length - 2 }}
                </button>
                <button
                  v-if="showAllTags[p.id]"
                  @click="showAllTags[p.id] = false"
                  class="text-slate-400 hover:text-slate-600 text-xs"
                >
                  收起
                </button>
              </div>
              <span v-else class="text-slate-400">-</span>
            </td>
            <td class="px-4 py-3 text-sm">
              <span
                :class="statusBadge(p.status)"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
                >{{ statusIcon(p.status) }}
                {{ p.status === "ACTIVE" ? "正常" : "停用" }}</span
              >
            </td>
            <td class="px-4 py-3 text-sm text-center space-x-2">
              <NuxtLink
                :to="`/products/${p.id}`"
                class="text-blue-600 hover:text-blue-800 font-medium text-sm min-h-[36px] inline-flex items-center"
                >详情</NuxtLink
              >
              <button
                @click="toggleStatus(p)"
                class="text-sm font-medium min-h-[36px]"
                :class="
                  p.status === 'ACTIVE'
                    ? 'text-red-500 hover:text-red-700'
                    : 'text-green-500 hover:text-green-700'
                "
              >
                {{ p.status === "ACTIVE" ? "停用" : "启用" }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 移动端卡片 -->
    <div class="md:hidden space-y-3">
      <div
        v-for="p in items"
        :key="p.id"
        class="bg-white rounded-xl shadow p-4 space-y-2"
      >
        <div class="flex items-center justify-between">
          <span
            :class="statusBadge(p.status)"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
            >{{ statusIcon(p.status) }}
            {{ p.status === "ACTIVE" ? "正常" : "停用" }}</span
          >
          <span class="font-mono text-sm text-slate-500">{{ p.code }}</span>
        </div>
        <div class="text-sm font-medium">{{ p.name }}</div>
        <div class="flex items-center gap-3 text-xs text-slate-500">
          <span>{{ categoryLabel(p.category) }}</span>
          <span>{{ p.unit }}</span>
          <span>{{ p.spec || "-" }}</span>
        </div>
        <div v-if="p.tags?.length" class="flex flex-wrap gap-1">
          <span
            v-for="tag in p.tags"
            :key="tag"
            class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs"
            >{{ tag }}</span
          >
        </div>
        <div class="flex gap-3 pt-2 border-t">
          <NuxtLink
            :to="`/products/${p.id}`"
            class="text-blue-600 text-sm font-medium"
            >详情</NuxtLink
          >
          <button
            @click="toggleStatus(p)"
            class="text-sm font-medium"
            :class="p.status === 'ACTIVE' ? 'text-red-500' : 'text-green-500'"
          >
            {{ p.status === "ACTIVE" ? "停用" : "启用" }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="items.length === 0" class="text-center py-12 text-slate-400">
      暂无产品记录
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

const showAllTags = reactive<Record<string, boolean>>({});
const page = ref(1);
const limit = 10;
const keyword = ref("");
const categoryFilter = ref("");
const sortField = ref("createdAt");
const sortDir = ref<"asc" | "desc">("desc");
const statusFilter = ref("ACTIVE");
const selectedTags = ref<string[]>([]);
const batchMode = ref(false);
const selectedIds = ref<string[]>([]);
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
const sortIcon = (field: string) =>
  sortField.value !== field ? "↕" : sortDir.value === "asc" ? "↑" : "↓";

const toggleSelect = (id: string) => {
  const idx = selectedIds.value.indexOf(id);
  if (idx > -1) selectedIds.value.splice(idx, 1);
  else selectedIds.value.push(id);
};

const clearFilters = () => {
  keyword.value = "";
  searchKeyword.value = "";
  categoryFilter.value = "";
  statusFilter.value = "ACTIVE";
  selectedTags.value = [];
  page.value = 1;
};

const batchChangeStatus = async (status: string) => {
  if (!selectedIds.value.length) return toast.error("请选择产品");
  try {
    await apiFetch("/api/products/batch-status", {
      method: "PATCH" as any,
      body: { ids: selectedIds.value, status },
    });
    toast.success("批量操作成功");
    selectedIds.value = [];
    batchMode.value = false;
    await refresh();
  } catch (e: any) {
    toast.error(e, "操作失败");
  }
};

const { data: tagsData } = await useFetch("/api/products/tags", {
  query: { status: statusFilter },
  watch: [statusFilter],
});
const allTags = computed(() => (tagsData.value as string[]) || []);

const toggleTag = (tag: string) => {
  const idx = selectedTags.value.indexOf(tag);
  if (idx > -1) selectedTags.value.splice(idx, 1);
  else selectedTags.value.push(tag);
  page.value = 1;
};

const toggleStatus = async (p: any) => {
  const newStatus = p.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  try {
    await apiFetch(`/api/products/${p.id}/status`, {
      method: "PATCH" as any,
      body: { status: newStatus },
    });
    toast.success(newStatus === "ACTIVE" ? "已启用" : "已停用");
    await refresh();
  } catch (e: any) {
    toast.error(e, "操作失败");
  }
};

const queryParams = computed(() => ({
  page: page.value,
  limit,
  keyword: searchKeyword.value,
  category: categoryFilter.value,
  sortField: sortField.value,
  sortDir: sortDir.value,
  tags: selectedTags.value,
  status: statusFilter.value,
}));
watch(keyword, (val) => {
  if (!val.trim()) {
    searchKeyword.value = "";
    page.value = 1;
  }
});
const { data, refresh } = await useFetch("/api/products", {
  query: queryParams,
  watch: [queryParams],
});

const items = computed(() => (data.value as any)?.data || []);
const totalPages = computed(() => (data.value as any)?.totalPages || 1);

const categoryLabel = (c: string) =>
  ({ FINISHED: "成品", SEMI: "半成品", RAW: "原材料", PACKAGING: "包材" })[c] ||
  "-";
const statusIcon = (s: string) => (s === "ACTIVE" ? "✅" : "🚫");
const statusBadge = (s: string) =>
  s === "ACTIVE"
    ? "bg-green-100 text-green-800 border-green-300"
    : "bg-red-100 text-red-800 border-red-300";
</script>
