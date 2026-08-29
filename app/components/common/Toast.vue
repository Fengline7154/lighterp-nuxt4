<template>
  <Teleport to="body">
    <TransitionGroup
      tag="div"
      class="fixed top-4 right-4 z-[100] flex flex-col gap-2"
      name="toast"
    >
      <div
        v-for="item in toasts"
        :key="item.id"
        :class="[
          'px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-xs',
          item.type === 'error'
            ? 'bg-red-500 text-white'
            : 'bg-green-500 text-white',
        ]"
      >
        {{ item.message }}
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
const toasts = reactive<
  Array<{ id: number; message: string; type: "error" | "success" }>
>([]);
let id = 0;

const add = (message: string, type: "error" | "success" = "error") => {
  const tid = ++id;
  toasts.push({ id: tid, message, type });
  setTimeout(() => {
    const idx = toasts.findIndex((t) => t.id === tid);
    if (idx > -1) toasts.splice(idx, 1);
  }, 3000);
};

defineExpose({ add });
</script>

<style scoped>
.toast-enter-active {
  transition: all 0.3s ease;
}
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
