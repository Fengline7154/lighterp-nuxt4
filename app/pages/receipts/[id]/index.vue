<template>
  <div class="max-w-2xl mx-auto">
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink to="/receipts" class="text-slate-500 hover:text-slate-700"
        >&larr; 返回</NuxtLink
      >
      <h1 class="text-xl lg:text-2xl font-bold">入库记录详情</h1>
    </div>

    <div v-if="receipt" class="space-y-6">
      <!-- 基本信息 -->
      <div class="bg-white rounded-xl shadow p-4 lg:p-6">
        <h2 class="font-semibold text-sm text-slate-500 mb-3">基本信息</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Info label="入库单号" :value="receipt.receiptCode" />
          <Info label="入库数量" :value="receipt.quantity" />
          <Info label="入库时间" :value="formatDate(receipt.createdAt)" />
          <Info
            label="操作人"
            :value="receipt.operator?.badgeCode || receipt.operatorId"
          />
          <Info label="备注" :value="receipt.remark || '-'" />
        </div>
      </div>

      <!-- 关联订单 -->
      <div class="bg-white rounded-xl shadow p-4 lg:p-6">
        <h2 class="font-semibold text-sm text-slate-500 mb-3">关联订单</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Info label="订单号">
            <NuxtLink
              v-if="receipt.order?.orderCode"
              :to="`/orders/${receipt.orderId}`"
              class="text-blue-600 hover:text-blue-800 font-mono"
              >{{ receipt.order.orderCode }}</NuxtLink
            >
            <span v-else>-</span>
          </Info>
          <Info label="产品" :value="receipt.orderItem?.product?.name || '-'" />
          <Info
            label="产品编码"
            :value="receipt.orderItem?.product?.code || '-'"
          />
          <Info
            label="订单需求量"
            :value="receipt.orderItem?.quantity || '-'"
          />
        </div>
      </div>

      <!-- 库位信息 -->
      <div
        v-if="receipt.location"
        class="bg-white rounded-xl shadow p-4 lg:p-6"
      >
        <h2 class="font-semibold text-sm text-slate-500 mb-3">库位信息</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Info label="库位编码" :value="receipt.location.code" />
          <Info label="库位名称" :value="receipt.location.name" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth" as any] });

const route = useRoute();
const { data: receipt } = await useFetch(
  `/api/order-receipts/${route.params.id}`,
);

const formatDate = (d: string) => new Date(d).toLocaleDateString("zh-CN");
</script>
