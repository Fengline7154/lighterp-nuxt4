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
          v-if="order?.status === 'APPROVED' || order?.status === 'PRODUCING'"
          @click="openReceiptModal"
          class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
        >
          入库
        </button>
        <button
          v-if="order?.status === 'PRODUCING'"
          @click="goToProduction"
          class="min-h-[44px] px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition text-sm"
        >
          生产报工
        </button>
        <button
          v-if="
            order?.status &&
            ['PRODUCING', 'READY', 'COMPLETED'].includes(order.status)
          "
          @click="openProcessViewer"
          class="min-h-[44px] px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition text-sm"
        >
          查看工序
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

    <!-- 报工弹窗 -->
    <div
      v-if="showProcessViewer"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showProcessViewer = false"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-auto"
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
            <NuxtLink
              :to="`/products/${product.productId}/routing?from=order&orderId=${order?.id}`"
              class="text-xs text-indigo-500 hover:text-indigo-700"
            >
              工序配置 →
            </NuxtLink>
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
              <span>{{ plan.processName }}</span>
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
            >去报工</NuxtLink
          >
          <span
            v-else
            class="flex-1 text-center min-h-[44px] py-2 bg-slate-300 text-slate-500 rounded-lg text-sm"
            >暂无工序，无法报工</span
          >
          <button
            @click="showProcessViewer = false"
            class="flex-1 min-h-[44px] border py-2 rounded-lg hover:bg-slate-50 transition text-sm"
          >
            关闭
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
  </div>
</template>

<script setup lang="ts">
import type { OrderStatus } from "~~/prisma/generated/client";
definePageMeta({ middleware: ["auth" as any] });

const showReceiptModal = ref(false);
const receiptForm = reactive({
  orderItemId: "",
  quantity: 1,
  remark: "",
  locationId: "",
});
const showPickModal = ref(false);
const pickForm = reactive({ orderItemId: "", quantity: 1, locationId: "" });
const showApproveModal = ref(false);
const reserveInputs = reactive<Record<string, number>>({});
const inventoryMap = ref<Record<string, any>>({});
const showShipModal = ref(false);
const shipQtys = reactive<Record<string, number>>({});
const shipLocationId = ref("");

const { apiFetch } = useApi();
const toast = useToast();
const route = useRoute();
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
// 替换 useFetch → useApiFetch
const {
  data: order,
  loading,
  execute: loadOrder,
} = useApiFetch<any>(() => `/api/orders/${route.params.id}`);
await loadOrder();
//物料需求计算相关
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

const showPriceModal = ref(false);
const priceEdits = reactive<Record<string, number>>({});
const showProcessViewer = ref(false);
const processPlans = ref<any[]>([]);

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

const openReceiptModal = () => {
  receiptForm.orderItemId = "";
  receiptForm.quantity = 1;
  receiptForm.remark = "";
  receiptForm.locationId = defaultLocation.value?.id || ""; // 自动选默认
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

const pickUnit = computed(() => {
  if (!pickForm.orderItemId) return "";
  const item = order.value?.items?.find(
    (i: any) => i.id === pickForm.orderItemId,
  );
  if (!item) return "";
  const p = allProducts.value.find((p: any) => p.id === item.productId);
  return p?.unit || "";
});

const getProductUnit = (productId: string) => {
  const p = allProducts.value.find((p: any) => p.id === productId);
  return p?.unit || "";
};

const goToCreateBom = async () => {
  const item = order.value?.items?.[0];
  if (!item) return;

  // 查该产品已关联的 BOM
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

const productGroups = computed(() => {
  const map = new Map<
    string,
    { productId: string; productName: string; plans: any[] }
  >();
  for (const plan of processPlans.value) {
    const key = plan.productId || plan.orderItemId;
    if (!map.has(key))
      map.set(key, {
        productId: plan.productId || plan.orderItem?.productId || "",
        productName:
          plan.product?.name || plan.orderItem?.productName || "未知产品",
        plans: [],
      });
    map.get(key)!.plans.push(plan);
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

const canComplete = computed(() =>
  order.value?.items?.every(
    (item: any) => (item.shippedQuantity || 0) >= item.quantity,
  ),
);

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
const getAvailableStock = (productId: string) => {
  const inv = inventoryMap.value[productId];
  if (!inv) return 0;
  return Math.max(0, inv.quantity - (inv.reservedQty || 0));
};

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

    const result = await apiFetch(`/api/orders/${route.params.id}/status`, {
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

const handleReceipt = async () => {
  if (!receiptForm.orderItemId) return toast.error("请选择产品");
  try {
    await apiFetch(`/api/orders/${route.params.id}/receipts`, {
      method: "POST",
      body: {
        orderItemId: receiptForm.orderItemId,
        quantity: receiptForm.quantity,
        remark: receiptForm.remark,
        locationId: receiptForm.locationId || undefined,
      },
    });
    toast.success("入库成功");
    showReceiptModal.value = false;
    await loadOrder();
  } catch (e: any) {
    toast.error(e, "入库失败");
  }
};

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
</script>
