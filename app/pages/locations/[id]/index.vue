<!-- pages/locations/[id].vue -->
<template>
  <div>
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink to="/locations" class="text-slate-500 hover:text-slate-700"
        >&larr; 返回</NuxtLink
      >
      <h1 class="text-xl lg:text-2xl font-bold">库位详情</h1>
    </div>

    <div v-if="location" class="bg-white rounded-xl shadow p-4 lg:p-6 mb-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <span class="text-xs text-slate-400">库位编码</span>
          <p class="text-sm font-mono font-medium">{{ location.code }}</p>
        </div>
        <div>
          <span class="text-xs text-slate-400">库位名称</span>
          <p class="text-sm font-medium">{{ location.name }}</p>
        </div>
        <div>
          <span class="text-xs text-slate-400">所属仓库</span>
          <p class="text-sm">{{ location.warehouse || "-" }}</p>
        </div>
        <div>
          <span class="text-xs text-slate-400">状态</span>
          <p>
            <span
              :class="statusBadge(location.status)"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
              >{{ statusIcon(location.status) }}
              {{ location.status === "ACTIVE" ? "启用" : "停用" }}</span
            >
          </p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow p-4 lg:p-6">
      <h2 class="font-semibold mb-3">库存分布</h2>

      <div class="hidden md:block overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b bg-slate-100">
              <th
                class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                产品编号
              </th>
              <th
                class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                产品名
              </th>
              <th
                class="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                数量
              </th>
              <th
                class="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase"
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="item in stockList"
              :key="item.productId"
              class="hover:bg-blue-50/30 even:bg-slate-50/50 transition"
            >
              <td class="px-4 py-3 text-sm font-mono">
                {{
                  item.product?.code || item.productId?.substring(0, 8) + "..."
                }}
              </td>
              <td class="px-4 py-3 text-sm font-medium">
                {{ item.product?.name || "-" }}
              </td>
              <td class="px-4 py-3 text-sm text-right font-medium">
                {{ item.quantity }}
              </td>
              <td class="px-4 py-3 text-sm text-right">
                <NuxtLink
                  :to="`/inventory?keyword=${item.product?.code || ''}`"
                  class="text-blue-600 text-sm"
                  >查看库存</NuxtLink
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="md:hidden space-y-3">
        <div
          v-for="item in stockList"
          :key="item.productId"
          class="bg-slate-50 rounded-xl p-4 border space-y-2"
        >
          <div class="flex justify-between items-center">
            <span class="font-mono text-sm">{{
              item.product?.code || item.productId?.substring(0, 8) + "..."
            }}</span
            ><span class="text-sm font-bold">{{ item.quantity }}</span>
          </div>
          <div class="text-sm">{{ item.product?.name || "-" }}</div>
          <NuxtLink
            :to="`/inventory?keyword=${item.product?.code || ''}`"
            class="block text-blue-600 text-sm pt-1 border-t"
            >查看库存 →</NuxtLink
          >
        </div>
      </div>

      <div
        v-if="stockList.length === 0"
        class="text-center py-12 text-slate-400"
      >
        该库位暂无库存
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth" as any] });
const route = useRoute();

const { data: locData } = await useFetch(`/api/locations/${route.params.id}`);
const location = computed(() => (locData.value as any)?.data || locData.value);

const { data: stockData } = await useFetch(
  `/api/inventory-locations?locationId=${route.params.id}`,
);
const stockList = computed(() => (stockData.value as any)?.data || []);

const statusIcon = (s: string) => (s === "ACTIVE" ? "✅" : "🚫");
const statusBadge = (s: string) =>
  s === "ACTIVE"
    ? "bg-green-100 text-green-800 border-green-300"
    : "bg-red-100 text-red-800 border-red-300";
</script>
