<template>
  <div />
</template>

<script setup lang="ts">
const authStore = useAuthStore();

onMounted(() => {
  if (authStore.isAuthenticated) {
    navigateTo("/dashboard");
  } else {
    navigateTo("/login");
  }
});
</script>
