<!-- components/common/PrintButton.vue -->
<template>
  <button
    @click="handlePrint"
    :disabled="loading"
    class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition min-h-[36px]"
  >
    <svg
      class="w-3.5 h-3.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-2m-6 4h4"
      />
    </svg>
    <span v-if="!loading">打印</span>
    <span v-else>生成中...</span>
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{
  documentType: string;
  documentId: string;
}>();

const emit = defineEmits<{
  (e: "error", message: string): void;
}>();

const loading = ref(false);

const handlePrint = async () => {
  if (!props.documentId) {
    emit("error", "缺少单据 ID");
    return;
  }

  loading.value = true;
  try {
    const blob = await $fetch<Blob>(
      `/api/documents/${props.documentType}/${props.documentId}/pdf`,
      {
        responseType: "blob",
      },
    );

    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (error: any) {
    emit("error", error?.data?.message || error?.message || "生成失败");
  } finally {
    loading.value = false;
  }
};
</script>
