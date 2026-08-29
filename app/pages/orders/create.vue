<template>
  <div>
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink to="/orders" class="text-slate-500 hover:text-slate-700"
        >&larr; 返回</NuxtLink
      >
      <h1 class="text-xl lg:text-2xl font-bold">创建订单</h1>
    </div>

    <div class="bg-white rounded-xl shadow p-4 lg:p-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >客户</label
          >
          <button
            @click="showCustomerPicker = true"
            type="button"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm text-left focus:ring-2 focus:ring-blue-500 outline-none transition hover:border-blue-400"
            :class="selectedCustomerLabel ? 'text-slate-900' : 'text-slate-400'"
          >
            {{ selectedCustomerLabel || "点击选择客户（可选）" }}
          </button>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >订单类型</label
          >
          <select
            v-model="orderType"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
          >
            <option value="STANDARD">标准品</option>
            <option value="VARIANT">变型品</option>
            <option value="CUSTOM">定制品</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >交货期限</label
          >
          <div class="flex gap-2">
            <input
              v-model="deadlineDate"
              type="date"
              :min="today"
              max="9999-12-30"
              class="flex-1 min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
            <input
              v-model="deadlineTime"
              type="time"
              class="w-32 min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
        </div>
      </div>

      <!-- 标准品明细 -->
      <template v-if="orderType === 'STANDARD'">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold">订单明细</h2>
        </div>

        <!-- 桌面端表格 -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full min-w-[750px]">
            <thead>
              <tr class="border-b bg-slate-100">
                <th
                  class="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase w-[14%]"
                >
                  产品编号
                </th>
                <th
                  class="text-center py-3 px-3 text-xs font-medium text-slate-500 uppercase"
                >
                  产品名称
                </th>
                <th
                  class="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase w-[10%]"
                >
                  规格
                </th>
                <th
                  class="text-center py-3 px-3 text-xs font-medium text-slate-500 uppercase w-[8%]"
                >
                  单位
                </th>
                <th
                  class="text-right py-3 px-3 text-xs font-medium text-slate-500 uppercase w-[12%]"
                >
                  数量
                </th>
                <th
                  class="text-right py-3 px-3 text-xs font-medium text-slate-500 uppercase w-[14%]"
                >
                  单价
                </th>
                <th
                  class="text-right py-3 px-3 text-xs font-medium text-slate-500 uppercase w-[14%]"
                >
                  小计
                </th>
                <th class="w-10"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="(_, i) in items" :key="i" class="even:bg-slate-50/50">
                <td class="py-2 px-3">
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
                      itemAt(i).productId
                        ? itemAt(i).productCode ||
                          itemAt(i).productId?.substring(0, 8) + "..."
                        : "选择产品"
                    }}
                  </button>
                </td>
                <td class="py-2 px-3 text-sm text-center">
                  {{ itemAt(i).productName || "-" }}
                </td>
                <td class="py-2 px-3">
                  <input
                    v-model="itemAt(i).spec"
                    :disabled="!!itemAt(i).productId"
                    class="w-full border border-slate-200 rounded px-2 py-1 text-xs disabled:bg-slate-100"
                  />
                </td>
                <td class="py-2 px-3">
                  <input
                    v-model="itemAt(i).unit"
                    :disabled="!!itemAt(i).productId"
                    class="w-full border border-slate-200 rounded px-2 py-1 text-xs text-center disabled:bg-slate-100"
                  />
                </td>
                <td class="py-2 px-3">
                  <input
                    v-model.number="itemAt(i).quantity"
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    class="w-full border border-slate-200 rounded px-2 py-1.5 text-xs text-right"
                  />
                </td>
                <td class="py-2 px-3">
                  <input
                    v-model.number="itemAt(i).unitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    class="w-full border border-slate-200 rounded px-2 py-1.5 text-xs text-right"
                  />
                </td>
                <td
                  class="py-2 px-3 text-xs text-right text-slate-600 font-medium"
                >
                  ¥{{
                    (
                      (itemAt(i).quantity || 0) * (itemAt(i).unitPrice || 0)
                    ).toFixed(2)
                  }}
                </td>
                <td class="py-2 pr-3 text-center">
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
        <div class="md:hidden space-y-3">
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
            <div v-if="itemAt(i).productId" class="text-sm font-medium">
              {{ itemAt(i).productName || "-" }}
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-xs text-slate-400">规格</label
                ><input
                  v-model="itemAt(i).spec"
                  :disabled="!!itemAt(i).productId"
                  class="w-full border rounded px-3 py-2 text-sm disabled:bg-slate-100"
                />
              </div>
              <div>
                <label class="text-xs text-slate-400">单位</label
                ><input
                  v-model="itemAt(i).unit"
                  :disabled="!!itemAt(i).productId"
                  class="w-full border rounded px-3 py-2 text-sm disabled:bg-slate-100"
                />
              </div>
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
                (
                  (itemAt(i).quantity || 0) * (itemAt(i).unitPrice || 0)
                ).toFixed(2)
              }}
            </div>
          </div>
        </div>

        <button
          @click="addItem"
          class="min-h-[44px] w-full mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
        >
          + 添加明细行
        </button>
      </template>

      <!-- 变型品 / 定制品提示 -->
      <div
        v-else
        class="text-sm text-slate-500 mb-4 p-4 bg-slate-50 rounded-lg"
      >
        {{
          orderType === "VARIANT"
            ? "变型品基于已有标准品创建，点击下方按钮配置产品信息。"
            : "定制品将在提交后自动创建新产品，点击下方按钮输入产品名称。"
        }}
      </div>

      <button
        @click="handleCreate"
        class="mt-6 w-full min-h-[48px] bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition font-medium text-sm"
      >
        {{ orderType === "STANDARD" ? "提交订单" : "下一步" }}
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
        <input
          v-model="productSearch"
          placeholder="搜索产品..."
          class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm mb-4 min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <div class="flex-1 overflow-y-auto space-y-1">
          <button
            v-for="p in filteredProducts"
            :key="p.id"
            @click="selectProduct(showProductPicker, p)"
            class="w-full text-left px-4 py-3 rounded-lg text-sm hover:bg-blue-50 transition"
          >
            <span class="font-mono text-xs text-slate-400 mr-2">{{
              p.code
            }}</span
            ><span class="font-medium">{{ p.name }}</span>
          </button>
          <p
            v-if="filteredProducts.length === 0"
            class="text-center text-slate-400 py-8"
          >
            无匹配产品
          </p>
        </div>
        <button
          @click="showProductPicker = null"
          class="mt-4 w-full min-h-[44px] border py-2 rounded-lg hover:bg-slate-50 text-sm"
        >
          关闭
        </button>
      </div>
    </div>

    <!-- 客户选择弹窗 -->
    <div
      v-if="showCustomerPicker"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showCustomerPicker = false"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col"
      >
        <h2 class="text-lg font-bold mb-4">选择客户</h2>
        <input
          v-model="customerSearch"
          placeholder="搜索客户..."
          class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm mb-4 min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <div class="flex-1 overflow-y-auto space-y-1">
          <button
            v-for="c in filteredCustomers"
            :key="c.id"
            @click="selectCustomer(c)"
            class="w-full text-left px-4 py-3 rounded-lg text-sm hover:bg-blue-50 transition"
            :class="
              customerId === c.id
                ? 'bg-blue-50 border border-blue-300'
                : 'border border-transparent'
            "
          >
            <span class="font-mono text-xs text-slate-400 mr-2">{{
              c.code
            }}</span
            ><span class="font-medium">{{ c.name }}</span>
          </button>
          <button
            @click="
              customerId = '';
              showCustomerPicker = false;
            "
            class="w-full text-left px-4 py-3 rounded-lg text-sm text-slate-400 hover:bg-slate-50 transition"
          >
            不指定客户
          </button>
        </div>
        <button
          @click="showCustomerPicker = false"
          class="mt-4 w-full min-h-[44px] border py-2 rounded-lg hover:bg-slate-50 text-sm"
        >
          关闭
        </button>
      </div>
    </div>

    <!-- 变型品弹窗 -->
    <div
      v-if="showVariantModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showVariantModal = false"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] overflow-auto"
      >
        <h2 class="text-lg font-bold mb-4">变型品配置</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">基础产品 *</label>
            <select
              v-model="variantForm.baseProductId"
              class="w-full min-h-[44px] border rounded-lg px-4 py-2 text-sm bg-white"
            >
              <option value="">选择标准品</option>
              <option v-for="p in finishedProducts" :key="p.id" :value="p.id">
                {{ p.code }} {{ p.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">变型品名称 *</label
            ><input
              v-model="variantForm.productName"
              class="w-full min-h-[44px] border rounded-lg px-4 py-2 text-sm"
              placeholder="例如：帐篷 HT-200 红色款"
            />
          </div>
          <div v-if="variantForm.baseProductId" class="text-sm text-slate-500">
            将基于基础产品的 BOM 创建副本，您可以在打样阶段修改物料。
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">数量 *</label
            ><input
              v-model.number="variantForm.quantity"
              type="number"
              min="1"
              class="w-full min-h-[44px] border rounded-lg px-4 py-2 text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">单价 (元)</label
            ><input
              v-model.number="variantForm.unitPrice"
              type="number"
              min="0"
              step="0.01"
              class="w-full min-h-[44px] border rounded-lg px-4 py-2 text-sm"
            />
          </div>
        </div>
        <div class="flex gap-2 mt-4">
          <button
            @click="confirmVariant"
            class="flex-1 min-h-[44px] bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 text-sm"
          >
            确认并提交
          </button>
          <button
            @click="showVariantModal = false"
            class="flex-1 min-h-[44px] border py-2 rounded-lg text-sm"
          >
            取消
          </button>
        </div>
      </div>
    </div>

    <!-- 定制品弹窗 -->
    <div
      v-if="showCustomModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showCustomModal = false"
      />
      <div class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 class="text-lg font-bold mb-4">定制品信息</h2>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">定制产品名称 *</label>
          <input
            v-model="customForm.productName"
            class="w-full min-h-[44px] border rounded-lg px-4 py-2 text-sm"
          />
        </div>
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium mb-1">分类</label>
            <select
              v-model="customForm.category"
              class="w-full min-h-[44px] border rounded-lg px-4 py-2 text-sm bg-white"
            >
              <option value="FINISHED">成品</option>
              <option value="SEMI">半成品</option>
              <option value="RAW">原材料</option>
              <option value="PACKAGING">包材</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">单位</label>
            <select
              v-model="customForm.unit"
              class="w-full min-h-[44px] border rounded-lg px-4 py-2 text-sm bg-white"
            >
              <option value="PCS">个 (PCS)</option>
              <option value="KG">千克 (KG)</option>
              <option value="M">米 (M)</option>
              <option value="SET">套 (SET)</option>
              <option value="ROLL">卷 (ROLL)</option>
            </select>
          </div>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">数量 *</label>
          <input
            v-model.number="customForm.quantity"
            type="number"
            min="1"
            class="w-full min-h-[44px] border rounded-lg px-4 py-2 text-sm"
          />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">单价 (元)</label>
          <input
            v-model.number="customForm.unitPrice"
            type="number"
            min="0"
            step="0.01"
            class="w-full min-h-[44px] border rounded-lg px-4 py-2 text-sm"
          />
        </div>
        <div class="flex gap-2">
          <button
            @click="confirmCustom"
            class="flex-1 min-h-[44px] bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 text-sm"
          >
            确认并提交
          </button>
          <button
            @click="showCustomModal = false"
            class="flex-1 min-h-[44px] border py-2 rounded-lg text-sm"
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

const customerId = ref("");
const orderType = ref("STANDARD");
const today = new Date().toISOString().split("T")[0];
const deadlineDate = ref(today);
const deadlineTime = ref("");

const showVariantModal = ref(false);
const showCustomModal = ref(false);
const showProductPicker = ref<number | null>(null);
const showCustomerPicker = ref(false);
const productSearch = ref("");
const customerSearch = ref("");

const variantForm = reactive({
  baseProductId: "",
  productName: "",
  quantity: 1,
  unitPrice: 0,
});
const customForm = reactive({
  productName: "",
  quantity: 1,
  unitPrice: 0,
  category: "FINISHED",
  unit: "PCS",
});

const { data: customersData } = await useFetch("/api/customers?limit=200");
const customers = computed(() => (customersData.value as any)?.data || []);
const selectedCustomerLabel = computed(() => {
  const c = customers.value.find((c: any) => c.id === customerId.value);
  return c ? `${c.code} ${c.name}` : "";
});

const filteredCustomers = computed(() => {
  if (!customerSearch.value.trim()) return customers.value;
  const q = customerSearch.value.toLowerCase();
  return customers.value.filter(
    (c: any) =>
      c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
  );
});

const selectCustomer = (c: any) => {
  customerId.value = c.id;
  showCustomerPicker.value = false;
};

const { data: productsData } = await useFetch("/api/products?limit=500");
const allProducts = computed(() => (productsData.value as any)?.data || []);

const finishedProducts = computed(() =>
  allProducts.value.filter(
    (p: any) => p.category === "FINISHED" && p.status === "ACTIVE",
  ),
);

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

type OrderItem = {
  productId: string;
  productName: string;
  spec: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  productCode?: string;
};
const items = reactive<OrderItem[]>([
  {
    productId: "",
    productName: "",
    spec: "",
    unit: "PCS",
    quantity: 1,
    unitPrice: 0,
  },
]);

function itemAt(i: number): OrderItem {
  return items[i]!;
}

const openProductPicker = (i: number) => {
  showProductPicker.value = i;
  productSearch.value = "";
};
const selectProduct = (i: number, p: any) => {
  const item = itemAt(i);
  item.productId = p.id;
  item.productName = p.name;
  item.productCode = p.code;
  item.spec = p.spec || "";
  item.unit = p.unit || "PCS";
  showProductPicker.value = null;
};

const addItem = () =>
  items.push({
    productId: "",
    productName: "",
    spec: "",
    unit: "PCS",
    quantity: 1,
    unitPrice: 0,
  });

const handleCreate = () => {
  if (orderType.value === "VARIANT") showVariantModal.value = true;
  else if (orderType.value === "CUSTOM") showCustomModal.value = true;
  else submitOrder({});
};

const confirmVariant = async () => {
  if (!variantForm.baseProductId || !variantForm.productName)
    return toast.error("请完善变型品信息");
  showVariantModal.value = false;
  await submitOrder({
    orderType: "VARIANT",
    baseProductId: variantForm.baseProductId,
    variantProductName: variantForm.productName,
    quantity: variantForm.quantity,
    unitPrice: variantForm.unitPrice,
  });
};

const confirmCustom = async () => {
  if (!customForm.productName) return toast.error("请输入定制品名称");
  showCustomModal.value = false;
  await submitOrder({
    orderType: "CUSTOM",
    customProductName: customForm.productName,
    customProductCategory: customForm.category,
    customProductUnit: customForm.unit,
    quantity: customForm.quantity,
    unitPrice: customForm.unitPrice,
  });
};

const submitOrder = async (extra: Record<string, any>) => {
  try {
    const body: any = {
      orderType: orderType.value,
      customerId: customerId.value || undefined,
      deadlineAt: deadlineDate.value
        ? new Date(
            `${deadlineDate.value}T${deadlineTime.value || "00:00"}:00`,
          ).toISOString()
        : undefined,
      ...extra,
    };
    if (orderType.value === "STANDARD") {
      body.items = items
        .filter((i) => i.productId)
        .map((i) => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        }));
      if (body.items.length === 0) return toast.error("请至少添加一条产品明细");
    }
    await apiFetch("/api/orders", { method: "POST", body });
    toast.success("订单创建成功");
    await navigateTo("/orders");
  } catch (e: any) {
    toast.error(e, "订单创建失败");
  }
};
</script>
