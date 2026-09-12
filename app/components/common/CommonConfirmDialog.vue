<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
  >
    <div class="absolute inset-0 bg-black/50" @click="handleCancel" />
    <div
      class="relative bg-white rounded-xl shadow-2xl p-8 w-full max-w-md text-center"
    >
      <div class="text-5xl mb-4">⚠️</div>
      <h3 class="text-xl font-bold mb-3 text-slate-900">请确认</h3>
      <p
        class="text-base text-slate-600 mb-6 whitespace-pre-line leading-relaxed"
      >
        {{ message }}
      </p>
      <div class="flex gap-3">
        <button
          @click="handleConfirm"
          :disabled="loading"
          class="flex-1 min-h-[52px] bg-blue-500 text-white text-lg rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
        >
          {{ loading ? "处理中..." : confirmText }}
        </button>
        <button
          @click="handleCancel"
          :disabled="loading"
          class="flex-1 min-h-[52px] border border-slate-300 text-lg rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
        >
          {{ cancelText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  visible: boolean;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: "confirm"): void;
  (e: "cancel"): void;
}>();

const handleConfirm = () => {
  if (!props.loading) {
    emit("confirm");
  }
};

const handleCancel = () => {
  if (!props.loading) {
    emit("cancel");
  }
};
</script>
