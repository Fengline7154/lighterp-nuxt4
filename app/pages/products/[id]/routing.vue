<!-- pages/products/[id]/routing.vue -->
<template>
  <div>
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink :to="backRoute" class="text-slate-500 hover:text-slate-700"
        >&larr; 返回</NuxtLink
      >
      <h1 class="text-xl lg:text-2xl font-bold">工序配置</h1>
    </div>

    <div v-if="product" class="bg-white rounded-xl shadow p-4 lg:p-6 mb-6">
      <div class="flex items-center gap-3 mb-4">
        <span class="font-mono text-sm text-slate-500">{{ product.code }}</span>
        <span class="font-semibold text-lg">{{ product.name }}</span>
      </div>

      <!-- 桌面端表格 -->
      <div class="hidden md:block overflow-x-auto mb-4">
        <table class="w-full min-w-[700px]">
          <thead>
            <tr class="border-b bg-slate-100">
              <th
                class="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase w-[8%]"
              >
                顺序
              </th>
              <th
                class="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase"
              >
                工序名称
              </th>
              <th
                class="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase w-[10%]"
              >
                类型
              </th>
              <th
                class="text-right py-3 px-3 text-xs font-medium text-slate-500 uppercase w-[14%]"
              >
                工时/单价
              </th>
              <th
                class="text-right py-3 px-3 text-xs font-medium text-slate-500 uppercase w-[14%]"
              >
                工资率
              </th>
              <th class="w-10"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="(_, i) in templates"
              :key="i"
              class="even:bg-slate-50/50"
            >
              <td class="py-2 px-3">
                <input
                  v-model.number="itemAt(i).sequence"
                  type="number"
                  min="1"
                  class="w-full border border-slate-200 rounded px-2 py-1.5 text-xs text-center"
                />
              </td>
              <td class="py-2 px-3">
                <button
                  @click="openProcessPicker(i)"
                  class="w-full min-h-[36px] text-left border border-slate-200 rounded px-3 py-1.5 text-xs hover:border-blue-400 transition"
                  :class="
                    itemAt(i).processId ? 'text-slate-900' : 'text-slate-400'
                  "
                >
                  {{ itemAt(i).processName || "选择工序" }}
                </button>
              </td>
              <td class="py-2 px-3">
                <select
                  v-model="itemAt(i).wageType"
                  class="w-full min-h-[36px] border border-slate-200 rounded px-2 py-1.5 text-xs bg-white"
                >
                  <option value="HOURLY">计时</option>
                  <option value="PIECE">计件</option>
                </select>
              </td>
              <td class="py-2 px-3">
                <input
                  v-if="itemAt(i).wageType === 'HOURLY'"
                  v-model.number="itemAt(i).standardHours"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full border border-slate-200 rounded px-2 py-1.5 text-xs text-right"
                  placeholder="标准工时"
                />
                <input
                  v-else
                  v-model.number="itemAt(i).unitPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full border border-slate-200 rounded px-2 py-1.5 text-xs text-right"
                  placeholder="计件单价"
                />
              </td>
              <td class="py-2 px-3">
                <input
                  v-if="itemAt(i).wageType === 'HOURLY'"
                  v-model.number="itemAt(i).hourlyRate"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full border border-slate-200 rounded px-2 py-1.5 text-xs text-right"
                  placeholder="工资率(元/时)"
                />
                <span v-else class="text-xs text-slate-300 block text-center"
                  >-</span
                >
              </td>
              <td class="py-2 pr-3 text-center">
                <button
                  @click="templates.splice(i, 1)"
                  class="text-red-400 hover:text-red-600 text-lg min-h-[36px] min-w-[36px]"
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
          v-for="(_, i) in templates"
          :key="i"
          class="bg-slate-50 rounded-xl p-4 border space-y-2"
        >
          <div class="flex items-center justify-between">
            <button
              @click="openProcessPicker(i)"
              class="text-sm font-medium border-b border-dashed border-blue-300 text-blue-600 min-h-[36px]"
            >
              {{ itemAt(i).processName || "选择工序" }}
            </button>
            <button
              @click="templates.splice(i, 1)"
              class="text-red-400 hover:text-red-600 text-xl min-h-[36px] min-w-[36px]"
            >
              &times;
            </button>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-xs text-slate-400">顺序</label
              ><input
                v-model.number="itemAt(i).sequence"
                type="number"
                min="1"
                class="w-full border rounded px-3 py-2 text-sm text-center"
              />
            </div>
            <div>
              <label class="text-xs text-slate-400">类型</label>
              <select
                v-model="itemAt(i).wageType"
                class="w-full min-h-[44px] border rounded px-3 py-2 text-sm bg-white"
              >
                <option value="HOURLY">计时</option>
                <option value="PIECE">计件</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div v-if="itemAt(i).wageType === 'HOURLY'">
              <label class="text-xs text-slate-400">标准工时</label
              ><input
                v-model.number="itemAt(i).standardHours"
                type="number"
                min="0"
                step="0.01"
                class="w-full border rounded px-3 py-2 text-sm text-right"
              />
            </div>
            <div v-else>
              <label class="text-xs text-slate-400">计件单价</label
              ><input
                v-model.number="itemAt(i).unitPrice"
                type="number"
                min="0"
                step="0.01"
                class="w-full border rounded px-3 py-2 text-sm text-right"
              />
            </div>
            <div v-if="itemAt(i).wageType === 'HOURLY'">
              <label class="text-xs text-slate-400">工资率(元/时)</label
              ><input
                v-model.number="itemAt(i).hourlyRate"
                type="number"
                min="0"
                step="0.01"
                class="w-full border rounded px-3 py-2 text-sm text-right"
              />
            </div>
          </div>
        </div>
      </div>

      <button
        @click="addRow"
        class="min-h-[44px] w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
      >
        + 添加工序行
      </button>

      <div class="mt-6 flex gap-2">
        <button
          @click="handleSave"
          class="flex-1 min-h-[48px] bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition font-medium text-sm"
        >
          保存模板
        </button>
        <NuxtLink
          :to="backRoute"
          class="flex-1 min-h-[48px] border py-3 rounded-lg hover:bg-slate-50 transition text-sm text-center"
          >返回</NuxtLink
        >
      </div>
    </div>

    <!-- 工序选择弹窗 -->
    <div
      v-if="showProcessPicker !== null"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showProcessPicker = null"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col"
      >
        <h2 class="text-lg font-bold mb-4">选择工序</h2>
        <div class="flex gap-2 mb-4">
          <input
            v-model="processSearch"
            placeholder="搜索工序..."
            class="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            @click="
              newProcessName = '';
              showNewProcessInput = true;
            "
            class="min-h-[44px] px-3 text-sm text-slate-500 border rounded-lg hover:bg-slate-50"
          >
            新建
          </button>
        </div>
        <div v-if="showNewProcessInput" class="mb-4 flex gap-2">
          <input
            v-model="newProcessName"
            placeholder="输入新工序名称"
            class="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-sm min-h-[44px]"
          />
          <button
            @click="createAndSelectProcess"
            class="min-h-[44px] px-3 bg-blue-500 text-white rounded-lg text-sm"
          >
            确认
          </button>
        </div>
        <div class="flex-1 overflow-y-auto space-y-1">
          <button
            v-for="p in filteredProcesses"
            :key="p.id"
            @click="selectProcess(showProcessPicker, p)"
            class="w-full text-left px-4 py-3 rounded-lg text-sm hover:bg-blue-50 transition border border-transparent"
          >
            {{ p.name }}
          </button>
          <p
            v-if="filteredProcesses.length === 0 && !showNewProcessInput"
            class="text-center text-slate-400 py-4"
          >
            无匹配工序，点击"新建"创建
          </p>
        </div>
        <button
          @click="
            showProcessPicker = null;
            showNewProcessInput = false;
          "
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
const route = useRoute();

const backRoute = computed(() => {
  if (route.query.from === "order" && route.query.orderId)
    return `/orders/${route.query.orderId}`;
  return "/processes";
});

const { data: productData } = await useFetch(
  `/api/products/${route.params.id}`,
);
const product = computed(
  () => (productData.value as any)?.data || productData.value,
);

const { data: templatesData } = await useFetch(
  `/api/routings?productId=${route.params.id}`,
);
const templates = reactive<any[]>([]);

watch(
  templatesData,
  (val) => {
    templates.length = 0;
    const items = (val as any)?.data || [];
    items.forEach((t: any) =>
      templates.push({
        ...t,
        processId: t.processId || null,
        processName: t.processName,
        sequence: t.sequence,
        wageType: t.wageType || "HOURLY",
        standardHours: Number(t.standardHours) || 0,
        hourlyRate: Number(t.hourlyRate) || 0,
        unitPrice: Number(t.unitPrice) || 0,
      }),
    );
  },
  { immediate: true },
);

function itemAt(i: number) {
  return templates[i]!;
}

const addRow = () =>
  templates.push({
    processId: null,
    processName: "",
    sequence: templates.length + 1,
    wageType: "HOURLY",
    standardHours: 0,
    hourlyRate: 0,
    unitPrice: 0,
  });

const showProcessPicker = ref<number | null>(null);
const processSearch = ref("");
const showNewProcessInput = ref(false);
const newProcessName = ref("");
const standardProcesses = ref<any[]>([]);

const loadProcesses = async () => {
  try {
    const data = await apiFetch<any>("/api/processes");
    standardProcesses.value = data.data || [];
  } catch {
    standardProcesses.value = [];
  }
};
loadProcesses();

const filteredProcesses = computed(() => {
  if (!processSearch.value.trim()) return standardProcesses.value;
  const q = processSearch.value.toLowerCase();
  return standardProcesses.value.filter((p: any) =>
    p.name.toLowerCase().includes(q),
  );
});

const openProcessPicker = (i: number) => {
  showProcessPicker.value = i;
  processSearch.value = "";
  showNewProcessInput.value = false;
};
const selectProcess = (i: number, p: any) => {
  templates[i].processId = p.id;
  templates[i].processName = p.name;
  showProcessPicker.value = null;
  showNewProcessInput.value = false;
};

const createAndSelectProcess = async () => {
  if (!newProcessName.value.trim()) return toast.error("请输入工序名称");
  try {
    const res = await apiFetch<any>("/api/processes", {
      method: "POST",
      body: { name: newProcessName.value.trim() },
    });
    const newProcess = res.data || res;
    standardProcesses.value.push(newProcess);
    templates[showProcessPicker.value!].processId = newProcess.id;
    templates[showProcessPicker.value!].processName = newProcess.name;
    showProcessPicker.value = null;
    showNewProcessInput.value = false;
    toast.success("工序已创建");
  } catch (e: any) {
    toast.error(e, "创建失败");
  }
};

const handleSave = async () => {
  const valid = templates.filter((t) => t.processName.trim());
  if (valid.length === 0) return toast.error("请至少配置一个工序");
  try {
    await apiFetch(`/api/routings`, {
      method: "POST",
      body: {
        productId: route.params.id,
        processes: valid.map((t, i) => ({
          processId: t.processId || undefined,
          processName: t.processName,
          sequence: t.sequence || i + 1,
          wageType: t.wageType,
          standardHours:
            t.wageType === "HOURLY" ? t.standardHours || undefined : undefined,
          hourlyRate:
            t.wageType === "HOURLY" ? t.hourlyRate || undefined : undefined,
          unitPrice:
            t.wageType === "PIECE" ? t.unitPrice || undefined : undefined,
        })),
      },
    });
    toast.success("模板保存成功");
    await navigateTo("/processes");
  } catch (e: any) {
    toast.error(e, "保存失败");
  }
};
</script>
