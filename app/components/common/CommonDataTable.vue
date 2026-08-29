<!-- app/components/common/CommonDataTable.vue -->
<template>
  <div>
    <div class="bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full" :class="tableClass">
        <thead>
          <tr class="border-b">
            <slot name="header" />
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <slot name="body" />
        </tbody>
      </table>
    </div>

    <div class="flex justify-between items-center mt-4">
      <button
        :disabled="page <= 1"
        @click="$emit('pageChange', page - 1)"
        class="px-3 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm border rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        上一页
      </button>
      <span class="text-xs lg:text-sm text-slate-500"
        >第 {{ page }} / {{ totalPages }} 页</span
      >
      <button
        :disabled="page >= totalPages"
        @click="$emit('pageChange', page + 1)"
        class="px-3 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm border rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  page: number;
  totalPages: number;
  tableClass?: string;
}>();

defineEmits<{
  pageChange: [page: number];
}>();
</script>
