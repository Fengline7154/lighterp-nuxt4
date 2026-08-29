<template>
  <div class="max-w-2xl mx-auto">
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div
        class="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"
      ></div>
      <span class="ml-3 text-sm text-slate-400">加载中...</span>
    </div>

    <div v-if="bom" class="space-y-6">
      <!-- 头部 -->
      <div class="flex items-center gap-4 flex-wrap">
        <NuxtLink to="/bom" class="text-slate-500 hover:text-slate-700"
          >&larr; 返回</NuxtLink
        >
        <h1 class="text-xl lg:text-2xl font-bold">BOM 详情</h1>
        <div class="ml-auto flex gap-2">
          <button
            v-if="bom.status === 'DRAFT'"
            @click="handlePublish"
            class="min-h-[44px] px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
          >
            发布
          </button>
          <button
            v-if="bom.status !== 'OBSOLETED'"
            @click="openEdit"
            class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
          >
            编辑
          </button>
          <button
            v-if="bom.status !== 'OBSOLETED'"
            @click="handleObsolete"
            class="min-h-[44px] px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
          >
            废弃
          </button>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="bg-white rounded-xl shadow p-4 lg:p-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Info label="BOM 编号" :value="bom.bomCode" />
          <Info label="产品名" :value="bom.product?.name || '-'" />
          <Info label="版本" :value="`V${bom.version}`" />
          <Info
            label="审核人"
            :value="
              bom.approver
                ? `${bom.approver.badgeCode} ${bom.approver.name || ''}`
                : '-'
            "
          />
          <Info
            label="审核时间"
            :value="bom.approvedAt ? formatDate(bom.approvedAt) : '-'"
          />
          <Info label="状态">
            <span
              :class="statusBadge(bom.status)"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
            >
              {{ statusIcon(bom.status) }} {{ statusLabel(bom.status) }}
            </span>
          </Info>
        </div>
      </div>

      <!-- 物料明细 -->
      <div class="hidden md:block bg-white rounded-xl shadow p-4 lg:p-6">
        <h2 class="font-semibold mb-3">物料明细</h2>
        <table class="w-full text-sm">
          <thead class="border-b bg-slate-100">
            <tr>
              <th
                class="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase"
              >
                编码
              </th>
              <th
                class="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase"
              >
                物料名
              </th>
              <th
                class="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase"
              >
                规格
              </th>
              <th
                class="text-right py-2 px-3 text-xs font-medium text-slate-500 uppercase"
              >
                用量
              </th>
              <th
                class="text-center py-2 px-3 text-xs font-medium text-slate-500 uppercase"
              >
                单位
              </th>
              <th
                class="text-right py-2 px-3 text-xs font-medium text-slate-500 uppercase"
              >
                损耗率
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in bom.items"
              :key="item.id"
              class="border-b last:border-0 even:bg-slate-50/50"
            >
              <td class="py-2 px-3 font-mono text-xs">
                {{
                  item.material?.code ||
                  item.materialId?.substring(0, 8) + "..."
                }}
              </td>
              <td class="py-2 px-3">
                {{ item.material?.name || item.materialName }}
              </td>
              <td class="py-2 px-3 text-sm text-slate-500">
                {{ item.material?.spec || "-" }}
              </td>
              <td class="py-2 px-3 text-right">{{ item.quantity }}</td>
              <td class="py-2 px-3 text-center">{{ item.unit }}</td>
              <td class="py-2 px-3 text-right">{{ item.scrapRate }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 物料明细 — 移动端 -->
      <div class="md:hidden space-y-3">
        <h2 class="font-semibold px-1">物料明细</h2>
        <div
          v-for="item in bom.items"
          :key="item.id"
          class="bg-white rounded-xl shadow p-4 space-y-1"
        >
          <div class="flex justify-between">
            <span class="font-mono text-xs text-slate-500">{{
              item.material?.code || item.materialId?.substring(0, 8) + "..."
            }}</span>
            <span class="text-xs">{{ item.unit }} × {{ item.quantity }}</span>
          </div>
          <div class="font-medium text-sm">
            {{ item.material?.name || item.materialName }}
          </div>
          <div class="text-xs text-slate-400">
            规格：{{ item.material?.spec || "-" }} | 损耗率：{{
              item.scrapRate
            }}
          </div>
        </div>
      </div>

      <!-- 历史版本 -->
      <div
        class="bg-white rounded-xl shadow p-4 lg:p-6"
        v-if="history && history.length > 1"
      >
        <h2 class="font-semibold mb-3">历史版本</h2>
        <div class="space-y-2">
          <div
            v-for="h in history"
            :key="h.id"
            class="flex justify-between items-center text-sm py-1 even:bg-slate-50/50 px-2 rounded"
          >
            <span>V{{ h.version }} — {{ statusLabel(h.status) }}</span>
            <span class="text-xs text-slate-400">{{
              formatDate(h.createdAt)
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showEditModal = false"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-4 lg:p-6 w-full max-w-4xl max-h-[85vh] overflow-auto"
      >
        <h2 class="text-lg font-bold mb-4">编辑 BOM</h2>
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >产品</label
          >
          <input
            :value="bom?.product?.name || bom?.productName"
            class="w-full border border-slate-300 rounded-lg px-4 py-2 bg-slate-50 text-sm"
            disabled
          />
        </div>
        <h3 class="font-semibold mb-2 text-sm">物料明细</h3>

        <!-- 编辑物料 — 桌面端表格 -->
        <div class="hidden md:block">
          <table class="w-full text-xs">
            <thead>
              <tr class="border-b bg-slate-100">
                <th class="text-left py-1 px-2">物料</th>
                <th class="text-left py-1 px-2">名称</th>
                <th class="text-left py-1 px-2">型号</th>
                <th class="text-left py-1 px-2">单位</th>
                <th class="text-left py-1 px-2">分类</th>
                <th class="text-right py-1 px-2">用量</th>
                <th class="text-right py-1 px-2">损耗率</th>
                <th class="w-6"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(_, i) in editForm.items"
                :key="i"
                class="even:bg-slate-50/50"
              >
                <td class="py-1 px-2">
                  <button
                    @click="openEditMaterialPicker(i)"
                    class="w-full min-h-[36px] text-left border border-slate-200 rounded px-3 py-1.5 text-xs hover:border-blue-400 transition"
                    :class="
                      editItemAt(i).materialId &&
                      editItemAt(i).materialId !== '__NEW__'
                        ? 'text-slate-900 font-mono'
                        : 'text-slate-400'
                    "
                  >
                    {{
                      editItemAt(i).materialId &&
                      editItemAt(i).materialId !== "__NEW__"
                        ? editItemAt(i).existingProduct?.code ||
                          editItemAt(i).materialId?.substring(0, 8) + "..."
                        : editItemAt(i).materialName || "选择物料"
                    }}
                  </button>
                </td>
                <td class="py-1 px-2">
                  <input
                    v-model="editItemAt(i).materialName"
                    :disabled="!!editItemAt(i).existingProduct"
                    class="w-full border border-slate-200 rounded px-2 py-1 text-xs disabled:bg-slate-100"
                  />
                </td>
                <td class="py-1 px-2">
                  <input
                    v-model="editItemAt(i).spec"
                    :disabled="!!editItemAt(i).existingProduct"
                    class="w-full border border-slate-200 rounded px-2 py-1 text-xs disabled:bg-slate-100"
                  />
                </td>
                <td class="py-1 px-2">
                  <select
                    v-model="editItemAt(i).unit"
                    :disabled="!!editItemAt(i).existingProduct"
                    class="w-full border border-slate-200 rounded px-2 py-1 text-xs disabled:bg-slate-100"
                  >
                    <option
                      v-for="u in unitOptions"
                      :key="u.value"
                      :value="u.value"
                    >
                      {{ u.label }}
                    </option>
                  </select>
                </td>
                <td class="py-1 px-2">
                  <select
                    v-if="!editItemAt(i).existingProduct"
                    v-model="editItemAt(i).category"
                    class="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                  >
                    <option value="RAW">原材料</option>
                    <option value="SEMI">半成品</option>
                    <option value="PACKAGING">包材</option>
                  </select>
                  <span v-else class="text-xs text-slate-400">已有</span>
                </td>
                <td class="py-1 px-2">
                  <input
                    v-model.number="editItemAt(i).quantity"
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    class="w-20 border border-slate-200 rounded px-2 py-1 text-xs text-right"
                  />
                </td>
                <td class="py-1 px-2">
                  <input
                    v-model.number="editItemAt(i).scrapRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    class="w-16 border border-slate-200 rounded px-2 py-1 text-xs text-right"
                  />
                </td>
                <td class="py-1 pr-1 text-center">
                  <button
                    @click="editForm.items.splice(i, 1)"
                    class="text-red-400 hover:text-red-600 min-h-[32px] min-w-[32px]"
                  >
                    &times;
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 编辑物料 — 移动端卡片 -->
        <div class="md:hidden space-y-3">
          <div
            v-for="(_, i) in editForm.items"
            :key="i"
            class="bg-slate-50 rounded-lg p-3 border space-y-2"
          >
            <div class="flex justify-between">
              <button
                @click="openEditMaterialPicker(i)"
                class="text-sm font-mono border-b border-dashed border-blue-300 text-blue-600 min-h-[36px]"
              >
                {{
                  editItemAt(i).materialId !== "__NEW__"
                    ? editItemAt(i).existingProduct?.code ||
                      editItemAt(i).materialId?.substring(0, 8) + "..."
                    : editItemAt(i).materialName || "选择物料"
                }}
              </button>
              <button
                @click="editForm.items.splice(i, 1)"
                class="text-red-400 hover:text-red-600 min-h-[36px] min-w-[36px]"
              >
                &times;
              </button>
            </div>
            <input
              v-model="editItemAt(i).materialName"
              placeholder="名称"
              :disabled="!!editItemAt(i).existingProduct"
              class="w-full border rounded px-2 py-1.5 text-sm disabled:bg-slate-100"
            />
            <div class="grid grid-cols-2 gap-2">
              <input
                v-model="editItemAt(i).spec"
                placeholder="型号"
                :disabled="!!editItemAt(i).existingProduct"
                class="w-full border rounded px-2 py-1.5 text-sm disabled:bg-slate-100"
              />
              <select
                v-model="editItemAt(i).unit"
                :disabled="!!editItemAt(i).existingProduct"
                class="w-full border rounded px-2 py-1.5 text-sm disabled:bg-slate-100"
              >
                <option
                  v-for="u in unitOptions"
                  :key="u.value"
                  :value="u.value"
                >
                  {{ u.label }}
                </option>
              </select>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="text-xs text-slate-400">用量</label
                ><input
                  v-model.number="editItemAt(i).quantity"
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  class="w-full border rounded px-2 py-1 text-sm text-right"
                />
              </div>
              <div>
                <label class="text-xs text-slate-400">损耗率</label
                ><input
                  v-model.number="editItemAt(i).scrapRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  class="w-full border rounded px-2 py-1 text-sm text-right"
                />
              </div>
              <div v-if="!editItemAt(i).existingProduct">
                <label class="text-xs text-slate-400">分类</label
                ><select
                  v-model="editItemAt(i).category"
                  class="w-full border rounded px-2 py-1 text-sm"
                >
                  <option value="RAW">原材料</option>
                  <option value="SEMI">半成品</option>
                  <option value="PACKAGING">包材</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <button
          @click="addEditItem"
          class="mt-3 min-h-[44px] w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
        >
          + 添加物料行
        </button>
        <div class="flex gap-2 mt-4">
          <button
            @click="handleEditSubmit"
            class="flex-1 min-h-[44px] bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition text-sm"
          >
            保存修改
          </button>
          <button
            @click="showEditModal = false"
            class="flex-1 min-h-[44px] border py-2 rounded-lg hover:bg-slate-50 transition text-sm"
          >
            取消
          </button>
        </div>
      </div>
    </div>

    <!-- 物料选择弹窗 -->
    <div
      v-if="showEditMaterialPicker !== null"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showEditMaterialPicker = null"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col"
      >
        <h2 class="text-lg font-bold mb-4">选择物料</h2>
        <div class="flex gap-2 mb-4">
          <input
            v-model="editMaterialSearch"
            placeholder="搜索产品..."
            class="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            @click="
              newEditMaterialName = '';
              showNewEditMaterialInput = true;
            "
            class="min-h-[44px] px-3 text-sm text-slate-500 border rounded-lg hover:bg-slate-50 whitespace-nowrap"
          >
            新建物料
          </button>
        </div>
        <div
          v-if="showNewEditMaterialInput"
          class="mb-4 space-y-2 border rounded-lg p-3 bg-slate-50"
        >
          <input
            v-model="newEditMaterialName"
            placeholder="物料名称 *"
            class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm min-h-[44px]"
          />
          <div class="grid grid-cols-2 gap-2">
            <input
              v-model="newEditMaterialSpec"
              placeholder="规格"
              class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm min-h-[44px]"
            />
            <select
              v-model="newEditMaterialUnit"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white"
            >
              <option v-for="u in unitOptions" :key="u.value" :value="u.value">
                {{ u.label }}
              </option>
            </select>
          </div>
          <select
            v-model="newEditMaterialCategory"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white"
          >
            <option value="RAW">原材料</option>
            <option value="SEMI">半成品</option>
            <option value="PACKAGING">包材</option>
          </select>
          <button
            @click="createEditMaterial"
            class="min-h-[44px] w-full px-3 bg-blue-500 text-white rounded-lg text-sm"
          >
            确认创建
          </button>
        </div>
        <div class="flex-1 overflow-y-auto space-y-1">
          <button
            v-for="p in filteredEditMaterials"
            :key="p.id"
            @click="selectEditMaterial(showEditMaterialPicker, p)"
            class="w-full text-left px-4 py-3 rounded-lg text-sm hover:bg-blue-50 transition border border-transparent"
          >
            <span class="font-mono text-xs text-slate-400 mr-2">{{
              p.code
            }}</span
            ><span class="font-medium">{{ p.name }}</span>
          </button>
          <p
            v-if="
              filteredEditMaterials.length === 0 && !showNewEditMaterialInput
            "
            class="text-center text-slate-400 py-4"
          >
            无匹配产品，点击"新建物料"创建
          </p>
        </div>
        <button
          @click="
            showEditMaterialPicker = null;
            showNewEditMaterialInput = false;
          "
          class="mt-4 w-full min-h-[44px] border py-2 rounded-lg hover:bg-slate-50 text-sm"
        >
          关闭
        </button>
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
  data: bom,
  loading,
  execute: loadBom,
} = useApiFetch<any>(() => `/api/bom/${route.params.id}`);
await loadBom();

const { data: history } = await useFetch(`/api/bom/${route.params.id}/history`);
const { data: productsData } = await useFetch("/api/products?limit=500");
const allProducts = computed(() => (productsData.value as any)?.data || []);

const unitOptions = [
  { value: "PCS", label: "个 (PCS)" },
  { value: "KG", label: "千克 (KG)" },
  { value: "G", label: "克 (G)" },
  { value: "M", label: "米 (M)" },
  { value: "CM", label: "厘米 (CM)" },
  { value: "MM", label: "毫米 (MM)" },
  { value: "M2", label: "平方米 (M²)" },
  { value: "M3", label: "立方米 (M³)" },
  { value: "L", label: "升 (L)" },
  { value: "ML", label: "毫升 (ML)" },
  { value: "SET", label: "套 (SET)" },
  { value: "PAIR", label: "双 (PAIR)" },
  { value: "ROLL", label: "卷 (ROLL)" },
];

const showEditModal = ref(false);
const showEditMaterialPicker = ref<number | null>(null);
const editMaterialSearch = ref("");
const showNewEditMaterialInput = ref(false);
const newEditMaterialName = ref("");
const newEditMaterialSpec = ref("");
const newEditMaterialUnit = ref("PCS");
const newEditMaterialCategory = ref("RAW");

type EditItem = {
  materialId: string;
  materialName: string;
  spec: string;
  quantity: number;
  unit: string;
  category: string;
  scrapRate: number;
  existingProduct: any;
};
const editForm = reactive({ items: [] as EditItem[] });

function editItemAt(i: number): EditItem {
  return editForm.items[i]!;
}

const filteredEditMaterials = computed(() => {
  if (!editMaterialSearch.value.trim()) return allProducts.value;
  const q = editMaterialSearch.value.toLowerCase();
  return allProducts.value.filter(
    (p: any) =>
      p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q),
  );
});

const openEdit = () => {
  editForm.items = (bom.value?.items || []).map((item: any) => ({
    materialId: item.materialId,
    materialName: item.materialName,
    spec: item.material?.spec || "",
    quantity: Number(item.quantity),
    unit: item.unit,
    category: item.material?.category || "",
    scrapRate: Number(item.scrapRate) || 0,
    existingProduct: item.material || null,
  }));
  showEditModal.value = true;
};

const openEditMaterialPicker = (i: number) => {
  showEditMaterialPicker.value = i;
  editMaterialSearch.value = "";
};

const selectEditMaterial = (i: number, p: any) => {
  const item = editItemAt(i);
  item.materialId = p.id;
  item.materialName = p.name;
  item.spec = p.spec || "";
  item.unit = p.unit || "PCS";
  item.existingProduct = p;
  showEditMaterialPicker.value = null;
};

const createEditMaterial = () => {
  if (!newEditMaterialName.value.trim()) return toast.error("请输入物料名称");
  const i = showEditMaterialPicker.value!;
  const item = editItemAt(i);
  item.materialId = "__NEW__";
  item.materialName = newEditMaterialName.value.trim();
  item.spec = newEditMaterialSpec.value;
  item.unit = newEditMaterialUnit.value;
  item.category = newEditMaterialCategory.value;
  item.existingProduct = null;
  showEditMaterialPicker.value = null;
  showNewEditMaterialInput.value = false;
  newEditMaterialSpec.value = "";
  newEditMaterialUnit.value = "PCS";
  newEditMaterialCategory.value = "RAW";
  toast.success(`物料"${newEditMaterialName.value}"将在保存时自动创建`);
};

const addEditItem = () => {
  editForm.items.push({
    materialId: "__NEW__",
    materialName: "",
    spec: "",
    quantity: 1,
    unit: "PCS",
    category: "RAW",
    scrapRate: 0,
    existingProduct: null,
  });
};

const handleEditSubmit = async () => {
  const newItems = editForm.items.filter(
    (i) => i.materialId === "__NEW__" && i.materialName.trim(),
  );
  if (newItems.length > 0) {
    const names = newItems.map((i) => i.materialName).join("、");
    if (!confirm(`以下物料将自动创建：${names}，确认继续？`)) return;
  }
  try {
    const result = await apiFetch(`/api/bom/${route.params.id}/update`, {
      method: "PUT" as any,
      body: {
        items: editForm.items.map((i) => ({
          materialId: i.materialId === "__NEW__" ? undefined : i.materialId,
          materialName: i.materialName,
          quantity: i.quantity,
          unit: i.unit,
          spec: i.spec,
          category: i.category,
          scrapRate: i.scrapRate,
        })),
      },
    });
    toast.success("BOM 更新成功");
    showEditModal.value = false;
    if (result.id !== route.params.id) await navigateTo(`/bom/${result.id}`);
    else await loadBom();
  } catch (e: any) {
    toast.error(e, "更新失败");
  }
};

const handlePublish = async () => {
  try {
    await apiFetch(`/api/bom/${route.params.id}/publish`, {
      method: "PATCH" as any,
    });
    toast.success("BOM 已发布");
    await loadBom();
  } catch (e: any) {
    toast.error(e, "发布失败");
  }
};

const handleObsolete = async () => {
  if (!confirm("确认废弃此 BOM？")) return;
  try {
    await apiFetch(`/api/bom/${route.params.id}/obsolete`, {
      method: "PATCH" as any,
    });
    toast.success("BOM 已废弃");
    navigateTo("/bom");
  } catch (e: any) {
    toast.error(e, "废弃失败");
  }
};

const formatDate = (d: string) =>
  d ? new Date(d).toLocaleDateString("zh-CN") : "-";
const statusLabel = (s: string) =>
  ({ DRAFT: "草稿", PUBLISHED: "已发布", OBSOLETED: "已废弃" })[s] || s;
const statusIcon = (s: string) =>
  ({ DRAFT: "📝", PUBLISHED: "✅", OBSOLETED: "📦" })[s] || "";
const statusBadge = (s: string) => {
  const m: Record<string, string> = {
    DRAFT: "bg-amber-100 text-amber-800 border-amber-300",
    PUBLISHED: "bg-green-100 text-green-800 border-green-300",
    OBSOLETED: "bg-slate-100 text-slate-600 border-slate-300",
  };
  return `inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${m[s] || "bg-slate-100 text-slate-600 border-slate-300"}`;
};
</script>
