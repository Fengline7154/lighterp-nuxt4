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
              class="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase"
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
            <td class="px-4 py-3 text-sm text-right font-medium text-blue-600">
              {{ inv.availableQty ?? "0" }}
            </td>
            <td class="px-4 py-3 text-sm text-right text-slate-500">
              {{ inv.reservedQty || "0" }}
            </td>
            <td class="px-4 py-3 text-sm text-right">
              <span
                v-if="Number(inv.shortageQty) > 0"
                class="text-red-500 font-medium"
              >
                {{ inv.shortageQty }}
              </span>
              <span v-else class="text-slate-400">0</span>
            </td>
            <td class="px-4 py-3 text-sm text-slate-500">
              {{ formatDate(inv.updatedAt) }}
            </td>
            <td class="px-4 py-3 text-sm text-center">
              <div class="flex items-center justify-center gap-1">
                <button
                  @click="
                    openActionModal('row', 'in', {
                      product: inv,
                      type: 'PRODUCTION_IN',
                    })
                  "
                  class="min-h-[32px] px-2 py-1 bg-teal-50 text-teal-700 rounded text-xs hover:bg-teal-100 transition"
                >
                  生产入库
                </button>
                <button
                  @click="
                    openActionModal('row', 'out', {
                      product: inv,
                      type: 'PRODUCTION_OUT',
                    })
                  "
                  class="min-h-[32px] px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs hover:bg-purple-100 transition"
                >
                  生产领料
                </button>
                <button
                  @click="openActionSheet(inv)"
                  class="min-h-[32px] px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs hover:bg-slate-200 transition"
                >
                  ···
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 移动端卡片 -->
    <div class="md:hidden space-y-3">
      <div
        v-for="inv in items"
        :key="inv.id"
        class="bg-white rounded-xl shadow p-4 space-y-2"
      >
        <div class="flex justify-between items-center">
          <span class="font-mono text-sm">
            {{ inv.productCode || inv.productId?.substring(0, 8) + "..." }}
          </span>
          <span class="text-xs text-slate-400">
            {{ formatDate(inv.updatedAt) }}
          </span>
        </div>
        <div class="font-medium">{{ inv.productName }}</div>
        <div class="grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <span class="text-xs text-slate-400 block">总库存</span>
            {{ inv.quantity }}
          </div>
          <div>
            <span class="text-xs text-slate-400 block">可用</span>
            <span class="text-blue-600">{{ inv.availableQty ?? "0" }}</span>
          </div>
          <div>
            <span class="text-xs text-slate-400 block">预留</span>
            {{ inv.reservedQty || "0" }}
          </div>
          <div>
            <span class="text-xs text-slate-400 block">缺口</span>
            <span v-if="Number(inv.shortageQty) > 0" class="text-red-500">{{
              inv.shortageQty
            }}</span>
            <span v-else>0</span>
          </div>
        </div>
        <div class="flex gap-2 pt-2 border-t flex-wrap">
          <button
            @click="
              openActionModal('row', 'in', {
                product: inv,
                type: 'PRODUCTION_IN',
              })
            "
            class="min-h-[36px] px-2 py-1 bg-teal-50 text-teal-700 rounded text-xs"
          >
            生产入库
          </button>
          <button
            @click="
              openActionModal('row', 'out', {
                product: inv,
                type: 'PRODUCTION_OUT',
              })
            "
            class="min-h-[36px] px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs"
          >
            生产领料
          </button>
          <button
            @click="openActionSheet(inv)"
            class="min-h-[36px] px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs"
          >
            更多···
          </button>
        </div>
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

    <!-- 移动端更多操作面板 -->
    <div
      v-if="showActionSheet"
      class="fixed inset-0 z-50 flex items-end justify-center"
      @click.self="showActionSheet = false"
    >
      <div
        class="bg-white rounded-t-xl shadow-xl w-full max-h-[60vh] overflow-y-auto p-4 space-y-1"
      >
        <h3 class="font-semibold text-sm mb-2">
          {{ actionSheetInv?.productName }}
        </h3>
        <button
          v-for="opt in allActions"
          :key="opt.type"
          @click="selectSheetAction(opt.type)"
          class="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 rounded-lg min-h-[44px]"
        >
          {{ opt.label }}
        </button>
        <button
          @click="showActionSheet = false"
          class="w-full text-center py-3 text-sm text-slate-400 border-t mt-2"
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
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm text-left text-slate-400"
          >
            点击选择产品
          </button>
          <div
            v-else
            class="w-full min-h-[44px] border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50 flex items-center justify-between"
          >
            <span>
              <span class="font-mono text-xs text-slate-400 mr-2">{{
                actionContext.productCode
              }}</span>
              <span class="font-medium">{{ actionContext.productName }}</span>
            </span>
            <button
              v-if="actionMode === 'general'"
              @click="showProductPicker = true"
              class="text-xs text-blue-500"
            >
              更换
            </button>
          </div>
        </div>

        <!-- 类型选择 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1">
            {{ actionDirection === "in" ? "入库类型" : "出库类型" }}
          </label>
          <select
            v-model="actionContext.type"
            :disabled="actionMode === 'row'"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none transition disabled:bg-slate-100 disabled:text-slate-500"
          >
            <template v-if="actionDirection === 'in'">
              <option value="PURCHASE_IN">采购入库</option>
              <option value="PRODUCTION_IN">生产入库</option>
              <option value="RETURN_IN">退货入库</option>
              <option value="CHECK_IN">盘盈入库</option>
            </template>
            <template v-else>
              <option value="SALES_OUT">销售出库</option>
              <option value="PRODUCTION_OUT">生产领料</option>
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
            class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm min-h-[44px]"
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
              class="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
            <span
              v-if="actionContext.unit"
              class="text-sm font-bold text-slate-900 min-w-[40px]"
            >
              {{ actionContext.unit }}
            </span>
          </div>
        </div>

        <!-- 关联订单 -->
        <div
          v-if="
            [
              'PRODUCTION_IN',
              'PRODUCTION_OUT',
              'SALES_OUT',
              'SAMPLE_OUT',
            ].includes(actionContext.type)
          "
          class="mb-4"
        >
          <label class="block text-sm font-medium text-slate-700 mb-1">
            关联订单
            <span
              v-if="actionContext.type === 'PRODUCTION_OUT'"
              class="text-red-500"
              >*</span
            >
            <span v-else class="text-slate-400 text-xs">(可选)</span>
          </label>
          <div class="flex gap-2">
            <input
              v-model="actionContext.relatedCode"
              :disabled="actionContext.type === 'PRODUCTION_OUT'"
              placeholder="选择订单"
              class="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-sm min-h-[44px] disabled:bg-slate-100"
            />
            <button
              @click="openOrderPicker"
              class="min-h-[44px] min-w-[44px] px-3 border border-slate-300 rounded-lg text-slate-500 hover:text-blue-500 transition text-sm"
            >
              +
            </button>
          </div>
        </div>

        <!-- 库位 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1">
            库位 <span class="text-slate-400 text-xs">(可选)</span>
          </label>
          <select
            v-model="actionContext.locationId"
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

        <!-- 备注 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1">
            备注
            <span v-if="isRemarkRequired" class="text-red-500">*</span>
          </label>
          <textarea
            v-model="actionContext.remark"
            rows="2"
            :placeholder="remarkPlaceholder"
            class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          ></textarea>
        </div>

        <div class="flex gap-2">
          <button
            @click="handleSubmit"
            class="flex-1 min-h-[44px] bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition text-sm"
          >
            确认
          </button>
          <button
            @click="showActionModal = false"
            class="flex-1 min-h-[44px] border py-2 rounded-lg hover:bg-slate-50 transition text-sm"
          >
            取消
          </button>
        </div>
      </div>
    </div>

    <!-- 库位查询弹窗 -->
    <div
      v-if="showLocationSearch"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showLocationSearch = false"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col"
      >
        <h2 class="text-lg font-bold mb-4">库位查询</h2>
        <input
          v-model="locationSearch"
          placeholder="搜索产品..."
          class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm mb-4 min-h-[44px]"
        />

        <div
          v-if="!selectedLocationProduct"
          class="flex-1 overflow-y-auto space-y-1"
        >
          <button
            v-for="p in filteredLocationProducts"
            :key="p.id"
            @click="openProductLocations(p)"
            class="w-full text-left px-4 py-3 rounded-lg text-sm hover:bg-blue-50 transition border"
          >
            <span class="font-mono text-xs text-slate-400 mr-2">{{
              p.productCode || p.productId
            }}</span>
            <span class="font-medium">{{ p.productName }}</span>
            <span class="text-xs text-slate-400 ml-2"
              >总库存 {{ p.quantity }}</span
            >
          </button>
          <p
            v-if="filteredLocationProducts.length === 0"
            class="text-center text-slate-400 py-8"
          >
            无匹配产品
          </p>
        </div>

        <div v-else class="flex-1 overflow-y-auto">
          <button
            @click="selectedLocationProduct = null"
            class="text-sm text-blue-500 mb-2"
          >
            &larr; 返回产品列表
          </button>
          <p class="font-medium text-sm mb-2">
            {{ selectedLocationProduct.productName }}
          </p>
          <div class="space-y-1">
            <div
              v-for="loc in selectedLocationDetails"
              :key="loc.locationId"
              class="flex justify-between text-sm py-1 border-b last:border-0"
            >
              <span
                >{{ loc.location?.code || loc.locationId }}
                {{ loc.location?.name || "" }}</span
              >
              <span class="font-medium">{{ loc.quantity }}</span>
            </div>
            <p
              v-if="selectedLocationDetails.length === 0"
              class="text-slate-400 text-sm"
            >
              该产品未分配库位
            </p>
          </div>
        </div>

        <button
          @click="
            showLocationSearch = false;
            selectedLocationProduct = null;
          "
          class="mt-4 w-full min-h-[44px] border py-2 rounded-lg text-sm"
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
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white"
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
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white"
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
              class="flex-1 min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm"
            />
            <span
              v-if="transferUnit"
              class="text-sm font-bold text-slate-900 min-w-[40px]"
            >
              {{ transferUnit }}
            </span>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            @click="handleTransfer"
            class="flex-1 min-h-[44px] bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-600 transition text-sm"
          >
            确认调拨
          </button>
          <button
            @click="showTransferModal = false"
            class="flex-1 min-h-[44px] border py-2 rounded-lg hover:bg-slate-50 transition text-sm"
          >
            取消
          </button>
        </div>
      </div>
    </div>

    <!-- 订单选择弹窗 -->
    <div
      v-if="showOrderPicker"
      class="fixed inset-0 z-[10001] flex items-center justify-center p-4"
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
          v-model="orderSearch"
          placeholder="搜索订单号..."
          class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm mb-4 min-h-[44px]"
        />
        <div class="flex-1 overflow-y-auto space-y-1">
          <button
            v-for="o in filteredOrders"
            :key="o.id"
            @click="selectOrder(o)"
            class="w-full text-left px-4 py-3 rounded-lg text-sm hover:bg-blue-50 transition flex justify-between items-center"
          >
            <span class="font-mono">{{ o.orderCode }}</span>
            <span class="text-xs text-slate-400">{{
              o.customer?.name || "无客户"
            }}</span>
          </button>
          <p
            v-if="filteredOrders.length === 0"
            class="text-center text-slate-400 py-8"
          >
            无匹配订单
          </p>
        </div>
        <button
          @click="showOrderPicker = false"
          class="mt-4 w-full min-h-[44px] border py-2 rounded-lg text-sm"
        >
          关闭
        </button>
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
          class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm mb-4 min-h-[44px]"
        />
        <div class="flex-1 overflow-y-auto space-y-1">
          <button
            v-for="p in filteredProductOptions"
            :key="p.value"
            @click="selectProduct(p)"
            class="w-full text-left px-4 py-3 rounded-lg text-sm hover:bg-blue-50 transition"
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
          class="mt-4 w-full min-h-[44px] border py-2 rounded-lg text-sm"
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

const { data: ordersData } = await useFetch(
  "/api/orders?limit=200&statuses=APPROVED,PRODUCING",
);
const orders = computed(() => (ordersData.value as any)?.data || []);

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
  remark: "",
  unitCost: 0,
});

const actionTitle = computed(() => {
  const labels: Record<string, string> = {
    PURCHASE_IN: "采购入库",
    PRODUCTION_IN: "生产入库",
    RETURN_IN: "退货入库",
    CHECK_IN: "盘盈入库",
    SALES_OUT: "销售出库",
    PRODUCTION_OUT: "生产领料",
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
    unit:
      preset?.product?.unit ||
      allProducts.value.find((p: any) => p.id === preset?.product?.productId)
        ?.unit ||
      "",
    type: preset?.type || (direction === "in" ? "PURCHASE_IN" : "SALES_OUT"),
    quantity: null,
    locationId: defaultLocation.value?.id || "",
    relatedCode: "",
    orderId: "",
    remark: "",
    unitCost: 0,
  };
  showActionModal.value = true;
};

const handleSubmit = async () => {
  const ctx = actionContext.value;
  if (!ctx.productId) return toast.error("请选择产品");
  if (!ctx.quantity || ctx.quantity <= 0) return toast.error("请输入有效数量");
  if (isRemarkRequired.value && !ctx.remark.trim())
    return toast.error("请填写备注");
  if (ctx.type === "PRODUCTION_OUT" && !ctx.orderId)
    return toast.error("生产领料必须选择关联订单");

  try {
    const isOut = actionDirection.value === "out";
    const body: any = {
      quantity: ctx.quantity,
      type: ctx.type,
      remark: ctx.remark || undefined,
      relatedCode: ctx.relatedCode || undefined,
      locationId: ctx.locationId || undefined,
    };

    if (ctx.type === "PRODUCTION_OUT") {
      body.orderId = ctx.orderId;
    }
    if (ctx.type === "PURCHASE_IN") {
      body.unitCost = ctx.unitCost;
    }

    const url = `/api/inventory/${ctx.productId}/${isOut ? "outbound" : "inbound"}`;
    await apiFetch(url, { method: "POST", body });
    toast.success("操作成功");
    showActionModal.value = false;
    await load(queryParams.value);
  } catch (e: any) {
    toast.error(e, "操作失败");
  }
};

// ==================== 移动端操作面板 ====================
const showActionSheet = ref(false);
const actionSheetInv = ref<any>(null);

const allActions = [
  { type: "PURCHASE_IN", label: "采购入库" },
  { type: "PRODUCTION_IN", label: "生产入库" },
  { type: "RETURN_IN", label: "退货入库" },
  { type: "CHECK_IN", label: "盘盈入库" },
  { type: "SALES_OUT", label: "销售出库" },
  { type: "PRODUCTION_OUT", label: "生产领料" },
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
  const direction = [
    "PURCHASE_IN",
    "PRODUCTION_IN",
    "RETURN_IN",
    "CHECK_IN",
  ].includes(type)
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

// ==================== 订单选择 ====================
const showOrderPicker = ref(false);
const orderSearch = ref("");

const filteredOrders = computed(() => {
  if (!orderSearch.value.trim()) return orders.value;
  const q = orderSearch.value.toLowerCase();
  return orders.value.filter((o: any) => o.orderCode.toLowerCase().includes(q));
});

const openOrderPicker = () => {
  orderSearch.value = "";
  showOrderPicker.value = true;
};

const selectOrder = (order: any) => {
  actionContext.value.relatedCode = order.orderCode;
  actionContext.value.orderId = order.id;
  showOrderPicker.value = false;
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
