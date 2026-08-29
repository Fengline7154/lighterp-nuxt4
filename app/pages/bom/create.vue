<template>
  <div>
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink to="/bom" class="text-slate-500 hover:text-slate-700"
        >&larr; 返回</NuxtLink
      >
      <h1 class="text-xl lg:text-2xl font-bold">创建 BOM</h1>
    </div>

    <div class="bg-white rounded-xl shadow p-4 lg:p-6">
      <!-- 基本信息 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >产品 *</label
          >
          <div class="flex gap-2">
            <button
              @click="showProductPicker = true"
              class="flex-1 min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm text-left focus:ring-2 focus:ring-blue-500 outline-none transition hover:border-blue-400"
              :class="form.productId ? 'text-slate-900' : 'text-slate-400'"
            >
              {{ form.productId ? selectedProductLabel : "点击选择已有产品" }}
            </button>
            <span class="text-slate-400 self-center text-sm">或</span>
            <input
              v-model="form.productName"
              @input="onProductNameInput"
              placeholder="输入新产品名称"
              class="flex-1 min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <p class="text-xs text-slate-400 mt-1">
            选择已有产品或输入新产品名称（新产品将自动创建为"成品"）
          </p>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >关联订单</label
          >
          <div class="flex gap-2">
            <input
              v-model="orderCode"
              class="flex-1 min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="输入订单号"
            />
            <button
              @click="showOrderPicker = true"
              class="min-h-[44px] min-w-[44px] px-3 border border-slate-300 rounded-lg text-slate-500 hover:text-blue-500 hover:border-blue-400 transition text-sm flex items-center justify-center"
              title="浏览订单"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <!-- 物料明细 -->
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-semibold">物料明细</h2>
      </div>

      <!-- 桌面端：表格 -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full min-w-[800px] whitespace-nowrap">
          <thead>
            <tr class="border-b bg-slate-100">
              <th
                class="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase"
              >
                物料编号
              </th>
              <th
                class="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase"
              >
                名称
              </th>
              <th
                class="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase"
              >
                型号
              </th>
              <th
                class="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase"
              >
                单位
              </th>
              <th
                class="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase"
              >
                分类
              </th>
              <th
                class="text-right py-2 px-3 text-xs font-medium text-slate-500 uppercase"
              >
                用量
              </th>
              <th
                class="text-right py-2 px-3 text-xs font-medium text-slate-500 uppercase"
              >
                损耗率
              </th>
              <th class="w-10"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="(_, i) in form.items"
              :key="i"
              class="hover:bg-blue-50/30 even:bg-slate-50/50 transition"
            >
              <td class="py-2 px-3">
                <button
                  @click="openMaterialPicker(i)"
                  class="w-full min-h-[36px] text-left border border-slate-200 rounded px-3 py-1.5 text-xs hover:border-blue-400 transition"
                  :class="
                    itemAt(i).materialId !== '__NEW__'
                      ? 'text-slate-900 font-mono'
                      : 'text-slate-400'
                  "
                >
                  {{
                    itemAt(i).materialId !== "__NEW__"
                      ? itemAt(i).existingProduct?.code ||
                        itemAt(i).materialId?.substring(0, 8) + "..."
                      : "选择物料"
                  }}
                </button>
              </td>
              <td class="py-2 px-3">
                <input
                  v-model="itemAt(i).materialName"
                  :disabled="itemAt(i).materialId !== '__NEW__'"
                  class="w-full border border-slate-200 rounded px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-slate-100 disabled:text-slate-500"
                />
              </td>
              <td class="py-2 px-3">
                <input
                  v-model="itemAt(i).spec"
                  :disabled="itemAt(i).materialId !== '__NEW__'"
                  class="w-full border border-slate-200 rounded px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-slate-100 disabled:text-slate-500"
                />
              </td>
              <td class="py-2 px-3">
                <select
                  v-model="itemAt(i).unit"
                  :disabled="itemAt(i).materialId !== '__NEW__'"
                  class="w-full border border-slate-200 rounded px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option v-for="u in units" :key="u" :value="u">
                    {{ u }}
                  </option>
                </select>
              </td>
              <td class="py-2 px-3">
                <select
                  v-if="itemAt(i).materialId === '__NEW__'"
                  v-model="itemAt(i).category"
                  class="w-full border border-slate-200 rounded px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                >
                  <option value="RAW">原材料</option>
                  <option value="SEMI">半成品</option>
                  <option value="PACKAGING">包材</option>
                </select>
                <span v-else class="text-xs text-slate-400">已有</span>
              </td>
              <td class="py-2 text-right px-3">
                <input
                  v-model.number="itemAt(i).quantity"
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  class="w-24 border border-slate-200 rounded px-3 py-1.5 text-xs text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </td>
              <td class="py-2 text-right px-3">
                <input
                  v-model.number="itemAt(i).scrapRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  class="w-20 border border-slate-200 rounded px-3 py-1.5 text-xs text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </td>
              <td class="py-2 pr-3 text-center">
                <button
                  @click="removeItem(i)"
                  class="text-red-400 hover:text-red-600 text-lg leading-none min-h-[36px] min-w-[36px]"
                >
                  &times;
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <button
          @click="addItem"
          class="mt-3 min-h-[44px] w-full border-2 border-dashed border-slate-300 rounded-lg text-slate-400 hover:text-blue-500 hover:border-blue-400 transition text-sm flex items-center justify-center gap-1"
        >
          + 添加物料行
        </button>
      </div>

      <!-- 移动端：物料卡片 + 底部固定添加按钮 -->
      <div class="md:hidden">
        <div class="space-y-3 pb-20">
          <div
            v-for="(_, i) in form.items"
            :key="i"
            class="bg-slate-50 rounded-xl p-4 space-y-2 border"
          >
            <div class="flex items-center justify-between">
              <button
                @click="openMaterialPicker(i)"
                class="text-sm font-mono border-b border-dashed border-blue-300 text-blue-600 min-h-[36px]"
              >
                {{
                  itemAt(i).materialId !== "__NEW__"
                    ? itemAt(i).existingProduct?.code ||
                      itemAt(i).materialId?.substring(0, 8) + "..."
                    : "选择物料"
                }}
              </button>
              <button
                @click="removeItem(i)"
                class="text-red-400 hover:text-red-600 text-xl min-h-[36px] min-w-[36px]"
              >
                &times;
              </button>
            </div>
            <input
              v-model="itemAt(i).materialName"
              placeholder="物料名称"
              :disabled="itemAt(i).materialId !== '__NEW__'"
              class="w-full border rounded px-3 py-2 text-sm disabled:bg-slate-100"
            />
            <div class="grid grid-cols-2 gap-2">
              <input
                v-model="itemAt(i).spec"
                placeholder="型号"
                :disabled="itemAt(i).materialId !== '__NEW__'"
                class="w-full border rounded px-3 py-2 text-sm disabled:bg-slate-100"
              />
              <select
                v-model="itemAt(i).unit"
                :disabled="itemAt(i).materialId !== '__NEW__'"
                class="w-full border rounded px-3 py-2 text-sm disabled:bg-slate-100"
              >
                <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
              </select>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="text-xs text-slate-400">用量</label>
                <input
                  v-model.number="itemAt(i).quantity"
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  class="w-full border rounded px-2 py-1.5 text-sm text-right"
                />
              </div>
              <div>
                <label class="text-xs text-slate-400">损耗率</label>
                <input
                  v-model.number="itemAt(i).scrapRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  class="w-full border rounded px-2 py-1.5 text-sm text-right"
                />
              </div>
              <div v-if="itemAt(i).materialId === '__NEW__'">
                <label class="text-xs text-slate-400">分类</label>
                <select
                  v-model="itemAt(i).category"
                  class="w-full border rounded px-2 py-1.5 text-sm"
                >
                  <option value="RAW">原材料</option>
                  <option value="SEMI">半成品</option>
                  <option value="PACKAGING">包材</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <!-- 移动端固定底部按钮：添加物料 + 提交 -->
        <div
          class="fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex gap-3 z-30"
        >
          <button
            @click="addItem"
            class="min-h-[48px] px-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:text-blue-500 hover:border-blue-400 transition text-sm flex items-center justify-center gap-1 flex-1"
          >
            + 添加物料
          </button>
          <button
            @click="handleCreate"
            class="min-h-[48px] px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium text-sm flex-shrink-0"
          >
            提交
          </button>
        </div>
      </div>

      <!-- 桌面端提交按钮 -->
      <button
        @click="handleCreate"
        class="hidden md:block mt-6 w-full min-h-[48px] bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition font-medium text-sm"
      >
        提交 BOM
      </button>
    </div>

    <!-- 产品选择弹窗 -->
    <div
      v-if="showProductPicker"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showProductPicker = false"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col"
      >
        <h2 class="text-lg font-bold mb-4">选择产品</h2>
        <input
          v-model="productSearch"
          placeholder="搜索产品编号或名称..."
          class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm mb-4 min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <div class="flex-1 overflow-y-auto space-y-1">
          <button
            v-for="p in filteredProducts"
            :key="p.id"
            @click="selectProduct(p)"
            class="w-full text-left px-4 py-3 rounded-lg text-sm hover:bg-blue-50 transition"
            :class="
              form.productId === p.id
                ? 'bg-blue-50 border border-blue-300'
                : 'border border-transparent'
            "
          >
            <span class="font-mono text-xs text-slate-400 mr-2">{{
              p.code
            }}</span>
            <span class="font-medium">{{ p.name }}</span>
          </button>
          <p
            v-if="filteredProducts.length === 0"
            class="text-center text-slate-400 py-8"
          >
            无匹配产品
          </p>
        </div>
        <button
          @click="showProductPicker = false"
          class="mt-4 w-full min-h-[44px] border py-2 rounded-lg hover:bg-slate-50 text-sm"
        >
          关闭
        </button>
      </div>
    </div>

    <!-- 物料选择弹窗 -->
    <div
      v-if="showMaterialPicker !== null"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showMaterialPicker = null"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col"
      >
        <h2 class="text-lg font-bold mb-4">选择物料</h2>
        <div class="flex gap-2 mb-4">
          <input
            v-model="materialSearch"
            placeholder="搜索产品编号或名称..."
            class="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            @click="clearMaterialSelection(showMaterialPicker)"
            class="min-h-[44px] px-3 text-sm text-slate-500 border rounded-lg hover:bg-slate-50"
          >
            新建物料
          </button>
        </div>
        <div class="flex-1 overflow-y-auto space-y-1">
          <button
            v-for="p in filteredMaterials"
            :key="p.id"
            @click="selectMaterial(showMaterialPicker, p)"
            class="w-full text-left px-4 py-3 rounded-lg text-sm hover:bg-blue-50 transition border border-transparent"
          >
            <span class="font-mono text-xs text-slate-400 mr-2">{{
              p.code
            }}</span>
            <span class="font-medium">{{ p.name }}</span>
            <span class="text-xs text-slate-400 ml-1">{{ p.spec || "" }}</span>
          </button>
          <p
            v-if="filteredMaterials.length === 0"
            class="text-center text-slate-400 py-4"
          >
            无匹配产品，点击"新建物料"手动录入
          </p>
        </div>
        <button
          @click="showMaterialPicker = null"
          class="mt-4 w-full min-h-[44px] border py-2 rounded-lg hover:bg-slate-50 text-sm"
        >
          关闭
        </button>
      </div>
    </div>

    <!-- 订单选择弹窗 -->
    <div
      v-if="showOrderPicker"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showOrderPicker = false"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col"
      >
        <h2 class="text-lg font-bold mb-4">选择订单</h2>
        <input
          v-model="orderSearch"
          placeholder="搜索订单号..."
          class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm mb-4 min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <div class="flex-1 overflow-y-auto space-y-1">
          <button
            v-for="o in filteredOrders"
            :key="o.id"
            @click="selectOrder(o.orderCode)"
            class="w-full text-left px-4 py-3 rounded-lg text-sm hover:bg-blue-50 transition flex justify-between items-center border border-transparent"
          >
            <span class="font-mono">{{ o.orderCode }}</span>
            <span class="text-xs text-slate-400">{{
              o.customer?.name || "无客户"
            }}</span>
          </button>
          <p
            v-if="filteredOrders.length === 0"
            class="text-center text-slate-400 py-8"
          >
            无匹配订单
          </p>
        </div>
        <button
          @click="showOrderPicker = false"
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

const units = [
  "PCS",
  "KG",
  "G",
  "M",
  "CM",
  "MM",
  "M2",
  "M3",
  "L",
  "ML",
  "SET",
  "PAIR",
  "ROLL",
];

type MaterialItem = {
  spec: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  isNew: boolean;
  category: string;
  scrapRate: number;
  existingProduct: any;
};

const showProductPicker = ref(false);
const showMaterialPicker = ref<number | null>(null);
const showOrderPicker = ref(false);
const productSearch = ref("");
const materialSearch = ref("");
const orderSearch = ref("");
const orderCode = ref("");

const form = reactive({
  productId: "",
  productName: "",
  items: [] as MaterialItem[],
});

function itemAt(i: number): MaterialItem {
  return form.items[i]!;
}

function removeItem(i: number) {
  form.items.splice(i, 1);
}

const preselectProductId = route.query.productId as string;
const preselectProductName = route.query.productName as string;
const preselectOrderId = route.query.orderId as string;

const { data: productsData } = await apiFetch("/api/products?limit=500");
const { data: ordersData } = await apiFetch(
  "/api/orders?limit=200&statuses=SAMPLING",
);
const onProductNameInput = () => {
  if (form.productName.trim()) {
    form.productId = "";
  }
};

const allProducts = computed(() => productsData || []);
const orders = computed(() => ordersData || []);

const selectedProductLabel = computed(() => {
  const p = allProducts.value.find((p: any) => p.id === form.productId);
  return p ? `${p.code} ${p.name}` : "";
});

const filteredProducts = computed(() => {
  if (!productSearch.value.trim())
    return allProducts.value.filter(
      (p: any) => p.category === "FINISHED" || p.category === "SEMI",
    );
  const q = productSearch.value.toLowerCase();
  return allProducts.value.filter(
    (p: any) =>
      (p.category === "FINISHED" || p.category === "SEMI") &&
      (p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)),
  );
});

const filteredMaterials = computed(() => {
  if (!materialSearch.value.trim()) return allProducts.value;
  const q = materialSearch.value.toLowerCase();
  return allProducts.value.filter(
    (p: any) =>
      p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q),
  );
});

const filteredOrders = computed(() => {
  if (!orderSearch.value.trim()) return orders.value;
  const q = orderSearch.value.toLowerCase();
  return orders.value.filter((o: any) => o.orderCode.toLowerCase().includes(q));
});

if (preselectProductId) {
  form.productId = preselectProductId;
  form.productName = preselectProductName || "";
}
if (preselectOrderId) {
  const o = orders.value.find((o: any) => o.id === preselectOrderId);
  if (o) orderCode.value = o.orderCode;
}
if (form.items.length === 0) {
  form.items.push({
    spec: "",
    materialId: "__NEW__",
    materialName: "",
    quantity: 1,
    unit: "PCS",
    isNew: true,
    category: "RAW",
    scrapRate: 0,
    existingProduct: null,
  });
}

const selectProduct = (p: any) => {
  form.productId = p.id;
  form.productName = p.name;
  showProductPicker.value = false;
  productSearch.value = "";
};

const openMaterialPicker = (i: number) => {
  showMaterialPicker.value = i;
  materialSearch.value = "";
};

const selectMaterial = (i: number, p: any) => {
  const item = itemAt(i);
  item.materialId = p.id;
  item.materialName = p.name;
  item.spec = p.spec || "";
  item.unit = p.unit || "PCS";
  item.isNew = false;
  item.existingProduct = {
    id: p.id,
    code: p.code,
    name: p.name,
    spec: p.spec,
    unit: p.unit,
  };
  showMaterialPicker.value = null;
};

const clearMaterialSelection = (i: number) => {
  const item = itemAt(i);
  item.materialId = "__NEW__";
  item.materialName = "";
  item.spec = "";
  item.unit = "PCS";
  item.isNew = true;
  item.existingProduct = null;
  showMaterialPicker.value = null;
};

const selectOrder = (code: string) => {
  orderCode.value = code;
  showOrderPicker.value = false;
  orderSearch.value = "";
};

const addItem = () => {
  form.items.push({
    spec: "",
    materialId: "__NEW__",
    materialName: "",
    quantity: 1,
    unit: "PCS",
    isNew: true,
    category: "RAW",
    scrapRate: 0,
    existingProduct: null,
  });
};

const handleCreate = async () => {
  if (!form.productId && !form.productName.trim())
    return toast.error("请选择产品或输入新产品名称");

  for (let i = 0; i < form.items.length; i++) {
    const item = itemAt(i);
    if (!item.materialName.trim())
      return toast.error(`第 ${i + 1} 行物料名称不能为空`);
    if (item.quantity <= 0) return toast.error(`第 ${i + 1} 行用量必须大于0`);
  }

  const ids = form.items.map((i) => i.materialId);
  const dupIdx = ids.findIndex(
    (id, idx) => id !== "__NEW__" && ids.indexOf(id) !== idx,
  );
  if (dupIdx !== -1) {
    const dup = itemAt(dupIdx);
    return toast.error(`物料 "${dup.materialName}" 重复，请检查`);
  }

  const newItems = form.items.filter((i) => i.materialId === "__NEW__");
  const allNewNames = [...newItems.map((i) => i.materialName)];
  if (!form.productId) allNewNames.unshift(form.productName); // 母产品也是新建的
  if (allNewNames.length > 0) {
    const names = allNewNames.join("、");
    if (!confirm(`以下产品/物料将自动创建：${names}，确认继续？`)) return;
  }

  try {
    await apiFetch("/api/bom", {
      method: "POST",
      body: {
        productId: form.productId || undefined,
        productName: form.productId ? undefined : form.productName,
        items: form.items.map((i) => ({
          materialId: i.materialId === "__NEW__" ? undefined : i.materialId,
          materialName: i.materialName,
          quantity: i.quantity,
          spec: i.spec,
          unit: i.unit,
          category: i.category,
          scrapRate: i.scrapRate,
        })),
        orderId: preselectOrderId || undefined,
      },
    });
    toast.success("BOM 创建成功");
    if (preselectOrderId) {
      await navigateTo(`/orders/${preselectOrderId}`);
    } else {
      await navigateTo("/bom");
    }
  } catch (e: any) {
    toast.error(e, "BOM创建失败");
  }
};
</script>
