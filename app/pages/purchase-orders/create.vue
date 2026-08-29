<!-- pages/purchase-orders/create.vue -->
<template>
  <div class="max-w-4xl mx-auto">
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink
        to="/purchase-orders"
        class="text-slate-500 hover:text-slate-700"
        >&larr; 返回</NuxtLink
      >
      <h1 class="text-xl lg:text-2xl font-bold">创建采购单</h1>
    </div>

    <div class="bg-white rounded-xl shadow p-4 lg:p-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >供应商 *</label
          >
          <button
            @click="showSupplierPicker = true"
            type="button"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm text-left focus:ring-2 focus:ring-blue-500 outline-none transition hover:border-blue-400"
            :class="selectedSupplier ? 'text-slate-900' : 'text-slate-400'"
          >
            {{
              selectedSupplier
                ? `${selectedSupplier.code} ${selectedSupplier.name}`
                : "点击选择供应商"
            }}
          </button>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >预计到货日期</label
          >
          <input
            v-model="expectedDate"
            max="9999-12-30"
            type="date"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
      </div>

      <!-- 采购明细 -->
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-semibold">采购明细</h2>
      </div>

      <!-- 桌面端表格 -->
      <div class="hidden md:block overflow-x-auto mb-4">
        <table class="w-full min-w-[600px]">
          <thead>
            <tr class="border-b bg-slate-100">
              <th
                class="text-left py-3 px-2 text-xs font-medium text-slate-500 uppercase"
              >
                产品 *
              </th>
              <th
                class="text-left py-3 px-2 text-xs font-medium text-slate-500 uppercase"
              >
                规格
              </th>
              <th
                class="text-center py-3 px-2 text-xs font-medium text-slate-500 uppercase w-16"
              >
                单位
              </th>
              <th
                class="text-right py-3 px-2 text-xs font-medium text-slate-500 uppercase w-20"
              >
                数量
              </th>
              <th
                class="text-right py-3 px-2 text-xs font-medium text-slate-500 uppercase w-24"
              >
                单价(元)
              </th>
              <th
                class="text-right py-3 px-2 text-xs font-medium text-slate-500 uppercase w-24"
              >
                小计
              </th>
              <th class="w-8"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="(_, i) in items" :key="i" class="even:bg-slate-50/50">
              <td class="py-2 px-2">
                <button
                  @click="openProductPicker(i)"
                  class="w-full min-h-[36px] text-left border border-slate-200 rounded px-3 py-1.5 text-xs hover:border-blue-400 transition"
                  :class="
                    itemAt(i).productId
                      ? 'text-slate-900 font-mono'
                      : 'text-slate-400'
                  "
                >
                  {{
                    itemAt(i).productId && itemAt(i).productId !== "__NEW__"
                      ? itemAt(i).productCode ||
                        itemAt(i).productId?.substring(0, 8) + "..."
                      : itemAt(i).productName || "选择产品"
                  }}
                </button>
              </td>
              <td class="py-2 px-2">
                <input
                  v-model="itemAt(i).spec"
                  :disabled="!!itemAt(i).productId"
                  class="w-full border border-slate-200 rounded px-2 py-1 text-xs disabled:bg-slate-100"
                />
              </td>
              <td class="py-2 px-2">
                <input
                  v-model="itemAt(i).unit"
                  :disabled="!!itemAt(i).productId"
                  class="w-full border border-slate-200 rounded px-2 py-1 text-xs text-center disabled:bg-slate-100"
                />
              </td>
              <td class="py-2 px-2">
                <input
                  v-model.number="itemAt(i).quantity"
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  class="w-full border border-slate-200 rounded px-2 py-1.5 text-xs text-right"
                />
              </td>
              <td class="py-2 px-2">
                <input
                  v-model.number="itemAt(i).unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  class="w-full border border-slate-200 rounded px-2 py-1.5 text-xs text-right"
                />
              </td>
              <td
                class="py-2 px-2 text-xs text-right text-slate-600 font-medium"
              >
                ¥{{
                  (
                    (itemAt(i).quantity || 0) * (itemAt(i).unitPrice || 0)
                  ).toFixed(2)
                }}
              </td>
              <td class="py-2 pr-1 text-center">
                <button
                  @click="items.splice(i, 1)"
                  class="text-red-400 hover:text-red-600 text-lg min-h-[36px] min-w-[36px]"
                >
                  &times;
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 移动端卡片 -->
      <div class="md:hidden space-y-3 mb-4">
        <div
          v-for="(_, i) in items"
          :key="i"
          class="bg-slate-50 rounded-xl p-4 border space-y-2"
        >
          <div class="flex items-center justify-between">
            <button
              @click="openProductPicker(i)"
              class="text-sm font-mono border-b border-dashed border-blue-300 text-blue-600 min-h-[36px]"
            >
              {{
                itemAt(i).productId
                  ? itemAt(i).productCode ||
                    itemAt(i).productId?.substring(0, 8) + "..."
                  : "选择产品"
              }}
            </button>
            <button
              @click="items.splice(i, 1)"
              class="text-red-400 hover:text-red-600 text-xl min-h-[36px] min-w-[36px]"
            >
              &times;
            </button>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <input
              v-model="itemAt(i).spec"
              placeholder="规格"
              :disabled="!!itemAt(i).productId"
              class="w-full border rounded px-3 py-2 text-sm disabled:bg-slate-100"
            />
            <input
              v-model="itemAt(i).unit"
              placeholder="单位"
              :disabled="!!itemAt(i).productId"
              class="w-full border rounded px-3 py-2 text-sm disabled:bg-slate-100"
            />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-xs text-slate-400">数量</label
              ><input
                v-model.number="itemAt(i).quantity"
                type="number"
                min="0.0001"
                step="0.0001"
                class="w-full border rounded px-3 py-2 text-sm text-right"
              />
            </div>
            <div>
              <label class="text-xs text-slate-400">单价</label
              ><input
                v-model.number="itemAt(i).unitPrice"
                type="number"
                step="0.01"
                min="0"
                class="w-full border rounded px-3 py-2 text-sm text-right"
              />
            </div>
          </div>
          <div class="text-right text-sm font-medium text-slate-700">
            小计：¥{{
              ((itemAt(i).quantity || 0) * (itemAt(i).unitPrice || 0)).toFixed(
                2,
              )
            }}
          </div>
        </div>
      </div>

      <button
        @click="addItem"
        class="min-h-[44px] w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
      >
        + 添加明细行
      </button>

      <div class="mt-4">
        <label class="block text-sm font-medium text-slate-700 mb-1"
          >备注</label
        >
        <textarea
          v-model="remark"
          rows="2"
          class="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
        ></textarea>
      </div>

      <button
        @click="handleCreate"
        class="mt-6 w-full min-h-[48px] bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition font-medium text-sm"
      >
        提交采购单
      </button>
    </div>

    <!-- 产品选择弹窗 -->
    <div
      v-if="showProductPicker !== null"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showProductPicker = null"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col"
      >
        <h2 class="text-lg font-bold mb-4">选择产品</h2>
        <div class="flex gap-2 mb-4">
          <input
            v-model="productSearch"
            placeholder="搜索产品..."
            class="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            @click="
              newMaterialName = '';
              showNewMaterialInput = true;
            "
            class="min-h-[44px] px-3 text-sm text-slate-500 border rounded-lg hover:bg-slate-50 whitespace-nowrap"
          >
            新建物料
          </button>
        </div>
        <div
          v-if="showNewMaterialInput"
          class="mb-4 space-y-2 border rounded-lg p-3 bg-slate-50"
        >
          <input
            v-model="newMaterialName"
            placeholder="物料名称 *"
            class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm min-h-[44px]"
          />
          <div class="grid grid-cols-2 gap-2">
            <input
              v-model="newMaterialSpec"
              placeholder="规格"
              class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm min-h-[44px]"
            />
            <select
              v-model="newMaterialUnit"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white"
            >
              <option value="PCS">个 (PCS)</option>
              <option value="KG">千克 (KG)</option>
              <option value="G">克 (G)</option>
              <option value="M">米 (M)</option>
              <option value="SET">套 (SET)</option>
              <option value="ROLL">卷 (ROLL)</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <select
              v-model="newMaterialCategory"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white"
            >
              <option value="RAW">原材料</option>
              <option value="SEMI">半成品</option>
              <option value="PACKAGING">包材</option>
            </select>
          </div>
          <button
            @click="createAndSelectProduct"
            class="min-h-[44px] w-full px-3 bg-blue-500 text-white rounded-lg text-sm"
          >
            确认创建
          </button>
        </div>
        <div class="flex-1 overflow-y-auto space-y-1">
          <button
            v-for="p in filteredProducts"
            :key="p.id"
            @click="selectProduct(showProductPicker, p)"
            class="w-full text-left px-4 py-3 rounded-lg text-sm hover:bg-blue-50 transition border border-transparent"
          >
            <span class="font-mono text-xs text-slate-400 mr-2">{{
              p.code
            }}</span
            ><span class="font-medium">{{ p.name }}</span>
          </button>
          <p
            v-if="filteredProducts.length === 0 && !showNewMaterialInput"
            class="text-center text-slate-400 py-4"
          >
            无匹配产品，点击"新建物料"创建
          </p>
        </div>
        <button
          @click="
            showProductPicker = null;
            showNewMaterialInput = false;
          "
          class="mt-4 w-full min-h-[44px] border py-2 rounded-lg hover:bg-slate-50 text-sm"
        >
          关闭
        </button>
      </div>
    </div>
    <!-- 供应商选择弹窗 -->
    <div
      v-if="showSupplierPicker"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showSupplierPicker = false"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col"
      >
        <h2 class="text-lg font-bold mb-4">选择供应商</h2>
        <input
          v-model="supplierSearch"
          placeholder="搜索供应商..."
          class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm mb-4 min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <div class="flex-1 overflow-y-auto space-y-1">
          <button
            v-for="s in filteredSuppliers"
            :key="s.id"
            @click="selectSupplier(s)"
            class="w-full text-left px-4 py-3 rounded-lg text-sm hover:bg-blue-50 transition border border-transparent"
          >
            <span class="font-mono text-xs text-slate-400 mr-2">{{
              s.code
            }}</span
            ><span class="font-medium">{{ s.name }}</span>
          </button>
          <p
            v-if="filteredSuppliers.length === 0"
            class="text-center text-slate-400 py-8"
          >
            无匹配供应商
          </p>
        </div>
        <button
          @click="showSupplierPicker = false"
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

const selectedSupplier = ref<any>(null);
const expectedDate = ref("");
const remark = ref("");
const showProductPicker = ref<number | null>(null);
const showSupplierPicker = ref(false);
const productSearch = ref("");
const supplierSearch = ref("");
const showNewMaterialInput = ref(false);
const newMaterialName = ref("");
const newMaterialSpec = ref("");
const newMaterialUnit = ref("PCS");
const newMaterialCategory = ref("RAW");
type Item = {
  productId: string;
  productName: string;
  productCode?: string;
  category: string;
  spec: string;
  unit: string;
  quantity: number;
  unitPrice: number;
};
const items = reactive<Item[]>([
  {
    productId: "",
    productName: "",
    spec: "",
    unit: "PCS",
    category: "RAW",
    quantity: 1,
    unitPrice: 0,
  },
]);

function itemAt(i: number): Item {
  return items[i]!;
}
const addItem = () =>
  items.push({
    productId: "",
    productName: "",
    spec: "",
    category: "RAW",
    unit: "PCS",
    quantity: 1,
    unitPrice: 0,
  });

// 产品
const { data: productsData } = await useFetch("/api/products?limit=500");
const allProducts = computed(() => (productsData.value as any)?.data || []);
const filteredProducts = computed(() => {
  if (!productSearch.value.trim()) return allProducts.value;
  const q = productSearch.value.toLowerCase();
  return allProducts.value.filter(
    (p: any) =>
      p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q),
  );
});

const openProductPicker = (i: number) => {
  showProductPicker.value = i;
  productSearch.value = "";
};
const selectProduct = (i: number, p: any) => {
  const item = itemAt(i);
  item.productId = p.id;
  item.productName = p.name;
  item.productCode = p.code;
  ((item.category = p.category), (item.spec = p.spec || ""));
  item.unit = p.unit || "PCS";
  showProductPicker.value = null;
  showNewMaterialInput.value = false;
};

const createAndSelectProduct = async () => {
  if (!newMaterialName.value.trim()) return toast.error("请输入物料名称");
  const i = showProductPicker.value!;
  const item = itemAt(i);
  item.productId = "__NEW__";
  item.productName = newMaterialName.value.trim();
  item.productCode = newMaterialName.value.trim();
  item.category = newMaterialCategory.value;
  item.spec = newMaterialSpec.value;
  item.unit = newMaterialUnit.value;
  showProductPicker.value = null;
  showNewMaterialInput.value = false;
  newMaterialSpec.value = "";
  newMaterialUnit.value = "PCS";
  newMaterialCategory.value = "RAW";
  toast.success(`物料"${newMaterialName.value.trim()}"将在提交时自动创建`);
};
// 供应商
const { data: suppliersData } = await useFetch(
  "/api/suppliers?limit=200&status=ACTIVE",
);
const allSuppliers = computed(() => (suppliersData.value as any)?.data || []);
const filteredSuppliers = computed(() => {
  if (!supplierSearch.value.trim()) return allSuppliers.value;
  const q = supplierSearch.value.toLowerCase();
  return allSuppliers.value.filter(
    (s: any) =>
      s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q),
  );
});
const selectSupplier = (s: any) => {
  selectedSupplier.value = s;
  showSupplierPicker.value = false;
};

const handleCreate = async () => {
  if (!selectedSupplier.value) return toast.error("请选择供应商");
  const validItems = items.filter((i) => i.productId);
  if (validItems.length === 0) return toast.error("请至少添加一条采购明细");
  try {
    await apiFetch("/api/purchase-orders", {
      method: "POST",
      body: {
        supplierId: selectedSupplier.value.id,
        expectedDate: expectedDate.value || undefined,
        remark: remark.value || undefined,
        items: validItems.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          spec: i.spec,
          unit: i.unit,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      },
    });
    toast.success("采购单创建成功");
    await navigateTo("/purchase-orders");
  } catch (e: any) {
    toast.error(e, "创建失败");
  }
};
</script>
