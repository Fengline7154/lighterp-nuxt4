<template>
  <div>
    <div class="flex justify-between items-center mb-6 flex-wrap gap-2">
      <h1 class="text-xl lg:text-2xl font-bold">库存管理</h1>

      <div class="flex gap-2 flex-wrap">
        <button
          @click="showLocationSearch = true"
          class="min-h-[44px] px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm"
        >
          库位查询
        </button>
        <NuxtLink
          to="/inventory/init"
          class="min-h-[44px] px-3 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition text-sm flex items-center"
        >
          初始化库存
        </NuxtLink>
        <button
          @click="openActionModal('general', 'in')"
          class="min-h-[44px] px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
        >
          通用入库
        </button>
        <button
          @click="openActionModal('general', 'out')"
          class="min-h-[44px] px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
        >
          通用出库
        </button>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="mb-4 flex gap-2">
      <input
        v-model="keyword"
        @keydown.enter="doSearch"
        placeholder="搜索产品编码/名称..."
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition w-full sm:w-64"
      />
      <button
        @click="doSearch"
        class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
      >
        搜索
      </button>
    </div>

    <!-- 桌面端表格 -->
    <div class="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full min-w-[800px] whitespace-nowrap">
        <thead>
          <tr class="border-b bg-slate-100">
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase cursor-pointer select-none"
              @click="toggleSort('productId')"
            >
              产品编号 {{ sortIcon("productId") }}
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              产品名
            </th>
            <th
              class="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase cursor-pointer select-none"
              @click="toggleSort('quantity')"
            >
              总库存 {{ sortIcon("quantity") }}
            </th>
            <th
              class="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              可用库存
            </th>
            <th
              class="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              预留量
            </th>
            <th
              class="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              缺口
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase cursor-pointer select-none"
              @click="toggleSort('updatedAt')"
            >
              更新时间 {{ sortIcon("updatedAt") }}
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
            v-for="inv in items"
            :key="inv.id"
            class="hover:bg-blue-50/30 even:bg-slate-50/50 transition"
          >
            <td class="px-4 py-3 text-sm font-mono">
              {{ inv.productCode || inv.productId?.substring(0, 8) + "..." }}
            </td>
            <td class="px-4 py-3 text-sm font-medium">{{ inv.productName }}</td>
            <td class="px-4 py-3 text-sm text-right font-medium">
              {{ inv.quantity }}
            </td>
            <td class="px-4 py-3 text-sm text-right font-medium">
              <span
                v-if="Number(inv.availableQty) < 0"
                class="text-red-500 font-bold"
              >
                {{ inv.availableQty }}
                <span class="text-[10px] ml-1">(库存不足)</span>
              </span>
              <span v-else class="text-blue-600">{{
                inv.availableQty ?? "0"
              }}</span>
            </td>
            <td class="px-4 py-3 text-sm text-right text-slate-500">
              {{ inv.reservedQty || "0" }}
            </td>
            <td class="px-4 py-3 text-sm text-center">
              <span v-if="Number(inv.shortageQty) > 0" class="font-medium">
                <span class="text-red-500">{{ inv.shortageQty }}</span>
                <span
                  v-if="inv.category === 'SEMI'"
                  class="ml-1 text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded"
                  >需生产</span
                >
                <span
                  v-else
                  class="ml-1 text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded"
                  >待采购</span
                >
              </span>
              <span v-else class="text-slate-400">0</span>
            </td>
            <td class="px-4 py-3 text-sm text-slate-500">
              {{ formatDate(inv.updatedAt) }}
            </td>

            <!-- 桌面端操作列 -->
            <td class="px-4 py-3 text-sm text-center">
              <div class="relative inline-block">
                <button
                  @click.stop="toggleDesktopMenu(inv.id, $event)"
                  class="min-h-[32px] px-3 py-1 bg-slate-100 text-slate-600 rounded text-xs hover:bg-slate-200 transition"
                >
                  操作 ▾
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <Teleport to="body">
      <div
        v-if="desktopMenuId"
        :style="desktopMenuStyle"
        data-desktop-menu
        class="fixed bg-white border border-slate-200 rounded-lg shadow-lg z-[9999] py-1 min-w-[120px]"
      >
        <button
          v-for="opt in allActions"
          :key="opt.type"
          @click="selectDesktopAction(opt.type)"
          class="block w-full text-left px-4 py-2 text-sm hover:bg-slate-50 min-h-[36px]"
        >
          {{ opt.label }}
        </button>
      </div>
    </Teleport>
    <!-- 移动端卡片 -->
    <div class="md:hidden space-y-3">
      <div
        v-for="inv in items"
        :key="inv.id"
        class="bg-white rounded-xl shadow p-4 space-y-2"
      >
        <div class="flex justify-between items-center">
          <span class="font-mono text-sm">{{
            inv.productCode || inv.productId?.substring(0, 8) + "..."
          }}</span>
          <span class="text-xs text-slate-400">{{
            formatDate(inv.updatedAt)
          }}</span>
        </div>
        <div class="font-medium">{{ inv.productName }}</div>
        <div class="grid grid-cols-4 gap-2 text-center text-sm">
          <div>
            <span class="text-xs text-slate-400 block">总库存</span>
            {{ inv.quantity }}
          </div>
          <div>
            <span class="text-xs text-slate-400 block">可用</span>
            <span
              v-if="Number(inv.availableQty) < 0"
              class="text-red-500 font-bold"
            >
              {{ inv.availableQty }}
              <span class="text-[10px]">(不足)</span>
            </span>
            <span v-else class="text-blue-600">{{
              inv.availableQty ?? "0"
            }}</span>
          </div>
          <div>
            <span class="text-xs text-slate-400 block">预留</span>
            {{ inv.reservedQty || "0" }}
          </div>
          <div>
            <span class="text-xs text-slate-400 block">缺口</span>
            <span v-if="Number(inv.shortageQty) > 0">
              <span class="text-red-500">{{ inv.shortageQty }}</span>
              <span
                v-if="inv.category === 'SEMI'"
                class="ml-0.5 text-[10px] px-1 py-0.5 bg-amber-100 text-amber-700 rounded"
                >需生产</span
              >
              <span
                v-else
                class="ml-0.5 text-[10px] px-1 py-0.5 bg-red-100 text-red-700 rounded"
                >待采购</span
              >
            </span>
            <span v-else>0</span>
          </div>
        </div>
        <button
          @click="openActionSheet(inv)"
          class="w-full min-h-[36px] px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs hover:bg-slate-200 transition border-t mt-2"
        >
          操作
        </button>
      </div>
    </div>

    <div v-if="items.length === 0" class="text-center py-12 text-slate-400">
      暂无库存记录
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

    <!-- 移动端操作面板 -->
    <div
      v-if="showActionSheet"
      class="fixed inset-0 z-50 flex items-end justify-center"
      @click.self="showActionSheet = false"
    >
      <div
        class="bg-white rounded-t-xl shadow-xl w-full max-h-[70vh] overflow-y-auto p-4 space-y-1"
      >
        <h3 class="font-semibold text-base mb-3">
          {{ actionSheetInv?.productName }}
        </h3>
        <button
          v-for="opt in allActions"
          :key="opt.type"
          @click="selectSheetAction(opt.type)"
          class="w-full text-left px-4 py-3.5 text-base hover:bg-slate-50 rounded-lg min-h-[52px]"
        >
          {{ opt.label }}
        </button>
        <button
          @click="showActionSheet = false"
          class="w-full text-center py-3.5 text-base text-slate-400 border-t mt-2 min-h-[52px]"
        >
          取消
        </button>
      </div>
    </div>

    <!-- 统一操作弹窗 -->
    <div
      v-if="showActionModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showActionModal = false"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto"
      >
        <h2 class="text-lg font-bold mb-4">{{ actionTitle }}</h2>

        <!-- 产品选择 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >产品</label
          >
          <button
            v-if="!actionContext.productId"
            @click="showProductPicker = true"
            class="w-full min-h-[48px] border border-slate-300 rounded-lg px-4 py-2 text-base text-left text-slate-400"
          >
            点击选择产品
          </button>
          <div
            v-else
            class="w-full min-h-[48px] border border-slate-200 rounded-lg px-4 py-2 text-base bg-slate-50 flex items-center justify-between"
          >
            <span>
              <span class="font-mono text-xs text-slate-400 mr-2">{{
                actionContext.productCode
              }}</span>
              <span class="font-medium">{{ actionContext.productName }}</span>
            </span>
            <button
              v-if="
                actionMode === 'general' &&
                !(actionContext.type === 'SALES_OUT' && actionContext.orderId)
              "
              @click="showProductPicker = true"
              class="text-xs text-blue-500"
            >
              更换
            </button>
          </div>
        </div>

        <!-- 类型选择 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1">{{
            actionDirection === "in" ? "入库类型" : "出库类型"
          }}</label>
          <select
            v-model="actionContext.type"
            @change="onTypeChange"
            :disabled="actionMode === 'row'"
            class="w-full min-h-[48px] border border-slate-300 rounded-lg px-4 py-2 text-base bg-white focus:ring-2 focus:ring-blue-500 outline-none transition disabled:bg-slate-100 disabled:text-slate-500"
          >
            <template v-if="actionDirection === 'in'">
              <option value="PURCHASE_IN">采购入库</option>
              <option value="RETURN_IN">退货入库</option>
              <option value="CHECK_IN">盘盈入库</option>
            </template>
            <template v-else>
              <option value="SALES_OUT">销售出库 / 发货</option>
              <option value="SAMPLE_OUT">打样领料</option>
              <option value="SCRAP_OUT">报废出库</option>
              <option value="CHECK_OUT">盘亏出库</option>
            </template>
          </select>
        </div>

        <!-- 采购单价 -->
        <div
          v-if="
            actionDirection === 'in' && actionContext.type === 'PURCHASE_IN'
          "
          class="mb-4"
        >
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >采购单价</label
          >
          <input
            v-model.number="actionContext.unitCost"
            type="number"
            min="0"
            step="0.01"
            class="w-full border border-slate-300 rounded-lg px-4 py-3 text-base min-h-[48px]"
          />
        </div>

        <!-- 销售出库：关联订单 -->
        <div
          v-if="actionDirection === 'out' && actionContext.type === 'SALES_OUT'"
          class="mb-4"
        >
          <label class="block text-sm font-medium text-slate-700 mb-1">
            关联订单
            <span class="text-slate-400 text-xs"
              >（选订单后自动走发货流程）</span
            >
          </label>

          <button
            v-if="!actionContext.orderId"
            @click="openOrderPicker"
            type="button"
            class="w-full min-h-[48px] border border-slate-300 rounded-lg px-4 py-2 text-base text-left text-slate-400 hover:border-blue-400 transition"
          >
            点击选择订单（可选）
          </button>

          <div
            v-else
            class="w-full min-h-[48px] border border-slate-200 rounded-lg px-4 py-2 bg-slate-50 flex items-center justify-between"
          >
            <span class="truncate">
              <span class="font-mono text-xs text-slate-400 mr-2">{{
                actionContext.orderCode
              }}</span>
            </span>
            <div class="flex gap-2 shrink-0 ml-2">
              <button @click="openOrderPicker" class="text-xs text-blue-500">
                更换
              </button>
              <button @click="clearOrderLink" class="text-xs text-red-400">
                取消
              </button>
            </div>
          </div>

          <!-- 订单多明细：待发明细下拉 -->
          <div
            v-if="actionContext.orderId && linkedOrderItems.length > 1"
            class="mt-2"
          >
            <label class="block text-xs text-slate-500 mb-1"
              >选择发货明细</label
            >
            <select
              v-model="actionContext.orderItemId"
              @change="onLinkedOrderItemChange"
              class="w-full min-h-[48px] border border-slate-300 rounded-lg px-4 py-2 text-base bg-white"
            >
              <option
                v-for="it in linkedOrderItems"
                :key="it.id"
                :value="it.id"
              >
                {{ it.productName }}（待发
                {{ Number(it.quantity) - Number(it.shippedQuantity || 0) }}）
              </option>
            </select>
          </div>
        </div>

        <!-- 打样领料：保留文本框 -->
        <div v-if="actionContext.type === 'SAMPLE_OUT'" class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >关联单号 <span class="text-slate-400 text-xs">(可选)</span></label
          >
          <input
            v-model="actionContext.relatedCode"
            placeholder="领料单号"
            class="w-full border border-slate-300 rounded-lg px-4 py-3 text-base min-h-[48px]"
          />
        </div>

        <!-- 数量 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >数量</label
          >
          <div class="flex items-center gap-2">
            <input
              v-model.number="actionContext.quantity"
              type="number"
              min="1"
              class="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-base min-h-[48px] focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
            <span
              v-if="actionContext.unit"
              class="text-base font-bold text-slate-900 min-w-[40px]"
              >{{ actionContext.unit }}</span
            >
          </div>
        </div>

        <!-- 库位 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >库位 <span class="text-slate-400 text-xs">(可选)</span></label
          >
          <select
            v-model="actionContext.locationId"
            class="w-full min-h-[48px] border border-slate-300 rounded-lg px-4 py-2 text-base bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
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

        <!-- 备注 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >备注
            <span v-if="isRemarkRequired" class="text-red-500">*</span></label
          >
          <textarea
            v-model="actionContext.remark"
            rows="2"
            :placeholder="remarkPlaceholder"
            class="w-full border border-slate-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 outline-none transition"
          ></textarea>
        </div>

        <div class="flex gap-2">
          <button
            @click="handleSubmit"
            class="flex-1 min-h-[52px] bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition text-base"
          >
            确认
          </button>
          <button
            @click="showActionModal = false"
            class="flex-1 min-h-[52px] border py-2 rounded-lg hover:bg-slate-50 transition text-base"
          >
            取消
          </button>
        </div>
      </div>
    </div>

    <!-- 产品选择弹窗 -->
    <div
      v-if="showProductPicker"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showProductPicker = false"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col"
      >
        <h2 class="text-lg font-bold mb-4">选择产品</h2>
        <input
          v-model="productSearch"
          placeholder="搜索产品..."
          class="w-full border border-slate-300 rounded-lg px-4 py-3 text-base mb-4 min-h-[48px]"
        />
        <div class="flex-1 overflow-y-auto space-y-1">
          <button
            v-for="p in filteredProductOptions"
            :key="p.value"
            @click="selectProduct(p)"
            class="w-full text-left px-4 py-3 rounded-lg text-base hover:bg-blue-50 transition"
          >
            <span class="font-mono text-xs text-slate-400 mr-2">{{
              p.code
            }}</span>
            <span>{{ p.label }}</span>
          </button>
          <p
            v-if="filteredProductOptions.length === 0"
            class="text-center text-slate-400 py-8"
          >
            无匹配产品
          </p>
        </div>
        <button
          @click="showProductPicker = false"
          class="mt-4 w-full min-h-[52px] border py-2 rounded-lg text-base"
        >
          关闭
        </button>
      </div>
    </div>

    <!-- 订单选择弹窗 -->
    <div
      v-if="showOrderPicker"
      class="fixed inset-0 z-[60] flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showOrderPicker = false"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col"
      >
        <h2 class="text-lg font-bold mb-4">选择订单</h2>
        <div class="flex gap-2 mb-4">
          <input
            v-model="orderSearch"
            @keydown.enter="searchOrders"
            placeholder="输入订单号搜索..."
            class="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-base min-h-[48px]"
          />
          <button
            @click="searchOrders"
            class="min-h-[48px] px-4 bg-blue-500 text-white rounded-lg text-sm"
          >
            搜索
          </button>
        </div>
        <div class="flex-1 overflow-y-auto space-y-1">
          <p v-if="orderSearching" class="text-center text-slate-400 py-8">
            搜索中...
          </p>
          <button
            v-for="o in orderCandidates"
            :key="o.id"
            @click="selectOrder(o)"
            class="w-full text-left px-4 py-3 rounded-lg text-sm hover:bg-blue-50 transition border border-transparent"
          >
            <div class="flex items-center justify-between">
              <div class="min-w-0">
                <span class="font-mono text-xs text-slate-500">{{
                  o.orderCode
                }}</span>
                <span class="ml-2 text-slate-600 truncate">{{
                  o.customer?.name || "-"
                }}</span>
              </div>
              <span class="text-xs text-slate-400 shrink-0 ml-2">
                {{
                  (o.items || []).filter(
                    (it: any) =>
                      Number(it.shippedQuantity || 0) < Number(it.quantity),
                  ).length
                }}
                项待发
              </span>
            </div>
          </button>
          <p
            v-if="!orderSearching && orderCandidates.length === 0"
            class="text-center text-slate-400 py-8"
          >
            无匹配订单
          </p>
        </div>
        <button
          @click="showOrderPicker = false"
          class="mt-4 w-full min-h-[48px] border py-2 rounded-lg hover:bg-slate-50 text-sm"
        >
          关闭
        </button>
      </div>
    </div>

    <!-- 调拨弹窗 -->
    <div
      v-if="showTransferModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showTransferModal = false"
      />
      <div class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 class="text-lg font-bold mb-4">
          库位调拨 — {{ transferProduct?.productName }}
        </h2>
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >源库位</label
          >
          <select
            v-model="transferFromLocationId"
            class="w-full min-h-[48px] border border-slate-300 rounded-lg px-4 py-2 text-base bg-white"
          >
            <option value="">选择源库位</option>
            <option
              v-for="loc in activeLocations"
              :key="loc.id"
              :value="loc.id"
            >
              {{ loc.code }} {{ loc.name }}
            </option>
          </select>
        </div>
        <div
          v-if="transferFromLocationId"
          class="text-xs text-slate-500 -mt-3 mb-4"
        >
          该库位库存：{{ transferFromStock ?? "-" }}
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >目标库位</label
          >
          <select
            v-model="transferToLocationId"
            class="w-full min-h-[48px] border border-slate-300 rounded-lg px-4 py-2 text-base bg-white"
          >
            <option value="">选择目标库位</option>
            <option
              v-for="loc in activeLocations"
              :key="loc.id"
              :value="loc.id"
            >
              {{ loc.code }} {{ loc.name }}
            </option>
          </select>
        </div>
        <div
          v-if="transferToLocationId"
          class="text-xs text-slate-500 -mt-3 mb-4"
        >
          该库位库存：{{ transferToStock ?? "-" }}
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >数量</label
          >
          <div class="flex items-center gap-2">
            <input
              v-model.number="transferQty"
              type="number"
              min="0.0001"
              step="0.0001"
              class="flex-1 min-h-[48px] border border-slate-300 rounded-lg px-4 py-2 text-base"
            />
            <span
              v-if="transferUnit"
              class="text-base font-bold text-slate-900 min-w-[40px]"
              >{{ transferUnit }}</span
            >
          </div>
        </div>
        <div class="flex gap-2">
          <button
            @click="handleTransfer"
            class="flex-1 min-h-[52px] bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-600 transition text-base"
          >
            确认调拨
          </button>
          <button
            @click="showTransferModal = false"
            class="flex-1 min-h-[52px] border py-2 rounded-lg hover:bg-slate-50 transition text-base"
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
const route = useRoute();
const toast = useToast();
const { apiFetch } = useApi();

// ==================== 列表 ====================
const page = ref(1);
const limit = 10;
const keyword = ref("");
const sortField = ref("updatedAt");
const sortDir = ref<"asc" | "desc">("desc");
const searchKeyword = ref("");

const doSearch = () => {
  searchKeyword.value = keyword.value;
  page.value = 1;
};

const toggleSort = (field: string) => {
  if (sortField.value === field) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortField.value = field;
    sortDir.value = "asc";
  }
};

const sortIcon = (field: string) =>
  sortField.value !== field ? "↕" : sortDir.value === "asc" ? "↑" : "↓";

watch(keyword, (val) => {
  if (!val.trim()) {
    searchKeyword.value = "";
    page.value = 1;
  }
});

const queryParams = computed(() => ({
  page: page.value,
  limit,
  keyword: searchKeyword.value,
  sortField: sortField.value,
  sortDir: sortDir.value,
}));

const { data, execute: load } = useApiFetch("/api/inventory");
watch(queryParams, () => load(queryParams.value), { immediate: true });

const items = computed(() => (data.value as any)?.data || []);
const totalPages = computed(() => (data.value as any)?.totalPages || 1);
const formatDate = (d: string) => new Date(d).toLocaleDateString("zh-CN");

// ==================== 基础数据 ====================
const { data: productsData } = await useFetch("/api/products?limit=500");
const allProducts = computed(() => (productsData.value as any)?.data || []);

const { data: locationsData } = await useFetch(
  "/api/locations?status=ACTIVE&limit=200",
);
const activeLocations = computed(
  () => (locationsData.value as any)?.data || [],
);
const defaultLocation = computed(() =>
  activeLocations.value.find((l: any) => l.isDefault),
);

// ==================== 桌面端操作菜单 ====================
const desktopMenuId = ref<string | null>(null);
const desktopMenuStyle = ref<Record<string, string>>({});

const toggleDesktopMenu = (id: string, event: MouseEvent) => {
  if (desktopMenuId.value === id) {
    desktopMenuId.value = null;
    return;
  }
  desktopMenuId.value = id;
  const rect = (event.target as HTMLElement).getBoundingClientRect();
  desktopMenuStyle.value = {
    left: `${rect.left}px`,
    top: `${rect.bottom + 4}px`,
  };
};

const selectDesktopAction = (type: string) => {
  const inv = items.value.find((i: any) => i.id === desktopMenuId.value);
  desktopMenuId.value = null;
  if (!inv) return;
  if (type === "TRANSFER") {
    openTransfer(inv);
    return;
  }
  const direction = ["PURCHASE_IN", "RETURN_IN", "CHECK_IN"].includes(type)
    ? "in"
    : "out";
  openActionModal("row", direction, { product: inv, type });
};

onMounted(() => {
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-desktop-menu]")) return;
    desktopMenuId.value = null;
  });
});

// ==================== query 自动打开弹窗 ====================
onMounted(() => {
  const action = route.query.action as string;
  const type = route.query.type as string;
  if (action === "in") {
    openActionModal("general", "in", type ? { type } : undefined);
  } else if (action === "out") {
    openActionModal("general", "out", type ? { type } : undefined);
    // 仓管"发货"卡片携带 pickOrder=1，自动打开订单选择
    if (route.query.pickOrder === "1") {
      openOrderPicker();
    }
  }
});

// ==================== 统一操作弹窗 ====================
const showActionModal = ref(false);
const actionMode = ref<"row" | "general">("general");
const actionDirection = ref<"in" | "out">("in");

const actionContext = ref({
  productId: "",
  productCode: "",
  productName: "",
  unit: "",
  type: "PURCHASE_IN",
  quantity: null as number | null,
  locationId: "",
  relatedCode: "",
  orderId: "",
  orderItemId: "",
  orderCode: "",
  remark: "",
  unitCost: 0,
});

const actionTitle = computed(() => {
  const labels: Record<string, string> = {
    PURCHASE_IN: "采购入库",
    RETURN_IN: "退货入库",
    CHECK_IN: "盘盈入库",
    SALES_OUT: "销售出库 / 发货",
    SAMPLE_OUT: "打样领料",
    SCRAP_OUT: "报废出库",
    CHECK_OUT: "盘亏出库",
  };
  return labels[actionContext.value.type] || "库存操作";
});

const isRemarkRequired = computed(() =>
  ["CHECK_IN", "CHECK_OUT"].includes(actionContext.value.type),
);

const remarkPlaceholder = computed(() =>
  isRemarkRequired.value ? "请输入盘点原因（必填）" : "备注信息（可选）",
);

const openActionModal = (
  mode: "row" | "general",
  direction: "in" | "out",
  preset?: { product?: any; type?: string },
) => {
  actionMode.value = mode;
  actionDirection.value = direction;
  actionContext.value = {
    productId: preset?.product?.productId || "",
    productCode: preset?.product?.productCode || "",
    productName: preset?.product?.productName || "",
    unit: preset?.product?.unit || "",
    type: preset?.type || (direction === "in" ? "PURCHASE_IN" : "SALES_OUT"),
    quantity: null,
    locationId: defaultLocation.value?.id || "",
    relatedCode: "",
    orderId: "",
    orderItemId: "",
    orderCode: "",
    remark: "",
    unitCost: 0,
  };
  linkedOrder.value = null;
  linkedOrderItems.value = [];
  showActionModal.value = true;
};

// 切换类型时清理关联订单（仅销售出库关联）
const onTypeChange = () => {
  if (actionContext.value.type !== "SALES_OUT") {
    clearOrderLink();
  }
};

const handleSubmit = async () => {
  const ctx = actionContext.value;
  if (!ctx.productId) return toast.error("请选择产品");
  if (!ctx.quantity || ctx.quantity <= 0) return toast.error("请输入有效数量");
  if (isRemarkRequired.value && !ctx.remark.trim())
    return toast.error("请填写备注");

  try {
    const isOut = actionDirection.value === "out";

    // ✅ 销售出库 + 关联了订单 → 走发货接口，订单进度同步更新
    if (isOut && ctx.type === "SALES_OUT" && ctx.orderId && ctx.orderItemId) {
      await apiFetch(`/api/orders/${ctx.orderId}/ship`, {
        method: "POST",
        body: {
          items: [{ orderItemId: ctx.orderItemId, quantity: ctx.quantity }],
          locationId: ctx.locationId || undefined,
        },
      });
      toast.success("发货成功");
      showActionModal.value = false;
      await load(queryParams.value);
      return;
    }

    // 通用出入库
    const body: any = {
      quantity: ctx.quantity,
      type: ctx.type,
      remark: ctx.remark || undefined,
      relatedCode: ctx.relatedCode || undefined,
      locationId: ctx.locationId || undefined,
    };
    if (ctx.type === "PURCHASE_IN") body.unitCost = ctx.unitCost;

    const url = `/api/inventory/${ctx.productId}/${isOut ? "outbound" : "inbound"}`;
    await apiFetch(url, { method: "POST", body });
    toast.success("操作成功");
    showActionModal.value = false;
    await load(queryParams.value);
  } catch (e: any) {
    toast.error(e, "操作失败");
  }
};

// ==================== 出库关联订单 ====================
const showOrderPicker = ref(false);
const orderSearch = ref("");
const orderCandidates = ref<any[]>([]);
const orderSearching = ref(false);
const linkedOrderItems = ref<any[]>([]);
const linkedOrder = ref<any>(null);

const openOrderPicker = () => {
  orderSearch.value = "";
  orderCandidates.value = [];
  showOrderPicker.value = true;
  searchOrders();
};

const searchOrders = async () => {
  orderSearching.value = true;
  try {
    const res = await apiFetch<any>(
      `/api/orders?keyword=${encodeURIComponent(orderSearch.value)}&limit=10`,
    );
    const all = res.data || [];
    // 只保留可发货状态的订单
    orderCandidates.value = all.filter((o: any) =>
      ["APPROVED", "PRODUCING", "READY"].includes(o.status),
    );
  } catch {
    orderCandidates.value = [];
  } finally {
    orderSearching.value = false;
  }
};

const selectOrder = (order: any) => {
  linkedOrder.value = order;
  linkedOrderItems.value = (order.items || []).filter(
    (it: any) => Number(it.shippedQuantity || 0) < Number(it.quantity),
  );

  if (linkedOrderItems.value.length === 0) {
    toast.error("该订单已全部发货");
    return;
  }

  actionContext.value.orderId = order.id;
  actionContext.value.orderCode = order.orderCode;

  const first = linkedOrderItems.value[0];
  actionContext.value.orderItemId = first.id;
  onLinkedOrderItemChange();

  showOrderPicker.value = false;
};

const onLinkedOrderItemChange = () => {
  if (!actionContext.value.orderItemId) return;
  const item = linkedOrderItems.value.find(
    (it: any) => it.id === actionContext.value.orderItemId,
  );
  if (!item) return;

  const remaining = Number(item.quantity) - Number(item.shippedQuantity || 0);
  const p = allProducts.value.find((x: any) => x.id === item.productId);

  actionContext.value.productId = item.productId;
  actionContext.value.productName = item.productName;
  actionContext.value.productCode = p?.code || "";
  actionContext.value.unit = p?.unit || "";
  actionContext.value.quantity = remaining;
  actionContext.value.relatedCode = linkedOrder.value?.orderCode || "";
};

const clearOrderLink = () => {
  actionContext.value.orderId = "";
  actionContext.value.orderItemId = "";
  actionContext.value.orderCode = "";
  actionContext.value.relatedCode = "";
  linkedOrder.value = null;
  linkedOrderItems.value = [];
};

// ==================== 移动端操作面板 ====================
const showActionSheet = ref(false);
const actionSheetInv = ref<any>(null);

const allActions = [
  { type: "PURCHASE_IN", label: "采购入库" },
  { type: "RETURN_IN", label: "退货入库" },
  { type: "CHECK_IN", label: "盘盈入库" },
  { type: "SALES_OUT", label: "销售出库 / 发货" },
  { type: "SAMPLE_OUT", label: "打样领料" },
  { type: "SCRAP_OUT", label: "报废出库" },
  { type: "CHECK_OUT", label: "盘亏出库" },
  { type: "TRANSFER", label: "库位调拨" },
];

const openActionSheet = (inv: any) => {
  actionSheetInv.value = inv;
  showActionSheet.value = true;
};

const selectSheetAction = (type: string) => {
  showActionSheet.value = false;
  if (type === "TRANSFER") {
    openTransfer(actionSheetInv.value);
    return;
  }
  const direction = ["PURCHASE_IN", "RETURN_IN", "CHECK_IN"].includes(type)
    ? "in"
    : "out";
  openActionModal("row", direction, { product: actionSheetInv.value, type });
};

// ==================== 库位查询 ====================
const showLocationSearch = ref(false);
const locationSearch = ref("");
const filteredLocationProducts = computed(() => {
  const q = locationSearch.value.toLowerCase();
  let list = items.value.filter((i: any) => Number(i.quantity) > 0);
  if (q) {
    list = list.filter(
      (i: any) =>
        (i.productName || "").toLowerCase().includes(q) ||
        (i.productCode || "").toLowerCase().includes(q),
    );
  }
  return list;
});

const selectedLocationProduct = ref<any>(null);
const selectedLocationDetails = ref<any[]>([]);

const openProductLocations = async (product: any) => {
  selectedLocationProduct.value = product;
  try {
    const res = (await $fetch(
      `/api/inventory-locations/search?q=${product.productCode || ""}`,
    )) as any;
    selectedLocationDetails.value = (res.data || []).filter(
      (item: any) => Number(item.quantity) > 0,
    );
  } catch {
    selectedLocationDetails.value = [];
  }
};

// ==================== 调拨 ====================
const showTransferModal = ref(false);
const transferProduct = ref<any>(null);
const transferFromLocationId = ref("");
const transferToLocationId = ref("");
const transferQty = ref(0);
const transferFromStock = ref<number | null>(null);
const transferToStock = ref<number | null>(null);

const transferUnit = computed(() => {
  if (!transferProduct.value) return "";
  const p = allProducts.value.find(
    (p: any) => p.id === transferProduct.value.productId,
  );
  return p?.unit || "";
});

watch(transferFromLocationId, async (locId) => {
  if (!locId) return (transferFromStock.value = null);
  try {
    const res = (await $fetch(
      `/api/inventory-locations?locationId=${locId}`,
    )) as any;
    const item = (res.data || []).find(
      (i: any) => i.productId === transferProduct.value?.productId,
    );
    transferFromStock.value = item?.quantity ?? 0;
  } catch {
    transferFromStock.value = null;
  }
});

watch(transferToLocationId, async (locId) => {
  if (!locId) return (transferToStock.value = null);
  try {
    const res = (await $fetch(
      `/api/inventory-locations?locationId=${locId}`,
    )) as any;
    const item = (res.data || []).find(
      (i: any) => i.productId === transferProduct.value?.productId,
    );
    transferToStock.value = item?.quantity ?? 0;
  } catch {
    transferToStock.value = null;
  }
});

const openTransfer = (inv: any) => {
  transferProduct.value = inv;
  transferFromLocationId.value = "";
  transferToLocationId.value = "";
  transferQty.value = 1;
  showTransferModal.value = true;
};

const handleTransfer = async () => {
  if (!transferFromLocationId.value || !transferToLocationId.value)
    return toast.error("请选择源库位和目标库位");
  if (transferFromLocationId.value === transferToLocationId.value)
    return toast.error("源库位和目标库位不能相同");
  if (!transferQty.value || transferQty.value <= 0)
    return toast.error("请输入有效数量");
  try {
    await apiFetch(
      `/api/inventory/${transferProduct.value.productId}/transfer`,
      {
        method: "POST",
        body: {
          fromLocationId: transferFromLocationId.value,
          toLocationId: transferToLocationId.value,
          quantity: transferQty.value,
        },
      },
    );
    toast.success("调拨成功");
    showTransferModal.value = false;
    await load(queryParams.value);
  } catch (e: any) {
    toast.error(e, "调拨失败");
  }
};

// ==================== 产品选择 ====================
const showProductPicker = ref(false);
const productSearch = ref("");

const productOptions = computed(() =>
  allProducts.value.map((p: any) => ({
    value: p.id,
    code: p.code,
    label: p.name,
    unit: p.unit,
  })),
);

const filteredProductOptions = computed(() => {
  if (!productSearch.value.trim()) return productOptions.value;
  const q = productSearch.value.toLowerCase();
  return productOptions.value.filter(
    (p: any) =>
      p.label.toLowerCase().includes(q) || p.code.toLowerCase().includes(q),
  );
});

const selectProduct = (p: any) => {
  actionContext.value.productId = p.value;
  actionContext.value.productCode = p.code;
  actionContext.value.productName = p.label;
  actionContext.value.unit = p.unit;
  showProductPicker.value = false;
};
</script>
