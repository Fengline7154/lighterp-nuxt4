<template>
  <div>
    <div class="flex justify-between items-center mb-6 flex-wrap gap-2">
      <h1 class="text-xl lg:text-2xl font-bold">库存预警配置</h1>
      <button
        @click="openCreateModal"
        class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
      >
        + 新建预警
      </button>
    </div>

    <!-- 桌面端表格 -->
    <div class="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full min-w-[600px]">
        <thead>
          <tr class="border-b bg-slate-100">
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              产品
            </th>
            <th
              class="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              安全库存线
            </th>
            <th
              class="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              当前库存
            </th>
            <th
              class="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              状态
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              备注
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
            v-for="alert in alerts"
            :key="alert.id"
            class="hover:bg-blue-50/30 transition"
          >
            <td class="px-4 py-3 text-sm">
              <span class="font-mono text-xs text-slate-400 mr-2">{{
                alert.product?.code
              }}</span>
              <span class="font-medium">{{ alert.product?.name }}</span>
            </td>
            <td class="px-4 py-3 text-sm text-right font-medium">
              {{ alert.threshold }}
            </td>
            <td class="px-4 py-3 text-sm text-right">
              {{ alert.currentQuantity }}
            </td>
            <td class="px-4 py-3 text-sm text-center">
              <span
                v-if="alert.isBelowThreshold"
                class="text-red-500 font-medium"
                >⚠️ 低于安全线</span
              >
              <span v-else class="text-green-600">正常</span>
            </td>
            <td class="px-4 py-3 text-sm text-slate-500">
              {{ alert.remark || "-" }}
            </td>
            <td class="px-4 py-3 text-sm text-center space-x-2">
              <button
                @click="openEditModal(alert)"
                class="text-blue-600 text-sm min-h-[36px]"
              >
                编辑
              </button>
              <button
                @click="handleDelete(alert.id)"
                class="text-red-500 text-sm min-h-[36px]"
              >
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 移动端卡片 -->
    <div class="md:hidden space-y-3">
      <div
        v-for="alert in alerts"
        :key="alert.id"
        class="bg-white rounded-xl shadow p-4 space-y-2"
      >
        <div class="flex justify-between items-center">
          <span class="font-medium text-sm">{{ alert.product?.name }}</span>
          <span
            v-if="alert.isBelowThreshold"
            class="text-red-500 text-xs font-medium"
            >⚠️ 低于安全线</span
          >
          <span v-else class="text-green-600 text-xs">正常</span>
        </div>
        <div class="text-sm text-slate-500">
          安全线：{{ alert.threshold }} | 当前：{{ alert.currentQuantity }}
        </div>
        <div class="flex gap-2 pt-2 border-t">
          <button
            @click="openEditModal(alert)"
            class="flex-1 text-blue-600 text-sm min-h-[36px]"
          >
            编辑
          </button>
          <button
            @click="handleDelete(alert.id)"
            class="flex-1 text-red-500 text-sm min-h-[36px]"
          >
            删除
          </button>
        </div>
      </div>
    </div>

    <div v-if="alerts.length === 0" class="text-center py-12 text-slate-400">
      暂无预警配置，点击右上角新建
    </div>

    <!-- 新建/编辑弹窗 -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div class="absolute inset-0 bg-black/30" @click="showModal = false" />
      <div class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 class="text-lg font-bold mb-4">
          {{ editingId ? "编辑预警" : "新建预警" }}
        </h2>

        <!-- 产品选择 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >产品</label
          >
          <button
            v-if="!form.productId"
            @click="showProductPicker = true"
            class="w-full min-h-[48px] border border-slate-300 rounded-lg px-4 py-2 text-base text-left text-slate-400"
          >
            点击选择产品
          </button>
          <div
            v-else
            class="w-full min-h-[48px] border border-slate-200 rounded-lg px-4 py-2 text-base bg-slate-50 flex items-center justify-between"
          >
            <span>
              <span class="font-mono text-xs text-slate-400 mr-2">{{
                selectedProduct?.code
              }}</span>
              <span class="font-medium">{{ selectedProduct?.name }}</span>
            </span>
            <button
              v-if="!editingId"
              @click="showProductPicker = true"
              class="text-xs text-blue-500"
            >
              更换
            </button>
          </div>
        </div>

        <!-- 阈值 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >安全库存线</label
          >
          <input
            v-model.number="form.threshold"
            type="number"
            min="0"
            step="0.0001"
            class="w-full min-h-[48px] border border-slate-300 rounded-lg px-4 py-2 text-base"
            placeholder="如：100"
          />
        </div>

        <!-- 备注 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >备注</label
          >
          <input
            v-model="form.remark"
            class="w-full min-h-[48px] border border-slate-300 rounded-lg px-4 py-2 text-base"
            placeholder="如：面料低于100米需补货"
          />
        </div>

        <div class="flex gap-2">
          <button
            @click="handleSubmit"
            class="flex-1 min-h-[52px] bg-blue-500 text-white py-2 rounded-lg text-base"
          >
            保存
          </button>
          <button
            @click="showModal = false"
            class="flex-1 min-h-[52px] border py-2 rounded-lg text-base"
          >
            取消
          </button>
        </div>
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
          class="w-full border border-slate-300 rounded-lg px-4 py-3 text-base mb-4 min-h-[48px]"
        />
        <div class="flex-1 overflow-y-auto space-y-1">
          <button
            v-for="p in filteredProducts"
            :key="p.id"
            @click="selectProduct(p)"
            class="w-full text-left px-4 py-3 rounded-lg text-base hover:bg-blue-50 transition"
          >
            <span class="font-mono text-xs text-slate-400 mr-2">{{
              p.code
            }}</span>
            <span>{{ p.name }}</span>
          </button>
        </div>
        <button
          @click="showProductPicker = false"
          class="mt-4 w-full min-h-[52px] border py-2 rounded-lg text-base"
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

const alerts = ref<any[]>([]);
const showModal = ref(false);
const editingId = ref<string | null>(null);
const form = reactive({
  productId: "",
  threshold: 0,
  remark: "",
});

const allProducts = ref<any[]>([]);
const showProductPicker = ref(false);
const productSearch = ref("");
const selectedProduct = ref<any>(null);

const filteredProducts = computed(() => {
  if (!productSearch.value.trim()) return allProducts.value;
  const q = productSearch.value.toLowerCase();
  return allProducts.value.filter(
    (p: any) =>
      p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q),
  );
});

const loadAlerts = async () => {
  try {
    const res = await apiFetch<any>("/api/inventory-alerts");
    alerts.value = res.data || [];
  } catch (e: any) {
    toast.error(e, "加载失败");
  }
};

const loadProducts = async () => {
  try {
    const res = await apiFetch<any>("/api/products?limit=500");
    allProducts.value = res.data || [];
  } catch {
    allProducts.value = [];
  }
};

const openCreateModal = () => {
  editingId.value = null;
  form.productId = "";
  form.threshold = 0;
  form.remark = "";
  selectedProduct.value = null;
  showModal.value = true;
};

const openEditModal = (alert: any) => {
  editingId.value = alert.id;
  form.productId = alert.productId;
  form.threshold = Number(alert.threshold);
  form.remark = alert.remark || "";
  selectedProduct.value = alert.product;
  showModal.value = true;
};

const selectProduct = (p: any) => {
  form.productId = p.id;
  selectedProduct.value = p;
  showProductPicker.value = false;
};

const handleSubmit = async () => {
  if (!form.productId) return toast.error("请选择产品");
  if (form.threshold < 0) return toast.error("安全库存线不能为负");

  try {
    await apiFetch("/api/inventory-alerts", {
      method: "POST",
      body: {
        productId: form.productId,
        threshold: form.threshold,
        remark: form.remark || undefined,
      },
    });
    toast.success(editingId.value ? "预警已更新" : "预警已创建");
    showModal.value = false;
    await loadAlerts();
  } catch (e: any) {
    toast.error(e, "保存失败");
  }
};

const handleDelete = async (id: string) => {
  if (!confirm("确认删除此预警？")) return;
  try {
    await apiFetch(`/api/inventory-alerts/${id}`, { method: "DELETE" });
    toast.success("预警已删除");
    await loadAlerts();
  } catch (e: any) {
    toast.error(e, "删除失败");
  }
};

onMounted(async () => {
  await Promise.all([loadAlerts(), loadProducts()]);
});
</script>
