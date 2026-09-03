<template>
  <div>
    <h1 class="text-xl lg:text-2xl font-bold mb-6">缺料分析</h1>

    <!-- 桌面端表格 -->
    <div class="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full min-w-[600px] whitespace-nowrap">
        <thead>
          <tr class="border-b bg-slate-100">
            <th
              class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              物料名称
            </th>
            <th
              class="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              库存总量
            </th>
            <th
              class="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              总需求
            </th>
            <th
              class="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              关联订单
            </th>
            <th
              class="text-right px-4 py-3 text-xs font-medium uppercase text-red-500"
            >
              实际缺口
            </th>
            <th
              class="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase"
            >
              单位
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
            v-for="s in shortages"
            :key="s.productId"
            class="hover:bg-blue-50/30 odd:bg-white even:bg-slate-50 transition"
          >
            <td class="px-4 py-3 text-sm font-medium">{{ s.productName }}</td>
            <td class="px-4 py-3 text-sm text-right">{{ s.available }}</td>
            <td class="px-4 py-3 text-sm text-right">{{ s.demand }}</td>
            <td class="px-4 py-3 text-sm text-right">{{ s.orderCount }}</td>
            <td class="px-4 py-3 text-sm text-right font-bold text-red-600">
              {{ s.realShortage }}
            </td>
            <td class="px-4 py-3 text-sm text-right text-slate-500">
              {{ s.unit || "-" }}
            </td>
            <td class="px-4 py-3 text-sm text-center">
              <button
                @click="openDetail(s.productId)"
                class="text-blue-600 hover:text-blue-800 font-medium text-sm min-h-[36px]"
              >
                详情
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 移动端卡片 -->
    <div class="md:hidden space-y-3">
      <div
        v-for="s in shortages"
        :key="s.productId"
        class="bg-white rounded-xl shadow p-4 space-y-2"
      >
        <div class="flex justify-between items-center">
          <span class="font-medium text-sm">{{ s.productName }}</span>
          <span class="text-xs text-slate-400">{{ s.unit || "-" }}</span>
        </div>
        <div class="grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <span class="text-xs text-slate-400 block">库存</span
            >{{ s.available }}
          </div>
          <div>
            <span class="text-xs text-slate-400 block">需求</span>{{ s.demand }}
          </div>
          <div>
            <span class="text-xs text-slate-400 block">订单</span
            >{{ s.orderCount }}
          </div>
        </div>
        <div class="text-sm text-right">
          实际缺口：<span class="font-bold text-red-600">{{
            s.realShortage
          }}</span>
        </div>
        <button
          @click="openDetail(s.productId)"
          class="block w-full text-center text-blue-600 text-sm font-medium pt-2 border-t"
        >
          详情 →
        </button>
      </div>
    </div>

    <div v-if="shortages.length === 0" class="text-center py-12 text-slate-400">
      暂无缺料，所有物料齐套
    </div>

    <!-- 详情弹窗 -->
    <div
      v-if="showDetail"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div class="absolute inset-0 bg-black/30" @click="showDetail = false" />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] overflow-auto"
      >
        <h2 class="text-lg font-bold mb-4">
          缺料详情 — {{ detailProductName }}
        </h2>
        <div
          v-if="details.length === 0"
          class="text-center text-slate-400 py-8"
        >
          暂无详情数据
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="d in details"
            :key="d.orderCode"
            class="bg-slate-50 rounded-lg p-3 border flex justify-between items-center"
          >
            <div>
              <div class="text-sm font-mono">{{ d.orderCode }}</div>
              <div class="text-xs text-slate-500">{{ d.source }}</div>
            </div>
            <div class="text-right">
              <div class="text-sm font-bold">需求 {{ d.demand }}</div>
            </div>
          </div>
        </div>
        <button
          @click="showDetail = false"
          class="mt-4 w-full min-h-[44px] border py-2 rounded-lg hover:bg-slate-50 text-sm"
        >
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth" as any] });

const { data } = await useFetch("/api/analytics/shortage");
const shortages = computed(() => {
  const all = (data.value as any)?.shortages || [];
  return all.filter((s: any) => Number(s.realShortage) > 0);
});

const showDetail = ref(false);
const detailProductName = ref("");
const details = ref<any[]>([]);

const openDetail = async (productId: string) => {
  try {
    details.value = await $fetch<any>("/api/analytics/shortage-detail", {
      query: { productId },
    });
  } catch {
    details.value = [];
  }
  detailProductName.value =
    shortages.value.find((s: any) => s.productId === productId)?.productName ||
    "";
  showDetail.value = true;
};
</script>
