<!-- app/app.vue -->
<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <Toast ref="toastRef" />
  </div>
</template>

<script setup lang="ts">
import Toast from "~/components/common/Toast.vue";

const toastRef = ref();
provide("toast", {
  error: (msg: string) => toastRef.value?.add(msg, "error"),
  success: (msg: string) => toastRef.value?.add(msg, "success"),
});
</script>
