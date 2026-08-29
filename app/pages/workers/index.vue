<template>
  <div>
    <div class="flex justify-between items-center mb-6 flex-wrap gap-2">
      <h1 class="text-xl lg:text-2xl font-bold">员工管理</h1>
      <div class="flex gap-2">
        <button
          @click="openCreateModal"
          class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
        >
          + 新增员工
        </button>
        <button
          @click="showBatchModal = true"
          class="min-h-[44px] px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition text-sm"
        >
          批量导入
        </button>
      </div>
    </div>

    <div class="flex flex-wrap gap-3 mb-4">
      <input
        v-model="keyword"
        @keydown.enter="doSearch"
        placeholder="搜索姓名/电话..."
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition w-full sm:w-56"
      />
      <button
        @click="doSearch"
        class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
      >
        搜索
      </button>
      <select
        v-model="statusFilter"
        @change="page = 1"
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
      >
        <option value="">全部</option>
        <option value="ACTIVE">在职</option>
        <option value="INACTIVE">离职</option>
      </select>
    </div>

    <!-- 桌面端表格 -->
    <div class="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full min-w-[900px] whitespace-nowrap">
        <thead>
          <tr class="border-b bg-slate-100">
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              姓名
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              电话
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              部门
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              岗位
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              入职日期
            </th>
            <th
              class="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              计时(元/时)
            </th>
            <th
              class="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              计件(元/件)
            </th>
            <th
              class="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              状态
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
            v-for="w in workers"
            :key="w.id"
            class="hover:bg-blue-50/30 odd:bg-white even:bg-slate-50 transition"
          >
            <td class="px-4 py-3 text-sm font-medium">{{ w.name }}</td>
            <td class="px-4 py-3 text-sm text-slate-500">
              {{ w.phone || "-" }}
            </td>
            <td class="px-4 py-3 text-sm text-slate-500">
              {{ w.department || "-" }}
            </td>
            <td class="px-4 py-3 text-sm text-slate-500">
              {{ w.position || "-" }}
            </td>
            <td class="px-4 py-3 text-sm text-slate-500">
              {{
                w.entryDate
                  ? new Date(w.entryDate).toLocaleDateString("zh-CN")
                  : "-"
              }}
            </td>
            <td class="px-4 py-3 text-sm text-right">
              {{ w.hourlyRate ? `¥${w.hourlyRate}` : "-" }}
            </td>
            <td class="px-4 py-3 text-sm text-right">
              {{ w.unitPrice ? `¥${w.unitPrice}` : "-" }}
            </td>
            <td class="px-4 py-3 text-sm text-center">
              <span
                :class="statusBadge(w.status)"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
                >{{ statusIcon(w.status) }}
                {{ w.status === "ACTIVE" ? "在职" : "离职" }}</span
              >
            </td>
            <td class="px-4 py-3 text-sm text-center space-x-2">
              <button
                @click="openEditModal(w)"
                class="text-blue-600 hover:text-blue-800 text-sm min-h-[36px]"
              >
                编辑
              </button>
              <button
                @click="toggleStatus(w)"
                class="text-sm font-medium min-h-[36px]"
                :class="
                  w.status === 'ACTIVE'
                    ? 'text-red-500 hover:text-red-700'
                    : 'text-green-500 hover:text-green-700'
                "
              >
                {{ w.status === "ACTIVE" ? "离职" : "入职" }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 移动端卡片 -->
    <div class="md:hidden space-y-3">
      <div
        v-for="w in workers"
        :key="w.id"
        class="bg-white rounded-xl shadow p-4 space-y-2"
      >
        <div class="flex items-center justify-between">
          <span
            :class="statusBadge(w.status)"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
            >{{ statusIcon(w.status) }}
            {{ w.status === "ACTIVE" ? "在职" : "离职" }}</span
          >
          <span class="text-xs text-slate-400">{{
            w.entryDate
              ? new Date(w.entryDate).toLocaleDateString("zh-CN")
              : "-"
          }}</span>
        </div>
        <div class="text-sm font-medium">{{ w.name }}</div>
        <div class="flex items-center gap-3 text-xs text-slate-500">
          <span>{{ w.department || "-" }}</span>
          <span>{{ w.position || "-" }}</span>
        </div>
        <div class="flex justify-between text-xs text-slate-500">
          <span>{{ w.phone || "-" }}</span>
          <span
            >计时:{{ w.hourlyRate ? `¥${w.hourlyRate}` : "-" }} 计件:{{
              w.unitPrice ? `¥${w.unitPrice}` : "-"
            }}</span
          >
        </div>
        <div class="flex gap-3 pt-2 border-t">
          <button @click="openEditModal(w)" class="text-blue-600 text-sm">
            编辑
          </button>
          <button
            @click="toggleStatus(w)"
            class="text-sm"
            :class="w.status === 'ACTIVE' ? 'text-red-500' : 'text-green-500'"
          >
            {{ w.status === "ACTIVE" ? "离职" : "入职" }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="workers.length === 0" class="text-center py-12 text-slate-400">
      暂无员工数据
    </div>

    <div class="flex justify-between items-center mt-4">
      <button
        :disabled="page <= 1"
        @click="page--"
        class="min-h-[44px] min-w-[44px] px-4 py-2 text-sm border rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center"
      >
        上一页
      </button>
      <span class="text-sm text-slate-500"
        >第 {{ page }} / {{ totalPages }} 页</span
      >
      <button
        :disabled="page >= totalPages"
        @click="page++"
        class="min-h-[44px] min-w-[44px] px-4 py-2 text-sm border rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center"
      >
        下一页
      </button>
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
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[85vh] overflow-auto"
      >
        <h2 class="text-lg font-bold mb-4">
          {{ isEditing ? "编辑员工" : "新增员工" }}
        </h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >姓名 *</label
            ><input
              v-model="form.name"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >电话</label
              ><input
                v-model="form.phone"
                class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >身份证号</label
              ><input
                v-model="form.idCard"
                class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >部门</label
              ><input
                v-model="form.department"
                class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >岗位</label
              ><input
                v-model="form.position"
                class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >入职日期</label
            ><input
              v-model="form.entryDate"
              type="date"
              max="9999-12-30"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >紧急联系人</label
              ><input
                v-model="form.emergencyContact"
                class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >联系电话</label
              ><input
                v-model="form.emergencyPhone"
                class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >计时工资率(元/时)</label
              ><input
                v-model.number="form.hourlyRate"
                type="number"
                step="0.01"
                min="0"
                class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >计件单价(元)</label
              ><input
                v-model.number="form.unitPrice"
                type="number"
                step="0.01"
                min="0"
                class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >备注</label
            ><textarea
              v-model="form.remark"
              rows="2"
              class="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            ></textarea>
          </div>
          <div v-if="isEditing">
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >状态</label
            >
            <select
              v-model="form.status"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            >
              <option value="ACTIVE">在职</option>
              <option value="INACTIVE">离职</option>
            </select>
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

    <!-- 批量导入弹窗 -->
    <div
      v-if="showBatchModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showBatchModal = false"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-4 lg:p-6 w-full max-w-7xl max-h-[90vh] overflow-auto"
      >
        <h2 class="text-lg font-bold mb-4">批量导入员工</h2>
        <!-- 桌面端批量表格 -->
        <div class="hidden md:block overflow-x-auto mb-4">
          <table class="w-full text-sm min-w-[1100px]">
            <thead>
              <tr
                class="border-b bg-slate-100 text-left text-xs text-slate-500"
              >
                <th class="py-2 px-2 w-24">姓名 *</th>
                <th class="py-2 px-2 w-32">电话</th>
                <th class="py-2 px-2 w-40">身份证号</th>
                <th class="py-2 px-2 w-24">部门</th>
                <th class="py-2 px-2 w-24">岗位</th>
                <th class="py-2 px-2 w-28">入职日期</th>
                <th class="py-2 px-2 w-24 text-right">计时(元/时)</th>
                <th class="py-2 px-2 w-24 text-right">计件(元/件)</th>
                <th class="py-2 px-2 w-28">备注</th>
                <th class="w-10"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(_, i) in batchItems"
                :key="i"
                class="border-b even:bg-slate-50/50"
              >
                <td class="py-1.5 px-2">
                  <input
                    v-model="itemAt(i).name"
                    class="w-full min-h-[36px] border rounded px-2 py-1.5 text-sm"
                    placeholder="姓名"
                  />
                </td>
                <td class="py-1.5 px-2">
                  <input
                    v-model="itemAt(i).phone"
                    class="w-full min-h-[36px] border rounded px-2 py-1.5 text-sm"
                  />
                </td>
                <td class="py-1.5 px-2">
                  <input
                    v-model="itemAt(i).idCard"
                    class="w-full min-h-[36px] border rounded px-2 py-1.5 text-sm"
                  />
                </td>
                <td class="py-1.5 px-2">
                  <input
                    v-model="itemAt(i).department"
                    class="w-full min-h-[36px] border rounded px-2 py-1.5 text-sm"
                  />
                </td>
                <td class="py-1.5 px-2">
                  <input
                    v-model="itemAt(i).position"
                    class="w-full min-h-[36px] border rounded px-2 py-1.5 text-sm"
                  />
                </td>
                <td class="py-1.5 px-2">
                  <input
                    v-model="itemAt(i).entryDate"
                    type="date"
                    max="9999-12-30"
                    class="w-full min-h-[36px] border rounded px-2 py-1.5 text-sm"
                  />
                </td>
                <td class="py-1.5 px-2">
                  <input
                    v-model.number="itemAt(i).hourlyRate"
                    type="number"
                    step="0.01"
                    min="0"
                    class="w-full min-h-[36px] border rounded px-2 py-1.5 text-sm text-right"
                  />
                </td>
                <td class="py-1.5 px-2">
                  <input
                    v-model.number="itemAt(i).unitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    class="w-full min-h-[36px] border rounded px-2 py-1.5 text-sm text-right"
                  />
                </td>
                <td class="py-1.5 px-2">
                  <input
                    v-model="itemAt(i).remark"
                    class="w-full min-h-[36px] border rounded px-2 py-1.5 text-sm"
                  />
                </td>
                <td class="py-1.5 text-center">
                  <button
                    @click="batchItems.splice(i, 1)"
                    class="text-red-400 hover:text-red-600 min-h-[36px] min-w-[36px]"
                  >
                    &times;
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- 移动端批量卡片 -->
        <div class="md:hidden space-y-3 mb-4">
          <div
            v-for="(_, i) in batchItems"
            :key="i"
            class="bg-slate-50 rounded-xl p-4 border space-y-2"
          >
            <div class="flex justify-between">
              <span class="text-sm font-medium">员工 {{ i + 1 }}</span
              ><button
                @click="batchItems.splice(i, 1)"
                class="text-red-400 hover:text-red-600 text-xl min-h-[36px] min-w-[36px]"
              >
                &times;
              </button>
            </div>
            <input
              v-model="itemAt(i).name"
              class="w-full border rounded px-3 py-2 text-sm"
              placeholder="姓名 *"
            />
            <div class="grid grid-cols-2 gap-2">
              <input
                v-model="itemAt(i).phone"
                class="w-full border rounded px-3 py-2 text-sm"
                placeholder="电话"
              />
              <input
                v-model="itemAt(i).idCard"
                class="w-full border rounded px-3 py-2 text-sm"
                placeholder="身份证号"
              />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <input
                v-model="itemAt(i).department"
                class="w-full border rounded px-3 py-2 text-sm"
                placeholder="部门"
              />
              <input
                v-model="itemAt(i).position"
                class="w-full border rounded px-3 py-2 text-sm"
                placeholder="岗位"
              />
            </div>
            <input
              v-model="itemAt(i).entryDate"
              type="date"
              max="9999-12-30"
              class="w-full border rounded px-3 py-2 text-sm"
            />
            <div class="grid grid-cols-2 gap-2">
              <input
                v-model.number="itemAt(i).hourlyRate"
                type="number"
                step="0.01"
                min="0"
                class="w-full border rounded px-3 py-2 text-sm text-right"
                placeholder="计时(元/时)"
              />
              <input
                v-model.number="itemAt(i).unitPrice"
                type="number"
                step="0.01"
                min="0"
                class="w-full border rounded px-3 py-2 text-sm text-right"
                placeholder="计件(元/件)"
              />
            </div>
          </div>
        </div>
        <button
          @click="
            batchItems.push({
              name: '',
              phone: '',
              idCard: '',
              department: '',
              position: '',
              entryDate: '',
              emergencyContact: '',
              emergencyPhone: '',
              hourlyRate: 0,
              unitPrice: 0,
              remark: '',
            })
          "
          class="min-h-[44px] w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
        >
          + 添加行
        </button>
        <div class="flex gap-2 mt-4">
          <button
            @click="handleBatchCreate"
            :disabled="batchSubmitting"
            class="flex-1 min-h-[44px] bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm"
          >
            {{ batchSubmitting ? "提交中..." : "确认导入" }}
          </button>
          <button
            @click="showBatchModal = false"
            class="flex-1 min-h-[44px] border py-2 rounded-lg text-sm"
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

const page = ref(1);
const limit = 20;
const keyword = ref("");
const statusFilter = ref("");
const searchKeyword = ref("");
const doSearch = () => {
  searchKeyword.value = keyword.value;
  page.value = 1;
};

const queryParams = computed(() => ({
  page: page.value,
  limit,
  keyword: searchKeyword.value,
  status: statusFilter.value,
}));
watch(keyword, (val) => {
  if (!val.trim()) {
    searchKeyword.value = "";
    page.value = 1;
  }
});
const { data, refresh } = await useFetch("/api/workers", {
  query: queryParams,
  watch: [queryParams],
});
const workers = computed(() => (data.value as any)?.data || []);
const totalPages = computed(() => (data.value as any)?.totalPages || 1);

const showFormModal = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);
const form = reactive({
  name: "",
  phone: "",
  idCard: "",
  department: "",
  position: "",
  entryDate: "",
  emergencyContact: "",
  emergencyPhone: "",
  hourlyRate: 0,
  unitPrice: 0,
  remark: "",
  status: "ACTIVE" as "ACTIVE" | "INACTIVE",
});

const showBatchModal = ref(false);
const batchSubmitting = ref(false);

type BatchItem = {
  name: string;
  phone: string;
  idCard: string;
  department: string;
  position: string;
  entryDate: string;
  emergencyContact: string;
  emergencyPhone: string;
  hourlyRate: number;
  unitPrice: number;
  remark: string;
};
const batchItems = reactive<BatchItem[]>([
  {
    name: "",
    phone: "",
    idCard: "",
    department: "",
    position: "",
    entryDate: "",
    emergencyContact: "",
    emergencyPhone: "",
    hourlyRate: 0,
    unitPrice: 0,
    remark: "",
  },
]);
function itemAt(i: number): BatchItem {
  return batchItems[i]!;
}

const toggleStatus = async (w: any) => {
  const newStatus = w.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  try {
    if (newStatus === "INACTIVE")
      await apiFetch(`/api/workers/${w.id}`, { method: "DELETE" });
    else
      await apiFetch(`/api/workers/${w.id}`, {
        method: "PATCH",
        body: { status: "ACTIVE" },
      });
    toast.success(newStatus === "ACTIVE" ? "已恢复在职" : "已标记离职");
    await refresh();
  } catch (e: any) {
    toast.error(e, "操作失败");
  }
};

const openCreateModal = () => {
  isEditing.value = false;
  editingId.value = null;
  Object.assign(form, {
    name: "",
    phone: "",
    idCard: "",
    department: "",
    position: "",
    entryDate: "",
    emergencyContact: "",
    emergencyPhone: "",
    hourlyRate: 0,
    unitPrice: 0,
    remark: "",
    status: "ACTIVE",
  });
  showFormModal.value = true;
};
const openEditModal = (w: any) => {
  isEditing.value = true;
  editingId.value = w.id;
  Object.assign(form, {
    name: w.name || "",
    phone: w.phone || "",
    idCard: w.idCard || "",
    department: w.department || "",
    position: w.position || "",
    entryDate: w.entryDate
      ? new Date(w.entryDate).toISOString().split("T")[0] || ""
      : "",
    emergencyContact: w.emergencyContact || "",
    emergencyPhone: w.emergencyPhone || "",
    hourlyRate: Number(w.hourlyRate) || 0,
    unitPrice: Number(w.unitPrice) || 0,
    remark: w.remark || "",
    status: w.status || "ACTIVE",
  });
  showFormModal.value = true;
};

const handleSubmit = async () => {
  if (!form.name.trim()) return toast.error("姓名不能为空");
  try {
    const body: any = {
      name: form.name.trim(),
      phone: form.phone || undefined,
      idCard: form.idCard || undefined,
      department: form.department || undefined,
      position: form.position || undefined,
      entryDate: form.entryDate
        ? new Date(form.entryDate).toISOString()
        : undefined,
      emergencyContact: form.emergencyContact || undefined,
      emergencyPhone: form.emergencyPhone || undefined,
      hourlyRate: form.hourlyRate || undefined,
      unitPrice: form.unitPrice || undefined,
      remark: form.remark || undefined,
    };
    if (isEditing.value) {
      body.status = form.status;
      await apiFetch(`/api/workers/${editingId.value}`, {
        method: "PATCH",
        body,
      });
      toast.success("修改成功");
    } else {
      await apiFetch("/api/workers", { method: "POST", body });
      toast.success("创建成功");
    }
    showFormModal.value = false;
    await refresh();
  } catch (e: any) {
    toast.error(e, "操作失败");
  }
};

const handleBatchCreate = async () => {
  const valid = batchItems.filter((i) => i.name.trim());
  if (!valid.length) return toast.error("请至少填写一个姓名");
  batchSubmitting.value = true;
  try {
    await apiFetch("/api/workers/batch", {
      method: "POST",
      body: {
        workers: valid.map((i) => ({
          name: i.name.trim(),
          phone: i.phone || undefined,
          idCard: i.idCard || undefined,
          department: i.department || undefined,
          position: i.position || undefined,
          entryDate: i.entryDate
            ? new Date(i.entryDate).toISOString()
            : undefined,
          hourlyRate: i.hourlyRate || undefined,
          unitPrice: i.unitPrice || undefined,
          remark: i.remark || undefined,
        })),
      },
    });
    toast.success(`成功导入 ${valid.length} 名员工`);
    showBatchModal.value = false;
    batchItems.length = 1;
    batchItems[0] = {
      name: "",
      phone: "",
      idCard: "",
      department: "",
      position: "",
      entryDate: "",
      emergencyContact: "",
      emergencyPhone: "",
      hourlyRate: 0,
      unitPrice: 0,
      remark: "",
    };
    await refresh();
  } catch (e: any) {
    toast.error(e, "导入失败");
  } finally {
    batchSubmitting.value = false;
  }
};

const statusIcon = (s: string) => (s === "ACTIVE" ? "✅" : "🚫");
const statusBadge = (s: string) =>
  s === "ACTIVE"
    ? "bg-green-100 text-green-800 border-green-300"
    : "bg-red-100 text-red-800 border-red-300";
</script>
