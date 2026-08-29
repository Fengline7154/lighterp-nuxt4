<template>
  <div>
    <div class="flex justify-between items-center mb-6 flex-wrap gap-2">
      <h1 class="text-xl lg:text-2xl font-bold">库位管理</h1>
      <div class="flex gap-2">
        <NuxtLink
          to="/locations/search"
          class="min-h-[44px] px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm flex items-center"
          >产品库位查询</NuxtLink
        >
        <button
          @click="openCreateModal"
          class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
        >
          + 新增库位
        </button>
      </div>
    </div>

    <div class="flex flex-wrap gap-3 mb-4">
      <input
        v-model="keyword"
        @keydown.enter="doSearch"
        placeholder="搜索编码/名称/仓库..."
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
        <option value="ACTIVE">启用</option>
        <option value="INACTIVE">停用</option>
      </select>
    </div>

    <!-- 桌面端表格 -->
    <div class="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full min-w-[500px] whitespace-nowrap">
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
              仓库
            </th>
            <th
              class="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase"
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
            v-for="loc in locations"
            :key="loc.id"
            class="hover:bg-blue-50/30 even:bg-slate-50/50 transition"
          >
            <td class="px-4 py-3 text-sm font-mono">{{ loc.code }}</td>
            <td class="px-4 py-3 text-sm font-medium">{{ loc.name }}</td>
            <td class="px-4 py-3 text-sm text-slate-500">
              {{ loc.warehouse || "-" }}
            </td>
            <td class="px-4 py-3 text-sm text-center">
              <span
                :class="statusBadge(loc.status)"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
              >
                {{ statusIcon(loc.status) }}
                {{ loc.status === "ACTIVE" ? "启用" : "停用" }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-center space-x-2">
              <NuxtLink
                :to="`/locations/${loc.id}`"
                class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >详情</NuxtLink
              >
              <button
                @click="openEditModal(loc)"
                class="text-blue-600 hover:text-blue-800 text-sm"
              >
                编辑
              </button>
              <button
                @click="toggleStatus(loc)"
                class="text-sm font-medium"
                :class="
                  loc.status === 'ACTIVE'
                    ? 'text-red-500 hover:text-red-700'
                    : 'text-green-500 hover:text-green-700'
                "
              >
                {{ loc.status === "ACTIVE" ? "停用" : "启用" }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 移动端卡片 -->
    <div class="md:hidden space-y-3">
      <div
        v-for="loc in locations"
        :key="loc.id"
        class="bg-white rounded-xl shadow p-4 space-y-2"
      >
        <div class="flex items-center justify-between">
          <span
            :class="statusBadge(loc.status)"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
          >
            {{ statusIcon(loc.status) }}
            {{ loc.status === "ACTIVE" ? "启用" : "停用" }}
          </span>
          <span class="font-mono text-sm text-slate-500">{{ loc.code }}</span>
        </div>
        <div class="text-sm font-medium">{{ loc.name }}</div>
        <div class="text-xs text-slate-400">{{ loc.warehouse || "-" }}</div>
        <div class="flex gap-3 pt-2 border-t">
          <NuxtLink
            :to="`/locations/${loc.id}`"
            class="text-blue-600 text-sm font-medium"
            >详情</NuxtLink
          >
          <button @click="openEditModal(loc)" class="text-blue-600 text-sm">
            编辑
          </button>
          <button
            @click="toggleStatus(loc)"
            class="text-sm font-medium"
            :class="loc.status === 'ACTIVE' ? 'text-red-500' : 'text-green-500'"
          >
            {{ loc.status === "ACTIVE" ? "停用" : "启用" }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="locations.length === 0" class="text-center py-12 text-slate-400">
      暂无库位数据
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

    <!-- 新建/编辑弹窗 -->
    <div
      v-if="showFormModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showFormModal = false"
      />
      <div class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 class="text-lg font-bold mb-4">
          {{ isEditing ? "编辑库位" : "新增库位" }}
        </h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >库位编码</label
            >
            <div class="flex items-center gap-2 mb-2">
              <input
                v-model="form.code"
                :disabled="autoCode"
                class="flex-1 min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm"
                placeholder="自动生成或手动输入"
              />
              <label
                class="flex items-center gap-1 text-sm text-slate-500 whitespace-nowrap cursor-pointer"
              >
                <input
                  type="checkbox"
                  v-model="autoCode"
                  class="accent-blue-500 w-4 h-4"
                />
                自动生成
              </label>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >库位名称 *</label
            >
            <input
              v-model="form.name"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm"
              placeholder="如：A区第一排第二层"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >所属仓库</label
            >
            <input
              v-model="form.warehouse"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm"
              placeholder="如：原材料仓"
            />
          </div>
          <div v-if="isEditing">
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >状态</label
            >
            <select
              v-model="form.status"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white"
            >
              <option value="ACTIVE">启用</option>
              <option value="INACTIVE">停用</option>
            </select>
          </div>
          <div>
            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                v-model="form.isDefault"
                class="w-4 h-4 text-blue-600 rounded"
              />
              设为默认库位
            </label>
          </div>
        </div>
        <div class="flex gap-2 mt-4">
          <button
            @click="handleSubmit"
            class="flex-1 min-h-[44px] bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition text-sm"
          >
            {{ isEditing ? "保存" : "创建" }}
          </button>
          <button
            @click="showFormModal = false"
            class="flex-1 min-h-[44px] border py-2 rounded-lg hover:bg-slate-50 transition text-sm"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth" as any] });
const toast = useToast();
const { apiFetch } = useApi();

const page = ref(1);
const limit = 20;
const keyword = ref("");
const statusFilter = ref("");
const searchKeyword = ref("");

const doSearch = () => {
  searchKeyword.value = keyword.value;
  page.value = 1;
};

watch(keyword, (val) => {
  if (!val.trim() && searchKeyword.value !== "") {
    searchKeyword.value = "";
    page.value = 1;
  }
});

const queryParams = computed(() => ({
  page: page.value,
  limit,
  keyword: searchKeyword.value,
  status: statusFilter.value,
}));

const { data: listData, execute: load } = useApiFetch("/api/locations");
watch(queryParams, () => load(queryParams.value), { immediate: true });

const locations = computed(() => (listData.value as any)?.data || []);
const totalPages = computed(() => (listData.value as any)?.totalPages || 1);

const showFormModal = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);
const autoCode = ref(true);
const form = reactive({
  code: "",
  name: "",
  warehouse: "",
  status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  isDefault: false,
});

const openCreateModal = () => {
  isEditing.value = false;
  editingId.value = null;
  autoCode.value = true;
  form.code = "";
  form.name = "";
  form.warehouse = "";
  form.status = "ACTIVE";
  form.isDefault = false;
  showFormModal.value = true;
};
const openEditModal = (loc: any) => {
  isEditing.value = true;
  editingId.value = loc.id;
  autoCode.value = false;
  form.code = loc.code;
  form.name = loc.name;
  form.warehouse = loc.warehouse || "";
  form.isDefault = loc.isDefault || false;
  form.status = loc.status;
  showFormModal.value = true;
};

const handleSubmit = async () => {
  if (!form.name.trim()) return toast.error("名称不能为空");
  try {
    if (isEditing.value) {
      await apiFetch(`/api/locations/${editingId.value}`, {
        method: "PATCH",
        body: {
          name: form.name.trim(),
          warehouse: form.warehouse || undefined,
          status: form.status,
          code: form.code || undefined,
          isDefault: form.isDefault,
        },
      });
      toast.success("修改成功");
    } else {
      await apiFetch("/api/locations", {
        method: "POST",
        body: {
          name: form.name.trim(),
          warehouse: form.warehouse || undefined,
          code: autoCode.value ? undefined : form.code.trim(),
          isDefault: form.isDefault,
        },
      });
      toast.success("创建成功");
    }
    showFormModal.value = false;
    await load(queryParams.value);
  } catch (e: any) {
    toast.error(e, "操作失败");
  }
};

const toggleStatus = async (loc: any) => {
  const newStatus = loc.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  try {
    if (newStatus === "INACTIVE") {
      await apiFetch(`/api/locations/${loc.id}`, { method: "DELETE" });
    } else {
      await apiFetch(`/api/locations/${loc.id}`, {
        method: "PATCH",
        body: { status: "ACTIVE" },
      });
    }
    toast.success(newStatus === "ACTIVE" ? "已启用" : "已停用");
    await load(queryParams.value);
  } catch (e: any) {
    toast.error(e, "操作失败");
  }
};

const statusIcon = (s: string) => (s === "ACTIVE" ? "✅" : "🚫");
const statusBadge = (s: string) =>
  s === "ACTIVE"
    ? "bg-green-100 text-green-800 border-green-300"
    : "bg-red-100 text-red-800 border-red-300";
</script>
