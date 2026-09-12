<template>
  <div>
    <h1 class="text-xl lg:text-2xl font-bold mb-6">操作日志</h1>

    <!-- 筛选区 -->
    <div class="flex flex-wrap gap-3 mb-4">
      <select
        v-model="entityFilter"
        @change="page = 1"
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
      >
        <option value="">全部模块</option>
        <option value="User">用户管理</option>
        <option value="Product">产品管理</option>
        <option value="PurchaseOrder">采购管理</option>
        <option value="Order">订单管理</option>
        <option value="Bom">BOM管理</option>
        <option value="Customer">客户管理</option>
        <option value="Inventory">库存管理</option>
        <option value="Location">库位管理</option>
        <option value="Supplier">供应商管理</option>
        <option value="ProductionLog">报工管理</option>
        <option value="Worker">员工管理</option>
      </select>
      <select
        v-model="actionFilter"
        @change="page = 1"
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
      >
        <option value="">全部操作</option>
        <option value="CREATE">创建</option>
        <option value="UPDATE">更新</option>
        <option value="DELETE">删除</option>
        <option value="STATUS_CHANGE">状态变更</option>
        <option value="APPROVE">审批</option>
        <option value="OBSOLETE">废弃</option>
      </select>
      <input
        v-model="startDate"
        type="date"
        max="9999-12-30"
        @change="page = 1"
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
      />
      <span class="text-sm text-slate-500 self-center">至</span>
      <input
        v-model="endDate"
        type="date"
        max="9999-12-30"
        @change="page = 1"
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
      />
      <button
        @click="
          entityFilter = '';
          actionFilter = '';
          startDate = '';
          endDate = '';
          page = 1;
        "
        class="px-4 py-2 text-sm min-h-[44px] border border-slate-300 rounded-lg hover:bg-slate-50 transition"
      >
        清除筛选
      </button>
    </div>

    <!-- 桌面端：表格 -->
    <div class="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full min-w-[800px] whitespace-nowrap">
        <thead>
          <tr class="border-b bg-slate-100">
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              时间
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              模块
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              操作
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              业务编号
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              操作人
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              备注
            </th>
            <th
              class="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              详情
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr
            v-for="log in items"
            :key="log.id"
            class="hover:bg-blue-50/30 even:bg-slate-50/50 transition"
          >
            <td class="px-4 py-3 text-sm text-slate-600">
              {{ formatDate(log.createdAt) }}
            </td>
            <td class="px-4 py-3 text-sm font-medium">
              {{ entityLabel(log.entity) }}
            </td>
            <td class="px-4 py-3 text-sm">
              <span
                :class="actionBadge(log.action)"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
              >
                <span class="text-sm leading-none">{{
                  actionIcon(log.action)
                }}</span>
                {{ actionLabel(log.action) }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm font-mono text-slate-600">
              {{ log.entityCode || log.entityId?.substring(0, 12) + "..." }}
            </td>
            <td class="px-4 py-3 text-sm">{{ log.operatorBadge }}</td>
            <td class="px-4 py-3 text-sm text-slate-500 max-w-[180px] truncate">
              {{ log.remark || "-" }}
            </td>
            <td class="px-4 py-3 text-sm text-center">
              <button
                @click="openDetail(log)"
                class="text-blue-600 hover:text-blue-800 text-xs font-medium min-h-[36px] min-w-[48px]"
              >
                查看
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 移动端：卡片列表 -->
    <div class="md:hidden space-y-3">
      <div
        v-for="log in items"
        :key="log.id"
        class="bg-white rounded-xl shadow p-4 space-y-2"
      >
        <div class="flex items-center justify-between">
          <span
            :class="actionBadge(log.action)"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
          >
            <span class="text-sm leading-none">{{
              actionIcon(log.action)
            }}</span>
            {{ actionLabel(log.action) }}
          </span>
          <span class="text-xs text-slate-400">{{
            formatDate(log.createdAt)
          }}</span>
        </div>
        <div class="text-sm font-medium">{{ entityLabel(log.entity) }}</div>
        <div class="text-xs text-slate-500 font-mono">
          {{ log.entityCode || log.entityId?.substring(0, 16) + "..." }}
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-slate-600">操作人：{{ log.operatorBadge }}</span>
          <button
            @click="openDetail(log)"
            class="text-blue-600 hover:text-blue-800 text-xs font-medium min-h-[36px]"
          >
            详情
          </button>
        </div>
        <div v-if="log.remark" class="text-xs text-slate-400 truncate">
          {{ log.remark }}
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="items.length === 0" class="text-center py-12 text-slate-400">
      暂无操作记录
    </div>

    <!-- 分页 -->
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

    <!-- 详情弹窗 -->
    <div
      v-if="showDetailModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showDetailModal = false"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[85vh] overflow-auto"
      >
        <h2 class="text-lg font-bold mb-4">操作详情</h2>
        <dl class="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt class="text-xs text-slate-400 mb-0.5">时间</dt>
            <dd>{{ formatDate(detail?.createdAt) }}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-400 mb-0.5">模块</dt>
            <dd>{{ entityLabel(detail?.entity) }}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-400 mb-0.5">操作</dt>
            <dd>
              <span
                :class="actionBadge(detail?.action)"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
              >
                <span class="text-sm leading-none">{{
                  actionIcon(detail?.action)
                }}</span>
                {{ actionLabel(detail?.action) }}
              </span>
            </dd>
          </div>
          <div>
            <dt class="text-xs text-slate-400 mb-0.5">操作人</dt>
            <dd>{{ detail?.operatorBadge }}</dd>
          </div>
          <div class="lg:col-span-2">
            <dt class="text-xs text-slate-400 mb-0.5">业务编号</dt>
            <dd class="font-mono">{{ detail?.entityCode || "-" }}</dd>
          </div>
          <div class="lg:col-span-2">
            <dt class="text-xs text-slate-400 mb-0.5">实体 ID</dt>
            <dd class="font-mono text-xs break-all">{{ detail?.entityId }}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-400 mb-0.5">变更字段</dt>
            <dd>{{ fieldLabel(detail?.entity, detail?.field) || "-" }}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-400 mb-0.5">表字段名</dt>
            <dd class="font-mono text-xs">{{ detail?.field || "-" }}</dd>
          </div>
          <div class="lg:col-span-2">
            <dt class="text-xs text-slate-400 mb-0.5">旧值</dt>
            <dd
              class="bg-slate-50 rounded px-2 py-1 text-xs break-all font-mono"
            >
              {{ detail?.oldValue || "-" }}
            </dd>
          </div>
          <div class="lg:col-span-2">
            <dt class="text-xs text-slate-400 mb-0.5">新值</dt>
            <dd
              class="bg-slate-50 rounded px-2 py-1 text-xs break-all font-mono"
            >
              {{ detail?.newValue || "-" }}
            </dd>
          </div>
          <div class="lg:col-span-2">
            <dt class="text-xs text-slate-400 mb-0.5">备注</dt>
            <dd class="text-xs break-all">{{ detail?.remark || "-" }}</dd>
          </div>
        </dl>
        <button
          @click="showDetailModal = false"
          class="mt-6 w-full min-h-[44px] border py-2 rounded-lg hover:bg-slate-50 transition text-sm"
        >
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth" as any] });

const page = ref(1);
const limit = 20;
const entityFilter = ref("");
const actionFilter = ref("");
const startDate = ref("");
const endDate = ref("");
const showDetailModal = ref(false);
const detail = ref<any>(null);

const openDetail = (log: any) => {
  detail.value = log;
  showDetailModal.value = true;
};

const queryParams = computed(() => ({
  page: page.value,
  limit,
  entity: entityFilter.value,
  action: actionFilter.value,
  startDate: startDate.value,
  endDate: endDate.value,
}));

const { data } = await useFetch("/api/audit-logs", {
  query: queryParams,
  watch: [queryParams],
});

const items = computed(() => (data.value as any)?.data || []);
const totalPages = computed(() => (data.value as any)?.totalPages || 1);

const entityLabel = (e: string) =>
  ({
    User: "用户",
    Product: "产品",
    Order: "订单",
    Bom: "BOM",
    Customer: "客户",
    Inventory: "库存",
    Location: "库位",
    Supplier: "供应商",
    ProductionLog: "报工",
    Worker: "员工",
    PurchaseOrder: "采购",
    Process: "工序",
  })[e] || e;

const actionLabel = (a: string) =>
  ({
    CREATE: "创建",
    UPDATE: "更新",
    DELETE: "删除",
    STATUS_CHANGE: "状态变更",
    APPROVE: "审批通过",
    OBSOLETE: "废弃",
    START_PRODUCTION: "开始生产",
    SHIP: "发货",
    RECEIPT: "生产入库",
    SAMPLE_DONE: "打样完成",
    MARK_READY: "标记备齐",
    COMPLETE: "订单完成",
    CANCEL: "取消",
    STOCK_IN: "入库",
    STOCK_OUT: "出库",
    TRANSFER: "调拨",
    REVERSAL: "红冲",
    INIT: "初始化",
    RESERVE: "预留",
    RELEASE: "释放预留",
    ROUTING_SAVE: "保存工序模板",
    PUBLISH: "发布BOM",
    BOM_REPLACE: "BOM物料替换",
  })[a] || a;

const actionIcon = (a: string) =>
  ({
    CREATE: "➕",
    UPDATE: "✏️",
    DELETE: "🗑️",
    STATUS_CHANGE: "🔄",
    APPROVE: "✅",
    OBSOLETE: "📦",
  })[a] || "📋";

const actionBadge = (a: string) => {
  const map: Record<string, string> = {
    CREATE: "bg-green-100 text-green-800 border border-green-300",
    UPDATE: "bg-blue-100 text-blue-800 border border-blue-300",
    DELETE: "bg-red-100 text-red-800 border border-red-300",
    STATUS_CHANGE: "bg-amber-100 text-amber-800 border border-amber-300",
    APPROVE: "bg-teal-100 text-teal-800 border border-teal-300",
    OBSOLETE: "bg-slate-100 text-slate-700 border border-slate-300",
  };
  return map[a] || "bg-slate-100 text-slate-600 border border-slate-300";
};

const fieldLabel = (entity: string, field: string) => {
  if (!field) return "-";
  const map: Record<string, Record<string, string>> = {
    User: {
      name: "姓名",
      email: "邮箱",
      phone: "手机号",
      department: "部门",
      status: "状态",
      role: "角色",
    },
    Product: {
      name: "名称",
      spec: "规格",
      unit: "单位",
      category: "分类",
      status: "状态",
      tags: "标签",
    },
    Customer: {
      name: "客户名称",
      contact: "联系人",
      phone: "电话",
      email: "邮箱",
      address: "地址",
      status: "状态",
    },
    Order: { status: "订单状态" },
    Bom: { status: "BOM状态" },
  };
  return map[entity]?.[field] || field;
};

const formatDate = (d: string) => new Date(d).toLocaleString("zh-CN");
</script>
