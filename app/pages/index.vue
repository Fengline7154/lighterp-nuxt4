<template>
  <div />
</template>

<script setup lang="ts">
const authStore = useAuthStore();

if (authStore.isAuthenticated) {
  await navigateTo("/dashboard");
} else {
  await navigateTo("/login");
}
</script>
