<template>
  <div>
    <dt class="text-xs text-slate-500 uppercase tracking-wide">{{ label }}</dt>
    <dd class="mt-1 text-sm text-slate-900">
      <slot>
        {{ value }}
      </slot>
    </dd>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value?: string | number }>();
</script>
