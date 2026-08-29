<template>
  <div>
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink
        :to="`/orders/${route.params.id}`"
        class="text-slate-500 hover:text-slate-700"
        >&larr; 返回订单</NuxtLink
      >
      <h1 class="text-xl lg:text-2xl font-bold">入库记录</h1>
    </div>

    <!-- 桌面端表格 -->
    <div class="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full min-w-[700px] whitespace-nowrap">
        <thead>
          <tr class="border-b bg-slate-100">
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              入库单号
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              产品
            </th>
            <th
              class="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              库位编号
            </th>
            <th
              class="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              库位名称
            </th>
            <th
              class="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              数量
            </th>
            <th
              class="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              操作人
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              时间
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr
            v-for="r in receipts"
            :key="r.id"
            class="hover:bg-blue-50/30 even:bg-slate-50/50 transition"
          >
            <td class="px-4 py-3 text-sm font-mono">{{ r.receiptCode }}</td>
            <td class="px-4 py-3 text-sm">
              {{ r.orderItem?.product?.name || "-" }}
            </td>
            <td class="px-4 py-3 text-sm text-center">
              {{ r.location?.code || "-" }}
            </td>
            <td class="px-4 py-3 text-sm text-center">
              {{ r.location?.name || "-" }}
            </td>
            <td class="px-4 py-3 text-sm text-right font-medium">
              {{ r.quantity }}
            </td>
            <td class="px-4 py-3 text-center text-sm">
              {{ r.operator?.badgeCode || r.operatorId
              }}{{ r.operator?.name ? `-${r.operator.name}` : "" }}
            </td>
            <td class="px-4 py-3 text-sm text-slate-500">
              {{ formatDate(r.createdAt) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 移动端卡片 -->
    <div class="md:hidden space-y-3">
      <div
        v-for="r in receipts"
        :key="r.id"
        class="bg-white rounded-xl shadow p-4 space-y-2"
      >
        <div class="flex justify-between items-center">
          <span class="font-mono text-sm">{{ r.receiptCode }}</span>
          <span class="text-sm font-bold">{{ r.quantity }}</span>
        </div>
        <div class="text-sm font-medium">
          {{ r.orderItem?.product?.name || "-" }}
        </div>
        <div class="flex items-center gap-3 text-xs text-slate-500">
          <span v-if="r.location?.code"
            >库位：{{ r.location.code }} {{ r.location.name || "" }}</span
          >
          <span v-else class="text-slate-300">未指定库位</span>
        </div>
        <div class="flex justify-between text-xs text-slate-500 pt-1 border-t">
          <span
            >{{ r.operator?.badgeCode || r.operatorId
            }}{{ r.operator?.name ? `-${r.operator.name}` : "" }}</span
          >
          <span>{{ formatDate(r.createdAt) }}</span>
        </div>
      </div>
    </div>

    <div v-if="receipts.length === 0" class="text-center py-12 text-slate-400">
      暂无入库记录
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth" as any] });
const route = useRoute();
const { data } = await useFetch("/api/order-receipts", {
  query: { orderId: route.params.id, page: 1, limit: 50 },
});
const receipts = computed(() => (data.value as any)?.data || []);
const formatDate = (d: string) => new Date(d).toLocaleDateString("zh-CN");
</script>
