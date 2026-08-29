<template>
  <div class="flex flex-col gap-0.5">
    <input
      :value="searchText"
      @input="onInput"
      placeholder="输入编码或名称"
      :disabled="locked"
      list="searchList"
      class="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-slate-100 disabled:text-slate-500"
    />
    <datalist id="searchList" class="w-full">
      <option v-for="p in products" :key="p.id" :value="`${p.code} ${p.name}`">
        {{ p.code }} {{ p.name }} /规格：{{ p.spec }}
      </option>
    </datalist>
    <p v-if="selectedProduct" class="text-xs text-green-600">
      {{ selectedProduct.code }} {{ selectedProduct.name }}
    </p>
    <p v-else-if="matchCount > 1" class="text-xs text-blue-500">
      找到 {{ matchCount }} 个同名产品，请选择规格
    </p>
    <p v-else-if="searchText && !isNew" class="text-xs text-red-500">
      产品不存在，请先在产品管理中创建
    </p>
    <p v-if="isNew && allowNew" class="text-xs text-orange-500">
      将作为新物料创建
    </p>
  </div>
</template>

<script setup lang="ts">
import { useProductSearch } from "~/composables/useProductSearch";

const props = defineProps<{
  products: any[];
  allowNew?: boolean;
  initialCode?: string;
}>();

const emit = defineEmits<{ select: [payload: any] }>();

const {
  searchText,
  selectedProduct,
  matchedProducts,
  matchCount,
  isNew,
  locked,
  search,
  selectBySpec,
  getResult,
} = useProductSearch(toRef(props, "products") as any, {
  allowNew: props.allowNew,
  initialCode: props.initialCode,
});

const onInput = (e: Event) => search((e.target as HTMLInputElement).value);

watch([selectedProduct, isNew, searchText], () => emit("select", getResult()));

defineExpose({ matchedProducts, selectedProduct, selectBySpec });
</script>
