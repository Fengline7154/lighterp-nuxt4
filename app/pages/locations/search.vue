<!-- pages/locations/search.vue -->
<template>
  <div>
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink to="/locations" class="text-slate-500 hover:text-slate-700"
        >&larr; 返回</NuxtLink
      >
      <h1 class="text-xl lg:text-2xl font-bold">产品库位查询</h1>
    </div>

    <div class="mb-4">
      <button
        @click="showProductPicker = true"
        class="w-full sm:w-64 min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm text-left focus:ring-2 focus:ring-blue-500 outline-none transition hover:border-blue-400"
        :class="selectedProduct ? 'text-slate-900' : 'text-slate-400'"
      >
        {{
          selectedProduct
            ? `${selectedProduct.code} ${selectedProduct.name}`
            : "点击选择产品"
        }}
      </button>
    </div>

    <!-- 桌面端：按库位分组 -->
    <div
      v-if="result.length > 0"
      class="hidden md:block bg-white rounded-xl shadow p-4 lg:p-6"
    >
      <div class="flex items-center gap-3 mb-4">
        <span class="font-mono text-sm text-slate-500">{{
          selectedProduct?.code
        }}</span>
        <span class="font-semibold">{{ selectedProduct?.name }}</span>
        <span class="text-xs text-slate-400">共 {{ totalQty }} 个</span>
      </div>
      <table class="w-full">
        <thead>
          <tr class="border-b bg-slate-100">
            <th
              class="text-left px-4 py-2 text-xs font-medium text-slate-500 uppercase"
            >
              库位编码
            </th>
            <th
              class="text-left px-4 py-2 text-xs font-medium text-slate-500 uppercase"
            >
              库位名称
            </th>
            <th
              class="text-left px-4 py-2 text-xs font-medium text-slate-500 uppercase"
            >
              仓库
            </th>
            <th
              class="text-right px-4 py-2 text-xs font-medium text-slate-500 uppercase"
            >
              数量
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr
            v-for="loc in result"
            :key="loc.locationId"
            class="even:bg-slate-50/50"
          >
            <td class="px-4 py-2 text-sm font-mono">
              {{ loc.location?.code || loc.locationId }}
            </td>
            <td class="px-4 py-2 text-sm">{{ loc.location?.name || "-" }}</td>
            <td class="px-4 py-2 text-sm text-slate-500">
              {{ loc.location?.warehouse || "-" }}
            </td>
            <td class="px-4 py-2 text-sm text-right font-medium">
              {{ loc.quantity }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 移动端 -->
    <div
      v-if="result.length > 0"
      class="md:hidden bg-white rounded-xl shadow p-4"
    >
      <div class="flex items-center justify-between mb-3">
        <div>
          <span class="font-mono text-xs text-slate-500 block">{{
            selectedProduct?.code
          }}</span>
          <span class="font-semibold">{{ selectedProduct?.name }}</span>
        </div>
        <span class="text-sm text-slate-500">共 {{ totalQty }}</span>
      </div>
      <div class="space-y-2">
        <div
          v-for="loc in result"
          :key="loc.locationId"
          class="flex items-center justify-between py-1 border-b last:border-0"
        >
          <div>
            <span class="text-sm font-mono">{{
              loc.location?.code || loc.locationId
            }}</span>
            <span class="text-xs text-slate-400 ml-2">{{
              loc.location?.name || "-"
            }}</span>
          </div>
          <span class="text-sm font-bold">{{ loc.quantity }}</span>
        </div>
      </div>
    </div>

    <div
      v-if="selectedProduct && result.length === 0"
      class="text-center py-12 text-slate-400"
    >
      该产品暂无库位信息
    </div>
    <div v-if="!selectedProduct" class="text-center py-12 text-slate-400">
      请选择产品查询库位分布
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
          class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm mb-4 min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none"
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
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth" as any] });

const showProductPicker = ref(false);
const productSearch = ref("");
const selectedProduct = ref<any>(null);
const result = ref<any[]>([]);

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

const selectProduct = async (p: any) => {
  selectedProduct.value = p;
  showProductPicker.value = false;
  productSearch.value = "";
  const res = (await $fetch(
    `/api/inventory-locations/search?q=${encodeURIComponent(p.code)}`,
  )) as any;
  result.value = res.data || [];
};

const totalQty = computed(() =>
  result.value.reduce((s, r) => s + Number(r.quantity), 0),
);
</script>
