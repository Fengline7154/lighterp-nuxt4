<template>
  <div>
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink
        :to="`/orders/${route.params.id}`"
        class="text-slate-500 hover:text-slate-700 text-sm lg:text-base"
        >&larr; 返回订单</NuxtLink
      >
      <h1 class="text-xl lg:text-2xl font-bold">生产报工</h1>
    </div>

    <div class="bg-white rounded-xl shadow p-6" v-if="loading">
      <div class="flex items-center justify-center py-12">
        <div
          class="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"
        ></div>
        <span class="ml-3 text-sm text-slate-400">加载中...</span>
      </div>
    </div>

    <div
      class="bg-white rounded-xl shadow p-6"
      v-else-if="allPlans.length === 0"
    >
      <div class="text-center py-12">
        <div class="text-4xl mb-3">📋</div>
        <p class="text-slate-500 text-sm">暂无未完成工序</p>
        <p class="text-slate-400 text-xs mt-1">
          请先为产品配置工序模板，或将订单推进到生产状态
        </p>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow p-4 lg:p-6" v-else>
      <!-- 移动端卡片 -->
      <div class="lg:hidden space-y-4 mb-4">
        <div
          v-for="(row, i) in rows"
          :key="i"
          class="border rounded-lg p-4 bg-slate-50"
        >
          <div class="flex justify-between items-center mb-3">
            <span class="text-sm font-medium text-slate-600"
              >报工行 {{ i + 1 }}</span
            >
            <button
              @click="rows.splice(i, 1)"
              class="text-red-400 hover:text-red-600 text-lg min-h-[36px] min-w-[36px]"
            >
              &times;
            </button>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-slate-500 mb-1">产品</label>
              <select
                v-model="row.productId"
                @change="onProductChange(i)"
                class="w-full min-h-[44px] border rounded px-3 py-2 text-sm bg-white"
              >
                <option value="">选择产品</option>
                <option v-for="p in productGroups" :key="p.key" :value="p.key">
                  {{ p.productName }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">工序</label>
              <select
                v-model="row.planId"
                @change="onPlanChange(i)"
                class="w-full min-h-[44px] border rounded px-3 py-2 text-sm bg-white"
              >
                <option value="">选择工序</option>
                <option
                  v-for="plan in getAvailablePlans(row.productId)"
                  :key="plan.id"
                  :value="plan.id"
                >
                  {{ plan.processName }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">本次完成</label>
              <input
                v-model.number="row.completedQty"
                type="number"
                min="0"
                step="0.01"
                class="w-full min-h-[44px] border rounded px-3 py-2 text-sm text-right"
                @input="onCompletedChange(i)"
              />
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">合格数</label>
              <input
                v-model.number="row.qualifiedQty"
                type="number"
                min="0"
                step="0.01"
                class="w-full min-h-[44px] border rounded px-3 py-2 text-sm text-right"
                @input="onQualifiedChange(i)"
              />
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">不良数</label>
              <input
                v-model.number="row.defectiveQty"
                type="number"
                min="0"
                step="0.01"
                class="w-full min-h-[44px] border rounded px-3 py-2 text-sm text-right"
              />
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">预估成本</label>
              <div class="text-sm font-medium text-slate-700 text-right py-2">
                {{ calcRowCost(row) }}
              </div>
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">操作工</label>
              <select
                v-model="row.workerId"
                class="w-full min-h-[44px] border rounded px-3 py-2 text-sm bg-white"
              >
                <option value="">选择</option>
                <option v-for="w in workers" :key="w.id" :value="w.id">
                  {{ w.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">工资类型</label>
              <select
                v-model="row.wageType"
                class="w-full min-h-[44px] border rounded px-3 py-2 text-sm bg-white"
              >
                <option value="HOURLY">计时</option>
                <option value="PIECE">计件</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">工时</label>
              <input
                v-model.number="row.laborHours"
                type="number"
                min="0"
                step="0.01"
                class="w-full min-h-[44px] border rounded px-3 py-2 text-sm text-right"
                :disabled="row.wageType !== 'HOURLY'"
              />
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">{{
                row.wageType === "HOURLY" ? "工资率(元/时)" : "计件单价(元/件)"
              }}</label>
              <input
                v-model.number="row.rate"
                type="number"
                min="0"
                step="0.01"
                class="w-full min-h-[44px] border rounded px-3 py-2 text-sm text-right"
                :placeholder="getRefPrice(row.planId, row.wageType)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 桌面端表格 -->
      <div class="hidden lg:block overflow-x-auto mb-4">
        <table class="w-full min-w-[1200px] text-sm">
          <thead>
            <tr
              class="border-b bg-slate-100 text-left text-xs font-medium text-slate-500 uppercase"
            >
              <th class="py-3 px-2 w-28">产品</th>
              <th class="py-3 px-2 w-32">工序</th>
              <th class="py-3 px-2 w-16 text-right">待完成</th>
              <th class="py-3 px-2 w-24 text-right">本次完成</th>
              <th class="py-3 px-2 w-24 text-right">合格数</th>
              <th class="py-3 px-2 w-20 text-right">不良数</th>
              <th class="py-3 px-2 w-24 text-right">预估成本</th>
              <th class="py-3 px-2 w-28">操作工</th>
              <th class="py-3 px-2 w-20">类型</th>
              <th class="py-3 px-2 w-20 text-right">工时</th>
              <th class="py-3 px-2 w-24 text-right">工价</th>
              <th class="py-3 px-1 w-8"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="(row, i) in rows"
              :key="i"
              class="hover:bg-blue-50/30 even:bg-slate-50/50 transition"
            >
              <td class="py-2 px-2">
                <select
                  v-model="row.productId"
                  @change="onProductChange(i)"
                  class="w-full min-h-[36px] border border-slate-200 rounded px-2 py-1.5 text-sm"
                >
                  <option value="">选择产品</option>
                  <option
                    v-for="p in productGroups"
                    :key="p.key"
                    :value="p.key"
                  >
                    {{ p.productName }}
                  </option>
                </select>
              </td>
              <td class="py-2 px-2">
                <select
                  v-model="row.planId"
                  @change="onPlanChange(i)"
                  class="w-full min-h-[36px] border border-slate-200 rounded px-2 py-1.5 text-sm"
                >
                  <option value="">选择工序</option>
                  <option
                    v-for="plan in getAvailablePlans(row.productId)"
                    :key="plan.id"
                    :value="plan.id"
                  >
                    {{ plan.processName }}
                  </option>
                </select>
              </td>
              <td class="py-2 px-2 text-right text-sm text-slate-500 font-mono">
                {{ getRemainingQty(row.planId) }}
              </td>
              <td class="py-2 px-2">
                <input
                  v-model.number="row.completedQty"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full min-h-[36px] border border-slate-200 rounded px-2 py-1.5 text-sm text-right"
                  @input="onCompletedChange(i)"
                />
              </td>
              <td class="py-2 px-2">
                <input
                  v-model.number="row.qualifiedQty"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full min-h-[36px] border border-slate-200 rounded px-2 py-1.5 text-sm text-right"
                  @input="onQualifiedChange(i)"
                />
              </td>
              <td class="py-2 px-2">
                <input
                  v-model.number="row.defectiveQty"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full min-h-[36px] border border-slate-200 rounded px-2 py-1.5 text-sm text-right"
                />
              </td>
              <td
                class="py-2 px-2 text-right text-sm text-slate-600 font-medium"
              >
                {{ calcRowCost(row) }}
              </td>
              <td class="py-2 px-2">
                <select
                  v-model="row.workerId"
                  class="w-full min-h-[36px] border border-slate-200 rounded px-2 py-1.5 text-sm"
                >
                  <option value="">选择</option>
                  <option v-for="w in workers" :key="w.id" :value="w.id">
                    {{ w.name }}
                  </option>
                </select>
              </td>
              <td class="py-2 px-2">
                <select
                  v-model="row.wageType"
                  class="w-full min-h-[36px] border border-slate-200 rounded px-2 py-1.5 text-sm"
                >
                  <option value="HOURLY">计时</option>
                  <option value="PIECE">计件</option>
                </select>
              </td>
              <td class="py-2 px-2">
                <input
                  v-model.number="row.laborHours"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full min-h-[36px] border border-slate-200 rounded px-2 py-1.5 text-sm text-right"
                  :disabled="row.wageType !== 'HOURLY'"
                />
              </td>
              <td class="py-2 px-2">
                <input
                  v-model.number="row.rate"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full min-h-[36px] border border-slate-200 rounded px-2 py-1.5 text-sm text-right"
                  :placeholder="getRefPrice(row.planId, row.wageType)"
                />
              </td>
              <td class="py-2 px-1 text-center">
                <button
                  @click="rows.splice(i, 1)"
                  class="text-red-400 hover:text-red-600 text-lg min-h-[36px] min-w-[36px]"
                >
                  &times;
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <button
        @click="addRow"
        class="min-h-[44px] px-4 py-2 text-blue-600 hover:text-blue-800 text-sm font-medium border border-blue-200 rounded-lg hover:bg-blue-50 transition mb-6"
      >
        + 添加报工行
      </button>

      <button
        @click="submitBatchReport"
        :disabled="submitting"
        class="w-full min-h-[48px] bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition font-medium disabled:opacity-50 text-sm lg:text-base"
      >
        {{ submitting ? "提交中..." : "确认报工" }}
      </button>
      <p class="text-xs text-slate-400 mt-2 text-center">
        只提交填写了"本次完成"且选择了"工序"和"操作工"的行。提交失败不会丢失数据。
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth" as any] });
const toast = useToast();
const { apiFetch } = useApi();
const route = useRoute();

const plans = ref<any[]>([]);
const workers = ref<any[]>([]);
const loading = ref(true);
const submitting = ref(false);

interface ReportRow {
  productId: string;
  planId: string;
  completedQty: number;
  qualifiedQty: number;
  defectiveQty: number;
  workerId: string;
  wageType: "HOURLY" | "PIECE";
  laborHours: number;
  rate: number;
}

const rows = reactive<ReportRow[]>([]);

const allPlans = computed(() =>
  plans.value.filter((p) => p.status !== "COMPLETED"),
);

const productGroups = computed(() => {
  const map = new Map<string, { key: string; productName: string }>();
  for (const plan of allPlans.value) {
    const key = plan.productId || plan.orderItemId;
    if (!map.has(key))
      map.set(key, {
        key,
        productName:
          plan.product?.name || plan.orderItem?.productName || "未知产品",
      });
  }
  return [...map.values()];
});

const getAvailablePlans = (productKey: string) => {
  if (!productKey) return [];
  return allPlans.value.filter(
    (p) => (p.productId || p.orderItemId) === productKey,
  );
};

const getRemainingQty = (planId: string) => {
  const plan = plans.value.find((p) => p.id === planId);
  if (!plan) return "-";
  return Number(plan.assignedQty) - Number(plan.completedQty);
};

const getRefPrice = (planId: string, wageType: string) => {
  const plan = plans.value.find((p) => p.id === planId);
  if (!plan) return "-";
  return wageType === "HOURLY"
    ? `${Number(plan.hourlyRate) || 0}`
    : `${Number(plan.unitPrice) || 0}`;
};

const calcRowCost = (row: ReportRow) => {
  if (!row.qualifiedQty) return "¥0.00";
  if (row.wageType === "HOURLY" && row.laborHours && row.rate) {
    return `¥${(row.laborHours * row.rate).toFixed(2)}`;
  }
  if (row.wageType === "PIECE" && row.rate) {
    return `¥${(row.qualifiedQty * row.rate).toFixed(2)}`;
  }
  return "¥0.00";
};

const onProductChange = (i: number) => {
  rows[i]!.planId = "";
  // 只有一个产品时自动选择
  if (productGroups.value.length === 1) {
    rows[i]!.productId = productGroups.value[0]!.key;
    // 只有一个工序时也自动选择
    const plans = getAvailablePlans(productGroups.value[0]!.key);
    if (plans.length === 1) {
      rows[i]!.planId = plans[0]!.id;
      onPlanChange(i);
    }
  }
};

const onPlanChange = (i: number) => {
  const plan = plans.value.find((p) => p.id === rows[i]!.planId);
  if (plan) {
    rows[i]!.wageType = plan.wageType || "HOURLY";
    if (plan.wageType === "HOURLY") {
      rows[i]!.laborHours = Number(plan.standardHours) || 0;
      rows[i]!.rate = Number(plan.hourlyRate) || 0;
    } else {
      rows[i]!.laborHours = 0;
      rows[i]!.rate = Number(plan.unitPrice) || 0;
    }
  }
};

const onCompletedChange = (i: number) => {
  rows[i]!.qualifiedQty = rows[i]!.completedQty;
  rows[i]!.defectiveQty = 0;
};

const onQualifiedChange = (i: number) => {
  rows[i]!.defectiveQty = Math.max(
    0,
    (rows[i]!.completedQty || 0) - (rows[i]!.qualifiedQty || 0),
  );
};

const addRow = () => {
  const row: ReportRow = {
    productId: "",
    planId: "",
    completedQty: 0,
    qualifiedQty: 0,
    defectiveQty: 0,
    workerId: "",
    wageType: "HOURLY",
    laborHours: 0,
    rate: 0,
  };
  // 只有一个产品时自动填充
  if (productGroups.value.length === 1) {
    row.productId = productGroups.value[0]!.key;
  }
  rows.push(row);
};

const loadData = async () => {
  try {
    const [plansData, workersData] = await Promise.all([
      apiFetch<any>(`/api/orders/${route.params.id}/plans`),
      apiFetch<any>("/api/workers?limit=200"),
    ]);
    plans.value = plansData.data || [];
    workers.value = workersData.data || [];
  } catch (e: any) {
    toast.error(e, "加载数据失败");
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await loadData();
  addRow();
});

const submitBatchReport = async () => {
  const reports = rows
    .filter((r) => r.planId && r.completedQty > 0 && r.workerId)
    .map((r) => {
      const plan = plans.value.find((p) => p.id === r.planId);
      return {
        planId: r.planId,
        orderId: plan.orderId,
        productId: plan.productId || plan.orderItem?.productId,
        processId: plan.processId || undefined,
        processName: plan.processName,
        workerId: r.workerId,
        completedQty: r.completedQty,
        qualifiedQty: r.qualifiedQty || r.completedQty,
        defectiveQty: r.defectiveQty || 0,
        wageType: r.wageType,
        laborHours:
          r.wageType === "HOURLY"
            ? r.laborHours || Number(plan.standardHours) || 0
            : undefined,
        hourlyRate:
          r.wageType === "HOURLY"
            ? r.rate || Number(plan.hourlyRate) || 0
            : undefined,
        unitPrice:
          r.wageType === "PIECE"
            ? r.rate || Number(plan.unitPrice) || 0
            : undefined,
      };
    });

  if (reports.length === 0) return toast.error("请至少填写一行完整的报工信息");

  submitting.value = true;
  try {
    await apiFetch("/api/production-logs/batch", {
      method: "POST",
      body: { reports },
    });
    toast.success(`成功报工 ${reports.length} 条记录`);
    rows.length = 1;
    rows[0] = {
      productId: "",
      planId: "",
      completedQty: 0,
      qualifiedQty: 0,
      defectiveQty: 0,
      workerId: "",
      wageType: "HOURLY",
      laborHours: 0,
      rate: 0,
    };
    const plansData = await apiFetch<any>(
      `/api/orders/${route.params.id}/plans`,
    );
    plans.value = plansData.data || [];
  } catch (e: any) {
    toast.error(e, "报工失败，数据未丢失");
  } finally {
    submitting.value = false;
  }
};
</script>
