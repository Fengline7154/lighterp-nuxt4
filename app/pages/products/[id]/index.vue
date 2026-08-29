<template>
  <div class="max-w-2xl mx-auto">
    <div class="flex items-center gap-4 mb-6 flex-wrap">
      <NuxtLink to="/products" class="text-slate-500 hover:text-slate-700"
        >&larr; 返回</NuxtLink
      >
      <h1 class="text-xl lg:text-2xl font-bold">产品详情</h1>
      <button
        @click="editing = !editing"
        class="ml-auto min-h-[44px] px-4 py-2 border rounded-lg text-sm hover:bg-slate-50 transition"
      >
        {{ editing ? "取消" : "编辑" }}
      </button>
      <NuxtLink
        :to="`/products/${product!.id}/routing`"
        class="min-h-[44px] px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition text-sm flex items-center"
        >工序管理</NuxtLink
      >
    </div>
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div
        class="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"
      ></div>
      <span class="ml-3 text-sm text-slate-400">加载中...</span>
    </div>
    <div v-if="product" class="space-y-6">
      <!-- 查看模式 -->
      <div v-if="!editing" class="bg-white rounded-xl shadow p-4 lg:p-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Info label="编码" :value="product.code" />
          <Info label="名称" :value="product.name" />
          <Info label="规格" :value="product.spec || '-'" />
          <Info label="单位" :value="product.unit" />
          <Info label="分类" :value="categoryLabel(product.category)" />
          <Info label="状态">
            <span
              :class="statusBadge(product.status)"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
              >{{ statusIcon(product.status) }}
              {{ product.status === "ACTIVE" ? "正常" : "停用" }}</span
            >
          </Info>
          <Info label="标签">
            <span v-if="product.tags?.length" class="flex flex-wrap gap-1">
              <span
                v-for="tag in product.tags"
                :key="tag"
                class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs"
                >{{ tag }}</span
              >
            </span>
            <span v-else>-</span>
          </Info>
          <Info
            label="备注"
            :value="
              product.attributes ? formatAttributes(product.attributes) : '-'
            "
          />
          <Info label="创建时间" :value="formatDate(product.createdAt)" />
        </div>

        <div v-if="firstInventory" class="mt-6 border-t pt-4">
          <h3 class="font-semibold mb-2">库存信息</h3>
          <p class="text-sm">总库存: {{ firstInventory.quantity }}</p>
          <p class="text-sm text-slate-500">
            可用:
            {{ firstInventory.quantity - (firstInventory.reservedQty || 0) }}
          </p>
        </div>

        <div v-if="bomProduct" class="mt-4">
          <h3 class="font-semibold mb-2">关联 BOM</h3>
          <NuxtLink
            :to="`/bom/${bomProduct.id}`"
            class="text-blue-500 hover:underline text-sm"
            >查看 BOM (V{{ bomProduct.version }})</NuxtLink
          >
        </div>
      </div>

      <!-- 编辑模式 -->
      <div v-else class="bg-white rounded-xl shadow p-4 lg:p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >名称</label
          >
          <input
            v-model="editForm.name"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >规格</label
          >
          <input
            v-model="editForm.spec"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >单位</label
          >
          <select
            v-model="editForm.unit"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
          >
            <option value="PCS">个 (PCS)</option>
            <option value="KG">千克 (KG)</option>
            <option value="G">克 (G)</option>
            <option value="M">米 (M)</option>
            <option value="CM">厘米 (CM)</option>
            <option value="MM">毫米 (MM)</option>
            <option value="M2">平方米 (M²)</option>
            <option value="M3">立方米 (M³)</option>
            <option value="L">升 (L)</option>
            <option value="ML">毫升 (ML)</option>
            <option value="SET">套 (SET)</option>
            <option value="PAIR">双 (PAIR)</option>
            <option value="ROLL">卷 (ROLL)</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >分类</label
          >
          <select
            v-model="editForm.category"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
          >
            <option value="">未分类</option>
            <option value="FINISHED">成品</option>
            <option value="SEMI">半成品</option>
            <option value="RAW">原材料</option>
            <option value="PACKAGING">包材</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >状态</label
          >
          <select
            v-model="editForm.status"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
          >
            <option value="ACTIVE">正常</option>
            <option value="INACTIVE">停用</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >标签</label
          >
          <div class="flex flex-wrap gap-2 items-center">
            <span
              v-for="(tag, i) in editForm.tags"
              :key="i"
              class="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs flex items-center gap-1"
            >
              {{ tag }}
              <button
                @click="editForm.tags.splice(i, 1)"
                class="text-blue-400 hover:text-blue-600 min-h-[24px] min-w-[24px]"
              >
                &times;
              </button>
            </span>
            <input
              v-model="tagInput"
              @keydown.enter.prevent="addTag"
              @blur="addTag"
              placeholder="输入后回车"
              class="border border-slate-300 rounded-full px-3 py-1.5 text-xs min-h-[36px] focus:ring-2 focus:ring-blue-500 outline-none transition w-28"
            />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >备注</label
          >
          <textarea
            v-model="editForm.remark"
            rows="3"
            class="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            placeholder="自定义备注信息..."
          ></textarea>
        </div>
        <button
          @click="handleSave"
          class="w-full min-h-[48px] bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition font-medium text-sm"
        >
          保存
        </button>
      </div>

      <div
        class="bg-white rounded-xl shadow p-4 lg:p-6"
        v-if="history && history.length"
      >
        <h2 class="font-semibold mb-3">变更历史</h2>
        <div class="space-y-2 text-sm">
          <div
            v-for="h in history"
            :key="h.id"
            class="flex justify-between text-slate-600 py-1 even:bg-slate-50/50 px-2 rounded"
          >
            <span
              >{{ fieldLabel(h.field) }}:
              {{ formatValue(h.field, h.oldValue) }} →
              {{ formatValue(h.field, h.newValue) }}</span
            >
            <span class="text-xs text-slate-400"
              >{{ h.operatorBadge }}-{{ h.operatorName }} ·
              {{ formatDate(h.createdAt) }}</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth" as any] });
const toast = useToast();
const { apiFetch } = useApi();
const route = useRoute();

const {
  data: product,
  loading,
  execute: loadProduct,
} = useApiFetch<any>(() => `/api/products/${route.params.id}`);
await loadProduct();

const { data: historyRaw, execute: loadHistory } = useApiFetch(
  () => `/api/products/${route.params.id}/history`,
);
await loadHistory();
const history = computed(() => {
  const raw =
    (historyRaw.value as any)?.data || (historyRaw.value as any) || [];
  return raw.filter((h: any) => h.field !== null);
});

const editing = ref(false);
const tagInput = ref("");

const editForm = reactive({
  name: "",
  spec: "",
  unit: "PCS",
  category: "",
  status: "ACTIVE",
  tags: [] as string[],
  remark: "",
});

watch(
  product,
  (val: any) => {
    if (val?.id) {
      editForm.name = val.name || "";
      editForm.spec = val.spec || "";
      editForm.unit = val.unit || "PCS";
      editForm.category = val.category || "";
      editForm.status = val.status || "ACTIVE";
      editForm.tags = [...(val.tags || [])];
      editForm.remark = val.attributes
        ? typeof val.attributes === "string"
          ? val.attributes
          : JSON.stringify(val.attributes)
        : "";
    }
  },
  { immediate: true },
);

const addTag = () => {
  const val = tagInput.value.trim();
  if (val && !editForm.tags.includes(val)) editForm.tags.push(val);
  tagInput.value = "";
};

const handleSave = async () => {
  try {
    await apiFetch(`/api/products/${route.params.id}`, {
      method: "PATCH" as any,
      body: {
        name: editForm.name,
        spec: editForm.spec,
        unit: editForm.unit,
        category: editForm.category,
        status: editForm.status,
        tags: editForm.tags,
        attributes: editForm.remark ? { remark: editForm.remark } : undefined,
      },
    });
    toast.success("保存成功");
    editing.value = false;
    await loadProduct();
    await loadHistory();
  } catch (e: any) {
    toast.error(e, "保存失败");
  }
};

const firstInventory = computed(() => (product.value as any)?.inventories?.[0]);
const bomProduct = computed(() => (product.value as any)?.bomProducts?.[0]);

const formatAttributes = (attrs: any) => {
  if (typeof attrs === "string") return attrs;
  if (attrs?.remark) return attrs.remark;
  return JSON.stringify(attrs);
};
const formatValue = (field: string, val: string | null) => {
  if (!val) return "-";
  if (field === "category") {
    const m: Record<string, string> = {
      FINISHED: "成品",
      SEMI: "半成品",
      RAW: "原材料",
      PACKAGING: "包材",
    };
    return m[val] || val;
  }
  if (field === "tags") {
    try {
      return JSON.parse(val).join("、") || "-";
    } catch {
      return val;
    }
  }
  if (field === "attributes") {
    try {
      const o = JSON.parse(val);
      return o?.remark || val;
    } catch {
      return val;
    }
  }
  if (field === "status") return statusLabel(val);
  return val;
};
const fieldLabel = (field: string) =>
  ({
    name: "名称",
    spec: "规格",
    unit: "单位",
    category: "分类",
    status: "状态",
    tags: "标签",
    attributes: "备注",
  })[field] || field;
const statusLabel = (s: string) =>
  s === "ACTIVE" ? "正常" : s === "INACTIVE" ? "停用" : s;
const statusIcon = (s: string) => (s === "ACTIVE" ? "✅" : "🚫");
const statusBadge = (s: string) =>
  s === "ACTIVE"
    ? "bg-green-100 text-green-800 border-green-300"
    : "bg-red-100 text-red-800 border-red-300";
const categoryLabel = (c: string | null | undefined) =>
  c
    ? { FINISHED: "成品", SEMI: "半成品", RAW: "原材料", PACKAGING: "包材" }[
        c
      ] || "-"
    : "-";
const formatDate = (d: string) => new Date(d).toLocaleDateString("zh-CN");
</script>
