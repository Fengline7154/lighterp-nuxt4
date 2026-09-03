<template>
  <div>
    <h1 class="text-xl lg:text-2xl font-bold mb-6">工序管理</h1>

    <!-- 标签切换 -->
    <div class="flex gap-1 mb-4 border-b overflow-x-auto">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        :class="[
          'px-4 py-2 text-sm font-medium transition border-b-2 -mb-px whitespace-nowrap min-h-[44px]',
          activeTab === tab.key
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-slate-500 hover:text-slate-700',
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 标准工序库 -->
    <div v-if="activeTab === 'standard'">
      <div class="mb-4">
        <button
          @click="openCreateModal"
          class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
        >
          + 新建工序
        </button>
      </div>

      <div class="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
        <table class="w-full min-w-[400px]">
          <thead>
            <tr class="border-b bg-slate-100">
              <th
                class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                名称
              </th>
              <th
                class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                描述
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
              v-for="process in standardProcesses"
              :key="process.id"
              class="hover:bg-blue-50/30 even:bg-slate-50/50 transition"
            >
              <td class="px-4 py-3 text-sm font-medium">{{ process.name }}</td>
              <td class="px-4 py-3 text-sm text-slate-500">
                {{ process.description || "-" }}
              </td>
              <td class="px-4 py-3 text-sm text-center space-x-2">
                <button
                  @click="openEditModal(process)"
                  class="text-blue-600 hover:text-blue-800 text-sm min-h-[36px]"
                >
                  编辑
                </button>
                <button
                  @click="handleDelete(process.id)"
                  class="text-red-500 hover:text-red-700 text-sm min-h-[36px]"
                >
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="md:hidden space-y-3">
        <div
          v-for="process in standardProcesses"
          :key="process.id"
          class="bg-white rounded-xl shadow p-4 flex items-center justify-between"
        >
          <div>
            <div class="text-sm font-medium">{{ process.name }}</div>
            <div class="text-xs text-slate-400">
              {{ process.description || "-" }}
            </div>
          </div>
          <div class="flex gap-2">
            <button
              @click="openEditModal(process)"
              class="text-blue-600 text-sm min-h-[36px]"
            >
              编辑
            </button>
            <button
              @click="handleDelete(process.id)"
              class="text-red-500 text-sm min-h-[36px]"
            >
              删除
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="standardProcesses.length === 0"
        class="text-center py-12 text-slate-400"
      >
        暂无标准工序
      </div>
    </div>
    <!-- 订单工序模板 -->
    <div v-if="activeTab === 'order'">
      <!-- 订单选择 -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-slate-700 mb-1"
          >选择订单</label
        >
        <div class="flex gap-2">
          <input
            v-model="orderSearchKeyword"
            placeholder="搜索订单号..."
            class="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm min-h-[44px]"
          />
          <button
            @click="searchOrders"
            class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
          >
            搜索
          </button>
        </div>
        <!-- 搜索结果下拉 -->
        <div
          v-if="showOrderResults"
          class="mt-1 border rounded-lg max-h-[200px] overflow-y-auto bg-white"
        >
          <button
            v-for="o in filteredOrders"
            :key="o.id"
            @click="selectOrder(o)"
            class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition"
          >
            <span class="font-mono">{{ o.orderCode }}</span>
            <span class="text-xs text-slate-400 ml-2">{{
              o.customer?.name || ""
            }}</span>
          </button>
          <p
            v-if="filteredOrders.length === 0"
            class="text-center text-slate-400 py-4"
          >
            无匹配订单
          </p>
        </div>
      </div>

      <!-- 已选订单信息 -->
      <div
        v-if="selectedOrder"
        class="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3"
      >
        <span class="font-mono text-sm">{{ selectedOrder.orderCode }}</span>
        <span class="text-xs text-slate-500 ml-2"
          >客户：{{ selectedOrder.customer?.name || "-" }}</span
        >
      </div>

      <!-- 订单明细及工序 -->
      <div v-if="selectedOrder" class="space-y-4">
        <div
          v-for="item in orderItemsWithPlans"
          :key="item.id"
          class="bg-white rounded-xl shadow p-4"
        >
          <div class="flex justify-between items-center mb-3">
            <h3 class="font-medium text-sm">{{ item.productName }}</h3>
            <button
              @click="openOrderPlanEdit(item)"
              class="text-xs text-blue-500 hover:text-blue-700 min-h-[36px]"
            >
              {{ item.plans.length > 0 ? "编辑工序" : "添加工序" }}
            </button>
          </div>

          <!-- 工序列表（只读） -->
          <div v-if="item.plans.length > 0" class="space-y-1">
            <div
              v-for="plan in item.plans"
              :key="plan.id"
              class="flex justify-between items-center text-sm py-1 border-b last:border-0"
            >
              <span>{{ plan.sequence }}. {{ plan.processName }}</span>
              <span class="text-xs text-slate-400">
                {{
                  plan.wageType === "HOURLY"
                    ? `计时 ${plan.hourlyRate}元/h`
                    : `计件 ${plan.unitPrice}元/件`
                }}
              </span>
            </div>
          </div>
          <div v-else class="text-sm text-slate-400 py-2">暂无工序</div>
        </div>
      </div>
    </div>

    <!-- 订单工序编辑弹窗 -->
    <div
      v-if="showOrderPlanModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showOrderPlanModal = false"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[85vh] overflow-auto"
      >
        <h2 class="text-lg font-bold mb-4">
          {{ editingOrderItem?.productName }} — 工序编辑
        </h2>

        <!-- 工序列表 -->
        <div class="space-y-2 mb-4">
          <div
            v-for="(plan, index) in editingPlans"
            :key="plan.id || `new_${index}`"
            class="border rounded-lg p-3 bg-slate-50"
          >
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-medium"
                >{{ index + 1 }}. {{ plan.processName }}</span
              >
              <button
                @click="editingPlans.splice(index, 1)"
                class="text-red-400 hover:text-red-600 min-h-[36px] min-w-[36px]"
              >
                &times;
              </button>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <input
                v-model="plan.processName"
                class="min-h-[36px] border border-slate-300 rounded px-2 py-1 text-sm"
                placeholder="工序名称"
              />
              <select
                v-model="plan.wageType"
                class="min-h-[36px] border border-slate-300 rounded px-2 py-1 text-sm bg-white"
              >
                <option value="HOURLY">计时</option>
                <option value="PIECE">计件</option>
              </select>
              <input
                v-if="plan.wageType === 'HOURLY'"
                v-model.number="plan.hourlyRate"
                type="number"
                min="0"
                step="0.01"
                class="min-h-[36px] border border-slate-300 rounded px-2 py-1 text-sm"
                placeholder="小时工资"
              />
              <input
                v-if="plan.wageType === 'PIECE'"
                v-model.number="plan.unitPrice"
                type="number"
                min="0"
                step="0.01"
                class="min-h-[36px] border border-slate-300 rounded px-2 py-1 text-sm"
                placeholder="计件单价"
              />
            </div>
          </div>
          <p
            v-if="editingPlans.length === 0"
            class="text-sm text-slate-400 text-center py-4"
          >
            暂无工序，请添加
          </p>
        </div>

        <!-- 添加按钮：从标准工序选 + 手动加 -->
        <div class="flex gap-2 mb-4">
          <button
            @click="addPlanFromStandard"
            class="flex-1 min-h-[44px] px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
          >
            从标准工序选
          </button>
          <button
            @click="addPlanManual"
            class="flex-1 min-h-[44px] px-3 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition text-sm"
          >
            手动添加
          </button>
        </div>

        <div class="flex gap-2">
          <button
            @click="saveOrderPlans"
            class="flex-1 min-h-[44px] bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition text-sm"
          >
            保存
          </button>
          <button
            @click="showOrderPlanModal = false"
            class="flex-1 min-h-[44px] border py-2 rounded-lg hover:bg-slate-50 transition text-sm"
          >
            取消
          </button>
        </div>
      </div>
    </div>
    <!-- 产品工序模板 -->

    <div v-if="activeTab === 'template'">
      <div class="mb-4">
        <input
          v-model="templateKeyword"
          @input="onTemplateSearch"
          placeholder="搜索产品..."
          class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition w-full sm:w-64"
        />
      </div>

      <div class="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
        <table class="w-full min-w-[500px]">
          <thead>
            <tr class="border-b bg-slate-100">
              <th
                class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                产品编号
              </th>
              <th
                class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                产品名称
              </th>
              <th
                class="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                工序数
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
              v-for="p in filteredTemplateProducts"
              :key="p.id"
              class="transition even:bg-slate-100 odd:bg-white hover:bg-blue-200"
            >
              <td class="px-4 py-3 text-sm font-mono">{{ p.code }}</td>
              <td class="px-4 py-3 text-sm font-medium">{{ p.name }}</td>
              <td class="px-4 py-3 text-sm text-center">
                {{ p.templateCount || "-" }}
              </td>
              <td class="px-4 py-3 text-sm text-center">
                <NuxtLink
                  :to="`/products/${p.id}/routing`"
                  class="text-blue-600 hover:text-blue-800 font-medium text-sm min-h-[36px] inline-flex items-center"
                >
                  {{ p.templateCount ? "详情" : "新建" }}
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="md:hidden space-y-3">
        <div
          v-for="p in filteredTemplateProducts"
          :key="p.id"
          class="bg-white rounded-xl shadow p-4 flex items-center justify-between"
        >
          <div>
            <div class="text-sm font-mono text-slate-500">{{ p.code }}</div>
            <div class="text-sm font-medium">{{ p.name }}</div>
            <div class="text-xs text-slate-400">
              工序数：{{ p.templateCount || "-" }}
            </div>
          </div>
          <NuxtLink
            :to="`/products/${p.id}/routing`"
            class="text-blue-600 font-medium text-sm min-h-[36px] inline-flex items-center"
          >
            {{ p.templateCount ? "详情 →" : "新建 →" }}
          </NuxtLink>
        </div>
      </div>

      <div
        v-if="filteredTemplateProducts.length === 0"
        class="text-center py-12 text-slate-400"
      >
        {{ templateKeyword ? "无匹配产品" : "暂无产品" }}
      </div>
    </div>

    <!-- 新建/编辑弹窗 -->
    <div
      v-if="showFormModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showFormModal = false"
      />
      <div class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 class="text-lg font-bold mb-4">
          {{ isEditing ? "编辑工序" : "新建工序" }}
        </h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >名称 *</label
            ><input
              v-model="form.name"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="工序名称，如：裁剪"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >描述</label
            ><textarea
              v-model="form.description"
              class="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              rows="3"
              placeholder="可选描述"
            ></textarea>
          </div>
        </div>
        <div class="flex gap-2 mt-4">
          <button
            @click="handleSubmit"
            class="flex-1 min-h-[44px] bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition text-sm"
          >
            {{ isEditing ? "保存" : "创建" }}
          </button>
          <button
            @click="showFormModal = false"
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

// ==================== 基础工具 ====================
const toast = useToast();
const { apiFetch } = useApi();

// ==================== 标签页 ====================
const tabs = [
  { key: "template", label: "产品工序模板" },
  { key: "order", label: "订单工序模板" },
  { key: "standard", label: "标准工序库" },
];
const activeTab = ref("template");

// ==================== 标准工序库 ====================
const standardProcesses = ref<any[]>([]);
const showFormModal = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);
const form = reactive({ name: "", description: "" });

/**
 * 加载标准工序列表
 */
const loadStandardProcesses = async () => {
  try {
    const data = await apiFetch<any>("/api/processes");
    standardProcesses.value = data.data || [];
  } catch (e: any) {
    toast.error(e, "加载失败");
  }
};

/**
 * 打开新建工序弹窗
 */
const openCreateModal = () => {
  isEditing.value = false;
  editingId.value = null;
  form.name = "";
  form.description = "";
  showFormModal.value = true;
};

/**
 * 打开编辑工序弹窗
 */
const openEditModal = (process: any) => {
  isEditing.value = true;
  editingId.value = process.id;
  form.name = process.name;
  form.description = process.description || "";
  showFormModal.value = true;
};

/**
 * 提交新建/编辑工序
 */
const handleSubmit = async () => {
  if (!form.name.trim()) return toast.error("名称不能为空");
  try {
    if (isEditing.value) {
      await apiFetch(`/api/processes/${editingId.value}`, {
        method: "PATCH",
        body: {
          name: form.name.trim(),
          description: form.description || undefined,
        },
      });
      toast.success("修改成功");
    } else {
      await apiFetch("/api/processes", {
        method: "POST",
        body: {
          name: form.name.trim(),
          description: form.description || undefined,
        },
      });
      toast.success("创建成功");
    }
    showFormModal.value = false;
    await loadStandardProcesses();
  } catch (e: any) {
    toast.error(e, "操作失败");
  }
};

/**
 * 删除标准工序
 */
const handleDelete = async (id: string) => {
  if (!confirm("确认删除此工序？")) return;
  try {
    await apiFetch(`/api/processes/${id}`, { method: "DELETE" });
    toast.success("删除成功");
    await loadStandardProcesses();
  } catch (e: any) {
    toast.error(e, "删除失败");
  }
};

// ==================== 产品工序模板 ====================
const templateKeyword = ref("");
let templateDebounce: ReturnType<typeof setTimeout>;

const onTemplateSearch = () => {
  clearTimeout(templateDebounce);
  templateDebounce = setTimeout(() => {
    // 实际搜索逻辑由 computed 响应式处理，这里只做防抖占位
  }, 300);
};

const { data: templateProductsData } = await useFetch("/api/routings");
const allTemplateProducts = computed(
  () => (templateProductsData.value as any)?.data || [],
);

const filteredTemplateProducts = computed(() => {
  if (!templateKeyword.value.trim()) return allTemplateProducts.value;
  const q = templateKeyword.value.toLowerCase();
  return allTemplateProducts.value.filter(
    (p: any) =>
      p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q),
  );
});

// ==================== 订单工序模板 ====================
const orderSearchKeyword = ref("");
const showOrderResults = ref(false);
const orderSearchResults = ref<any[]>([]);
const selectedOrder = ref<any>(null);
const orderItemsWithPlans = ref<any[]>([]);

const filteredOrders = computed(() => orderSearchResults.value);

/**
 * 搜索订单
 */
const searchOrders = async () => {
  if (!orderSearchKeyword.value.trim()) return;
  try {
    const res = await $fetch(
      `/api/orders?limit=50&keyword=${encodeURIComponent(orderSearchKeyword.value)}`,
    );
    orderSearchResults.value = (res as any)?.data || [];
    showOrderResults.value = true;
  } catch {
    orderSearchResults.value = [];
    showOrderResults.value = true;
  }
};

/**
 * 选择订单并加载其明细及工序
 */
const selectOrder = async (order: any) => {
  selectedOrder.value = order;
  showOrderResults.value = false;
  orderSearchKeyword.value = order.orderCode;

  try {
    const res = await $fetch(`/api/orders/${order.id}/plans`);
    const plansData = (res as any)?.data || [];

    // 按 orderItemId 分组
    const itemMap = new Map<string, any>();
    for (const item of order.items || []) {
      itemMap.set(item.id, {
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        plans: [],
      });
    }
    for (const plan of plansData) {
      const item = itemMap.get(plan.orderItemId);
      if (item) item.plans.push(plan);
    }
    orderItemsWithPlans.value = [...itemMap.values()];
  } catch {
    orderItemsWithPlans.value = [];
  }
};

// ==================== 订单工序编辑弹窗 ====================
const showOrderPlanModal = ref(false);
const editingOrderItem = ref<any>(null);
const editingPlans = ref<any[]>([]);

/**
 * 打开订单工序编辑弹窗
 */
const openOrderPlanEdit = (item: any) => {
  editingOrderItem.value = item;
  editingPlans.value = item.plans.map((p: any) => ({
    id: p.id,
    sequence: p.sequence,
    processName: p.processName,
    wageType: p.wageType || "HOURLY",
    hourlyRate: p.hourlyRate ? Number(p.hourlyRate) : 0,
    unitPrice: p.unitPrice ? Number(p.unitPrice) : 0,
  }));
  showOrderPlanModal.value = true;
};

/**
 * 手动添加空工序行
 */
const addPlanManual = () => {
  editingPlans.value.push({
    id: "",
    sequence: editingPlans.value.length + 1,
    processName: "",
    wageType: "HOURLY",
    hourlyRate: 0,
    unitPrice: 0,
  });
};

/**
 * 从标准工序库快速添加（简化版：选第一个，实际可弹窗选择）
 */
const addPlanFromStandard = () => {
  if (standardProcesses.value.length === 0) {
    toast.error("标准工序库为空，请先创建");
    return;
  }
  // 简化处理：直接添加第一个标准工序，后续可改为弹窗选择
  const process = standardProcesses.value[0];
  editingPlans.value.push({
    id: "",
    sequence: editingPlans.value.length + 1,
    processName: process.name,
    wageType: "HOURLY",
    hourlyRate: 0,
    unitPrice: 0,
  });
};

/**
 * 保存订单工序计划
 */
const saveOrderPlans = async () => {
  if (!editingOrderItem.value) return;
  if (editingPlans.value.some((p) => !p.processName.trim())) {
    return toast.error("请填写所有工序名称");
  }

  try {
    const plans = editingPlans.value.map((p, index) => ({
      id: p.id || undefined,
      sequence: index + 1,
      processName: p.processName,
      wageType: p.wageType,
      hourlyRate: p.hourlyRate || undefined,
      unitPrice: p.unitPrice || undefined,
    }));

    await apiFetch(`/api/orders/${selectedOrder.value.id}/plans`, {
      method: "POST",
      body: {
        orderItemId: editingOrderItem.value.id,
        plans,
      },
    });
    toast.success("工序保存成功");
    showOrderPlanModal.value = false;
    await selectOrder(selectedOrder.value);
  } catch (e: any) {
    toast.error(e, "保存失败");
  }
};

// ==================== 初始化 ====================
onMounted(() => {
  loadStandardProcesses();
});
</script>
