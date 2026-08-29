<!-- pages/production-logs/[id]/index.vue -->
<template>
  <div class="max-w-2xl mx-auto">
    <div class="flex items-center gap-4 mb-6 flex-wrap">
      <NuxtLink
        to="/production-logs"
        class="text-slate-500 hover:text-slate-700"
        >&larr; 返回</NuxtLink
      >
      <h1 class="text-xl lg:text-2xl font-bold">报工详情</h1>
      <button
        v-if="log?.isLatest"
        @click="editing = !editing"
        class="ml-auto min-h-[44px] px-4 py-2 border rounded-lg text-sm hover:bg-slate-50 transition"
      >
        {{ editing ? "取消" : "编辑" }}
      </button>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <div
        class="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"
      ></div>
      <span class="ml-3 text-sm text-slate-400">加载中...</span>
    </div>

    <div v-if="log" class="space-y-6">
      <!-- 查看模式 -->
      <div v-if="!editing" class="bg-white rounded-xl shadow p-4 lg:p-6">
        <div
          class="flex justify-between items-start mb-4 pb-4 border-b border-slate-100"
        >
          <div>
            <div class="text-lg font-bold text-slate-800">
              {{ log.processName }}
            </div>
            <div class="text-sm text-slate-500 mt-1">
              {{ log.order?.orderCode || log.orderId }}
            </div>
          </div>
          <div class="text-right">
            <div class="text-xs text-slate-400 mb-1">
              {{ log.wageType === "HOURLY" ? "计时" : "计件" }} · 人工成本
            </div>
            <div class="text-xl font-bold text-green-600">
              ¥{{ log.laborCost || 0 }}
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Info label="订单号" :value="log.order?.orderCode || log.orderId" />
          <Info label="工序" :value="log.processName" />
          <Info label="产品">
            <span class="font-mono text-xs text-slate-400">{{
              log.product?.code
            }}</span>
            <span class="ml-1">{{ log.product?.name || "-" }}</span>
          </Info>
          <Info label="操作工">
            {{ log.worker?.name || log.workerId || "-" }}
            <span v-if="log.worker?.code" class="text-xs text-slate-400 ml-1"
              >({{ log.worker.code }})</span
            >
          </Info>
          <Info label="完成数" :value="log.completedQty" />
          <Info label="合格数">
            <span class="text-green-600 font-medium">{{
              log.qualifiedQty
            }}</span>
          </Info>
          <Info label="不良数">
            <span
              :class="
                Number(log.defectiveQty) > 0 ? 'text-red-500 font-medium' : ''
              "
            >
              {{ log.defectiveQty }}
            </span>
          </Info>
          <Info
            label="工资类型"
            :value="log.wageType === 'HOURLY' ? '计时' : '计件'"
          />
          <Info
            v-if="log.wageType === 'HOURLY'"
            label="工时"
            :value="`${log.laborHours} 小时`"
          />
          <Info
            v-if="log.wageType === 'HOURLY'"
            label="工资率"
            :value="`¥${log.hourlyRate || 0}/时`"
          />
          <Info
            v-if="log.wageType === 'PIECE'"
            label="计件单价"
            :value="`¥${log.unitPrice || 0}/件`"
          />
          <Info label="录入人">
            {{ log.operator?.badgeCode || log.operatorId }}
            {{ log.operator?.name || "-" }}
          </Info>
          <Info label="报工时间" :value="formatDateTime(log.createdAt)" />
          <Info label="备注" :value="log.remark || '-'" />
        </div>

        <div
          v-if="!log.isLatest"
          class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg"
        >
          <span class="text-sm text-amber-700">⚠️ 此记录已被修订</span>
        </div>
      </div>

      <!-- 编辑模式 -->
      <div v-else class="bg-white rounded-xl shadow p-4 lg:p-6 space-y-4">
        <h2 class="font-semibold text-sm text-slate-500">编辑报工</h2>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >完成数</label
            >
            <input
              v-model.number="editForm.completedQty"
              type="number"
              min="0"
              step="0.01"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-3 py-2 text-sm text-right focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-green-600 mb-1"
              >合格数</label
            >
            <input
              v-model.number="editForm.qualifiedQty"
              type="number"
              min="0"
              step="0.01"
              class="w-full min-h-[44px] border border-green-300 rounded-lg px-3 py-2 text-sm text-right text-green-700 focus:ring-2 focus:ring-green-500 outline-none transition"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-red-500 mb-1"
              >不良数</label
            >
            <input
              v-model.number="editForm.defectiveQty"
              type="number"
              min="0"
              step="0.01"
              class="w-full min-h-[44px] border border-red-300 rounded-lg px-3 py-2 text-sm text-right text-red-600 focus:ring-2 focus:ring-red-500 outline-none transition"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >操作工</label
          >
          <select
            v-model="editForm.workerId"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
          >
            <option value="">选择操作工</option>
            <option v-for="w in workers" :key="w.id" :value="w.id">
              {{ w.name }}（{{ w.code }}）
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >工资类型</label
          >
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="editForm.wageType = 'HOURLY'"
              :class="[
                'min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition border',
                editForm.wageType === 'HOURLY'
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50',
              ]"
            >
              计时
            </button>
            <button
              @click="editForm.wageType = 'PIECE'"
              :class="[
                'min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition border',
                editForm.wageType === 'PIECE'
                  ? 'bg-purple-500 text-white border-purple-500'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50',
              ]"
            >
              计件
            </button>
          </div>
        </div>

        <template v-if="editForm.wageType === 'HOURLY'">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >工时（小时）</label
              >
              <input
                v-model.number="editForm.laborHours"
                type="number"
                min="0"
                step="0.01"
                class="w-full min-h-[44px] border border-slate-300 rounded-lg px-3 py-2 text-sm text-right focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >工资率（元/时）</label
              >
              <input
                v-model.number="editForm.hourlyRate"
                type="number"
                min="0"
                step="0.01"
                class="w-full min-h-[44px] border border-slate-300 rounded-lg px-3 py-2 text-sm text-right focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
          </div>
        </template>

        <div v-if="editForm.wageType === 'PIECE'">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >计件单价（元/件）</label
          >
          <input
            v-model.number="editForm.unitPrice"
            type="number"
            min="0"
            step="0.01"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-3 py-2 text-sm text-right focus:ring-2 focus:ring-blue-500 outline-none transition"
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

        <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span class="text-sm text-blue-700"
            >💡 编辑后原记录将标记为已修订，新记录会继承原记录信息</span
          >
        </div>

        <button
          @click="handleSave"
          :disabled="saving"
          class="w-full min-h-[48px] bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition font-medium text-sm disabled:opacity-50"
        >
          {{ saving ? "保存中..." : "保存修改" }}
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

const {
  data: log,
  loading,
  execute: loadLog,
} = useApiFetch<any>(() => `/api/production-logs/${route.params.id}`);
await loadLog();

const editing = ref(false);
const saving = ref(false);
const workers = ref<any[]>([]);

const editForm = reactive({
  completedQty: 0,
  qualifiedQty: 0,
  defectiveQty: 0,
  workerId: "",
  wageType: "HOURLY" as "HOURLY" | "PIECE",
  laborHours: 0,
  hourlyRate: 0,
  unitPrice: 0,
  remark: "",
});

watch(
  log,
  (val: any) => {
    if (val?.id) {
      editForm.completedQty = Number(val.completedQty) || 0;
      editForm.qualifiedQty = Number(val.qualifiedQty) || 0;
      editForm.defectiveQty = Number(val.defectiveQty) || 0;
      editForm.workerId = val.workerId || "";
      editForm.wageType = val.wageType || "HOURLY";
      editForm.laborHours = Number(val.laborHours) || 0;
      editForm.hourlyRate = Number(val.hourlyRate) || 0;
      editForm.unitPrice = Number(val.unitPrice) || 0;
      editForm.remark = val.remark || "";
    }
  },
  { immediate: true },
);

watch(editing, async (val) => {
  if (val && workers.value.length === 0) {
    try {
      const data = await apiFetch<any>("/api/workers?limit=200");
      workers.value = data.data || [];
    } catch {
      workers.value = [];
    }
  }
});

const handleSave = async () => {
  if (editForm.completedQty <= 0) return toast.error("完成数必须大于 0");
  if (editForm.qualifiedQty < 0 || editForm.defectiveQty < 0)
    return toast.error("合格数和不良数不能为负数");
  if (editForm.completedQty !== editForm.qualifiedQty + editForm.defectiveQty)
    return toast.error("完成数必须等于合格数+不良数");

  saving.value = true;
  try {
    await apiFetch(`/api/production-logs/${route.params.id}/edit`, {
      method: "PATCH",
      body: {
        completedQty: editForm.completedQty,
        qualifiedQty: editForm.qualifiedQty,
        defectiveQty: editForm.defectiveQty,
        workerId: editForm.workerId || undefined,
        wageType: editForm.wageType,
        laborHours:
          editForm.wageType === "HOURLY" ? editForm.laborHours : undefined,
        hourlyRate:
          editForm.wageType === "HOURLY" ? editForm.hourlyRate : undefined,
        unitPrice:
          editForm.wageType === "PIECE" ? editForm.unitPrice : undefined,
        remark: editForm.remark || undefined,
      },
    });
    toast.success("报工修改成功");
    editing.value = false;
    await loadLog();
  } catch (e: any) {
    toast.error(e, "修改失败");
  } finally {
    saving.value = false;
  }
};

const formatDate = (d: string) => new Date(d).toLocaleDateString("zh-CN");
const formatDateTime = (d: string) => {
  const date = new Date(d);
  return `${date.toLocaleDateString("zh-CN")} ${date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
};
</script>
