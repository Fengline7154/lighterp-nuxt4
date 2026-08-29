<!-- pages/purchase-orders/[id].vue -->
<template>
  <div class="max-w-2xl mx-auto">
    <div class="flex items-center gap-4 mb-6 flex-wrap">
      <NuxtLink
        to="/purchase-orders"
        class="text-slate-500 hover:text-slate-700"
        >&larr; 返回</NuxtLink
      >
      <h1 class="text-xl lg:text-2xl font-bold">采购单详情</h1>
      <div class="ml-auto flex gap-2">
        <button
          @click="showEditModal = true"
          class="min-h-[44px] px-4 py-2 border rounded-lg text-sm hover:bg-slate-50 transition"
        >
          编辑
        </button>
        <button
          v-if="order?.status === 'PENDING'"
          @click="handleApprove"
          class="min-h-[44px] px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
        >
          审批通过
        </button>
        <button
          v-if="order?.status === 'APPROVED' || order?.status === 'PARTIAL'"
          @click="openReceiptModal"
          class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
        >
          入库
        </button>
        <button
          v-if="order?.status !== 'COMPLETED' && order?.status !== 'CANCELLED'"
          @click="handleCancel"
          class="min-h-[44px] px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
        >
          取消
        </button>
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
      <div class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 class="text-lg font-bold mb-4">编辑采购单</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >预计到货日期</label
            >
            <input
              v-model="editForm.expectedDate"
              type="date"
              max="9999-12-30"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >备注</label
            >
            <textarea
              v-model="editForm.remark"
              rows="2"
              class="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            ></textarea>
          </div>
        </div>
        <div class="flex gap-2 mt-4">
          <button
            @click="handleEdit"
            class="flex-1 min-h-[44px] bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition text-sm"
          >
            保存
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

    <div v-if="loading" class="flex items-center justify-center py-12">
      <div
        class="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"
      ></div>
      <span class="ml-3 text-sm text-slate-400">加载中...</span>
    </div>

    <div v-if="order" class="space-y-6">
      <!-- 基本信息 -->
      <div class="bg-white rounded-xl shadow p-4 lg:p-6">
        <h2 class="font-semibold text-sm text-slate-500 mb-3">基本信息</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Info label="采购单号" :value="order.orderCode" />
          <Info label="供应商" :value="order.supplier?.name || '-'" />
          <Info label="状态">
            <span
              :class="statusBadge(order.status)"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
              >{{ statusIcon(order.status) }}
              {{ statusLabel(order.status) }}</span
            >
          </Info>
          <Info label="总金额" :value="`¥${order.totalAmount}`" />
          <Info
            label="预计到货"
            :value="order.expectedDate ? formatDate(order.expectedDate) : '-'"
          />
          <Info label="创建时间" :value="formatDate(order.createdAt)" />
          <Info label="备注" :value="order.remark || '-'" />
        </div>
      </div>

      <!-- 采购明细 -->
      <div class="bg-white rounded-xl shadow p-4 lg:p-6">
        <h2 class="font-semibold text-sm text-slate-500 mb-3">采购明细</h2>
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b bg-slate-100">
                <th
                  class="text-left px-4 py-2 text-xs font-medium text-slate-500 uppercase"
                >
                  产品
                </th>
                <th
                  class="text-right px-4 py-2 text-xs font-medium text-slate-500 uppercase"
                >
                  数量
                </th>
                <th
                  class="text-right px-4 py-2 text-xs font-medium text-slate-500 uppercase"
                >
                  单价
                </th>
                <th
                  class="text-right px-4 py-2 text-xs font-medium text-slate-500 uppercase"
                >
                  已入库
                </th>
                <th
                  class="text-right px-4 py-2 text-xs font-medium text-slate-500 uppercase"
                >
                  小计
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="item in order.items"
                :key="item.id"
                class="odd:bg-white even:bg-slate-50"
              >
                <td class="px-4 py-2">{{ item.productName }}</td>
                <td class="px-4 py-2 text-right">{{ item.quantity }}</td>
                <td class="px-4 py-2 text-right">¥{{ item.unitPrice }}</td>
                <td class="px-4 py-2 text-right">
                  <span
                    :class="
                      Number(item.receivedQty) >= Number(item.quantity)
                        ? 'text-green-600'
                        : 'text-orange-500'
                    "
                    >{{ item.receivedQty }}/{{ item.quantity }}</span
                  >
                </td>
                <td class="px-4 py-2 text-right">
                  ¥{{
                    (Number(item.quantity) * Number(item.unitPrice)).toFixed(2)
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="md:hidden space-y-2">
          <div
            v-for="item in order.items"
            :key="item.id"
            class="bg-slate-50 rounded-lg p-3 border"
          >
            <div class="flex justify-between items-center mb-1">
              <span class="font-medium text-sm">{{ item.productName }}</span>
              <span class="text-xs text-slate-400">{{
                item.product?.unit || ""
              }}</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span>{{ item.quantity }} × ¥{{ item.unitPrice }}</span>
              <span
                :class="
                  Number(item.receivedQty) >= Number(item.quantity)
                    ? 'text-green-600'
                    : 'text-orange-500'
                "
                class="font-medium"
              >
                {{ item.receivedQty }}/{{ item.quantity }}
              </span>
            </div>
            <div class="text-right text-xs text-slate-500 mt-1">
              小计：¥{{
                (Number(item.quantity) * Number(item.unitPrice)).toFixed(2)
              }}
            </div>
          </div>
        </div>
      </div>

      <!-- 入库记录 -->
      <div
        v-if="order.receipts?.length"
        class="bg-white rounded-xl shadow p-4 lg:p-6"
      >
        <h2 class="font-semibold text-sm text-slate-500 mb-3">入库记录</h2>
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b bg-slate-100">
                <th
                  class="text-left px-4 py-2 text-xs font-medium text-slate-500 uppercase"
                >
                  入库单号
                </th>
                <th
                  class="text-left px-4 py-2 text-xs font-medium text-slate-500 uppercase"
                >
                  产品
                </th>
                <th
                  class="text-center px-4 py-2 text-xs font-medium text-slate-500 uppercase"
                >
                  数量
                </th>
                <th
                  class="text-right px-4 py-2 text-xs font-medium text-slate-500 uppercase"
                >
                  单价
                </th>
                <th
                  class="text-left px-4 py-2 text-xs font-medium text-slate-500 uppercase"
                >
                  库位
                </th>
                <th
                  class="text-left px-4 py-2 text-xs font-medium text-slate-500 uppercase"
                >
                  时间
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="r in order.receipts"
                :key="r.id"
                class="odd:bg-white even:bg-slate-50"
              >
                <td class="px-4 py-2 font-mono text-xs">{{ r.receiptCode }}</td>
                <td class="px-4 py-2">{{ r.orderItem?.productName || "-" }}</td>
                <td class="px-4 py-2 text-center">
                  {{ r.quantity }} {{ r.orderItem?.product?.unit || "" }}
                </td>
                <td class="px-4 py-2 text-right">¥{{ r.unitCost }}</td>
                <td class="px-4 py-2">{{ r.location?.code || "-" }}</td>
                <td class="px-4 py-2 text-xs text-slate-500">
                  {{ formatDate(r.createdAt) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="md:hidden space-y-2">
          <div
            v-for="r in order.receipts"
            :key="r.id"
            class="bg-slate-50 rounded-lg p-3 border"
          >
            <div class="flex justify-between items-center mb-1">
              <span class="text-sm font-mono">{{ r.receiptCode }}</span>
              <span class="text-sm font-bold"
                >{{ r.quantity }}
                <span
                  v-if="r.orderItem?.product?.unit"
                  class="text-xs text-slate-400 font-normal"
                  >{{ r.orderItem.product.unit }}</span
                ></span
              >
            </div>
            <div
              class="flex justify-between items-center text-xs text-slate-500"
            >
              <span>{{ r.orderItem?.productName || "-" }}</span>
              <span>¥{{ r.unitCost }}</span>
            </div>
            <div
              class="flex justify-between items-center text-xs text-slate-400 mt-1"
            >
              <span>{{
                r.location?.code
                  ? `${r.location.code} ${r.location.name}`
                  : "未指定库位"
              }}</span>
              <span>{{ formatDate(r.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 入库弹窗 -->
    <div
      v-if="showReceiptModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showReceiptModal = false"
      />
      <div class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 class="text-lg font-bold mb-4">采购入库</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >采购明细</label
            >
            <select
              v-model="receiptForm.orderItemId"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            >
              <option value="">选择明细</option>
              <option
                v-for="item in order?.items"
                :key="item.id"
                :value="item.id"
              >
                {{ item.productName }}（{{ item.receivedQty }}/{{
                  item.quantity
                }}）
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >数量 *</label
            >
            <div class="flex items-center gap-2">
              <input
                v-model.number="receiptForm.quantity"
                type="number"
                min="0.0001"
                step="0.0001"
                class="flex-1 min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
              <span
                v-if="receiptUnit"
                class="text-sm font-bold text-slate-900 min-w-[40px]"
                >{{ receiptUnit }}</span
              >
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >实际单价(元)</label
            >
            <input
              v-model.number="receiptForm.unitCost"
              type="number"
              step="0.01"
              min="0"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >库位 <span class="text-slate-400 text-xs">(可选)</span></label
            >
            <select
              v-model="receiptForm.locationId"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
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
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >备注</label
            >
            <input
              v-model="receiptForm.remark"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
        </div>
        <div class="flex gap-2 mt-4">
          <button
            @click="handleReceipt"
            class="flex-1 min-h-[44px] bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition text-sm"
          >
            确认入库
          </button>
          <button
            @click="showReceiptModal = false"
            class="flex-1 min-h-[44px] border py-2 rounded-lg hover:bg-slate-50 transition text-sm"
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
const route = useRoute();
const receiptUnit = ref("");
const showEditModal = ref(false);
const editForm = reactive({ expectedDate: "", remark: "" });
const {
  data: orderRaw,
  loading,
  execute: loadOrder,
} = useApiFetch<any>(() => `/api/purchase-orders/${route.params.id}`);
await loadOrder();

const order = computed(() => (orderRaw.value as any)?.data || orderRaw.value);

const showReceiptModal = ref(false);
const receiptForm = reactive({
  orderItemId: "",
  quantity: 1,
  unitCost: 0,
  locationId: "",
  remark: "",
});

const { data: locationsData } = await useFetch(
  "/api/locations?status=ACTIVE&limit=200",
);
const activeLocations = computed(
  () => (locationsData.value as any)?.data || [],
);
// 打开编辑弹窗时预填
watch(showEditModal, (val) => {
  if (val && order.value) {
    editForm.expectedDate = order.value.expectedDate
      ? new Date(order.value.expectedDate).toISOString().split("T")[0] || ""
      : "";
    editForm.remark = order.value.remark || "";
  }
});

const handleEdit = async () => {
  try {
    await apiFetch(`/api/purchase-orders/${route.params.id}`, {
      method: "PATCH",
      body: {
        expectedDate: editForm.expectedDate
          ? new Date(editForm.expectedDate).toISOString()
          : null,
        remark: editForm.remark || undefined,
      },
    });
    toast.success("保存成功");
    showEditModal.value = false;
    await loadOrder();
  } catch (e: any) {
    toast.error(e, "保存失败");
  }
};
watch(
  () => receiptForm.orderItemId,
  async (itemId) => {
    if (!itemId) {
      receiptUnit.value = "";
      return;
    }
    const item = order.value?.items?.find((i: any) => i.id === itemId);
    if (!item) return;
    try {
      const res = await $fetch(`/api/products/${item.productId}`);
      receiptUnit.value = (res as any)?.data?.unit || (res as any)?.unit || "";
    } catch {
      receiptUnit.value = "";
    }
  },
);

const openReceiptModal = () => {
  receiptForm.orderItemId = "";
  receiptForm.quantity = 1;
  receiptForm.unitCost = 0;
  receiptForm.locationId = "";
  receiptForm.remark = "";
  showReceiptModal.value = true;
};

// 选择明细后自动填单价
watch(
  () => receiptForm.orderItemId,
  (itemId) => {
    if (!itemId) {
      receiptForm.unitCost = 0;
      return;
    }
    const item = order.value?.items?.find((i: any) => i.id === itemId);
    if (item) {
      receiptForm.unitCost = Number(item.unitPrice) || 0;
    }
  },
);

const handleApprove = async () => {
  try {
    await apiFetch(`/api/purchase-orders/${route.params.id}/approve`, {
      method: "PATCH",
    });
    toast.success("审批通过");
    await loadOrder();
  } catch (e: any) {
    toast.error(e, "审批失败");
  }
};

const handleCancel = async () => {
  if (!confirm("确认取消该采购单？")) return;
  try {
    await apiFetch(`/api/purchase-orders/${route.params.id}/cancel`, {
      method: "PATCH",
    });
    toast.success("已取消");
    await loadOrder();
  } catch (e: any) {
    toast.error(e, "取消失败");
  }
};

const handleReceipt = async () => {
  if (!receiptForm.orderItemId) return toast.error("请选择采购明细");
  if (!receiptForm.quantity || receiptForm.quantity <= 0)
    return toast.error("请输入有效数量");
  try {
    await apiFetch(`/api/purchase-orders/${route.params.id}/receipts`, {
      method: "POST",
      body: {
        orderItemId: receiptForm.orderItemId,
        quantity: receiptForm.quantity,
        unitCost: receiptForm.unitCost,
        locationId: receiptForm.locationId || undefined,
        remark: receiptForm.remark || undefined,
      },
    });
    toast.success("入库成功");
    showReceiptModal.value = false;
    await loadOrder();
  } catch (e: any) {
    toast.error(e, "入库失败");
  }
};

const statusLabel = (s: string) =>
  ({
    PENDING: "待审批",
    APPROVED: "已审批",
    PARTIAL: "部分入库",
    COMPLETED: "已完成",
    CANCELLED: "已取消",
  })[s] || s;
const statusIcon = (s: string) =>
  ({
    PENDING: "⏳",
    APPROVED: "✅",
    PARTIAL: "📥",
    COMPLETED: "🏁",
    CANCELLED: "❌",
  })[s] || "";
const statusBadge = (s: string) => {
  const m: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800 border-amber-300",
    APPROVED: "bg-blue-100 text-blue-800 border-blue-300",
    PARTIAL: "bg-teal-100 text-teal-800 border-teal-300",
    COMPLETED: "bg-green-100 text-green-800 border-green-300",
    CANCELLED: "bg-red-100 text-red-800 border-red-300",
  };
  return `inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${m[s] || "bg-slate-100 text-slate-600 border-slate-300"}`;
};
const formatDate = (d: string) => new Date(d).toLocaleDateString("zh-CN");
</script>
