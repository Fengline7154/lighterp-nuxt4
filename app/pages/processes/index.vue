<template>
  <div>
    <h1 class="text-xl lg:text-2xl font-bold mb-6">工序管理</h1>

    <!-- 标签切换 -->
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

    <!-- 标准工序库 -->
    <div v-if="activeTab === 'standard'">
      <div class="mb-4">
        <button
          @click="openCreateModal"
          class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
        >
          + 新建工序
        </button>
      </div>

      <div class="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
        <table class="w-full min-w-[400px]">
          <thead>
            <tr class="border-b bg-slate-100">
              <th
                class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                名称
              </th>
              <th
                class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                描述
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
              v-for="process in standardProcesses"
              :key="process.id"
              class="hover:bg-blue-50/30 even:bg-slate-50/50 transition"
            >
              <td class="px-4 py-3 text-sm font-medium">{{ process.name }}</td>
              <td class="px-4 py-3 text-sm text-slate-500">
                {{ process.description || "-" }}
              </td>
              <td class="px-4 py-3 text-sm text-center space-x-2">
                <button
                  @click="openEditModal(process)"
                  class="text-blue-600 hover:text-blue-800 text-sm min-h-[36px]"
                >
                  编辑
                </button>
                <button
                  @click="handleDelete(process.id)"
                  class="text-red-500 hover:text-red-700 text-sm min-h-[36px]"
                >
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="md:hidden space-y-3">
        <div
          v-for="process in standardProcesses"
          :key="process.id"
          class="bg-white rounded-xl shadow p-4 flex items-center justify-between"
        >
          <div>
            <div class="text-sm font-medium">{{ process.name }}</div>
            <div class="text-xs text-slate-400">
              {{ process.description || "-" }}
            </div>
          </div>
          <div class="flex gap-2">
            <button
              @click="openEditModal(process)"
              class="text-blue-600 text-sm min-h-[36px]"
            >
              编辑
            </button>
            <button
              @click="handleDelete(process.id)"
              class="text-red-500 text-sm min-h-[36px]"
            >
              删除
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="standardProcesses.length === 0"
        class="text-center py-12 text-slate-400"
      >
        暂无标准工序
      </div>
    </div>

    <!-- 产品工序模板 -->

    <div v-if="activeTab === 'template'">
      <div class="mb-4">
        <input
          v-model="templateKeyword"
          @input="onTemplateSearch"
          placeholder="搜索产品..."
          class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition w-full sm:w-64"
        />
      </div>

      <div class="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
        <table class="w-full min-w-[500px]">
          <thead>
            <tr class="border-b bg-slate-100">
              <th
                class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                产品编号
              </th>
              <th
                class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                产品名称
              </th>
              <th
                class="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                工序数
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
              v-for="p in filteredTemplateProducts"
              :key="p.id"
              class="transition even:bg-slate-100 odd:bg-white hover:bg-blue-200"
            >
              <td class="px-4 py-3 text-sm font-mono">{{ p.code }}</td>
              <td class="px-4 py-3 text-sm font-medium">{{ p.name }}</td>
              <td class="px-4 py-3 text-sm text-center">
                {{ p.templateCount || "-" }}
              </td>
              <td class="px-4 py-3 text-sm text-center">
                <NuxtLink
                  :to="`/products/${p.id}/routing`"
                  class="text-blue-600 hover:text-blue-800 font-medium text-sm min-h-[36px] inline-flex items-center"
                >
                  {{ p.templateCount ? "详情" : "新建" }}
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="md:hidden space-y-3">
        <div
          v-for="p in filteredTemplateProducts"
          :key="p.id"
          class="bg-white rounded-xl shadow p-4 flex items-center justify-between"
        >
          <div>
            <div class="text-sm font-mono text-slate-500">{{ p.code }}</div>
            <div class="text-sm font-medium">{{ p.name }}</div>
            <div class="text-xs text-slate-400">
              工序数：{{ p.templateCount || "-" }}
            </div>
          </div>
          <NuxtLink
            :to="`/products/${p.id}/routing`"
            class="text-blue-600 font-medium text-sm min-h-[36px] inline-flex items-center"
          >
            {{ p.templateCount ? "详情 →" : "新建 →" }}
          </NuxtLink>
        </div>
      </div>

      <div
        v-if="filteredTemplateProducts.length === 0"
        class="text-center py-12 text-slate-400"
      >
        {{ templateKeyword ? "无匹配产品" : "暂无产品" }}
      </div>
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
          {{ isEditing ? "编辑工序" : "新建工序" }}
        </h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >名称 *</label
            ><input
              v-model="form.name"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="工序名称，如：裁剪"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >描述</label
            ><textarea
              v-model="form.description"
              class="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              rows="3"
              placeholder="可选描述"
            ></textarea>
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

const tabs = [
  { key: "template", label: "产品工序模板" },
  { key: "standard", label: "标准工序库" },
];
const activeTab = ref("template");

// 标准工序
const standardProcesses = ref<any[]>([]);
const showFormModal = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);
const form = reactive({ name: "", description: "" });

const loadStandardProcesses = async () => {
  try {
    const data = await apiFetch<any>("/api/processes");
    standardProcesses.value = data.data || [];
  } catch (e: any) {
    toast.error(e, "加载失败");
  }
};

const openCreateModal = () => {
  isEditing.value = false;
  editingId.value = null;
  form.name = "";
  form.description = "";
  showFormModal.value = true;
};
const openEditModal = (process: any) => {
  isEditing.value = true;
  editingId.value = process.id;
  form.name = process.name;
  form.description = process.description || "";
  showFormModal.value = true;
};

const handleSubmit = async () => {
  if (!form.name.trim()) return toast.error("名称不能为空");
  try {
    if (isEditing.value) {
      await apiFetch(`/api/processes/${editingId.value}`, {
        method: "PATCH",
        body: {
          name: form.name.trim(),
          description: form.description || undefined,
        },
      });
      toast.success("修改成功");
    } else {
      await apiFetch("/api/processes", {
        method: "POST",
        body: {
          name: form.name.trim(),
          description: form.description || undefined,
        },
      });
      toast.success("创建成功");
    }
    showFormModal.value = false;
    await loadStandardProcesses();
  } catch (e: any) {
    toast.error(e, "操作失败");
  }
};

const handleDelete = async (id: string) => {
  if (!confirm("确认删除此工序？")) return;
  try {
    await apiFetch(`/api/processes/${id}`, { method: "DELETE" });
    toast.success("删除成功");
    await loadStandardProcesses();
  } catch (e: any) {
    toast.error(e, "删除失败");
  }
};

// 产品工序模板
const templateKeyword = ref("");
let templateDebounce: ReturnType<typeof setTimeout>;
const onTemplateSearch = () => {
  clearTimeout(templateDebounce);
  templateDebounce = setTimeout(() => {}, 300);
};

const { data: templateProductsData } = await useFetch("/api/routings");
const allTemplateProducts = computed(
  () => (templateProductsData.value as any)?.data || [],
);

const filteredTemplateProducts = computed(() => {
  if (!templateKeyword.value.trim()) return allTemplateProducts.value;
  const q = templateKeyword.value.toLowerCase();
  return allTemplateProducts.value.filter(
    (p: any) =>
      p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q),
  );
});

onMounted(() => {
  loadStandardProcesses();
});
</script>
