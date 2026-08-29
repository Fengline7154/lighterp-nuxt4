<template>
  <div ref="containerRef" class="flex gap-1">
    <input
      v-model="query"
      @focus="open = true"
      @blur="onBlur"
      @keydown.escape="open = false"
      @keydown.enter.prevent="onEnter"
      @keydown.arrow-down.prevent="onArrowDown"
      @keydown.arrow-up.prevent="onArrowUp"
      :placeholder="placeholder"
      :disabled="disabled"
      class="flex-1 border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-slate-100 disabled:text-slate-500"
    />
    <button
      @click="openModal = true"
      class="px-2 py-2 border border-slate-200 rounded text-slate-400 hover:text-blue-500 hover:border-blue-300 transition text-sm flex-shrink-0"
      title="浏览全部物料"
    >
      +
    </button>

    <!-- 下拉列表 -->
    <Teleport to="body">
      <div
        v-if="open && filteredOptions.length > 0"
        :style="dropdownStyle"
        class="fixed z-[9999] bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
      >
        <div
          v-for="(option, index) in filteredOptions"
          :key="option.value"
          @mousedown.prevent="select(option)"
          :class="[
            'px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 transition flex items-center gap-2',
            index === highlightIndex ? 'bg-blue-50' : '',
          ]"
        >
          <span class="font-mono text-slate-500 text-xs">{{
            option.code
          }}</span>
          <span class="text-slate-700">{{ option.label }}</span>
          <span v-if="option.spec" class="text-slate-400 text-xs"
            >— {{ option.spec }}</span
          >
        </div>
      </div>
    </Teleport>

    <!-- 物料总览弹窗 -->
    <Teleport to="body">
      <div
        v-if="openModal"
        class="fixed inset-0 z-[10000] flex items-center justify-center"
      >
        <div class="absolute inset-0 bg-black/30" @click="openModal = false" />
        <div
          class="relative bg-white rounded-xl shadow-xl w-[60vw] h-[60vh] flex flex-col min-w-[600px]"
        >
          <div
            class="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          >
            <h2 class="text-lg font-bold">选择物料</h2>
            <button
              @click="openModal = false"
              class="text-slate-400 hover:text-slate-600 text-xl leading-none"
            >
              &times;
            </button>
          </div>
          <div class="px-6 py-3 border-b flex-shrink-0">
            <input
              v-model="modalQuery"
              placeholder="搜索编码/名称/规格..."
              class="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          <div class="flex-1 flex flex-col min-h-0">
            <div class="px-6 pt-4 flex-shrink-0">
              <div
                class="grid grid-cols-[1fr_1fr_1fr_80px_60px] gap-3 text-left py-2 text-slate-500 font-medium text-sm border-b"
              >
                <span>编码</span><span>名称</span><span>规格</span
                ><span>单位</span><span></span>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto px-6 pb-4">
              <div
                v-for="opt in modalFiltered"
                :key="opt.value"
                class="grid grid-cols-[1fr_1fr_1fr_80px_60px] gap-3 py-2 text-sm border-b last:border-0 hover:bg-slate-50 items-center"
              >
                <span class="font-mono text-xs">{{ opt.code }}</span>
                <span>{{ opt.label }}</span>
                <span class="text-slate-500 text-xs">{{
                  opt.spec || "-"
                }}</span>
                <span>{{ opt.unit || "pcs" }}</span>
                <span class="text-right">
                  <button
                    @click="selectFromModal(opt)"
                    class="text-blue-500 hover:text-blue-700 text-sm font-medium"
                  >
                    选择
                  </button>
                </span>
              </div>
              <p
                v-if="modalFiltered.length === 0"
                class="text-center text-slate-400 mt-8"
              >
                无匹配物料
              </p>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
let selectedProductId = "";
const resetSelectedProductId = () => {
  selectedProductId = "";
};
export interface SearchOption {
  value: string;
  code: string;
  label: string;
  spec?: string;
  unit?: string;
}

const props = defineProps<{
  options: SearchOption[];
  placeholder?: string;
  disabled?: boolean;
  modelValue?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  select: [option: SearchOption];
}>();

const containerRef = ref<HTMLElement>();
const query = ref("");
const open = ref(false);
const highlightIndex = ref(0);
const dropdownStyle = ref<Record<string, string>>({});

const filteredOptions = computed(() => {
  if (!query.value.trim()) return props.options.slice(0, 20);
  const q = query.value.toLowerCase();
  return props.options
    .filter(
      (o) =>
        o.code.toLowerCase().includes(q) ||
        o.label.toLowerCase().includes(q) ||
        (o.spec && o.spec.toLowerCase().includes(q)),
    )
    .slice(0, 30);
});

const openModal = ref(false);
const modalQuery = ref("");

const modalFiltered = computed(() => {
  if (!modalQuery.value.trim()) return props.options;
  const q = modalQuery.value.toLowerCase();
  return props.options.filter(
    (o) =>
      o.code.toLowerCase().includes(q) ||
      o.label.toLowerCase().includes(q) ||
      (o.spec && o.spec.toLowerCase().includes(q)),
  );
});

watch(open, (val) => {
  if (val && containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    dropdownStyle.value = {
      left: `${rect.left}px`,
      top: `${rect.bottom + 4}px`,
      width: `${rect.width}px`,
    };
  }
});

watch(query, () => {
  if (query.value && !open.value) open.value = true;
  highlightIndex.value = 0;
});

watch(query, (val) => {
  if (selectedProductId !== query.value) {
    // 用户手动改变输入，重置选中状态
    emit("update:modelValue", "");
    emit("select", { value: "", code: "", label: "", spec: "", unit: "" });
  }
  if (val && !open.value) open.value = true;
  highlightIndex.value = 0;
});

const onBlur = () => {
  setTimeout(() => {
    open.value = false;
  }, 150);
};

const select = (option: SearchOption) => {
  query.value = `${option.code} ${option.label}`;
  selectedProductId = `${option.code} ${option.label}`;
  emit("update:modelValue", option.value);
  emit("select", option);
};

const selectFromModal = (opt: SearchOption) => {
  select(opt);
  openModal.value = false;
};

const onEnter = () => {
  if (filteredOptions.value.length > 0)
    select(filteredOptions.value[highlightIndex.value]!);
};

const onArrowDown = () => {
  highlightIndex.value = Math.min(
    highlightIndex.value + 1,
    filteredOptions.value.length - 1,
  );
};

const onArrowUp = () => {
  highlightIndex.value = Math.max(highlightIndex.value - 1, 0);
};

const closeDropdown = () => {
  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) return;
  }
  open.value = false;
};

const handleClickOutside = (e: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(e.target as Node))
    open.value = false;
};

onMounted(() => {
  window.addEventListener("scroll", closeDropdown);
  window.addEventListener("resize", closeDropdown);
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener("scroll", closeDropdown);
  window.removeEventListener("resize", closeDropdown);
  document.removeEventListener("click", handleClickOutside);
});
</script>
