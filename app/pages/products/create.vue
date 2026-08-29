<template>
  <div class="max-w-lg mx-auto">
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink to="/products" class="text-slate-500 hover:text-slate-700"
        >&larr; 返回</NuxtLink
      >
      <h1 class="text-xl lg:text-2xl font-bold">创建产品</h1>
    </div>

    <div class="bg-white rounded-xl shadow p-4 lg:p-6">
      <div
        class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-700"
      >
        <p class="font-medium mb-1">命名规则示例</p>
        <p><strong>名称：</strong>户外露营帐篷 HT-200</p>
        <p><strong>规格：</strong>2人 双层 防水3000mm 2.1kg</p>
        <p class="text-xs text-blue-500 mt-1">
          名称保持简洁，规格堆参数，方便搜索
        </p>
      </div>

      <form @submit.prevent="handleCreate" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >名称 *</label
          >
          <input
            v-model="form.name"
            required
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >规格</label
          >
          <input
            v-model="form.spec"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >单位</label
          >
          <select
            v-model="form.unit"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
          >
            <option value="PCS">个 (PCS)</option>
            <option value="KG">千克 (KG)</option>
            <option value="G">克 (G)</option>
            <option value="M">米 (M)</option>
            <option value="CM">厘米 (CM)</option>
            <option value="MM">毫米 (MM)</option>
            <option value="M2">平方米 (M²)</option>
            <option value="M3">立方米 (M³)</option>
            <option value="L">升 (L)</option>
            <option value="ML">毫升 (ML)</option>
            <option value="SET">套 (SET)</option>
            <option value="PAIR">双 (PAIR)</option>
            <option value="ROLL">卷 (ROLL)</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >分类</label
          >
          <select
            v-model="form.category"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
          >
            <option value="">未分类</option>
            <option value="FINISHED">成品</option>
            <option value="SEMI">半成品</option>
            <option value="RAW">原材料</option>
            <option value="PACKAGING">包材</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >标签</label
          >
          <div class="flex flex-wrap gap-2 items-center">
            <span
              v-for="(tag, i) in form.tags"
              :key="i"
              class="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs flex items-center gap-1"
            >
              {{ tag }}
              <button
                @click="form.tags.splice(i, 1)"
                class="text-blue-400 hover:text-blue-600 min-h-[24px] min-w-[24px]"
              >
                &times;
              </button>
            </span>
            <input
              v-model="tagInput"
              @keydown.enter.prevent="addTag"
              @blur="addTag"
              placeholder="输入后回车"
              class="border border-slate-300 rounded-full px-3 py-1.5 text-xs min-h-[36px] focus:ring-2 focus:ring-blue-500 outline-none transition w-28"
            />
          </div>
        </div>
        <button
          type="submit"
          class="w-full min-h-[48px] bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition font-medium text-sm"
        >
          创建产品
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth" as any] });

const toast = useToast();
const { apiFetch } = useApi();

const units = [
  "PCS",
  "KG",
  "G",
  "M",
  "CM",
  "MM",
  "M2",
  "M3",
  "L",
  "ML",
  "SET",
  "PAIR",
  "ROLL",
];

const form = reactive({
  name: "",
  spec: "",
  unit: "PCS",
  category: "",
  tags: [] as string[],
});
const tagInput = ref("");

const addTag = () => {
  const val = tagInput.value.trim();
  if (val && !form.tags.includes(val)) form.tags.push(val);
  tagInput.value = "";
};

const handleCreate = async () => {
  if (!form.name.trim()) return toast.error("产品名称不能为空");
  try {
    await apiFetch("/api/products", { method: "POST", body: form });
    toast.success("产品创建成功");
    await navigateTo("/products");
  } catch (e: any) {
    toast.error(e, "产品创建失败");
  }
};
</script>
