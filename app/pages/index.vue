<template>
  <div></div>
</template>

<script setup lang="ts">
const { data } = await useFetch("/api/setup/status");

if (data.value?.needSetup) {
  await navigateTo("/setup");
} else {
  await navigateTo("/login");
}
</script>
