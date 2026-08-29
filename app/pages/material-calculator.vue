<!-- pages/material-calculator.vue -->
<template>
  <div>
    <h1 class="text-xl lg:text-2xl font-bold mb-6">物料需求计算器</h1>

    <div class="bg-white rounded-xl shadow p-4 lg:p-6">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >产品</label
          >
          <button
            @click="showProductPicker = true"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm text-left"
            :class="selectedProduct ? 'text-slate-900' : 'text-slate-400'"
          >
            {{
              selectedProduct
                ? `${selectedProduct.code} ${selectedProduct.name}`
                : "选择产品"
            }}
          </button>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >数量</label
          >
          <input
            v-model.number="calculatorQty"
            type="number"
            min="0.0001"
            step="0.0001"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm"
          />
        </div>
        <div class="flex items-end">
          <button
            @click="calculate"
            class="min-h-[44px] w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
          >
            计算
          </button>
        </div>
      </div>

      <div v-if="calcResult.length > 0" class="space-y-3">
        <h2 class="font-semibold text-sm text-slate-500">物料需求</h2>
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b bg-slate-100">
                <th
                  class="text-left px-4 py-2 text-xs font-medium text-slate-500 uppercase"
                >
                  物料
                </th>
                <th
                  class="text-right px-4 py-2 text-xs font-medium text-slate-500 uppercase"
                >
                  需求量
                </th>
                <th
                  class="text-right px-4 py-2 text-xs font-medium text-slate-500 uppercase"
                >
                  可用库存
                </th>
                <th
                  class="text-right px-4 py-2 text-xs font-medium text-slate-500 uppercase"
                >
                  缺口
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="m in calcResult"
                :key="m.productId"
                class="odd:bg-white even:bg-slate-50"
              >
                <td class="px-4 py-2">
                  {{ m.productName }}
                  <span class="text-xs text-slate-400">{{ m.unit }}</span>
                </td>
                <td class="px-4 py-2 text-right">{{ m.demand }}</td>
                <td class="px-4 py-2 text-right">{{ m.available }}</td>
                <td
                  class="px-4 py-2 text-right font-medium"
                  :class="m.shortage > 0 ? 'text-red-600' : 'text-green-600'"
                >
                  {{ m.shortage }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="md:hidden space-y-2">
          <div
            v-for="m in calcResult"
            :key="m.productId"
            class="bg-slate-50 rounded-lg p-3 border"
          >
            <div class="font-medium text-sm">
              {{ m.productName }}
              <span class="text-xs text-slate-400">{{ m.unit }}</span>
            </div>
            <div class="flex justify-between text-xs mt-1">
              <span>需求: {{ m.demand }}</span>
              <span>可用: {{ m.available }}</span>
              <span
                :class="m.shortage > 0 ? 'text-red-600' : 'text-green-600'"
                class="font-medium"
                >缺口: {{ m.shortage }}</span
              >
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="calculated && calcResult.length === 0"
        class="text-center py-8 text-slate-400"
      >
        该产品没有 BOM 或无可展开物料
      </div>
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
          placeholder="搜索产品..."
          class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm mb-4 min-h-[44px]"
        />
        <div class="flex-1 overflow-y-auto space-y-1">
          <button
            v-for="p in filteredProducts"
            :key="p.id"
            @click="selectProduct(p)"
            class="w-full text-left px-4 py-3 rounded-lg text-sm hover:bg-blue-50 transition"
          >
            <span class="font-mono text-xs text-slate-400 mr-2">{{
              p.code
            }}</span
            ><span class="font-medium">{{ p.name }}</span>
          </button>
        </div>
        <button
          @click="showProductPicker = false"
          class="mt-4 w-full min-h-[44px] border py-2 rounded-lg text-sm"
        >
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth" as any] });

const showProductPicker = ref(false);
const productSearch = ref("");
const selectedProduct = ref<any>(null);
const calculatorQty = ref(1);
const calcResult = ref<any[]>([]);
const calculated = ref(false);

const { data: productsData } = await useFetch("/api/products?limit=500");
const allProducts = computed(() => (productsData.value as any)?.data || []);
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

const selectProduct = (p: any) => {
  selectedProduct.value = p;
  showProductPicker.value = false;
};

const calculate = async () => {
  if (!selectedProduct.value) return;
  calculated.value = true;
  try {
    const res = await $fetch("/api/tools/material-calculator", {
      query: {
        productId: selectedProduct.value.id,
        quantity: calculatorQty.value,
      },
    });
    calcResult.value = (res as any)?.data || [];
  } catch {
    calcResult.value = [];
  }
};
</script>
