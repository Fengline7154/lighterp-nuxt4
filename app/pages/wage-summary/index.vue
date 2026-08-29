<template>
  <div>
    <div class="flex justify-between items-center mb-6 flex-wrap gap-2">
      <h1 class="text-xl lg:text-2xl font-bold">工资汇总</h1>
    </div>

    <!-- 筛选区 -->
    <div class="flex flex-wrap gap-3 mb-4">
      <input
        v-model="startDate"
        type="date"
        max="9999-12-30"
        @change="loadSummary"
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition"
      />
      <span class="text-sm text-slate-500 self-center">至</span>
      <input
        v-model="endDate"
        type="date"
        max="9999-12-30"
        @change="loadSummary"
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition"
      />

      <select
        v-model="groupBy"
        @change="loadSummary"
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
      >
        <option value="worker">按员工分组</option>
        <option value="order">按订单分组</option>
        <option value="worker+order">按员工+订单分组</option>
      </select>

      <button
        @click="clearFilters"
        class="min-h-[44px] px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition"
      >
        清除筛选
      </button>
    </div>

    <!-- 汇总卡片 -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-xl shadow p-4">
        <div class="text-xs text-slate-400 mb-1">总工资</div>
        <div class="text-2xl font-bold text-blue-600">
          ¥{{ summary.totalAmount }}
        </div>
      </div>
      <div class="bg-white rounded-xl shadow p-4">
        <div class="text-xs text-slate-400 mb-1">工序报工工资</div>
        <div class="text-2xl font-bold text-green-600">
          ¥{{ summary.productionTotal }}
        </div>
      </div>
      <div class="bg-white rounded-xl shadow p-4">
        <div class="text-xs text-slate-400 mb-1">杂费工资</div>
        <div class="text-2xl font-bold text-purple-600">
          ¥{{ summary.miscTotal }}
        </div>
      </div>
    </div>

    <!-- 按员工分组：单级展开 -->
    <template v-if="groupBy === 'worker'">
      <div class="space-y-3">
        <div
          v-for="group in groups"
          :key="group.key"
          class="bg-white rounded-xl shadow overflow-hidden"
        >
          <div
            class="p-4 cursor-pointer hover:bg-slate-50 transition flex justify-between items-center flex-wrap gap-2"
            @click="toggleDetail(group.key)"
          >
            <div>
              <div class="font-semibold text-sm lg:text-base">
                {{ group.workerName }}
                <span
                  v-if="group.workerCode"
                  class="text-xs text-slate-400 ml-1"
                  >({{ group.workerCode }})</span
                >
              </div>
              <div class="text-xs text-slate-400 mt-0.5">
                {{ group.records.length }} 条记录
              </div>
            </div>
            <div class="text-right">
              <div class="text-lg font-bold text-blue-600">
                ¥{{ group.totalAmount }}
              </div>
              <div class="text-xs text-slate-400">
                工序 ¥{{ group.productionTotal }} + 杂费 ¥{{ group.miscTotal }}
              </div>
            </div>
          </div>
          <div
            v-if="expandedKeys.has(group.key)"
            class="border-t px-4 py-3 space-y-2 bg-slate-50/50"
          >
            <div
              v-for="record in group.records"
              :key="record.id"
              class="flex justify-between items-center text-sm py-1.5 px-2 rounded-lg hover:bg-white"
            >
              <div class="flex items-center gap-2 flex-wrap">
                <span
                  :class="
                    record.type === 'PRODUCTION'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-purple-100 text-purple-700'
                  "
                  class="px-2 py-0.5 rounded-full text-xs font-medium"
                >
                  {{ record.type === "PRODUCTION" ? "工序" : "杂费" }}
                </span>
                <span class="text-sm">{{ record.description }}</span>
                <span v-if="record.orderCode" class="text-xs text-slate-400">{{
                  record.orderCode
                }}</span>
                <span v-if="record.productName" class="text-xs text-slate-400">
                  {{ record.productCode }} {{ record.productName }}
                </span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-xs text-slate-400">{{ record.date }}</span>
                <span class="font-medium text-sm">¥{{ record.amount }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 按订单分组：两级展开 -->
    <template v-else-if="groupBy === 'order'">
      <div class="space-y-3">
        <div
          v-for="group in groups"
          :key="group.key"
          class="bg-white rounded-xl shadow overflow-hidden"
        >
          <!-- 第一级：订单 -->
          <div
            class="p-4 cursor-pointer hover:bg-slate-50 transition flex justify-between items-center flex-wrap gap-2"
            @click="toggleDetail(group.key)"
          >
            <div>
              <div class="font-semibold text-sm lg:text-base font-mono">
                {{ group.orderCode || "未绑定订单" }}
              </div>
              <div class="text-xs text-slate-400 mt-0.5">
                {{ group.records.length }} 条记录
              </div>
            </div>
            <div class="text-right">
              <div class="text-lg font-bold text-blue-600">
                ¥{{ group.totalAmount }}
              </div>
              <div class="text-xs text-slate-400">
                工序 ¥{{ group.productionTotal }} + 杂费 ¥{{ group.miscTotal }}
              </div>
            </div>
          </div>

          <!-- 第二级：员工 -->
          <div
            v-if="expandedKeys.has(group.key)"
            class="border-t bg-slate-50/50"
          >
            <div
              v-for="workerGroup in getWorkerGroups(group.records)"
              :key="workerGroup.workerKey"
              class="border-b last:border-0"
            >
              <div
                class="px-6 py-3 cursor-pointer hover:bg-white transition flex justify-between items-center"
                @click="toggleDetail(workerGroup.workerKey)"
              >
                <div class="text-sm font-medium">
                  {{ workerGroup.workerName }}
                  <span
                    v-if="workerGroup.workerCode"
                    class="text-xs text-slate-400 ml-1"
                    >({{ workerGroup.workerCode }})</span
                  >
                </div>
                <div class="text-right">
                  <span class="text-sm font-bold text-blue-600"
                    >¥{{ workerGroup.totalAmount }}</span
                  >
                </div>
              </div>

              <!-- 第三级：明细 -->
              <div
                v-if="expandedKeys.has(workerGroup.workerKey)"
                class="px-6 py-2 space-y-1 bg-white/50"
              >
                <div
                  v-for="record in workerGroup.records"
                  :key="record.id"
                  class="flex justify-between items-center text-sm py-1.5 px-2 rounded-lg hover:bg-slate-50"
                >
                  <div class="flex items-center gap-2 flex-wrap">
                    <span
                      :class="
                        record.type === 'PRODUCTION'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      "
                      class="px-2 py-0.5 rounded-full text-xs font-medium"
                    >
                      {{ record.type === "PRODUCTION" ? "工序" : "杂费" }}
                    </span>
                    <span class="text-sm">{{ record.description }}</span>
                    <span
                      v-if="record.productName"
                      class="text-xs text-slate-400"
                    >
                      {{ record.productCode }} {{ record.productName }}
                    </span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-xs text-slate-400">{{
                      record.date
                    }}</span>
                    <span class="font-medium text-sm"
                      >¥{{ record.amount }}</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 按员工+订单分组：单级展开 -->
    <template v-else>
      <div class="space-y-3">
        <div
          v-for="group in groups"
          :key="group.key"
          class="bg-white rounded-xl shadow overflow-hidden"
        >
          <div
            class="p-4 cursor-pointer hover:bg-slate-50 transition flex justify-between items-center flex-wrap gap-2"
            @click="toggleDetail(group.key)"
          >
            <div>
              <div class="font-semibold text-sm lg:text-base">
                {{ group.workerName }}
                <span
                  v-if="group.workerCode"
                  class="text-xs text-slate-400 ml-1"
                  >({{ group.workerCode }})</span
                >
              </div>
              <div class="text-xs text-slate-400 mt-0.5 font-mono">
                {{ group.orderCode || "未绑定订单" }}
              </div>
            </div>
            <div class="text-right">
              <div class="text-lg font-bold text-blue-600">
                ¥{{ group.totalAmount }}
              </div>
              <div class="text-xs text-slate-400">
                工序 ¥{{ group.productionTotal }} + 杂费 ¥{{ group.miscTotal }}
              </div>
            </div>
          </div>
          <div
            v-if="expandedKeys.has(group.key)"
            class="border-t px-4 py-3 space-y-2 bg-slate-50/50"
          >
            <div
              v-for="record in group.records"
              :key="record.id"
              class="flex justify-between items-center text-sm py-1.5 px-2 rounded-lg hover:bg-white"
            >
              <div class="flex items-center gap-2 flex-wrap">
                <span
                  :class="
                    record.type === 'PRODUCTION'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-purple-100 text-purple-700'
                  "
                  class="px-2 py-0.5 rounded-full text-xs font-medium"
                >
                  {{ record.type === "PRODUCTION" ? "工序" : "杂费" }}
                </span>
                <span class="text-sm">{{ record.description }}</span>
                <span v-if="record.productName" class="text-xs text-slate-400">
                  {{ record.productCode }} {{ record.productName }}
                </span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-xs text-slate-400">{{ record.date }}</span>
                <span class="font-medium text-sm">¥{{ record.amount }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-if="groups.length === 0" class="text-center py-12 text-slate-400">
      暂无数据
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth" as any] });

const startDate = ref("");
const endDate = ref("");
const groupBy = ref("worker");

const groups = ref<any[]>([]);
const summary = ref({
  totalAmount: 0,
  productionTotal: 0,
  miscTotal: 0,
  totalCount: 0,
  groupCount: 0,
});
const expandedKeys = ref(new Set<string>());

/**
 * 按员工分组（用于订单分组下的二级展开）
 */
const getWorkerGroups = (records: any[]) => {
  const workerMap = new Map<string, any>();

  for (const record of records) {
    const key = record.workerId || record.workerName || "unassigned";
    if (!workerMap.has(key)) {
      workerMap.set(key, {
        workerKey: key,
        workerId: record.workerId,
        workerName: record.workerName || "未指定",
        workerCode: record.workerCode,
        totalAmount: 0,
        productionTotal: 0,
        miscTotal: 0,
        records: [],
      });
    }
    const wg = workerMap.get(key)!;
    wg.totalAmount += record.amount;
    if (record.type === "PRODUCTION") {
      wg.productionTotal += record.amount;
    } else {
      wg.miscTotal += record.amount;
    }
    wg.records.push(record);
  }

  return [...workerMap.values()];
};

const loadSummary = async () => {
  try {
    const res: any = await $fetch("/api/wage-summary", {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
        groupBy: groupBy.value,
      },
    });

    groups.value = res.data || [];
    if (res.summary) {
      summary.value = res.summary;
    }
    // 清空展开状态
    expandedKeys.value = new Set();
  } catch (e: any) {
    console.error("加载工资汇总失败:", e);
  }
};

const toggleDetail = (key: string) => {
  const newSet = new Set(expandedKeys.value);
  if (newSet.has(key)) {
    newSet.delete(key);
  } else {
    newSet.add(key);
  }
  expandedKeys.value = newSet;
};

const clearFilters = () => {
  startDate.value = "";
  endDate.value = "";
  groupBy.value = "worker";
  loadSummary();
};

onMounted(() => {
  loadSummary();
});
</script>
