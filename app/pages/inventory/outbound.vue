<template>
  <div class="max-w-lg mx-auto">
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink to="/inventory" class="text-slate-500 hover:text-slate-700"
        >&larr; 返回</NuxtLink
      >
      <h1 class="text-xl lg:text-2xl font-bold">出库</h1>
    </div>

    <div class="bg-white rounded-xl shadow p-4 lg:p-6">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >产品 *</label
          >
          <button
            @click="showProductPicker = true"
            type="button"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm text-left focus:ring-2 focus:ring-blue-500 outline-none transition hover:border-blue-400"
            :class="form.productId ? 'text-slate-900' : 'text-slate-400'"
          >
            {{ form.productId ? selectedLabel : "点击选择产品" }}
          </button>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >出库类型</label
          >
          <select
            v-model="form.type"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
          >
            <option value="SALES_OUT">销售出库</option>
            <option value="PRODUCTION_OUT">生产领料</option>
            <option value="SAMPLE_OUT">打样领料</option>
            <option value="SCRAP_OUT">报废出库</option>
            <option value="CHECK_OUT">盘亏出库</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >数量 *</label
          >
          <div class="flex items-center gap-2">
            <input
              v-model.number="form.quantity"
              type="number"
              min="0.0001"
              step="0.0001"
              required
              class="flex-1 min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
            <span
              v-if="selectedUnit"
              class="text-sm font-bold text-slate-900 min-w-[40px]"
              >{{ selectedUnit }}</span
            >
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >关联单号 <span class="text-slate-400 text-xs">(可选)</span></label
          >
          <input
            v-model="form.relatedCode"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            placeholder="订单号等"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >备注
            <span v-if="form.type === 'CHECK_OUT'" class="text-red-500"
              >*</span
            ></label
          >
          <textarea
            v-model="form.remark"
            rows="2"
            :placeholder="
              form.type === 'CHECK_OUT'
                ? '盘亏出库必须填写备注'
                : '备注（可选）'
            "
            class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          ></textarea>
        </div>
        <button
          type="submit"
          class="w-full min-h-[48px] bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition font-medium text-sm"
        >
          确认出库
        </button>
      </form>
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
            :class="
              form.productId === p.id
                ? 'bg-blue-50 border border-blue-300'
                : 'border border-transparent'
            "
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
const route = useRoute();

const toast = useToast();
const { apiFetch } = useApi();

const { data: productsData } = await useFetch("/api/products?limit=500");
const allProducts = computed(() => (productsData.value as any)?.data || []);

const showProductPicker = ref(false);
const productSearch = ref("");

const form = reactive({
  productId: "",
  quantity: 1,
  type: (route.query.type as string) || "SALES_OUT", // ← 改这一行
  remark: "",
  relatedCode: "",
});

const filteredProducts = computed(() => {
  if (!productSearch.value.trim()) return allProducts.value;
  const q = productSearch.value.toLowerCase();
  return allProducts.value.filter(
    (p: any) =>
      p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q),
  );
});

const selectedLabel = computed(() => {
  const p = allProducts.value.find((p: any) => p.id === form.productId);
  return p ? `${p.code} ${p.name}` : "";
});

const selectedUnit = computed(() => {
  const p = allProducts.value.find((p: any) => p.id === form.productId);
  return p?.unit || "";
});

const selectProduct = (p: any) => {
  form.productId = p.id;
  showProductPicker.value = false;
  productSearch.value = "";
};

const handleSubmit = async () => {
  if (!form.productId) return toast.error("请选择产品");
  if (!form.quantity || form.quantity <= 0)
    return toast.error("请输入有效数量");
  if (form.type === "CHECK_OUT" && !form.remark.trim())
    return toast.error("盘亏出库必须填写备注");
  try {
    await apiFetch(`/api/inventory/${form.productId}/outbound`, {
      method: "POST",
      body: {
        quantity: form.quantity,
        type: form.type,
        remark: form.remark || undefined,
        relatedCode: form.relatedCode || undefined,
      },
    });
    toast.success("出库成功");
    await navigateTo("/inventory");
  } catch (e: any) {
    toast.error(e, "出库失败");
  }
};
</script>
