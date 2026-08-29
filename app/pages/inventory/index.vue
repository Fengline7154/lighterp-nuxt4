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
          >初始化库存</NuxtLink
        >
        <button
          @click="openGeneralAction('in')"
          class="min-h-[44px] px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
        >
          通用入库
        </button>
        <button
          @click="openGeneralAction('out')"
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
              可调配
            </th>
            <th
              class="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              预留量
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
            <td
              class="px-4 py-3 text-sm text-right font-medium text-indigo-600"
            >
              {{ inv.allocatableQty ?? "0" }}
            </td>
            <td class="px-4 py-3 text-sm text-right text-slate-500">
              {{ inv.reservedQty || "0" }}
            </td>
            <td class="px-4 py-3 text-sm text-slate-500">
              {{ formatDate(inv.updatedAt) }}
            </td>
            <td class="px-4 py-3 text-sm text-center">
              <div class="flex items-center justify-center gap-1">
                <button
                  @click="openAction(inv, 'PRODUCTION_IN')"
                  class="min-h-[32px] px-2 py-1 bg-teal-50 text-teal-700 rounded text-xs hover:bg-teal-100 transition"
                >
                  生产入库
                </button>
                <button
                  @click="openAction(inv, 'PRODUCTION_OUT')"
                  class="min-h-[32px] px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs hover:bg-purple-100 transition"
                >
                  生产领料
                </button>
                <button
                  @click="toggleMenu(inv.id)"
                  :data-menu-id="inv.id"
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
            <span class="text-xs text-slate-400 block">总库存</span
            >{{ inv.quantity }}
          </div>
          <div>
            <span class="text-xs text-slate-400 block">可用</span
            ><span class="text-blue-600">{{ inv.availableQty ?? "0" }}</span>
          </div>
          <div>
            <span class="text-xs text-slate-400 block">可调配</span
            ><span class="text-indigo-600">{{
              inv.allocatableQty ?? "0"
            }}</span>
          </div>
          <div>
            <span class="text-xs text-slate-400 block">预留</span
            >{{ inv.reservedQty || "0" }}
          </div>
        </div>
        <div class="flex gap-2 pt-2 border-t flex-wrap">
          <button
            @click="openAction(inv, 'PRODUCTION_IN')"
            class="min-h-[36px] px-2 py-1 bg-teal-50 text-teal-700 rounded text-xs"
          >
            生产入库
          </button>
          <button
            @click="openAction(inv, 'PRODUCTION_OUT')"
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

    <!-- 桌面端更多菜单 -->
    <Teleport to="body">
      <div
        v-if="openMenuId"
        :style="menuStyle"
        class="fixed bg-white border border-slate-200 rounded-lg shadow-lg z-[9999] py-1 w-28"
        @click.stop
      >
        <button
          v-for="opt in menuActions"
          :key="opt.type"
          @click="selectMenuAction(opt.type)"
          class="block w-full text-left px-3 py-2 text-xs hover:bg-slate-50 min-h-[36px]"
        >
          {{ opt.label }}
        </button>
      </div>
    </Teleport>

    <!-- 移动端操作面板 -->
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

    <!-- 操作弹窗 -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div class="absolute inset-0 bg-black/30" @click="showModal = false" />
      <div class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
        <h2 class="text-lg font-bold mb-4">
          {{ actionLabel }} — {{ current?.productName }}
        </h2>
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >数量</label
          >
          <div class="flex items-center gap-2">
            <input
              v-model="actionQty"
              type="number"
              :min="actionType === 'REVERSAL' ? undefined : 1"
              :placeholder="
                actionType === 'REVERSAL' ? '正数补回，负数扣减' : ''
              "
              class="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
            <span
              v-if="currentUnit"
              class="text-sm font-bold text-slate-900 min-w-[40px]"
              >{{ currentUnit }}</span
            >
          </div>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >库位 <span class="text-slate-400 text-xs">(可选)</span></label
          >
          <select
            v-model="selectedLocationId"
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
        <div v-if="showRelatedCode" class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >关联单号 <span class="text-slate-400 text-xs">(可选)</span></label
          >
          <div class="flex gap-2">
            <input
              v-model="relatedCode"
              class="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-sm min-h-[44px] focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="订单号"
            />
            <button
              @click="openOrderPicker('relatedCode')"
              class="min-h-[44px] min-w-[44px] px-3 border border-slate-300 rounded-lg text-slate-500 hover:text-blue-500 transition text-sm"
            >
              +
            </button>
          </div>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >备注
            <span v-if="isRemarkRequired" class="text-red-500">*</span></label
          >
          <textarea
            v-model="remark"
            rows="2"
            :placeholder="remarkPlaceholder"
            :required="isRemarkRequired"
            class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          ></textarea>
        </div>
        <div class="flex gap-2">
          <button
            @click="handleAction"
            class="flex-1 min-h-[44px] bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition text-sm"
          >
            确认
          </button>
          <button
            @click="showModal = false"
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

        <!-- 产品列表 -->
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

        <!-- 库位详情 -->
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
    <!-- 调配弹窗 -->
    <div
      v-if="showAllocateModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showAllocateModal = false"
      />
      <div class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 class="text-lg font-bold mb-4">
          调配库存 — {{ allocateProduct?.productName }}
        </h2>
        <p class="text-sm text-slate-500 mb-4">
          可调配: {{ allocateAvailable }}
        </p>
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >目标订单号</label
          >
          <div class="flex gap-2">
            <input
              v-model="allocateOrderCode"
              class="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-sm min-h-[44px]"
              placeholder="输入订单号"
            />
            <button
              @click="openOrderPicker('allocateOrderCode')"
              class="min-h-[44px] min-w-[44px] px-3 border rounded text-slate-400 hover:text-blue-500"
            >
              +
            </button>
          </div>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >调配数量</label
          >
          <div class="flex items-center gap-2">
            <input
              v-model.number="allocateQty"
              type="number"
              min="1"
              :max="allocateAvailable"
              class="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-sm min-h-[44px]"
            />
            <span
              v-if="allocateUnit"
              class="text-sm font-bold text-slate-900 min-w-[40px]"
              >{{ allocateUnit }}</span
            >
          </div>
        </div>
        <div class="flex gap-2">
          <button
            @click="handleAllocate"
            class="flex-1 min-h-[44px] bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-600 transition text-sm"
          >
            确认调配
          </button>
          <button
            @click="showAllocateModal = false"
            class="flex-1 min-h-[44px] border py-2 rounded-lg hover:bg-slate-50 transition text-sm"
          >
            取消
          </button>
        </div>
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
              >{{ transferUnit }}</span
            >
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
    <!-- 通用操作弹窗 -->
    <div
      v-if="showGeneralModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showGeneralModal = false"
      />
      <div class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 class="text-lg font-bold mb-4">{{ actionLabel }}</h2>
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >产品</label
          >
          <button
            @click="showProductPicker = true"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm text-left"
            :class="generalProduct ? 'text-slate-900' : 'text-slate-400'"
          >
            {{
              generalProduct
                ? `${generalProduct.code} ${generalProduct.label}`
                : "点击选择产品"
            }}
          </button>
        </div>
        <div v-if="showGeneralRelatedCode" class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >关联单号 <span class="text-slate-400 text-xs">(可选)</span></label
          >
          <div class="flex gap-2">
            <input
              v-model="generalRelatedCode"
              class="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-sm min-h-[44px]"
              placeholder="采购单号/订单号等"
            />
            <button
              @click="openOrderPicker('generalRelatedCode')"
              class="min-h-[44px] min-w-[44px] px-3 border rounded text-slate-400 hover:text-blue-500"
            >
              +
            </button>
          </div>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1">{{
            generalDirection === "in" ? "入库类型" : "出库类型"
          }}</label>
          <select
            v-model="generalActionType"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white"
          >
            <template v-if="generalDirection === 'in'">
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
        <div
          v-if="
            generalDirection === 'in' && generalActionType === 'PURCHASE_IN'
          "
          class="mb-4"
        >
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >采购单价</label
          >
          <input
            v-model.number="unitCost"
            type="number"
            min="0"
            step="0.01"
            class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm min-h-[44px]"
          />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >数量</label
          >
          <div class="flex items-center gap-2">
            <input
              v-model="generalActionQty"
              type="number"
              min="1"
              class="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-sm min-h-[44px]"
            />
            <span
              v-if="generalProduct?.unit"
              class="text-sm font-bold text-slate-900 min-w-[40px]"
              >{{ generalProduct.unit }}</span
            >
          </div>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >库位 <span class="text-slate-400 text-xs">(可选)</span></label
          >
          <select
            v-model="generalLocationId"
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
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >备注
            <span v-if="generalIsRemarkRequired" class="text-red-500"
              >*</span
            ></label
          >
          <textarea
            v-model="generalRemark"
            rows="2"
            :placeholder="generalRemarkPlaceholder"
            class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm"
          ></textarea>
        </div>
        <div class="flex gap-2">
          <button
            @click="handleGeneralAction"
            class="flex-1 min-h-[44px] bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition text-sm"
          >
            确认
          </button>
          <button
            @click="showGeneralModal = false"
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
            @click="selectOrder(o.orderCode)"
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
            @click="selectGeneralProduct(p)"
            class="w-full text-left px-4 py-3 rounded-lg text-sm hover:bg-blue-50 transition"
          >
            <span class="font-mono text-xs text-slate-400 mr-2">{{
              p.code
            }}</span
            ><span>{{ p.label }}</span>
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
const { data, loading, execute: load } = useApiFetch("/api/inventory");
watch(queryParams, () => load(queryParams.value), { immediate: true });

const items = computed(() => (data.value as any)?.data || []);
const totalPages = computed(() => (data.value as any)?.totalPages || 1);
const formatDate = (d: string) => new Date(d).toLocaleDateString("zh-CN");

// 产品选项
const { data: productsData } = await useFetch("/api/products?limit=500");
const allProducts = computed(() => (productsData.value as any)?.data || []);
const productOptions = computed(() =>
  allProducts.value.map((p: any) => ({
    value: p.id,
    code: p.code,
    label: p.name,
    spec: p.spec,
    unit: p.unit,
  })),
);

// 库位选项
const { data: locationsData } = await useFetch(
  "/api/locations?status=ACTIVE&limit=200",
);
const activeLocations = computed(
  () => (locationsData.value as any)?.data || [],
);
const defaultLocation = computed(() =>
  activeLocations.value.find((l: any) => l.isDefault),
);
// 订单
const { data: ordersData } = await useFetch(
  "/api/orders?limit=200&statuses=APPROVED,PRODUCING",
);
const orders = computed(() => (ordersData.value as any)?.data || []);

// 菜单
const openMenuId = ref<string | null>(null);
const menuStyle = ref<Record<string, string>>({});
const menuActions = [
  { type: "PURCHASE_IN", label: "采购入库" },
  { type: "RETURN_IN", label: "退货入库" },
  { type: "SALES_OUT", label: "销售出库" },
  { type: "SAMPLE_OUT", label: "打样领料" },
  { type: "SCRAP_OUT", label: "报废" },
  { type: "CHECK_IN", label: "盘点" },
  { type: "REVERSAL", label: "红冲" },
  { type: "ALLOCATE", label: "调配" },
  { type: "TRANSFER", label: "库位调拨" },
];
const allActions = [
  ...menuActions,
  { type: "PRODUCTION_IN", label: "生产入库" },
  { type: "PRODUCTION_OUT", label: "生产领料" },
];

const toggleMenu = (id: string) => {
  if (openMenuId.value === id) {
    openMenuId.value = null;
    return;
  }
  openMenuId.value = id;
  nextTick(() => {
    const btn = document.querySelector(`[data-menu-id="${id}"]`);
    if (btn) {
      const rect = btn.getBoundingClientRect();
      menuStyle.value = { left: `${rect.left}px`, top: `${rect.bottom + 4}px` };
    }
  });
};
const selectMenuAction = (type: string) => {
  const inv = items.value.find((i: any) => i.id === openMenuId.value);
  if (!inv) return;
  openMenuId.value = null;
  if (type === "ALLOCATE") openAllocate(inv);
  else if (type === "TRANSFER") openTransfer(inv);
  else openAction(inv, type);
};

// 移动端面板
const showActionSheet = ref(false);
const actionSheetInv = ref<any>(null);
const openActionSheet = (inv: any) => {
  actionSheetInv.value = inv;
  showActionSheet.value = true;
};
const selectSheetAction = (type: string) => {
  showActionSheet.value = false;
  if (type === "ALLOCATE") openAllocate(actionSheetInv);
  else if (type === "TRANSFER") openTransfer(actionSheetInv);
  else openAction(actionSheetInv, type);
};
//库位查询弹窗
const showLocationSearch = ref(false);
const locationSearch = ref("");
const allLocationProducts = ref<any[]>([]);

// 直接复用 items（库存列表数据），只过滤有库存的
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

// 点击产品后查库位分布
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
//调拨功能弹窗
const showTransferModal = ref(false);
const transferProduct = ref<any>(null);
const transferFromLocationId = ref("");
const transferToLocationId = ref("");
const transferQty = ref(0);
const transferUnit = computed(() => {
  if (!transferProduct.value) return "";
  const p = allProducts.value.find(
    (p: any) => p.id === transferProduct.value.productId,
  );
  return p?.unit || "";
});
const transferFromStock = ref<number | null>(null);
const transferToStock = ref<number | null>(null);

watch(transferFromLocationId, async (locId) => {
  if (!locId) {
    transferFromStock.value = null;
    return;
  }
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
  if (!locId) {
    transferToStock.value = null;
    return;
  }
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
// 行操作弹窗
const showModal = ref(false);
const current = ref<any>(null);
const actionType = ref("");
const actionQty = ref<number | null>(null);
const relatedCode = ref("");
const remark = ref("");
const selectedLocationId = ref("");
const currentUnit = computed(() => {
  if (!current.value) return "";
  const p = allProducts.value.find(
    (p: any) => p.id === current.value.productId,
  );
  return p?.unit || "";
});
const showRelatedCode = computed(() =>
  ["PRODUCTION_IN", "PRODUCTION_OUT", "SALES_OUT", "SAMPLE_OUT"].includes(
    actionType.value,
  ),
);
const isRemarkRequired = computed(() =>
  ["REVERSAL", "CHECK_IN", "CHECK_OUT"].includes(actionType.value),
);
const remarkPlaceholder = computed(() => {
  if (actionType.value === "REVERSAL") return "请输入红冲原因（必填）";
  if (actionType.value === "CHECK_IN" || actionType.value === "CHECK_OUT")
    return "请输入盘点原因（必填）";
  return "备注信息（可选）";
});
const actionLabel = computed(() => {
  const m: Record<string, string> = {
    PURCHASE_IN: "采购入库",
    PRODUCTION_IN: "生产入库",
    RETURN_IN: "退货入库",
    SALES_OUT: "销售出库",
    PRODUCTION_OUT: "生产领料",
    SAMPLE_OUT: "打样领料",
    SCRAP_OUT: "报废出库",
    CHECK_IN: "盘点调整",
    CHECK_OUT: "盘点调整",
    REVERSAL: "红冲",
  };
  return m[actionType.value] || "操作";
});
const openAction = (inv: any, type: string) => {
  current.value = inv;
  actionType.value = type;
  actionQty.value = null;
  relatedCode.value = "";
  remark.value = "";
  selectedLocationId.value = defaultLocation.value?.id || "";
  showModal.value = true;
};

const handleAction = async () => {
  const qty = Number(actionQty.value);
  if (
    actionType.value !== "REVERSAL" &&
    (!actionQty.value || isNaN(qty) || qty <= 0)
  )
    return toast.error("请输入有效数量");
  if (
    actionType.value === "REVERSAL" &&
    (!actionQty.value || isNaN(qty) || qty === 0)
  )
    return toast.error("请输入有效数量");
  if (isRemarkRequired.value && !remark.value.trim())
    return toast.error("请填写备注信息");
  try {
    const isOut = [
      "SALES_OUT",
      "PRODUCTION_OUT",
      "SAMPLE_OUT",
      "SCRAP_OUT",
    ].includes(actionType.value);
    const body: any = {
      quantity: qty,
      type: actionType.value,
      remark: remark.value || undefined,
      relatedCode: relatedCode.value || undefined,
      locationId: selectedLocationId.value || undefined,
    };
    if (actionType.value === "REVERSAL") {
      await apiFetch(`/api/inventory/${current.value.productId}/reversal`, {
        method: "POST",
        body,
      });
    } else {
      const url = `/api/inventory/${current.value.productId}/${isOut ? "outbound" : "inbound"}`;
      await apiFetch(url, { method: "POST", body });
    }
    toast.success("操作成功");
    showModal.value = false;
    await load(queryParams.value);
  } catch (e: any) {
    toast.error(e, "操作失败");
  }
};

// 调配
const showAllocateModal = ref(false);
const allocateProduct = ref<any>(null);
const allocateOrderCode = ref("");
const allocateQty = ref(1);
const allocateUnit = computed(() => {
  if (!allocateProduct.value) return "";
  const p = allProducts.value.find(
    (p: any) => p.id === allocateProduct.value.productId,
  );
  return p?.unit || "";
});
const allocateAvailable = computed(() => {
  if (!allocateProduct.value) return 0;
  const inv = allocateProduct.value;
  return Math.max(
    0,
    (inv.quantity || 0) - (inv.reservedQty || 0) - (inv.allocatedQty || 0),
  );
});
const openAllocate = (inv: any) => {
  allocateProduct.value = inv;
  allocateOrderCode.value = "";
  allocateQty.value = 1;
  showAllocateModal.value = true;
};
const handleAllocate = async () => {
  if (!allocateOrderCode.value) return toast.error("请输入订单号");
  if (!allocateQty.value || allocateQty.value <= 0)
    return toast.error("请输入有效数量");
  try {
    await apiFetch(
      `/api/inventory/${allocateProduct.value.productId}/allocate`,
      {
        method: "POST",
        body: {
          orderCode: allocateOrderCode.value,
          quantity: allocateQty.value,
        },
      },
    );
    toast.success("调配成功");
    showAllocateModal.value = false;
    await load(queryParams.value);
  } catch (e: any) {
    toast.error(e, "调配失败");
  }
};

// 通用操作
const showGeneralModal = ref(false);
const generalProduct = ref<any>(null);
const generalDirection = ref<"in" | "out">("in");
const generalActionType = ref("PURCHASE_IN");
const generalActionQty = ref<number | null>(null);
const generalRelatedCode = ref("");
const generalRemark = ref("");
const generalLocationId = ref("");
const unitCost = ref(0);
const generalIsRemarkRequired = computed(() =>
  ["CHECK_IN", "CHECK_OUT"].includes(generalActionType.value),
);
const generalRemarkPlaceholder = computed(() =>
  generalIsRemarkRequired.value ? "请输入盘点原因（必填）" : "备注信息（可选）",
);
const showGeneralRelatedCode = computed(() =>
  ["PRODUCTION_IN", "PRODUCTION_OUT", "SALES_OUT", "SAMPLE_OUT"].includes(
    generalActionType.value,
  ),
);
const openGeneralAction = (dir: "in" | "out") => {
  generalDirection.value = dir;
  generalActionType.value = dir === "in" ? "PURCHASE_IN" : "SALES_OUT";
  generalProduct.value = null;
  generalActionQty.value = null;
  generalRelatedCode.value = "";
  generalRemark.value = "";
  generalLocationId.value = defaultLocation.value?.id || "";
  showGeneralModal.value = true;
};
const selectGeneralProduct = (p: any) => {
  generalProduct.value = p;
  showProductPicker.value = false;
};

const handleGeneralAction = async () => {
  if (!generalProduct.value?.value) return toast.error("请选择产品");
  const qty = Number(generalActionQty.value);
  if (!generalActionQty.value || isNaN(qty) || qty <= 0)
    return toast.error("请输入有效数量");
  if (generalIsRemarkRequired.value && !generalRemark.value.trim())
    return toast.error("请填写备注信息");
  try {
    const isOut = generalDirection.value === "out";
    const body: any = {
      quantity: qty,
      type: generalActionType.value,
      remark: generalRemark.value || undefined,
      relatedCode: generalRelatedCode.value || undefined,
      locationId: generalLocationId.value || undefined,
    };
    if (
      generalDirection.value === "in" &&
      generalActionType.value === "PURCHASE_IN"
    )
      body.unitCost = unitCost.value;
    const url = `/api/inventory/${generalProduct.value.value}/${isOut ? "outbound" : "inbound"}`;
    await apiFetch(url, { method: "POST", body });
    toast.success("操作成功");
    showGeneralModal.value = false;
    await load(queryParams.value);
  } catch (e: any) {
    toast.error(e, "操作失败");
  }
};

// 订单选择
const showOrderPicker = ref(false);
const orderSearch = ref("");
const orderPickerTarget = ref("relatedCode");
const openOrderPicker = (target: string) => {
  orderPickerTarget.value = target;
  orderSearch.value = "";
  showOrderPicker.value = true;
};
const filteredOrders = computed(() => {
  if (!orderSearch.value.trim()) return orders.value;
  const q = orderSearch.value.toLowerCase();
  return orders.value.filter((o: any) => o.orderCode.toLowerCase().includes(q));
});
const selectOrder = (code: string) => {
  if (orderPickerTarget.value === "allocateOrderCode")
    allocateOrderCode.value = code;
  else if (orderPickerTarget.value === "generalRelatedCode")
    generalRelatedCode.value = code;
  else relatedCode.value = code;
  showOrderPicker.value = false;
};

// 产品选择
const showProductPicker = ref(false);
const productSearch = ref("");
const filteredProductOptions = computed(() => {
  if (!productSearch.value.trim()) return productOptions.value;
  const q = productSearch.value.toLowerCase();
  return productOptions.value.filter(
    (p: any) =>
      p.label.toLowerCase().includes(q) || p.code.toLowerCase().includes(q),
  );
});

// 全局点击关闭菜单
onMounted(() =>
  document.addEventListener("click", (e) => {
    if (
      openMenuId.value &&
      !(e.target as HTMLElement).closest("[data-menu-id]")
    )
      openMenuId.value = null;
  }),
);
onUnmounted(() => document.removeEventListener("click", () => {}));
</script>
