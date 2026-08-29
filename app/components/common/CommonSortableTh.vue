<!-- app/components/common/SortableTh.vue -->
<template>
  <th
    @click="$emit('sort', field)"
    class="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
  >
    <span class="inline-flex items-center gap-1">
      {{ label }}
      <span v-if="currentSort === field" class="text-blue-500">{{
        currentDir === "asc" ? "↑" : "↓"
      }}</span>
    </span>
  </th>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  field: string;
  currentSort: string;
  currentDir: string;
}>();
defineEmits<{ sort: [field: string] }>();
</script>
