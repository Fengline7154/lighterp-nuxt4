<template>
  <div>
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink to="/inventory" class="text-slate-500 hover:text-slate-700"
        >&larr; 返回库存</NuxtLink
      >
      <h1 class="text-xl lg:text-2xl font-bold">初始化库存</h1>
    </div>

    <div class="bg-white rounded-xl shadow p-4 lg:p-6">
      <p class="text-sm text-slate-500 mb-4">
        此功能用于系统启用时录入仓库已有库存。请确认产品已创建后再录入。
      </p>

      <!-- 桌面端表格 -->
      <div class="hidden md:block overflow-x-auto mb-4">
        <table class="w-full">
          <thead>
            <tr class="border-b bg-slate-100">
              <th
                class="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase"
              >
                产品编号
              </th>
              <th
                class="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase"
              >
                产品名
              </th>
              <th
                class="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase"
              >
                分类
              </th>
              <th
                class="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase"
              >
                库位
              </th>
              <th
                class="text-right py-3 px-3 text-xs font-medium text-slate-500 uppercase w-[15%]"
              >
                数量
              </th>
              <th
                class="text-center py-3 px-3 text-xs font-medium text-slate-500 uppercase"
              >
                单位
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
              <td class="py-2 px-3 text-sm">{{ itemAt(i).productName }}</td>
              <td class="py-2 px-3 text-sm">
                {{ itemAt(i).categoryLabel || "-" }}
              </td>
              <td class="py-2 px-3">
                <select
                  v-model="itemAt(i).locationId"
                  class="w-full border border-slate-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition"
                >
                  <option value="">不指定</option>
                  <option
                    v-for="loc in activeLocations"
                    :key="loc.id"
                    :value="loc.id"
                  >
                    {{ loc.code }} {{ loc.name }}
                  </option>
                </select>
              </td>
              <td class="py-2 px-3">
                <input
                  v-model.number="itemAt(i).quantity"
                  type="number"
                  min="0"
                  step="0.0001"
                  class="w-full border border-slate-200 rounded px-3 py-1.5 text-xs text-right focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </td>
              <td class="py-2 px-3 text-sm text-center">
                {{ itemAt(i).unit || "-" }}
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
              @click="removeItem(i)"
              class="text-red-400 hover:text-red-600 text-xl min-h-[36px] min-w-[36px]"
            >
              &times;
            </button>
          </div>
          <div class="text-sm font-medium">
            {{ itemAt(i).productName || "未选择" }}
          </div>
          <div class="flex items-center gap-3 text-xs text-slate-500">
            <span>分类：{{ itemAt(i).categoryLabel || "-" }}</span>
            <span>单位：{{ itemAt(i).unit || "-" }}</span>
          </div>
          <select
            v-model="itemAt(i).locationId"
            class="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="">不指定库位</option>
            <option
              v-for="loc in activeLocations"
              :key="loc.id"
              :value="loc.id"
            >
              {{ loc.code }} {{ loc.name }}
            </option>
          </select>
          <input
            v-model.number="itemAt(i).quantity"
            type="number"
            min="0"
            step="0.0001"
            class="w-full border rounded px-3 py-2 text-sm text-right"
            placeholder="数量"
          />
        </div>
      </div>

      <button
        @click="addItem"
        class="min-h-[44px] w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm flex items-center justify-center gap-1"
      >
        + 添加行
      </button>

      <div class="mt-4">
        <label class="block text-sm font-medium text-slate-700 mb-1"
          >备注</label
        >
        <input
          v-model="remark"
          class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          placeholder="如：2026年7月初始库存"
        />
        <div class="flex justify-end mt-3">
          <button
            @click="handleSubmit"
            class="min-h-[48px] w-full md:w-auto px-8 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition font-medium text-sm"
          >
            确认录入
          </button>
        </div>
      </div>
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
            class="w-full text-left px-4 py-3 rounded-lg text-sm hover:bg-blue-50 transition border border-transparent"
          >
            <span class="font-mono text-xs text-slate-400 mr-2">{{
              p.code
            }}</span
            ><span class="font-medium">{{ p.name }}</span>
            <span class="text-xs text-slate-400 ml-2">{{
              categoryLabel(p.category)
            }}</span>
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
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth" as any] });
const toast = useToast();
const { apiFetch } = useApi();

const remark = ref("");

type InitItem = {
  productId: string;
  productName: string;
  quantity: number;
  productCode?: string;
  unit?: string;
  category?: string;
  categoryLabel?: string;
  locationId?: string;
};
const items = reactive<InitItem[]>([
  { productId: "", productName: "", quantity: 0 },
]);

function itemAt(i: number): InitItem {
  return items[i]!;
}
function removeItem(i: number) {
  items.splice(i, 1);
}

const { data: productsData } = await useFetch("/api/products?limit=500");
const allProducts = computed(() => (productsData.value as any)?.data || []);

const { data: locationsData } = await useFetch(
  "/api/locations?status=ACTIVE&limit=200",
);
const activeLocations = computed(
  () => (locationsData.value as any)?.data || [],
);

const showProductPicker = ref<number | null>(null);
const productSearch = ref("");

const categoryLabel = (c: string) =>
  ({ FINISHED: "成品", SEMI: "半成品", RAW: "原材料", PACKAGING: "包材" })[c] ||
  c;

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
  item.unit = p.unit;
  item.category = p.category;
  item.categoryLabel = categoryLabel(p.category);
  showProductPicker.value = null;
};

const addItem = () =>
  items.push({ productId: "", productName: "", quantity: 0 });

const handleSubmit = async () => {
  const validItems = items.filter((i) => i.productId && i.quantity > 0);
  if (validItems.length === 0) return toast.error("请至少添加一条有效记录");
  try {
    await apiFetch("/api/inventory/init", {
      method: "POST",
      body: {
        items: validItems.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          locationId: i.locationId || undefined,
        })),
        remark: remark.value || undefined,
      },
    });
    toast.success(`成功录入 ${validItems.length} 条初始库存`);
    await navigateTo("/inventory");
  } catch (e: any) {
    toast.error(e, "录入失败");
  }
};
</script>
