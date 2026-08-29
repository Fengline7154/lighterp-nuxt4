<!-- app/components/common/FieldError.vue -->
<template>
  <p v-if="error" class="text-red-500 text-xs mt-1">{{ error }}</p>
</template>

<script setup lang="ts">
defineProps<{ error?: string }>();
</script>
