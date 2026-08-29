<!-- pages/production-logs/index.vue -->
<template>
  <div>
    <div class="flex justify-between items-center mb-6 flex-wrap gap-2">
      <h1 class="text-xl lg:text-2xl font-bold">报工记录</h1>
      <div class="flex gap-2">
        <button
          v-if="activeTab === 'production'"
          @click="showQuickReport = true"
          class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
        >
          + 工序报工
        </button>
        <button
          v-if="activeTab === 'misc'"
          @click="showMiscCostModal = true"
          class="min-h-[44px] px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm"
        >
          + 杂费报工
        </button>
      </div>
    </div>

    <!-- 标签栏 -->
    <div class="flex gap-2 mb-4">
      <button
        @click="
          activeTab = 'production';
          page = 1;
        "
        :class="[
          'min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition',
          activeTab === 'production'
            ? 'bg-blue-500 text-white'
            : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50',
        ]"
      >
        工序报工
      </button>
      <button
        @click="
          activeTab = 'misc';
          page = 1;
        "
        :class="[
          'min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition',
          activeTab === 'misc'
            ? 'bg-purple-500 text-white'
            : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50',
        ]"
      >
        杂费报工
      </button>
    </div>

    <!-- 筛选区 -->
    <div class="flex flex-wrap gap-3 mb-4">
      <input
        v-model="keyword"
        @keydown.enter="doSearch"
        :placeholder="
          activeTab === 'production'
            ? '搜索订单号/产品/操作工...'
            : '搜索费用说明/员工/订单...'
        "
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition w-full sm:w-64"
      />
      <button
        @click="doSearch"
        class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
      >
        搜索
      </button>
      <input
        v-model="startDate"
        max="9999-12-30"
        type="date"
        @change="page = 1"
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition"
      />
      <span class="text-sm text-slate-500 self-center">至</span>
      <input
        v-model="endDate"
        max="9999-12-30"
        type="date"
        @change="page = 1"
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition"
      />
      <button
        @click="clearFilters"
        class="min-h-[44px] px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition"
      >
        清除筛选
      </button>
    </div>

    <!-- ==================== 工序报工表格 ==================== -->
    <template v-if="activeTab === 'production'">
      <!-- 桌面端表格 -->
      <div class="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
        <table class="w-full min-w-[900px] whitespace-nowrap">
          <thead>
            <tr class="border-b bg-slate-100">
              <th
                class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                订单号
              </th>
              <th
                class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                工序
              </th>
              <th
                class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                产品
              </th>
              <th
                class="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                完成数
              </th>
              <th
                class="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                合格数
              </th>
              <th
                class="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                不良数
              </th>
              <th
                class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                操作工
              </th>
              <th
                class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                类型
              </th>
              <th
                class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                操作人
              </th>
              <th
                class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                时间
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
              v-for="log in logs"
              :key="log.id"
              class="hover:bg-blue-50/30 odd:bg-white even:bg-slate-50 transition cursor-pointer"
              @click="navigateTo(`/production-logs/${log.id}`)"
            >
              <td class="px-4 py-3 text-sm font-mono">
                {{ log.order?.orderCode || log.orderId }}
              </td>
              <td class="px-4 py-3 text-sm">{{ log.processName }}</td>
              <td class="px-4 py-3 text-sm">
                <span class="font-mono text-xs text-slate-400">{{
                  log.product?.code
                }}</span>
                <span class="ml-1">{{ log.product?.name || "-" }}</span>
              </td>
              <td class="px-4 py-3 text-sm text-right">
                {{ log.completedQty }}
              </td>
              <td class="px-4 py-3 text-sm text-right">
                {{ log.qualifiedQty }}
              </td>
              <td class="px-4 py-3 text-sm text-right">
                {{ log.defectiveQty }}
              </td>
              <td class="px-4 py-3 text-sm">
                {{ log.worker?.name || log.workerId }}
              </td>
              <td class="px-4 py-3 text-sm">
                {{ log.wageType === "HOURLY" ? "计时" : "计件" }}
              </td>
              <td class="px-4 py-3 text-sm">
                {{ log.operator?.badgeCode || log.operatorId
                }}{{ log.operator?.name || "-" }}
              </td>
              <td class="px-4 py-3 text-sm text-slate-500">
                {{ formatDate(log.createdAt) }}
              </td>
              <td class="px-4 py-3 text-center">
                <NuxtLink
                  :to="`/production-logs/${log.id}`"
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
                  @click.stop
                >
                  详情
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 移动端卡片 -->
      <div class="md:hidden space-y-3">
        <div
          v-for="log in logs"
          :key="log.id"
          class="bg-white rounded-xl shadow p-4 space-y-2"
          @click="navigateTo(`/production-logs/${log.id}`)"
        >
          <div class="flex justify-between items-center">
            <span class="font-mono text-sm">{{
              log.order?.orderCode || log.orderId
            }}</span>
            <span
              class="text-xs font-semibold"
              :class="
                log.wageType === 'HOURLY' ? 'text-blue-600' : 'text-purple-600'
              "
            >
              {{ log.wageType === "HOURLY" ? "计时" : "计件" }}
            </span>
          </div>
          <div class="text-sm font-medium">{{ log.processName }}</div>
          <div class="text-sm">{{ log.product?.name || "-" }}</div>
          <div class="grid grid-cols-3 gap-2 text-center text-sm">
            <div class="bg-slate-50 rounded-lg py-1.5">
              <span class="text-xs text-slate-400 block">完成</span>
              <span class="font-medium">{{ log.completedQty }}</span>
            </div>
            <div class="bg-green-50 rounded-lg py-1.5">
              <span class="text-xs text-green-500 block">合格</span>
              <span class="font-medium text-green-700">{{
                log.qualifiedQty
              }}</span>
            </div>
            <div
              class="bg-red-50 rounded-lg py-1.5"
              v-if="Number(log.defectiveQty) > 0"
            >
              <span class="text-xs text-red-400 block">不良</span>
              <span class="font-medium text-red-600">{{
                log.defectiveQty
              }}</span>
            </div>
            <div class="bg-slate-50 rounded-lg py-1.5" v-else>
              <span class="text-xs text-slate-400 block">不良</span>
              <span class="font-medium">0</span>
            </div>
          </div>
          <div class="flex justify-between items-center text-xs text-slate-500">
            <span>{{ log.worker?.name || log.workerId }}</span>
            <div class="flex items-center gap-2">
              <span>{{ formatDate(log.createdAt) }}</span>
              <NuxtLink
                :to="`/production-logs/${log.id}`"
                class="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg"
                @click.stop
              >
                详情
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <div v-if="logs.length === 0" class="text-center py-12 text-slate-400">
        暂无报工记录
      </div>
    </template>

    <!-- ==================== 杂费报工表格 ==================== -->
    <template v-else>
      <!-- 桌面端表格 -->
      <div class="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
        <table class="w-full min-w-[700px] whitespace-nowrap">
          <thead>
            <tr class="border-b bg-slate-100">
              <th
                class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                类型
              </th>
              <th
                class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                费用说明
              </th>
              <th
                class="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                金额
              </th>
              <th
                class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                关联订单
              </th>
              <th
                class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                员工
              </th>
              <th
                class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                状态
              </th>
              <th
                class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                时间
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
              v-for="cost in miscLogs"
              :key="cost.id"
              class="hover:bg-purple-50/30 odd:bg-white even:bg-slate-50 transition"
              :class="{ 'opacity-50': cost.status === 'VOIDED' }"
            >
              <td class="px-4 py-3 text-sm">
                <span
                  class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold"
                  :class="costTypeBadge(cost.costType)"
                >
                  {{ costTypeLabel(cost.costType) }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm">{{ cost.description }}</td>
              <td class="px-4 py-3 text-sm text-right font-medium">
                ¥{{ cost.amount }}
              </td>
              <td class="px-4 py-3 text-sm font-mono">
                {{ cost.order?.orderCode || "-" }}
              </td>
              <td class="px-4 py-3 text-sm">
                {{ cost.worker?.name || cost.workerName || "-" }}
              </td>
              <td class="px-4 py-3 text-sm">
                <span
                  :class="
                    cost.status === 'ACTIVE' ? 'text-green-600' : 'text-red-500'
                  "
                >
                  {{ cost.status === "ACTIVE" ? "有效" : "已作废" }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-slate-500">
                {{ formatDate(cost.createdAt) }}
              </td>
              <td class="px-4 py-3 text-center">
                <button
                  v-if="cost.status === 'ACTIVE'"
                  @click="handleVoidMiscCost(cost)"
                  class="inline-flex px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition"
                >
                  作废
                </button>
                <span v-else class="text-xs text-slate-400">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 移动端卡片 -->
      <div class="md:hidden space-y-3">
        <div
          v-for="cost in miscLogs"
          :key="cost.id"
          class="bg-white rounded-xl shadow p-4 space-y-2"
          :class="{ 'opacity-50': cost.status === 'VOIDED' }"
        >
          <div class="flex justify-between items-center">
            <span
              class="text-sm font-semibold"
              :class="costTypeBadge(cost.costType)"
            >
              {{ costTypeLabel(cost.costType) }}
            </span>
            <span class="text-sm font-bold text-purple-600"
              >¥{{ cost.amount }}</span
            >
          </div>
          <div class="text-sm">{{ cost.description }}</div>
          <div class="flex justify-between text-xs text-slate-500">
            <span>{{ cost.order?.orderCode || "未关联订单" }}</span>
            <span>{{ cost.worker?.name || cost.workerName || "未指定" }}</span>
          </div>
          <div class="flex justify-between items-center text-xs text-slate-500">
            <span>{{ formatDate(cost.createdAt) }}</span>
            <div class="flex items-center gap-2">
              <span
                :class="
                  cost.status === 'ACTIVE' ? 'text-green-600' : 'text-red-500'
                "
              >
                {{ cost.status === "ACTIVE" ? "有效" : "已作废" }}
              </span>
              <button
                v-if="cost.status === 'ACTIVE'"
                @click="handleVoidMiscCost(cost)"
                class="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg"
              >
                作废
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="miscLogs.length === 0"
        class="text-center py-12 text-slate-400"
      >
        暂无杂费记录
      </div>
    </template>

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

    <!-- 快速报工弹窗 -->
    <div
      v-if="showQuickReport"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showQuickReport = false"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-auto"
      >
        <h2 class="text-lg font-bold mb-4">快速报工</h2>

        <!-- 选订单 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >选择订单</label
          >
          <div class="flex gap-2">
            <input
              v-model="quickOrderSearch"
              @keydown.enter="searchOrders"
              placeholder="搜索订单号..."
              class="flex-1 min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
            <button
              @click="searchOrders"
              class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
            >
              搜索
            </button>
            <button
              @click="showOrderPicker = true"
              class="min-h-[44px] px-3 border border-slate-300 rounded-lg text-slate-500 hover:text-blue-500 hover:border-blue-400 transition text-sm"
            >
              浏览
            </button>
          </div>
          <!-- 搜索结果 -->
          <div
            v-if="searchedOrders.length > 0"
            class="mt-2 border rounded-lg max-h-[200px] overflow-y-auto"
          >
            <button
              v-for="o in searchedOrders"
              :key="o.id"
              @click="selectQuickOrder(o)"
              class="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 transition border-b last:border-0"
              :class="
                quickOrder?.id === o.id
                  ? 'bg-blue-50 border-blue-300'
                  : 'border-transparent'
              "
            >
              <span class="font-mono">{{ o.orderCode }}</span>
              <span class="text-slate-400 ml-2">{{
                o.customer?.name || "无客户"
              }}</span>
              <span
                :class="statusBadge(o.status)"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ml-2"
                >{{ statusLabel(o.status) }}</span
              >
            </button>
          </div>
          <p
            v-if="searched && searchedOrders.length === 0"
            class="text-sm text-slate-400 mt-2"
          >
            未找到匹配订单
          </p>
        </div>

        <!-- 订单浏览弹窗 -->
        <div
          v-if="showOrderPicker"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            class="absolute inset-0 bg-black/30"
            @click="showOrderPicker = false"
          />
          <div
            class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col"
          >
            <h2 class="text-lg font-bold mb-4">选择订单</h2>
            <input
              v-model="orderPickerSearch"
              placeholder="搜索订单号..."
              class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm mb-4 min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <div class="flex-1 overflow-y-auto space-y-1">
              <button
                v-for="o in orderPickerList"
                :key="o.id"
                @click="
                  selectQuickOrder(o);
                  showOrderPicker = false;
                "
                class="w-full text-left px-4 py-3 rounded-lg text-sm hover:bg-blue-50 transition flex justify-between items-center border border-transparent"
              >
                <span>
                  <span class="font-mono">{{ o.orderCode }}</span>
                  <span
                    :class="statusBadge(o.status)"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ml-2"
                    >{{ statusLabel(o.status) }}</span
                  >
                </span>
                <span class="text-xs text-slate-400">{{
                  o.customer?.name || "无客户"
                }}</span>
              </button>
              <p
                v-if="orderPickerList.length === 0"
                class="text-center text-slate-400 py-8"
              >
                无匹配订单
              </p>
            </div>
            <button
              @click="showOrderPicker = false"
              class="mt-4 w-full min-h-[44px] border py-2 rounded-lg hover:bg-slate-50 text-sm"
            >
              关闭
            </button>
          </div>
        </div>

        <!-- 报工表单（选订单后显示） -->
        <template v-if="quickOrder">
          <div
            v-if="quickPlans.length === 0"
            class="text-center py-8 text-slate-400"
          >
            该订单暂无未完成工序
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="(row, i) in quickRows"
              :key="i"
              class="border rounded-lg p-3 bg-slate-50"
            >
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium text-slate-600"
                  >报工行 {{ i + 1 }}</span
                >
                <button
                  @click="quickRows.splice(i, 1)"
                  class="text-red-400 hover:text-red-600 text-lg min-h-[36px] min-w-[36px]"
                >
                  &times;
                </button>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-slate-500 mb-1">工序</label>
                  <select
                    v-model="row.planId"
                    @change="onQuickPlanChange(i)"
                    class="w-full min-h-[44px] border rounded px-3 py-2 text-sm bg-white"
                  >
                    <option value="">选择工序</option>
                    <option
                      v-for="plan in quickPlans"
                      :key="plan.id"
                      :value="plan.id"
                    >
                      {{ plan.processName }}（{{
                        plan.product?.name || plan.orderItem?.productName
                      }}）
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs text-slate-500 mb-1"
                    >操作工</label
                  >
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
                  <label class="block text-xs text-slate-500 mb-1"
                    >本次完成</label
                  >
                  <input
                    v-model.number="row.completedQty"
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-full min-h-[44px] border rounded px-3 py-2 text-sm text-right"
                    @input="onQuickCompletedChange(i)"
                  />
                </div>
                <div>
                  <label class="block text-xs text-slate-500 mb-1"
                    >合格数</label
                  >
                  <input
                    v-model.number="row.qualifiedQty"
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-full min-h-[44px] border rounded px-3 py-2 text-sm text-right"
                  />
                </div>
                <div>
                  <label class="block text-xs text-slate-500 mb-1"
                    >不良数</label
                  >
                  <input
                    v-model.number="row.defectiveQty"
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-full min-h-[44px] border rounded px-3 py-2 text-sm text-right"
                  />
                </div>
                <div>
                  <label class="block text-xs text-slate-500 mb-1"
                    >工资类型</label
                  >
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
                    row.wageType === "HOURLY"
                      ? "工资率(元/时)"
                      : "计件单价(元/件)"
                  }}</label>
                  <input
                    v-model.number="row.rate"
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-full min-h-[44px] border rounded px-3 py-2 text-sm text-right"
                    :placeholder="getQuickRefPrice(row.planId, row.wageType)"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            v-if="quickOrder"
            @click="addQuickRow"
            class="mt-3 min-h-[44px] w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
          >
            + 添加报工行
          </button>
        </template>

        <div class="flex gap-2 mt-4">
          <button
            @click="submitQuickReport"
            :disabled="submitting"
            class="flex-1 min-h-[48px] bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition font-medium text-sm disabled:opacity-50"
          >
            {{ submitting ? "提交中..." : "确认报工" }}
          </button>
          <button
            @click="showQuickReport = false"
            class="flex-1 min-h-[48px] border py-3 rounded-lg hover:bg-slate-50 transition text-sm"
          >
            取消
          </button>
        </div>
      </div>
    </div>
    <!-- 杂费报工弹窗（新增） -->
    <div
      v-if="showMiscCostModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showMiscCostModal = false"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[85vh] overflow-auto"
      >
        <h2 class="text-lg font-bold mb-4">杂费报工</h2>

        <!-- 费用类型 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >费用类型</label
          >
          <select
            v-model="miscForm.costType"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none transition"
          >
            <option value="TRANSPORT">运输</option>
            <option value="HANDLING">搬运</option>
            <option value="TEMP_LABOR">临时工</option>
            <option value="OUTSOURCE">外包</option>
            <option value="OTHER">其他</option>
          </select>
        </div>

        <!-- 费用说明 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >费用说明</label
          >
          <input
            v-model="miscForm.description"
            placeholder="如：原材料卸货、成品装车..."
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition"
          />
        </div>

        <!-- 金额 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >金额（元）</label
          >
          <input
            v-model.number="miscForm.amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm text-right focus:ring-2 focus:ring-purple-500 outline-none transition"
          />
        </div>

        <!-- 关联订单（可选） -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1">
            关联订单（可选）
          </label>
          <div class="flex gap-2">
            <input
              v-model="miscOrderSearch"
              @keydown.enter="searchMiscOrders"
              placeholder="搜索订单号..."
              class="flex-1 min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition"
            />
            <button
              @click="searchMiscOrders"
              class="min-h-[44px] px-4 py-2 bg-purple-500 text-white rounded-lg text-sm"
            >
              搜索
            </button>
            <button
              @click="showMiscOrderPicker = true"
              class="min-h-[44px] px-3 border border-slate-300 rounded-lg text-slate-500 hover:text-purple-500 hover:border-purple-400 transition text-sm"
            >
              浏览
            </button>
          </div>
          <!-- 搜索结果 -->
          <div
            v-if="miscSearchedOrders.length > 0"
            class="mt-2 border rounded-lg max-h-[150px] overflow-y-auto"
          >
            <button
              v-for="o in miscSearchedOrders"
              :key="o.id"
              @click="selectMiscOrder(o)"
              class="w-full text-left px-4 py-2 text-sm hover:bg-purple-50 transition border-b last:border-0"
            >
              <span class="font-mono">{{ o.orderCode }}</span>
              <span class="text-slate-400 ml-2">{{
                o.customer?.name || "无客户"
              }}</span>
            </button>
          </div>
          <!-- 已选中订单 -->
          <div v-if="miscForm.orderId" class="mt-2 flex items-center gap-2">
            <span
              class="text-sm font-mono bg-purple-50 border border-purple-200 px-3 py-1 rounded-lg"
            >
              {{ miscSelectedOrderCode }}
            </span>
            <button
              @click="clearMiscOrder"
              class="text-red-400 hover:text-red-600 text-sm min-h-[36px] min-w-[36px]"
            >
              &times;
            </button>
          </div>
        </div>

        <!-- 订单浏览弹窗 -->
        <div
          v-if="showMiscOrderPicker"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            class="absolute inset-0 bg-black/30"
            @click="showMiscOrderPicker = false"
          />
          <div
            class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col"
          >
            <h2 class="text-lg font-bold mb-4">选择订单</h2>
            <input
              v-model="miscOrderPickerSearch"
              placeholder="搜索订单号..."
              class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm mb-4 min-h-[44px]"
            />
            <div class="flex-1 overflow-y-auto space-y-1">
              <button
                v-for="o in miscOrderPickerList"
                :key="o.id"
                @click="
                  selectMiscOrder(o);
                  showMiscOrderPicker = false;
                "
                class="w-full text-left px-4 py-3 rounded-lg text-sm hover:bg-purple-50 transition flex justify-between items-center border border-transparent"
              >
                <span class="font-mono">{{ o.orderCode }}</span>
                <span class="text-xs text-slate-400">{{
                  o.customer?.name || "无客户"
                }}</span>
              </button>
              <p
                v-if="miscOrderPickerList.length === 0"
                class="text-center text-slate-400 py-8"
              >
                无匹配订单
              </p>
            </div>
            <button
              @click="showMiscOrderPicker = false"
              class="mt-4 w-full min-h-[44px] border py-2 rounded-lg hover:bg-slate-50 text-sm"
            >
              关闭
            </button>
          </div>
        </div>

        <!-- 员工（可选） -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1">
            员工（可选，选正式员工或手填姓名）
          </label>
          <div class="flex gap-2">
            <select
              v-model="miscForm.workerId"
              class="flex-1 min-h-[44px] border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none transition"
            >
              <option value="">不选择员工</option>
              <option v-for="w in workers" :key="w.id" :value="w.id">
                {{ w.name }}（{{ w.code }}）
              </option>
            </select>
          </div>
          <div v-if="!miscForm.workerId" class="mt-2">
            <input
              v-model="miscForm.workerName"
              placeholder="或手填临时工姓名..."
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition"
            />
          </div>
        </div>

        <!-- 备注 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >备注（可选）</label
          >
          <textarea
            v-model="miscForm.remark"
            rows="2"
            placeholder="补充说明..."
            class="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition"
          ></textarea>
        </div>

        <!-- 按钮 -->
        <div class="flex gap-2 mt-4">
          <button
            @click="submitMiscCost"
            :disabled="miscSubmitting"
            class="flex-1 min-h-[48px] bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 transition font-medium text-sm disabled:opacity-50"
          >
            {{ miscSubmitting ? "提交中..." : "确认报工" }}
          </button>
          <button
            @click="showMiscCostModal = false"
            class="flex-1 min-h-[48px] border py-3 rounded-lg hover:bg-slate-50 transition text-sm"
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

const activeTab = ref<"production" | "misc">("production");
const page = ref(1);
const limit = 20;
const startDate = ref("");
const endDate = ref("");
const keyword = ref("");
const searchKeyword = ref("");

const doSearch = () => {
  searchKeyword.value = keyword.value;
  page.value = 1;
};

watch(keyword, (val) => {
  if (!val.trim() && searchKeyword.value !== "") {
    searchKeyword.value = "";
    page.value = 1;
  }
});

watch(activeTab, () => {
  page.value = 1;
  searchKeyword.value = "";
  keyword.value = "";
});

const queryParams = computed(() => ({
  page: page.value,
  limit,
  keyword: searchKeyword.value,
  startDate: startDate.value,
  endDate: endDate.value,
}));

const clearFilters = () => {
  keyword.value = "";
  searchKeyword.value = "";
  startDate.value = "";
  endDate.value = "";
  page.value = 1;
};

// 工序报工数据
const {
  data: listData,
  loading,
  execute: loadLogs,
} = useApiFetch("/api/production-logs");
watch(
  queryParams,
  () => {
    if (activeTab.value === "production") loadLogs(queryParams.value);
  },
  { immediate: true },
);

const logs = computed(() => (listData.value as any)?.data || []);
const totalPages = computed(() => (listData.value as any)?.totalPages || 1);

// 杂费报工数据
const {
  data: miscListData,
  loading: miscLoading,
  execute: loadMiscLogs,
} = useApiFetch("/api/misc-costs");
watch(
  [queryParams, activeTab],
  () => {
    if (activeTab.value === "misc") loadMiscLogs(queryParams.value);
  },
  { immediate: true },
);

const miscLogs = computed(() => (miscListData.value as any)?.data || []);

// 作废杂费
const handleVoidMiscCost = async (cost: any) => {
  if (!confirm(`确认作废杂费记录「${cost.description} ¥${cost.amount}」？`))
    return;
  try {
    await apiFetch(`/api/misc-costs/${cost.id}/void`, { method: "PATCH" });
    toast.success("已作废");
    await loadMiscLogs(queryParams.value);
  } catch (e: any) {
    toast.error(e, "作废失败");
  }
};

// 快速报工
const showQuickReport = ref(false);
const quickOrderSearch = ref("");
const quickOrder = ref<any>(null);
const searchedOrders = ref<any[]>([]);
const searched = ref(false);
const quickPlans = ref<any[]>([]);
const workers = ref<any[]>([]);
const submitting = ref(false);
const showOrderPicker = ref(false);
const orderPickerSearch = ref("");

const { data: allOrdersData } = await useFetch(
  "/api/orders?limit=100&statuses=APPROVED,PRODUCING",
);
const allOrders = computed(() => (allOrdersData.value as any)?.data || []);

const orderPickerList = computed(() => {
  if (!orderPickerSearch.value.trim()) return allOrders.value;
  const q = orderPickerSearch.value.toLowerCase();
  return allOrders.value.filter((o: any) =>
    o.orderCode.toLowerCase().includes(q),
  );
});

interface QuickRow {
  planId: string;
  completedQty: number;
  qualifiedQty: number;
  defectiveQty: number;
  workerId: string;
  wageType: "HOURLY" | "PIECE";
  laborHours: number;
  rate: number;
}
const quickRows = reactive<QuickRow[]>([]);

const searchOrders = async () => {
  if (!quickOrderSearch.value.trim()) return;
  searched.value = true;
  try {
    const res = await apiFetch<any>(
      `/api/orders?keyword=${encodeURIComponent(quickOrderSearch.value)}&limit=5`,
    );
    searchedOrders.value = res.data || [];
  } catch {
    searchedOrders.value = [];
  }
};

const selectQuickOrder = async (order: any) => {
  quickOrder.value = order;
  searchedOrders.value = [];
  quickOrderSearch.value = order.orderCode;
  quickRows.length = 1;
  quickRows[0] = {
    planId: "",
    completedQty: 0,
    qualifiedQty: 0,
    defectiveQty: 0,
    workerId: "",
    wageType: "HOURLY",
    laborHours: 0,
    rate: 0,
  };

  try {
    const plansData = await apiFetch<any>(`/api/orders/${order.id}/plans`);
    quickPlans.value = (plansData.data || []).filter(
      (p: any) => p.status !== "COMPLETED",
    );
    // 如果只有一个工序，自动选中
    if (quickPlans.value.length === 1) {
      quickRows[0].planId = quickPlans.value[0].id;
      onQuickPlanChange(0);
    }
  } catch {
    quickPlans.value = [];
  }
};

const onQuickPlanChange = (i: number) => {
  const plan = quickPlans.value.find((p: any) => p.id === quickRows[i]!.planId);
  if (plan) {
    quickRows[i]!.wageType = plan.wageType || "HOURLY";
    if (plan.wageType === "HOURLY") {
      quickRows[i]!.laborHours = Number(plan.standardHours) || 0;
      quickRows[i]!.rate = Number(plan.hourlyRate) || 0;
    } else {
      quickRows[i]!.laborHours = 0;
      quickRows[i]!.rate = Number(plan.unitPrice) || 0;
    }
  }
};

const onQuickCompletedChange = (i: number) => {
  quickRows[i]!.qualifiedQty = quickRows[i]!.completedQty;
  quickRows[i]!.defectiveQty = 0;
};

const getQuickRefPrice = (planId: string, wageType: string) => {
  const plan = quickPlans.value.find((p: any) => p.id === planId);
  if (!plan) return "-";
  return wageType === "HOURLY"
    ? `${Number(plan.hourlyRate) || 0}`
    : `${Number(plan.unitPrice) || 0}`;
};

const addQuickRow = () => {
  quickRows.push({
    planId: "",
    completedQty: 0,
    qualifiedQty: 0,
    defectiveQty: 0,
    workerId: "",
    wageType: "HOURLY",
    laborHours: 0,
    rate: 0,
  });
};

const submitQuickReport = async () => {
  const reports = quickRows
    .filter((r) => r.planId && r.completedQty > 0 && r.workerId)
    .map((r) => {
      const plan = quickPlans.value.find((p: any) => p.id === r.planId);
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
    showQuickReport.value = false;
    quickOrder.value = null;
    quickPlans.value = [];
    quickRows.length = 0;
    await loadLogs(queryParams.value);
  } catch (e: any) {
    toast.error(e, "报工失败");
  } finally {
    submitting.value = false;
  }
};

// 加载操作工列表（弹窗打开时）
watch(showQuickReport, async (val) => {
  if (val && workers.value.length === 0) {
    try {
      const data = await apiFetch<any>("/api/workers?limit=200");
      workers.value = data.data || [];
    } catch {
      workers.value = [];
    }
  }
});
// ==================== 杂费报工 ====================
const showMiscCostModal = ref(false);
const miscSubmitting = ref(false);
const miscOrderSearch = ref("");
const miscSearchedOrders = ref<any[]>([]);
const showMiscOrderPicker = ref(false);
const miscOrderPickerSearch = ref("");

const miscForm = reactive({
  costType: "HANDLING",
  description: "",
  amount: null as number | null,
  orderId: "",
  workerId: "",
  workerName: "",
  remark: "",
});

const miscSelectedOrderCode = ref("");

const miscOrderPickerList = computed(() => {
  if (!miscOrderPickerSearch.value.trim()) return allOrders.value;
  const q = miscOrderPickerSearch.value.toLowerCase();
  return allOrders.value.filter((o: any) =>
    o.orderCode.toLowerCase().includes(q),
  );
});

const searchMiscOrders = async () => {
  if (!miscOrderSearch.value.trim()) return;
  try {
    const res = await apiFetch<any>(
      `/api/orders?keyword=${encodeURIComponent(miscOrderSearch.value)}&limit=5`,
    );
    miscSearchedOrders.value = res.data || [];
  } catch {
    miscSearchedOrders.value = [];
  }
};

const selectMiscOrder = (order: any) => {
  miscForm.orderId = order.id;
  miscSelectedOrderCode.value = order.orderCode;
  miscSearchedOrders.value = [];
  miscOrderSearch.value = order.orderCode;
};

const clearMiscOrder = () => {
  miscForm.orderId = "";
  miscSelectedOrderCode.value = "";
  miscOrderSearch.value = "";
};

const submitMiscCost = async () => {
  if (!miscForm.description.trim()) return toast.error("请填写费用说明");
  if (!miscForm.amount || miscForm.amount <= 0)
    return toast.error("请输入有效金额");

  miscSubmitting.value = true;
  try {
    await apiFetch("/api/misc-costs", {
      method: "POST",
      body: {
        costType: miscForm.costType,
        description: miscForm.description,
        amount: miscForm.amount,
        orderId: miscForm.orderId || undefined,
        workerId: miscForm.workerId || undefined,
        workerName: miscForm.workerId
          ? undefined
          : miscForm.workerName || undefined,
        remark: miscForm.remark || undefined,
      },
    });
    toast.success("杂费报工成功");
    showMiscCostModal.value = false;
    // 重置表单
    miscForm.costType = "HANDLING";
    miscForm.description = "";
    miscForm.amount = null;
    miscForm.orderId = "";
    miscForm.workerId = "";
    miscForm.workerName = "";
    miscForm.remark = "";
    miscSelectedOrderCode.value = "";
  } catch (e: any) {
    toast.error(e, "报工失败");
  } finally {
    miscSubmitting.value = false;
  }
};

// 加载操作工列表（弹窗打开时）
watch([showQuickReport, showMiscCostModal], async ([quick, misc]) => {
  if ((quick || misc) && workers.value.length === 0) {
    try {
      const data = await apiFetch<any>("/api/workers?limit=200");
      workers.value = data.data || [];
    } catch {
      workers.value = [];
    }
  }
});
// ==================== 工具函数 ====================
const costTypeLabel = (t: string) =>
  ({
    TRANSPORT: "运输",
    HANDLING: "搬运",
    TEMP_LABOR: "临时工",
    OUTSOURCE: "外包",
    OTHER: "其他",
  })[t] || t;

const costTypeBadge = (t: string) => {
  const m: Record<string, string> = {
    TRANSPORT: "bg-blue-100 text-blue-800 border-blue-300",
    HANDLING: "bg-amber-100 text-amber-800 border-amber-300",
    TEMP_LABOR: "bg-orange-100 text-orange-800 border-orange-300",
    OUTSOURCE: "bg-purple-100 text-purple-800 border-purple-300",
    OTHER: "bg-slate-100 text-slate-600 border-slate-300",
  };
  return `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${m[t] || "bg-slate-100 text-slate-600 border-slate-300"}`;
};

const statusLabel = (s: string) =>
  ({
    PENDING: "待审核",
    APPROVED: "已审核",
    PRODUCING: "生产中",
    SAMPLING: "打样中",
    READY: "待发货",
    COMPLETED: "已完成",
    CANCELLED: "已取消",
  })[s] || s;
const statusBadge = (s: string) => {
  const m: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800 border-amber-300",
    APPROVED: "bg-blue-100 text-blue-800 border-blue-300",
    PRODUCING: "bg-purple-100 text-purple-800 border-purple-300",
    COMPLETED: "bg-green-100 text-green-800 border-green-300",
    CANCELLED: "bg-red-100 text-red-800 border-red-300",
  };
  return m[s] || "bg-slate-100 text-slate-600 border-slate-300";
};
const formatDate = (d: string) => new Date(d).toLocaleDateString("zh-CN");
</script>
