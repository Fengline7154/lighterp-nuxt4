<template>
  <div class="max-w-2xl mx-auto">
    <div class="flex items-center gap-4 mb-6 flex-wrap">
      <NuxtLink to="/orders" class="text-slate-500 hover:text-slate-700"
        >&larr; 返回</NuxtLink
      >
      <h1 class="text-xl lg:text-2xl font-bold">订单详情</h1>

      <!-- 所有操作按钮靠右 -->
      <div class="ml-auto flex gap-2 flex-wrap">
        <button
          @click="showMaterialRequirements = true"
          class="min-h-[44px] px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition text-sm"
        >
          物料需求
        </button>
        <button
          v-if="
            order?.status &&
            ['PRODUCING', 'READY', 'COMPLETED'].includes(order.status)
          "
          @click="openProcessViewer"
          class="min-h-[44px] px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition text-sm"
        >
          查看工序
        </button>
        <button
          @click="openPrintModal"
          class="min-h-[44px] px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition text-sm"
        >
          打印报工单
        </button>
        <button
          @click="openSubstitutionViewer"
          class="min-h-[44px] px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm"
        >
          替代记录
        </button>
      </div>
    </div>
    <!-- 物料需求查看弹窗 -->
    <div
      v-if="showMaterialRequirements"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showMaterialRequirements = false"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-auto"
      >
        <h2 class="text-lg font-bold mb-4">物料需求预览</h2>
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b bg-slate-100">
                <th
                  class="text-left px-4 py-2 text-xs font-medium text-slate-500 uppercase"
                >
                  物料
                </th>
                <th
                  class="text-right px-4 py-2 text-xs font-medium text-slate-500 uppercase"
                >
                  需求量
                </th>

                <th
                  class="text-right px-4 py-2 text-xs font-medium text-slate-500 uppercase"
                >
                  缺口
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="m in materialRequirements"
                :key="m.productId"
                class="odd:bg-white even:bg-slate-50"
              >
                <td class="px-4 py-2">
                  {{ m.productName }}
                  <span class="text-xs text-slate-400">{{ m.unit }}</span>
                </td>
                <td class="px-4 py-2 text-right">{{ m.demand }}</td>

                <td
                  class="px-4 py-2 text-right font-medium"
                  :class="m.shortage > 0 ? 'text-red-600' : 'text-green-600'"
                >
                  {{ m.shortage }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="md:hidden space-y-2">
          <div
            v-for="m in materialRequirements"
            :key="m.productId"
            class="bg-slate-50 rounded-lg p-3 border"
          >
            <div class="font-medium text-sm">
              {{ m.productName }}
              <span class="text-xs text-slate-400">{{ m.unit }}</span>
            </div>
            <div class="flex justify-between text-xs mt-1">
              <span>需求: {{ m.demand }}</span>

              <span
                :class="m.shortage > 0 ? 'text-red-600' : 'text-green-600'"
                class="font-medium"
                >缺口: {{ m.shortage }}</span
              >
            </div>
          </div>
        </div>
        <div
          v-if="materialRequirements.length === 0"
          class="text-center py-8 text-slate-400"
        >
          暂无数据
        </div>
        <button
          @click="showMaterialRequirements = false"
          class="mt-4 w-full min-h-[44px] border py-2 rounded-lg hover:bg-slate-50 text-sm"
        >
          关闭
        </button>
      </div>
    </div>
    <!-- 替代料记录弹窗 -->
    <div
      v-if="showSubstitutionModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showSubstitutionModal = false"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-auto"
      >
        <h2 class="text-lg font-bold mb-4">替代料记录</h2>

        <div
          v-if="substitutions.length === 0"
          class="text-center text-slate-400 py-8"
        >
          该订单暂无替代料记录
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="record in substitutions"
            :key="record.id"
            class="bg-slate-50 border rounded-lg p-4 space-y-2"
          >
            <div class="flex items-center gap-2 text-sm">
              <span class="text-slate-500">原物料：</span>
              <span class="font-medium">{{ record.originalProductName }}</span>
              <span class="text-slate-400">→</span>
              <span class="text-slate-500">替代料：</span>
              <span class="font-medium text-purple-600">{{
                record.substituteProductName
              }}</span>
            </div>
            <div class="flex gap-4 text-sm">
              <span
                >数量：<span class="font-medium">{{
                  record.quantity
                }}</span></span
              >
              <span class="text-slate-400">|</span>
              <span class="text-slate-500"
                >时间：{{ formatDate(record.createdAt) }}</span
              >
            </div>
            <div v-if="record.remark" class="text-xs text-slate-500">
              备注：{{ record.remark }}
            </div>
          </div>
        </div>

        <button
          @click="showSubstitutionModal = false"
          class="mt-4 w-full min-h-[44px] border py-2 rounded-lg hover:bg-slate-50 transition text-sm"
        >
          关闭
        </button>
      </div>
    </div>
    <!-- 修改价格弹窗 -->
    <div
      v-if="showPriceModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showPriceModal = false"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] overflow-auto"
      >
        <h2 class="text-lg font-bold mb-4">修改产品单价</h2>
        <div class="space-y-4">
          <div
            v-for="item in order?.items"
            :key="item.id"
            class="border rounded-lg p-3"
          >
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-medium">{{ item.productName }}</span>
              <span class="text-xs text-slate-500"
                >当前单价：¥{{ Number(item.unitPrice) }}</span
              >
            </div>
            <input
              v-model.number="priceEdits[item.id]"
              type="number"
              min="0"
              step="0.01"
              class="w-full min-h-[44px] border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="输入新单价"
            />
          </div>
        </div>
        <div class="flex gap-2 mt-4">
          <button
            @click="handleUpdatePrice"
            class="flex-1 min-h-[44px] bg-amber-500 text-white py-2 rounded-lg hover:bg-amber-600 transition text-sm"
          >
            确认修改
          </button>
          <button
            @click="showPriceModal = false"
            class="flex-1 min-h-[44px] border py-2 rounded-lg hover:bg-slate-50 transition text-sm"
          >
            取消
          </button>
        </div>
      </div>
    </div>

    <!-- 查看/编辑工序弹窗 -->
    <div
      v-if="showProcessViewer"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showProcessViewer = false"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-auto"
      >
        <h2 class="text-lg font-bold mb-4">订单工序进度</h2>

        <div
          v-for="(product, index) in productGroups"
          :key="index"
          class="mb-6"
        >
          <h3
            class="font-medium text-sm text-slate-500 mb-2 flex justify-between items-center"
          >
            <span>{{ product.productName }}</span>
            <button
              v-if="canEditPlans"
              @click="openAddPlan(product)"
              class="text-xs text-blue-500 hover:text-blue-700"
            >
              + 添加工序
            </button>
          </h3>

          <div
            v-if="product.plans.length === 0"
            class="text-sm text-slate-400 py-2"
          >
            暂无工序计划
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="plan in product.plans"
              :key="plan.id"
              class="flex justify-between items-center border-b pb-2"
            >
              <span>{{ plan.sequence }}. {{ plan.processName }}</span>
              <div class="flex items-center gap-2">
                <span
                  class="text-sm"
                  :class="
                    plan.status === 'COMPLETED'
                      ? 'text-green-600'
                      : 'text-blue-600'
                  "
                >
                  {{ plan.completedQty }}/{{ plan.assignedQty }}
                  {{
                    plan.status === "COMPLETED"
                      ? "已完成"
                      : plan.status === "IN_PROGRESS"
                        ? "进行中"
                        : "待开始"
                  }}
                </span>
                <button
                  v-if="canEditPlans"
                  @click="removePlan(plan)"
                  class="text-red-400 hover:text-red-600 text-sm"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="productGroups.length === 0"
          class="text-center text-slate-400 py-8"
        >
          该订单暂无工序计划
        </div>

        <div class="mt-4 flex gap-2">
          <NuxtLink
            v-if="processPlans.length > 0"
            :to="`/orders/${order?.id}/production`"
            class="flex-1 text-center min-h-[44px] py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
          >
            去报工
          </NuxtLink>
          <span
            v-else
            class="flex-1 text-center min-h-[44px] py-2 bg-slate-300 text-slate-500 rounded-lg text-sm"
          >
            暂无工序，无法报工
          </span>
          <button
            @click="showProcessViewer = false"
            class="flex-1 min-h-[44px] border py-2 rounded-lg hover:bg-slate-50 transition text-sm"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
    <!-- 添加工序弹窗 -->
    <div
      v-if="showAddPlanModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showAddPlanModal = false"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[85vh] overflow-auto"
      >
        <h2 class="text-lg font-bold mb-4">
          添加工序 — {{ addPlanForm.productName }}
        </h2>

        <!-- 选择模板 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1">
            从模板选择 <span class="text-slate-400 text-xs">(可选)</span>
          </label>
          <select
            v-model="addPlanForm.selectedTemplateId"
            @change="onTemplateSelected"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white"
          >
            <option value="">手动输入</option>
            <option v-for="t in productTemplates" :key="t.id" :value="t.id">
              {{ t.sequence }}. {{ t.processName }}
              <template v-if="t.wageType === 'HOURLY'">
                （计时 {{ t.hourlyRate }}元/h）
              </template>
              <template v-else> （计件 {{ t.unitPrice }}元/件） </template>
            </option>
          </select>
        </div>

        <!-- 手动输入 -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >工序名称</label
            >
            <input
              v-model="addPlanForm.processName"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm"
              placeholder="如：包装"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >顺序</label
            >
            <input
              v-model.number="addPlanForm.sequence"
              type="number"
              min="1"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >工资类型</label
            >
            <select
              v-model="addPlanForm.wageType"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white"
            >
              <option value="HOURLY">计时</option>
              <option value="PIECE">计件</option>
            </select>
          </div>
          <div v-if="addPlanForm.wageType === 'HOURLY'">
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >小时工资</label
            >
            <input
              v-model.number="addPlanForm.hourlyRate"
              type="number"
              min="0"
              step="0.01"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm"
            />
          </div>
          <div v-if="addPlanForm.wageType === 'PIECE'">
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >计件单价</label
            >
            <input
              v-model.number="addPlanForm.unitPrice"
              type="number"
              min="0"
              step="0.01"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm"
            />
          </div>
          <div v-if="addPlanForm.wageType === 'HOURLY'">
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >标准工时</label
            >
            <input
              v-model.number="addPlanForm.standardHours"
              type="number"
              min="0"
              step="0.01"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm"
            />
          </div>
        </div>

        <div class="flex gap-2 mt-4">
          <button
            @click="confirmAddPlan"
            class="flex-1 min-h-[44px] bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition text-sm"
          >
            确认
          </button>
          <button
            @click="showAddPlanModal = false"
            class="flex-1 min-h-[44px] border py-2 rounded-lg hover:bg-slate-50 transition text-sm"
          >
            取消
          </button>
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
        <h2 class="text-lg font-bold mb-4">生产入库</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >产品</label
            >
            <select
              v-model="receiptForm.orderItemId"
              class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            >
              <option value="">选择产品</option>
              <option
                v-for="item in order!.items"
                :key="item.id"
                :value="item.id"
              >
                {{ item.productName }}（已入库 {{ item.fulfilledQuantity }}/{{
                  item.quantity
                }}）
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1"
              >数量</label
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
    <!-- 更换 BOM 弹窗 -->
    <div
      v-if="showReplaceBomModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showReplaceBomModal = false"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[85vh] overflow-auto"
      >
        <h2 class="text-lg font-bold mb-4">更换 BOM 物料</h2>

        <!-- 选择订单明细产品 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >产品</label
          >
          <select
            v-model="replaceBomForm.orderItemId"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white"
          >
            <option value="">选择产品</option>
            <option
              v-for="item in order?.items"
              :key="item.id"
              :value="item.id"
            >
              {{ item.productName }}
            </option>
          </select>
        </div>

        <!-- 替换列表 -->
        <div class="space-y-3 mb-4">
          <div
            v-for="(row, index) in replaceBomRows"
            :key="index"
            class="border rounded-lg p-3 bg-slate-50"
          >
            <div class="grid grid-cols-2 gap-2 mb-2">
              <button
                @click="openOldMaterialPicker(index)"
                class="min-h-[44px] border border-slate-300 rounded-lg px-3 py-2 text-sm text-left bg-white"
                :class="row.oldMaterialId ? 'text-slate-900' : 'text-slate-400'"
              >
                {{ row.oldMaterialName || "选择原物料" }}
              </button>
              <button
                @click="openNewMaterialPicker(index)"
                class="min-h-[44px] border border-slate-300 rounded-lg px-3 py-2 text-sm text-left bg-white"
                :class="row.newMaterialId ? 'text-slate-900' : 'text-slate-400'"
              >
                {{ row.newMaterialName || "选择替代料" }}
              </button>
            </div>
            <div class="flex items-center gap-2">
              <input
                v-model.number="row.newQuantity"
                type="number"
                min="0.0001"
                step="0.0001"
                :placeholder="`新用量（默认 ${row.oldQuantity}）`"
                class="flex-1 min-h-[44px] border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />

              <button
                @click="replaceBomRows.splice(index, 1)"
                class="min-h-[44px] min-w-[44px] text-red-400 hover:text-red-600"
              >
                &times;
              </button>
            </div>
          </div>
        </div>

        <button
          @click="addReplaceBomRow"
          class="min-h-[44px] w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
        >
          + 添加替换行
        </button>

        <div class="flex gap-2 mt-4">
          <button
            @click="handleReplaceBom"
            class="flex-1 min-h-[44px] bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition text-sm"
          >
            确认更换
          </button>
          <button
            @click="showReplaceBomModal = false"
            class="flex-1 min-h-[44px] border py-2 rounded-lg hover:bg-slate-50 transition text-sm"
          >
            取消
          </button>
        </div>
      </div>
    </div>

    <!-- 原物料选择弹窗 -->
    <div
      v-if="showOldMaterialPicker !== null"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showOldMaterialPicker = null"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col"
      >
        <h2 class="text-lg font-bold mb-4">选择原物料</h2>
        <div class="flex-1 overflow-y-auto space-y-1">
          <button
            v-for="m in currentBomItems"
            :key="m.materialId"
            @click="selectOldMaterial(showOldMaterialPicker, m)"
            class="w-full text-left px-4 py-3 rounded-lg text-sm hover:bg-blue-50 transition border"
          >
            <span class="font-mono text-xs text-slate-400 mr-2">{{
              m.materialCode
            }}</span>
            <span class="font-medium">{{ m.materialName }}</span>
            <span class="text-xs text-slate-400 ml-2">{{ m.unit }}</span>
            <span class="text-xs text-slate-400 ml-2"
              >用量 {{ m.quantity }}</span
            >
          </button>
        </div>
        <button
          @click="showOldMaterialPicker = null"
          class="mt-4 w-full min-h-[44px] border py-2 rounded-lg text-sm"
        >
          取消
        </button>
      </div>
    </div>

    <!-- 替代料选择弹窗 -->
    <div
      v-if="showNewMaterialPicker !== null"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showNewMaterialPicker = null"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col"
      >
        <h2 class="text-lg font-bold mb-4">选择替代料</h2>
        <input
          v-model="newMaterialSearch"
          placeholder="搜索物料..."
          class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm mb-4 min-h-[44px]"
        />
        <div class="flex-1 overflow-y-auto space-y-1">
          <button
            v-for="p in filteredNewMaterials"
            :key="p.id"
            @click="selectNewMaterial(showNewMaterialPicker, p)"
            class="w-full text-left px-4 py-3 rounded-lg text-sm hover:bg-blue-50 transition"
          >
            <span class="font-mono text-xs text-slate-400 mr-2">{{
              p.code
            }}</span>
            <span class="font-medium">{{ p.name }}</span>
            <span class="text-xs text-slate-400 ml-2">{{ p.unit }}</span>
          </button>
        </div>
        <button
          @click="showNewMaterialPicker = null"
          class="mt-4 w-full min-h-[44px] border py-2 rounded-lg text-sm"
        >
          取消
        </button>
      </div>
    </div>
    <!-- 倒冲缺口警告弹窗 -->
    <div
      v-if="showShortageModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showShortageModal = false"
      />
      <div class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 class="text-lg font-bold mb-2 text-red-600">⚠️ 物料缺口警告</h2>
        <p class="text-sm text-slate-500 mb-4">
          以下物料库存和预留均不足，可选择替代料或稍后处理：
        </p>

        <div class="space-y-3 max-h-[50vh] overflow-y-auto">
          <div
            v-for="(warning, index) in shortageWarnings"
            :key="warning.productId"
            class="bg-red-50 border border-red-200 rounded-lg p-3"
          >
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-red-700">
                {{ warning.productName }}
              </span>
              <span class="text-sm text-red-600 font-bold">
                缺口 {{ warning.shortageQty }}
              </span>
            </div>
            <button
              @click="openSubstitutePicker(index)"
              class="mt-2 w-full min-h-[36px] px-3 py-1 bg-white border border-red-300 text-red-600 rounded text-xs hover:bg-red-100 transition"
            >
              选择替代料
            </button>
          </div>
        </div>

        <button
          @click="showShortageModal = false"
          class="mt-4 w-full min-h-[44px] bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition text-sm"
        >
          稍后处理
        </button>
      </div>
    </div>

    <!-- 替代料选择弹窗 -->
    <div
      v-if="showSubstitutePicker !== null"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showSubstitutePicker = null"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col"
      >
        <h2 class="text-lg font-bold mb-2">选择替代料</h2>
        <p class="text-sm text-slate-500 mb-4">
          {{ shortageWarnings[showSubstitutePicker]?.productName }}
          缺口
          {{ shortageWarnings[showSubstitutePicker]?.shortageQty }}
        </p>

        <input
          v-model="substituteSearch"
          placeholder="搜索物料..."
          class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm mb-4 min-h-[44px]"
        />

        <div class="flex-1 overflow-y-auto space-y-1">
          <button
            v-for="p in filteredSubstituteProducts"
            :key="p.id"
            @click="selectSubstitute(p)"
            class="w-full text-left px-4 py-3 rounded-lg text-sm hover:bg-blue-50 transition border"
          >
            <span class="font-mono text-xs text-slate-400 mr-2">{{
              p.code
            }}</span>
            <span class="font-medium">{{ p.name }}</span>
            <span class="text-xs text-slate-400 ml-2">{{ p.unit }}</span>
          </button>
          <p
            v-if="filteredSubstituteProducts.length === 0"
            class="text-center text-slate-400 py-8"
          >
            无匹配物料
          </p>
        </div>

        <button
          @click="showSubstitutePicker = null"
          class="mt-4 w-full min-h-[44px] border py-2 rounded-lg text-sm"
        >
          取消
        </button>
      </div>
    </div>
    <!-- 打样领料弹窗 -->
    <div
      v-if="showPickModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showPickModal = false"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[85vh] overflow-auto"
      >
        <h2 class="text-lg font-bold mb-4">打样领料</h2>

        <!-- 领料行列表 -->
        <div class="space-y-3 mb-4">
          <div
            v-for="(row, i) in pickItems"
            :key="i"
            class="border rounded-lg p-3 bg-slate-50"
          >
            <div class="flex justify-between mb-2">
              <button
                @click="openPickProductPicker(i)"
                class="text-sm font-mono border-b border-dashed border-blue-300 text-blue-600 min-h-[36px]"
              >
                {{
                  row.productId
                    ? `${row.productCode} ${row.productName}`
                    : "选择物料"
                }}
              </button>
              <button
                @click="pickItems.splice(i, 1)"
                class="text-red-400 hover:text-red-600 min-h-[36px] min-w-[36px]"
              >
                &times;
              </button>
            </div>
            <div class="flex items-center gap-2">
              <input
                v-model.number="row.quantity"
                type="number"
                min="0.0001"
                step="0.0001"
                class="flex-1 min-h-[44px] border rounded px-3 py-2 text-sm text-right"
                placeholder="数量"
              />
              <span
                v-if="row.unit"
                class="text-sm font-bold text-slate-900 min-w-[40px]"
                >{{ row.unit }}</span
              >
            </div>
          </div>
        </div>

        <button
          @click="
            pickItems.push({
              productId: '',
              productCode: '',
              productName: '',
              quantity: 1,
              unit: '',
            })
          "
          class="min-h-[44px] w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
        >
          + 添加物料行
        </button>

        <div class="flex gap-2 mt-4">
          <button
            @click="handlePick"
            class="flex-1 min-h-[44px] bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition text-sm"
          >
            确认领料
          </button>
          <button
            @click="showPickModal = false"
            class="flex-1 min-h-[44px] border py-2 rounded-lg hover:bg-slate-50 transition text-sm"
          >
            取消
          </button>
        </div>
      </div>
    </div>

    <!-- 物料选择弹窗 -->
    <div
      v-if="showPickProductPicker !== null"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showPickProductPicker = null"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col"
      >
        <h2 class="text-lg font-bold mb-4">选择物料</h2>
        <input
          v-model="pickProductSearch"
          placeholder="搜索物料..."
          class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm mb-4 min-h-[44px]"
        />
        <div class="flex-1 overflow-y-auto space-y-1">
          <button
            v-for="p in filteredPickProducts"
            :key="p.id"
            @click="selectPickProduct(showPickProductPicker, p)"
            class="w-full text-left px-4 py-3 rounded-lg text-sm hover:bg-blue-50 transition"
          >
            <span class="font-mono text-xs text-slate-400 mr-2">{{
              p.code
            }}</span
            ><span class="font-medium">{{ p.name }}</span>
          </button>
        </div>
        <button
          @click="showPickProductPicker = null"
          class="mt-4 w-full min-h-[44px] border py-2 rounded-lg text-sm"
        >
          关闭
        </button>
      </div>
    </div>

    <!-- 发货弹窗 -->
    <div
      v-if="showShipModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showShipModal = false"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[80vh] overflow-auto"
      >
        <h2 class="text-lg font-bold mb-4">确认发货</h2>
        <div
          v-for="item in order?.items"
          :key="item.id"
          class="mb-3 border-b pb-2"
        >
          <div class="text-sm font-medium">{{ item.productName }}</div>
          <div class="text-xs text-slate-500">
            已发 {{ item.shippedQuantity || 0 }} / {{ item.quantity }}
          </div>
          <div class="flex items-center gap-2 mt-1">
            <input
              v-model.number="shipQtys[item.id]"
              type="number"
              min="0"
              :max="
                Math.min(
                  item.quantity - (item.shippedQuantity || 0),
                  getAvailableStock(item.productId),
                )
              "
              class="flex-1 min-h-[44px] border rounded px-3 py-2 text-sm"
              placeholder="本次出库数量"
            />
            <span class="text-xs font-bold text-slate-900 min-w-[40px]">{{
              getProductUnit(item.productId)
            }}</span>
          </div>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >库位 <span class="text-slate-400 text-xs">(可选)</span></label
          >
          <select
            v-model="shipLocationId"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white"
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
        <div class="flex gap-2 mt-4">
          <button
            @click="confirmShip"
            class="flex-1 min-h-[44px] bg-blue-500 text-white py-2 rounded-lg text-sm"
          >
            确认发货
          </button>
          <button
            @click="showShipModal = false"
            class="flex-1 min-h-[44px] border py-2 rounded-lg text-sm"
          >
            取消
          </button>
        </div>
      </div>
    </div>

    <!-- 审核预留弹窗 -->
    <div
      v-if="showApproveModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showApproveModal = false"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] overflow-auto"
      >
        <h2 class="text-lg font-bold mb-4">审核通过 - 预留设置</h2>
        <p class="text-sm text-slate-500 mb-4">
          设置每条明细从成品库存预留的数量（剩余部分将按 BOM 预留物料）
        </p>
        <div class="space-y-4">
          <div
            v-for="item in order?.items"
            :key="item.id"
            class="border rounded-lg p-3"
          >
            <div class="flex justify-between items-center mb-2">
              <span class="font-medium text-sm">{{ item.productName }}</span>
              <span class="text-xs text-slate-500"
                >需求 {{ item.quantity }} | 可用库存
                {{ getAvailableStock(item.productId) }}</span
              >
            </div>
            <div class="flex items-center gap-2">
              <input
                v-model.number="reserveInputs[item.id]"
                type="number"
                :max="
                  Math.min(item.quantity, getAvailableStock(item.productId))
                "
                min="0"
                class="w-24 min-h-[44px] border border-slate-300 rounded px-2 py-1 text-sm text-right"
              />
              <button
                @click="
                  reserveInputs[item.id] = Math.min(
                    item.quantity,
                    getAvailableStock(item.productId),
                  )
                "
                class="text-xs text-blue-500 hover:text-blue-700"
              >
                全部库存
              </button>
              <button
                @click="reserveInputs[item.id] = 0"
                class="text-xs text-slate-400 hover:text-slate-600"
              >
                仅物料
              </button>
            </div>
          </div>
        </div>
        <div class="flex gap-2 mt-4">
          <button
            @click="handleApproveWithReservations"
            class="flex-1 min-h-[44px] bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition text-sm"
          >
            确认审核
          </button>
          <button
            @click="showApproveModal = false"
            class="flex-1 min-h-[44px] border py-2 rounded-lg hover:bg-slate-50 transition text-sm"
          >
            取消
          </button>
        </div>
      </div>
    </div>

    <!-- 订单详情主体 -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div
        class="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"
      ></div>
      <span class="ml-3 text-sm text-slate-400">加载中...</span>
    </div>
    <div v-if="order" class="space-y-6">
      <div class="bg-white rounded-xl shadow p-4 lg:p-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Info label="订单号" :value="order.orderCode" />
          <Info label="订单类型" :value="typeLabel(order.orderType)" />
          <Info label="状态">
            <span
              :class="statusBadge(order.status)"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
              >{{ statusIcon(order.status) }}
              {{ statusLabel(order.status) }}</span
            >
          </Info>
          <Info label="总金额" :value="`¥${order.totalAmount}`" />
          <Info label="客户" :value="order.customer?.name || '-'" />
          <Info
            label="制单人"
            :value="
              order.creator
                ? `${order.creator.badgeCode}-${order.creator.name}`
                : order.createdById
            "
          />
          <Info label="部门" :value="order.department || '-'" />
          <Info
            label="交货期限"
            :value="order.deadlineAt ? formatDate(order.deadlineAt) : '-'"
          />
          <Info label="创建时间" :value="formatDate(order.createdAt)" />
        </div>
      </div>

      <div class="bg-white rounded-xl shadow p-4 lg:p-6">
        <h2 class="font-semibold mb-3">订单明细</h2>
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="border-b bg-slate-100">
              <tr>
                <th
                  class="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase"
                >
                  产品
                </th>
                <th
                  class="text-right py-2 px-3 text-xs font-medium text-slate-500 uppercase"
                >
                  已完工(未入库)/需求
                </th>
                <th
                  class="text-right py-2 px-3 text-xs font-medium text-slate-500 uppercase"
                >
                  已入库/需求
                </th>
                <th
                  class="text-right py-2 px-3 text-xs font-medium text-slate-500 uppercase"
                >
                  已发货/需求
                </th>
                <th
                  class="text-right py-2 px-3 text-xs font-medium text-slate-500 uppercase"
                >
                  单价
                </th>
                <th
                  class="text-right py-2 px-3 text-xs font-medium text-slate-500 uppercase"
                >
                  小计
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in order.items"
                :key="item.id"
                class="border-b last:border-0 even:bg-slate-50/50"
              >
                <td class="py-2 px-3">{{ item.productName }}</td>
                <td class="py-2 px-3 text-right">
                  <span
                    :class="
                      Number(item.producedQty || 0) >= Number(item.quantity)
                        ? 'text-green-600'
                        : 'text-amber-600'
                    "
                    >{{ item.producedQty || 0 }}/{{ item.quantity }}</span
                  >
                </td>
                <td class="py-2 px-3 text-right">
                  <span
                    :class="
                      item.fulfilledQuantity >= item.quantity
                        ? 'text-green-600'
                        : 'text-orange-500'
                    "
                    >{{ item.fulfilledQuantity }}/{{ item.quantity }}</span
                  >
                </td>
                <td class="py-2 px-3 text-right">
                  <span
                    :class="
                      (item.shippedQuantity || 0) >= item.quantity
                        ? 'text-green-600'
                        : 'text-blue-500'
                    "
                    >{{ item.shippedQuantity || 0 }}/{{ item.quantity }}</span
                  >
                </td>
                <td class="py-2 px-3 text-right">¥{{ item.unitPrice }}</td>
                <td class="py-2 px-3 text-right">
                  ¥{{
                    (Number(item.quantity) * Number(item.unitPrice)).toFixed(2)
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="md:hidden space-y-3">
          <div
            v-for="item in order.items"
            :key="item.id"
            class="bg-slate-50 rounded-lg p-3 border"
          >
            <div class="font-medium text-sm">{{ item.productName }}</div>
            <div class="flex justify-between text-xs mt-1">
              <span
                >已完工(未入库)<span
                  :class="
                    Number(item.producedQty || 0) >= Number(item.quantity)
                      ? 'text-green-600'
                      : 'text-amber-600'
                  "
                  >{{ item.producedQty || 0 }}/{{ item.quantity }}</span
                ></span
              >
              <span
                >已入库：<span
                  :class="
                    item.fulfilledQuantity >= item.quantity
                      ? 'text-green-600'
                      : 'text-orange-500'
                  "
                  >{{ item.fulfilledQuantity }}/{{ item.quantity }}</span
                ></span
              >
              <span
                >已发货：<span
                  :class="
                    (item.shippedQuantity || 0) >= item.quantity
                      ? 'text-green-600'
                      : 'text-blue-500'
                  "
                  >{{ item.shippedQuantity || 0 }}/{{ item.quantity }}</span
                ></span
              >
            </div>
            <div class="flex justify-between text-xs mt-1 text-slate-500">
              <span>单价：¥{{ item.unitPrice }}</span>
              <span
                >小计：¥{{
                  (Number(item.quantity) * Number(item.unitPrice)).toFixed(2)
                }}</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- 状态操作按钮 -->
      <div
        class="flex gap-2 flex-wrap"
        v-if="order.status !== 'COMPLETED' && order.status !== 'CANCELLED'"
      >
        <template v-if="order.orderType === 'STANDARD'">
          <button
            v-if="order.status === 'PENDING'"
            @click="openApproveModal"
            class="min-h-[44px] px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
          >
            审核通过
          </button>
          <button
            v-if="order.status === 'APPROVED'"
            @click="changeStatus('PRODUCING')"
            class="min-h-[44px] px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm"
          >
            开始生产
          </button>
          <button
            v-if="order.status === 'PRODUCING'"
            @click="changeStatus('READY')"
            class="min-h-[44px] px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition text-sm"
          >
            标记备齐
          </button>
          <button
            v-if="order.status === 'APPROVED'"
            @click="changeStatus('READY')"
            class="min-h-[44px] px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition text-sm"
          >
            生产齐备
          </button>
          <!-- 生产相关操作 -->
          <button
            v-if="order.status === 'PRODUCING'"
            @click="goToProduction"
            class="min-h-[44px] px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition text-sm"
          >
            生产报工
          </button>
          <button
            v-if="order.status === 'APPROVED' || order.status === 'PRODUCING'"
            @click="openReceiptModal"
            class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
          >
            入库
          </button>
          <button
            v-if="order.status === 'APPROVED' || order.status === 'PRODUCING'"
            @click="openReplaceBomModal"
            class="min-h-[44px] px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-sm"
          >
            更换 BOM
          </button>
          <button
            v-if="
              order?.status &&
              ['APPROVED', 'PRODUCING', 'READY'].includes(order.status)
            "
            @click="openShipModal"
            class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
          >
            发货
          </button>
          <button
            v-if="order.status === 'READY' && canComplete"
            @click="changeStatus('COMPLETED')"
            class="min-h-[44px] px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
          >
            确认完成
          </button>
        </template>
        <template v-else>
          <button
            v-if="order.status === 'PENDING'"
            @click="openApproveModal"
            class="min-h-[44px] px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
          >
            审核通过
          </button>
          <button
            v-if="order.status === 'APPROVED'"
            @click="changeStatus('SAMPLING')"
            class="min-h-[44px] px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-sm"
          >
            开始打样
          </button>
          <button
            v-if="order.status === 'SAMPLING'"
            @click="showPickModal = true"
            class="min-h-[44px] px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-sm"
          >
            打样领料
          </button>
          <button
            v-if="order.status === 'SAMPLING'"
            @click="goToCreateBom"
            class="min-h-[44px] px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition text-sm"
          >
            {{ order.orderType === "VARIANT" ? "修改 BOM" : "创建 BOM" }}
          </button>
          <button
            v-if="order.status === 'SAMPLING'"
            @click="changeStatus('SAMPLED')"
            class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
          >
            打样完成
          </button>
          <button
            v-if="order.status === 'SAMPLED'"
            @click="changeStatus('PRODUCING')"
            class="min-h-[44px] px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm"
          >
            开始生产
          </button>
          <button
            v-if="order.status === 'PRODUCING'"
            @click="changeStatus('READY')"
            class="min-h-[44px] px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition text-sm"
          >
            标记备齐
          </button>

          <button
            v-if="order.status === 'READY'"
            @click="changeStatus('COMPLETED')"
            class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
          >
            确认发货
          </button>
        </template>
        <button
          v-if="canEditPrice"
          @click="openPriceModal"
          class="min-h-[44px] px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition text-sm"
        >
          修改价格
        </button>
        <button
          @click="changeStatus('CANCELLED')"
          class="min-h-[44px] px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
        >
          取消
        </button>
      </div>

      <div class="mt-4">
        <NuxtLink
          :to="`/orders/${order.id}/receipts`"
          class="text-blue-500 hover:underline text-sm"
          >查看入库记录 →</NuxtLink
        >
      </div>
    </div>
    <!-- 打印报工单选择弹窗 -->
    <div
      v-if="showPrintModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showPrintModal = false"
      />
      <div class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 class="text-lg font-bold mb-4">选择打印产品</h2>
        <select
          v-model="printOrderItemId"
          class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white mb-4"
        >
          <option value="">请选择产品</option>
          <option v-for="item in order?.items" :key="item.id" :value="item.id">
            {{ item.productName }}
          </option>
        </select>

        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1">
            空白行数 <span class="text-slate-400 text-xs">(默认 20 行)</span>
          </label>
          <input
            v-model.number="printBlankRows"
            type="number"
            min="1"
            max="50"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm"
          />
        </div>

        <div class="flex gap-2">
          <button
            @click="confirmPrint"
            class="flex-1 min-h-[44px] bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition text-sm"
          >
            打印
          </button>
          <button
            @click="showPrintModal = false"
            class="flex-1 min-h-[44px] border py-2 rounded-lg hover:bg-slate-50 transition text-sm"
          >
            取消
          </button>
        </div>
      </div>
    </div>
    <CommonConfirmDialog
      :visible="showConfirmModal"
      :message="confirmMessage"
      :loading="confirmLoading"
      confirm-text="继续"
      cancel-text="取消"
      @confirm="handleConfirm"
      @cancel="showConfirmModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { OrderStatus } from "~~/prisma/generated/client";
definePageMeta({ middleware: ["auth" as any] });

// ==================== 基础工具 ====================
const { apiFetch } = useApi();
const toast = useToast();
const route = useRoute();
const showMoreMenu = ref(false);
//自定义警告弹窗
const showConfirmModal = ref(false);
const confirmMessage = ref("");
const confirmLoading = ref(false);
const pendingConfirmAction = ref<(() => Promise<void>) | null>(null);

const showConfirm = (message: string, onConfirm: () => Promise<void>) => {
  confirmMessage.value = message;
  pendingConfirmAction.value = onConfirm;
  showConfirmModal.value = true;
};

const handleConfirm = async () => {
  if (!pendingConfirmAction.value) return;
  confirmLoading.value = true;
  try {
    await pendingConfirmAction.value();
    showConfirmModal.value = false;
  } finally {
    confirmLoading.value = false;
    pendingConfirmAction.value = null;
  }
};
// ==================== 订单数据 ====================
const {
  data: order,
  loading,
  execute: loadOrder,
} = useApiFetch<any>(() => `/api/orders/${route.params.id}`);
await loadOrder();

// ==================== 库存与产品基础数据 ====================
const inventoryMap = ref<Record<string, any>>({});

const { data: locationsData } = await useFetch(
  "/api/locations?status=ACTIVE&limit=200",
);
const activeLocations = computed(
  () => (locationsData.value as any)?.data || [],
);
const defaultLocation = computed(() =>
  activeLocations.value.find((l: any) => l.isDefault),
);

const { data: productsData } = await useFetch("/api/products?limit=500");
const allProducts = computed(() => (productsData.value as any)?.data || []);

// ==================== 入库弹窗 ====================
const showReceiptModal = ref(false);
const receiptForm = reactive({
  orderItemId: "",
  quantity: 1,
  remark: "",
  locationId: "",
});

const openReceiptModal = () => {
  receiptForm.orderItemId = "";
  receiptForm.quantity = 1;
  receiptForm.remark = "";
  receiptForm.locationId = defaultLocation.value?.id || ""; // 自动选默认库位
  showReceiptModal.value = true;
};

const receiptUnit = computed(() => {
  if (!receiptForm.orderItemId) return "";
  const item = order.value?.items?.find(
    (i: any) => i.id === receiptForm.orderItemId,
  );
  if (!item) return "";
  const p = allProducts.value.find((p: any) => p.id === item.productId);
  return p?.unit || "";
});

/**
 * 提交入库
 * 后端返回 { receipt, warnings }
 * warnings 为倒冲物料缺口警告，非空时弹窗展示
 */

const doReceipt = async () => {
  // 入库提交逻辑
  const result = await apiFetch<any>(
    `/api/orders/${route.params.id}/receipts`,
    {
      method: "POST",
      body: {
        orderItemId: receiptForm.orderItemId,
        quantity: receiptForm.quantity,
        remark: receiptForm.remark,
        locationId: receiptForm.locationId || undefined,
      },
    },
  );

  // 处理字符串警告
  const stringWarnings = (result?.warnings || []).filter(
    (w: any) => typeof w === "string",
  );
  if (stringWarnings.length > 0) {
    toast.error(stringWarnings.join("；"));
  }

  // 处理结构化缺口警告
  const shortageList = (result?.warnings || []).filter(
    (w: any) => typeof w === "object" && w.productId,
  );

  if (shortageList.length > 0) {
    shortageWarnings.value = shortageList;
    showShortageModal.value = true;
    showReceiptModal.value = false;
  } else {
    if (stringWarnings.length === 0) {
      toast.success("入库成功");
    }
    showReceiptModal.value = false;
  }

  await loadOrder();
};
const handleReceipt = async () => {
  if (!receiptForm.orderItemId) return toast.error("请选择产品");

  const item = order.value?.items?.find(
    (i: any) => i.id === receiptForm.orderItemId,
  );
  const producedQty = Number(item?.producedQty || 0);
  const receiptQty = Number(receiptForm.quantity);

  if (receiptQty > producedQty) {
    showConfirm(
      `完工数 ${producedQty} 小于本次入库数 ${receiptQty}，是否继续入库？`,
      doReceipt,
    );
    return;
  }

  await doReceipt();
};

// ==================== 倒冲缺口警告弹窗 ====================
const showShortageModal = ref(false);

interface ShortageWarning {
  productId: string;
  productName: string;
  shortageQty: string;
}

const shortageWarnings = ref<ShortageWarning[]>([]);
//替代料弹窗
const showSubstitutionModal = ref(false);
const substitutions = ref<any[]>([]);

const openSubstitutionViewer = async () => {
  try {
    const res = await apiFetch<any>(
      `/api/material-substitutions?orderId=${route.params.id}`,
    );
    substitutions.value = res.data || [];
    showSubstitutionModal.value = true;
  } catch (e: any) {
    toast.error(e, "加载替代记录失败");
  }
};
// ===================== 倒冲替代料 =====================
const showSubstitutePicker = ref<number | null>(null);
const substituteSearch = ref("");
const substituteQty = ref(0);

/**
 * 过滤可选替代料
 * 小厂场景：任意物料均可选作替代料，不做类别限制
 */
const filteredSubstituteProducts = computed(() => {
  if (!substituteSearch.value.trim()) {
    return allProducts.value.filter(
      (p: any) =>
        p.category === "RAW" ||
        p.category === "PACKAGING" ||
        p.category === "SEMI",
    );
  }
  const q = substituteSearch.value.toLowerCase();
  return allProducts.value.filter(
    (p: any) =>
      (p.category === "RAW" ||
        p.category === "PACKAGING" ||
        p.category === "SEMI") &&
      (p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)),
  );
});

/**
 * 打开替代料选择器
 * @param index 缺口警告在 shortageWarnings 中的索引
 */
const openSubstitutePicker = (index: number) => {
  showSubstitutePicker.value = index;
  substituteSearch.value = "";
  substituteQty.value = Number(shortageWarnings.value[index]?.shortageQty || 0);
};

/**
 * 选择替代料并提交
 * @param p 选中的替代料产品对象
 */
const selectSubstitute = async (p: any) => {
  if (showSubstitutePicker.value === null) return;
  const warning = shortageWarnings.value[showSubstitutePicker.value];
  if (!warning) return;

  try {
    await apiFetch(`/api/inventory/substitute`, {
      method: "POST",
      body: {
        productId: warning.productId,
        substituteProductId: p.id,
        quantity: Number(warning.shortageQty),
        orderId: order.value?.id,
        orderItemId: receiptForm.orderItemId,
        remark: `替代 ${warning.productName} 缺口`,
      },
    });

    // 替代完成后从警告列表移除该条缺口
    shortageWarnings.value.splice(showSubstitutePicker.value, 1);
    showSubstitutePicker.value = null;

    // 所有缺口处理完毕则关闭弹窗
    if (shortageWarnings.value.length === 0) {
      showShortageModal.value = false;
      toast.success("替代完成");
    } else {
      toast.success("替代成功");
    }
  } catch (e: any) {
    toast.error(e, "替代失败");
  }
};
// ==================== 物料需求查看 ====================
const showMaterialRequirements = ref(false);
const materialRequirements = ref<any[]>([]);

watch(showMaterialRequirements, async (val) => {
  if (val && materialRequirements.value.length === 0) {
    try {
      const res = await $fetch(
        `/api/orders/${route.params.id}/material-requirements`,
      );
      materialRequirements.value = (res as any)?.data || [];
    } catch {
      materialRequirements.value = [];
    }
  }
});

// ==================== 修改价格 ====================
const showPriceModal = ref(false);
const priceEdits = reactive<Record<string, number>>({});

const canEditPrice = computed(() => {
  const s = order.value?.status;
  return s && !["PRODUCING", "READY", "COMPLETED", "CANCELLED"].includes(s);
});

const openPriceModal = () => {
  if (order.value?.items)
    for (const item of order.value.items)
      priceEdits[item.id] = Number(item.unitPrice) || 0;
  showPriceModal.value = true;
};

const handleUpdatePrice = async () => {
  const itemsToUpdate = (order.value?.items || [])
    .filter(
      (item: any) =>
        priceEdits[item.id] !== undefined &&
        priceEdits[item.id] !== Number(item.unitPrice),
    )
    .map((item: any) => ({ id: item.id, unitPrice: priceEdits[item.id] }));
  if (itemsToUpdate.length === 0) {
    toast.error("没有修改任何单价");
    return;
  }
  try {
    await apiFetch(`/api/orders/${route.params.id}/update`, {
      method: "PATCH",
      body: { items: itemsToUpdate },
    });
    toast.success("单价已更新");
    showPriceModal.value = false;
    await loadOrder();
  } catch (e: any) {
    toast.error(e, "修改失败");
  }
};

const goToProduction = async () => {
  try {
    const data = await apiFetch<any>(`/api/orders/${order.value?.id}/plans`);
    if (!data.data || data.data.length === 0) {
      toast.error("该订单暂无工序计划");
      return;
    }
    await navigateTo(`/orders/${order.value?.id}/production`);
  } catch (e: any) {
    toast.error(e, "检查工序失败");
  }
};
// ==================== 工序查看与编辑 ====================
const showProcessViewer = ref(false);
const processPlans = ref<any[]>([]);

const canEditPlans = computed(() => {
  const s = order.value?.status;
  return s && ["APPROVED", "PRODUCING"].includes(s);
});

/**
 * 按产品分组的工序计划
 * 每个产品包含 orderItemId，确保工序删光后仍能新增
 */
const productGroups = computed(() => {
  const map = new Map<
    string,
    {
      productId: string;
      orderItemId: string;
      productName: string;
      plans: any[];
    }
  >();

  // 先遍历工序计划，按产品分组
  for (const plan of processPlans.value) {
    const key = plan.orderItemId || plan.productId;
    if (!map.has(key)) {
      map.set(key, {
        productId: plan.productId || "",
        orderItemId: plan.orderItemId || "",
        productName:
          plan.product?.name || plan.orderItem?.productName || "未知产品",
        plans: [],
      });
    }
    map.get(key)!.plans.push(plan);
  }

  // 补全订单明细中可能没有工序计划的产品
  if (order.value?.items) {
    for (const item of order.value.items) {
      const existing = [...map.values()].find((g) => g.orderItemId === item.id);
      if (!existing) {
        map.set(`empty_${item.id}`, {
          productId: item.productId,
          orderItemId: item.id,
          productName: item.productName,
          plans: [],
        });
      }
    }
  }

  return [...map.values()];
});

const openProcessViewer = async () => {
  try {
    const data = await apiFetch<any>(`/api/orders/${order.value?.id}/plans`);
    processPlans.value = data.data || [];
    showProcessViewer.value = true;
  } catch (e: any) {
    toast.error(e, "加载工序失败");
  }
};

// ==================== 添加工序 ====================
const showAddPlanModal = ref(false);
const addPlanForm = reactive({
  orderItemId: "",
  productId: "",
  productName: "",
  selectedTemplateId: "",
  processName: "",
  sequence: 1,
  wageType: "HOURLY",
  hourlyRate: 0,
  unitPrice: 0,
  standardHours: 0,
});

const productTemplates = ref<any[]>([]);

const openAddPlan = async (product: any) => {
  if (!product.orderItemId) {
    toast.error("找不到对应订单明细");
    return;
  }

  addPlanForm.orderItemId = product.orderItemId;
  addPlanForm.productId = product.productId;
  addPlanForm.productName = product.productName;
  addPlanForm.selectedTemplateId = "";
  addPlanForm.processName = "";
  addPlanForm.sequence = product.plans.length + 1;
  addPlanForm.wageType = "HOURLY";
  addPlanForm.hourlyRate = 0;
  addPlanForm.unitPrice = 0;
  addPlanForm.standardHours = 0;

  // 加载该产品的工序模板
  try {
    const res = await $fetch(`/api/routings?productId=${product.productId}`);
    productTemplates.value = (res as any)?.data || [];
  } catch {
    productTemplates.value = [];
  }

  showAddPlanModal.value = true;
};

// 选择模板后自动填充表单
const onTemplateSelected = () => {
  if (!addPlanForm.selectedTemplateId) return;
  const template = productTemplates.value.find(
    (t: any) => t.id === addPlanForm.selectedTemplateId,
  );
  if (!template) return;

  addPlanForm.processName = template.processName;
  addPlanForm.wageType = template.wageType || "HOURLY";
  addPlanForm.hourlyRate = template.hourlyRate
    ? Number(template.hourlyRate)
    : 0;
  addPlanForm.unitPrice = template.unitPrice ? Number(template.unitPrice) : 0;
  addPlanForm.standardHours = template.standardHours
    ? Number(template.standardHours)
    : 0;
};

const confirmAddPlan = async () => {
  if (!addPlanForm.orderItemId) return toast.error("订单明细不完整");
  if (!addPlanForm.processName.trim()) return toast.error("请输入或选择工序");

  try {
    await apiFetch(`/api/orders/${route.params.id}/plan-add`, {
      method: "POST",
      body: {
        orderItemId: addPlanForm.orderItemId,
        plan: {
          sequence: addPlanForm.sequence,
          processName: addPlanForm.processName,
          wageType: addPlanForm.wageType,
          standardHours: addPlanForm.standardHours || undefined,
          hourlyRate: addPlanForm.hourlyRate || undefined,
          unitPrice: addPlanForm.unitPrice || undefined,
        },
      },
    });
    toast.success("工序已添加");
    showAddPlanModal.value = false;
    await openProcessViewer();
  } catch (e: any) {
    toast.error(e, "添加工序失败");
  }
};

// ==================== 删除工序 ====================
const removePlan = async (plan: any) => {
  if (!confirm(`确认删除工序「${plan.processName}」？`)) return;

  try {
    await apiFetch(`/api/orders/${route.params.id}/plan-delete`, {
      method: "POST",
      body: { planId: plan.id },
    });
    toast.success("工序已删除");
    await openProcessViewer();
  } catch (e: any) {
    toast.error(e, "删除工序失败");
  }
};

// ==================== 发货 ====================
const showShipModal = ref(false);
const shipQtys = reactive<Record<string, number>>({});
const shipLocationId = ref("");

const getAvailableStock = (productId: string) => {
  const inv = inventoryMap.value[productId];
  if (!inv) return 0;
  return Math.max(0, inv.quantity - (inv.reservedQty || 0));
};

const openShipModal = async () => {
  try {
    const data = await $fetch("/api/inventory?limit=500");
    const map: Record<string, any> = {};
    if ((data as any)?.data)
      (data as any).data.forEach((inv: any) => {
        map[inv.productId] = inv;
      });
    inventoryMap.value = map;
  } catch (e) {
    console.error("获取库存失败", e);
  }
  order.value?.items?.forEach((item: any) => {
    const need = item.quantity - (item.shippedQuantity || 0);
    const stock = inventoryMap.value[item.productId];
    const available = stock
      ? Math.max(0, stock.quantity - stock.reservedQty)
      : 0;
    shipQtys[item.id] = Math.min(need, available);
  });
  shipLocationId.value = "";
  showShipModal.value = true;
};

const confirmShip = async () => {
  const shipments =
    order.value?.items
      ?.filter((item: any) => (shipQtys[item.id] || 0) > 0)
      .map((item: any) => ({
        orderItemId: item.id,
        quantity: shipQtys[item.id],
      })) || [];
  if (shipments.length === 0) {
    toast.error("请至少输入一个出库数量");
    return;
  }
  try {
    await apiFetch(`/api/orders/${route.params.id}/ship`, {
      method: "POST",
      body: { items: shipments, locationId: shipLocationId.value || undefined },
    });
    toast.success("发货成功");
    showShipModal.value = false;
    await loadOrder();
  } catch (e: any) {
    toast.error(e, "发货失败");
  }
};

const canComplete = computed(() =>
  order.value?.items?.every(
    (item: any) => (item.shippedQuantity || 0) >= item.quantity,
  ),
);

// ==================== 审核预留 ====================
const showApproveModal = ref(false);
const reserveInputs = reactive<Record<string, number>>({});

const openApproveModal = async () => {
  if (order.value?.orderType !== "STANDARD") {
    // 变型品/定制品：直接确认审批
    if (confirm("确认审核通过该订单？审批通过后可开始打样流程。")) {
      await changeStatus("APPROVED");
    }
    return;
  }

  // 标准品：弹预留设置
  order.value?.items.forEach((item: any) => {
    reserveInputs[item.id] = 0;
  });
  try {
    const data = await $fetch("/api/inventory?limit=500");
    const map: Record<string, any> = {};
    if ((data as any)?.data)
      (data as any).data.forEach((inv: any) => {
        map[inv.productId] = inv;
      });
    inventoryMap.value = map;
  } catch (e) {
    console.error("获取库存失败", e);
  }
  showApproveModal.value = true;
};

const handleApproveWithReservations = async () => {
  const reservations =
    order.value?.items.map((item: any) => ({
      orderItemId: item.id,
      quantity: reserveInputs[item.id] || 0,
    })) || [];

  try {
    // 先查物料需求
    const reqRes = (await $fetch(
      `/api/orders/${route.params.id}/material-requirements`,
    )) as any;
    const shortages = (reqRes.data || []).filter((m: any) => m.shortage > 0);

    if (shortages.length > 0) {
      const msg = shortages
        .map(
          (m: any) =>
            `${m.productName}: 需求${m.demand}，可用${m.effectiveAvailable}，缺口${m.shortage}`,
        )
        .join("\n");
      if (!confirm(`以下物料可能不足：\n\n${msg}\n\n是否继续审批？`)) return;
    }

    await apiFetch(`/api/orders/${route.params.id}/status`, {
      method: "PATCH",
      body: { status: "APPROVED", reservations },
    });
    toast.success("审核通过并预留成功");
    showApproveModal.value = false;
    await loadOrder();
  } catch (e: any) {
    toast.error(e, "审核失败");
  }
};

// ==================== 状态变更 ====================
const changeStatus = async (status: string) => {
  try {
    await apiFetch(`/api/orders/${route.params.id}/status`, {
      method: "PATCH",
      body: { status },
    });
    if (order.value) order.value.status = status as OrderStatus;
    toast.success("状态更新成功");
    await loadOrder();
  } catch (e: any) {
    toast.error(e, "状态更新失败");
  }
};

// ==================== 打样领料 ====================
const showPickModal = ref(false);
const pickForm = reactive({ orderItemId: "", quantity: 1, locationId: "" });
const showPickProductPicker = ref<number | null>(null);
const pickProductSearch = ref("");
const pickItems = reactive<
  Array<{
    productId: string;
    productCode: string;
    productName: string;
    quantity: number;
    unit: string;
  }>
>([{ productId: "", productCode: "", productName: "", quantity: 1, unit: "" }]);

const pickUnit = computed(() => {
  if (!pickForm.orderItemId) return "";
  const item = order.value?.items?.find(
    (i: any) => i.id === pickForm.orderItemId,
  );
  if (!item) return "";
  const p = allProducts.value.find((p: any) => p.id === item.productId);
  return p?.unit || "";
});

const filteredPickProducts = computed(() => {
  if (!pickProductSearch.value.trim()) return allProducts.value;
  const q = pickProductSearch.value.toLowerCase();
  return allProducts.value.filter(
    (p: any) =>
      p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q),
  );
});

const openPickProductPicker = (i: number) => {
  showPickProductPicker.value = i;
  pickProductSearch.value = "";
};

const selectPickProduct = (i: number, p: any) => {
  const item = pickItems[i]!;
  item.productId = p.id;
  item.productCode = p.code;
  item.productName = p.name;
  item.unit = p.unit || "";
  showPickProductPicker.value = null;
};

const handlePick = async () => {
  const validItems = pickItems.filter((i) => i.productId && i.quantity > 0);
  if (validItems.length === 0) return toast.error("请至少添加一条领料明细");

  try {
    for (const item of validItems) {
      await apiFetch(`/api/inventory/${item.productId}/outbound`, {
        method: "POST",
        body: {
          quantity: item.quantity,
          type: "SAMPLE_OUT",
          relatedCode: order.value?.orderCode,
          remark: `打样领料：${order.value?.orderCode} ${item.productName}`,
        },
      });
    }
    toast.success(`成功领料 ${validItems.length} 种物料`);
    showPickModal.value = false;
    pickItems.length = 1;
    pickItems[0] = {
      productId: "",
      productCode: "",
      productName: "",
      quantity: 1,
      unit: "",
    };
  } catch (e: any) {
    toast.error(e, "领料失败");
  }
};

// ==================== BOM 跳转 ====================
const goToCreateBom = async () => {
  const item = order.value?.items?.[0];
  if (!item) return;

  try {
    const res = await apiFetch<any>(
      `/api/bom?productId=${item.productId}&limit=1`,
    );
    const bomId = res.data?.[0]?.id;
    if (bomId) {
      await navigateTo(`/bom/${bomId}`);
    } else {
      await navigateTo(
        `/bom/create?productId=${item.productId}&productName=${encodeURIComponent(item.productName)}&orderId=${order.value!.id}`,
      );
    }
  } catch {
    await navigateTo(
      `/bom/create?productId=${item.productId}&productName=${encodeURIComponent(item.productName)}&orderId=${order.value!.id}`,
    );
  }
};
// ==================== 更换 BOM ====================
const showReplaceBomModal = ref(false);
const replaceBomForm = reactive({
  orderItemId: "",
});
const replaceBomRows = reactive<
  Array<{
    oldMaterialId: string;
    oldMaterialName: string;
    oldQuantity: number;
    newMaterialId: string;
    newMaterialName: string;
    newQuantity: number | null;
  }>
>([]);

const currentBomItems = ref<any[]>([]);
const showOldMaterialPicker = ref<number | null>(null);
const showNewMaterialPicker = ref<number | null>(null);
const newMaterialSearch = ref("");

const filteredNewMaterials = computed(() => {
  if (!newMaterialSearch.value.trim()) {
    return allProducts.value.filter(
      (p: any) =>
        p.category === "RAW" ||
        p.category === "PACKAGING" ||
        p.category === "SEMI",
    );
  }
  const q = newMaterialSearch.value.toLowerCase();
  return allProducts.value.filter(
    (p: any) =>
      (p.category === "RAW" ||
        p.category === "PACKAGING" ||
        p.category === "SEMI") &&
      (p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)),
  );
});

const openReplaceBomModal = async () => {
  replaceBomForm.orderItemId = "";
  replaceBomRows.length = 0;
  currentBomItems.value = [];
  showReplaceBomModal.value = true;
};

const addReplaceBomRow = () => {
  replaceBomRows.push({
    oldMaterialId: "",
    oldMaterialName: "",
    oldQuantity: 1,
    newMaterialId: "",
    newMaterialName: "",
    newQuantity: null,
  });
};

// 选择订单明细产品后，加载当前 BOM 子物料
watch(
  () => replaceBomForm.orderItemId,
  async (val) => {
    if (!val) return;
    try {
      const item = order.value?.items?.find((i: any) => i.id === val);
      if (!item?.bomId) return;
      const bom = await $fetch(`/api/bom/${item.bomId}`);
      currentBomItems.value = (bom as any)?.items || [];
    } catch {
      currentBomItems.value = [];
    }
  },
);

const openOldMaterialPicker = (index: number) => {
  showOldMaterialPicker.value = index;
};

const selectOldMaterial = (index: number, material: any) => {
  const row = replaceBomRows[index];
  if (!row) return;
  row.oldMaterialId = material.materialId;
  row.oldMaterialName = material.materialName;
  row.oldQuantity = Number(material.quantity);
  if (row.newQuantity === null) row.newQuantity = Number(material.quantity);
  showOldMaterialPicker.value = null;
};

const openNewMaterialPicker = (index: number) => {
  showNewMaterialPicker.value = index;
  newMaterialSearch.value = "";
};

const selectNewMaterial = (index: number, product: any) => {
  const row = replaceBomRows[index];
  if (!row) return;
  row.newMaterialId = product.id;
  row.newMaterialName = product.name;
  showNewMaterialPicker.value = null;
};

const handleReplaceBom = async () => {
  if (!replaceBomForm.orderItemId) return toast.error("请选择产品");
  const validRows = replaceBomRows.filter(
    (r) => r.oldMaterialId && r.newMaterialId,
  );
  if (validRows.length === 0) return toast.error("请至少添加一条替换明细");

  try {
    const result = await apiFetch<any>(
      `/api/orders/${route.params.id}/replace-bom`,
      {
        method: "POST",
        body: {
          orderItemId: replaceBomForm.orderItemId,
          replacements: validRows.map((r) => ({
            oldMaterialId: r.oldMaterialId,
            newMaterialId: r.newMaterialId,
            newQuantity: r.newQuantity || undefined,
          })),
        },
      },
    );

    // 处理预留不足警告
    if (result?.warnings && result.warnings.length > 0) {
      toast.error(
        `BOM 更换成功，但请注意以下物料预留不足：${result.warnings.join("；")}`,
      );
    } else {
      toast.success("BOM 更换成功");
    }

    showReplaceBomModal.value = false;
    await loadOrder();
  } catch (e: any) {
    toast.error(e, "BOM 更换失败");
  }
};
//========================打印报工单================================================
const showPrintModal = ref(false);
const printOrderItemId = ref("");
const printBlankRows = ref(20);
const openPrintModal = () => {
  if (!order.value?.items || order.value.items.length === 0) {
    toast.error("订单无明细");
    return;
  }

  // 默认选中第一个产品
  printOrderItemId.value = order.value.items[0].id;
  printBlankRows.value = 20;
  showPrintModal.value = true;
};

const confirmPrint = async () => {
  if (!printOrderItemId.value) {
    toast.error("请选择产品");
    return;
  }

  try {
    const blob = await $fetch<Blob>(
      `/api/documents/production/${order.value.id}/pdf?orderItemId=${printOrderItemId.value}&blankRows=${printBlankRows.value}`,
      { responseType: "blob" },
    );
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    showPrintModal.value = false;
  } catch (e: any) {
    toast.error(e?.data?.message || "打印失败");
  }
};
// ==================== 工具函数 ====================
const getProductUnit = (productId: string) => {
  const p = allProducts.value.find((p: any) => p.id === productId);
  return p?.unit || "";
};

const typeLabel = (t: string) =>
  ({ STANDARD: "标准品", VARIANT: "变型品", CUSTOM: "定制品" })[t] || t;

const statusLabel = (s: string) =>
  ({
    PENDING: "待审核",
    APPROVED: "已审核",
    SAMPLING: "打样中",
    SAMPLED: "打样完成",
    PRODUCING: "生产中",
    READY: "备货完成",
    COMPLETED: "已完成",
    CANCELLED: "已取消",
  })[s] || s;

const statusIcon = (s: string) =>
  ({
    PENDING: "⏳",
    APPROVED: "✅",
    SAMPLING: "🔬",
    SAMPLED: "📋",
    PRODUCING: "🏭",
    READY: "📦",
    COMPLETED: "🏁",
    CANCELLED: "❌",
  })[s] || "";

const statusBadge = (s: string) => {
  const m: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800 border-amber-300",
    APPROVED: "bg-blue-100 text-blue-800 border-blue-300",
    SAMPLING: "bg-orange-100 text-orange-800 border-orange-300",
    SAMPLED: "bg-teal-100 text-teal-800 border-teal-300",
    PRODUCING: "bg-purple-100 text-purple-800 border-purple-300",
    READY: "bg-cyan-100 text-cyan-800 border-cyan-300",
    COMPLETED: "bg-green-100 text-green-800 border-green-300",
    CANCELLED: "bg-red-100 text-red-800 border-red-300",
  };
  return `inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${m[s] || "bg-slate-100 text-slate-600 border-slate-300"}`;
};

const formatDate = (d: string) => new Date(d).toLocaleDateString("zh-CN");
</script>
