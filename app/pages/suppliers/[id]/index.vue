<!-- pages/suppliers/[id].vue -->
<template>
  <div class="max-w-2xl mx-auto">
    <div class="flex items-center gap-4 mb-6 flex-wrap">
      <NuxtLink to="/suppliers" class="text-slate-500 hover:text-slate-700"
        >&larr; 返回</NuxtLink
      >
      <h1 class="text-xl lg:text-2xl font-bold">供应商详情</h1>
      <button
        @click="editing = !editing"
        class="ml-auto min-h-[44px] px-4 py-2 border rounded-lg text-sm hover:bg-slate-50 transition"
      >
        {{ editing ? "取消" : "编辑" }}
      </button>
    </div>

    <div v-if="supplier" class="space-y-6">
      <!-- 查看模式 -->
      <div v-if="!editing" class="bg-white rounded-xl shadow p-4 lg:p-6">
        <h2 class="font-semibold text-sm text-slate-500 mb-3">基本信息</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Info label="供应商编码" :value="supplier.code" />
          <Info label="名称" :value="supplier.name" />
          <Info label="联系人" :value="supplier.contact || '-'" />
          <Info label="电话" :value="supplier.phone || '-'" />
          <Info label="邮箱" :value="supplier.email || '-'" />
          <Info label="地址" :value="supplier.address || '-'" />
          <Info label="备注" :value="supplier.remark || '-'" />
          <Info label="状态">
            <span
              :class="statusBadge(supplier.status)"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
            >
              {{ statusIcon(supplier.status) }}
              {{ supplier.status === "ACTIVE" ? "正常" : "停用" }}
            </span>
          </Info>
          <Info label="创建时间" :value="formatDate(supplier.createdAt)" />
        </div>

        <div class="flex gap-2 mt-6">
          <button
            v-if="supplier.status === 'ACTIVE'"
            @click="handleDeactivate"
            class="min-h-[44px] px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
          >
            停用
          </button>
          <button
            v-else
            @click="handleActivate"
            class="min-h-[44px] px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
          >
            启用
          </button>
        </div>
      </div>

      <!-- 编辑模式 -->
      <div v-else class="bg-white rounded-xl shadow p-4 lg:p-6 space-y-4">
        <h2 class="font-semibold text-sm text-slate-500 mb-3">
          编辑供应商信息
        </h2>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >名称</label
          >
          <input
            v-model="editForm.name"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >联系人</label
          >
          <input
            v-model="editForm.contact"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >电话</label
          >
          <input
            v-model="editForm.phone"
            type="tel"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >邮箱</label
          >
          <input
            v-model="editForm.email"
            type="email"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >地址</label
          >
          <input
            v-model="editForm.address"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >备注</label
          >
          <textarea
            v-model="editForm.remark"
            rows="2"
            class="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          ></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >状态</label
          >
          <select
            v-model="editForm.status"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
          >
            <option value="ACTIVE">正常</option>
            <option value="INACTIVE">停用</option>
          </select>
        </div>
        <button
          @click="handleSave"
          class="w-full min-h-[48px] bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition font-medium text-sm"
        >
          保存
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth" as any] });
const toast = useToast();
const { apiFetch } = useApi();
const route = useRoute();

const {
  data: RawSupplier,
  loading,
  execute: loadSupplier,
} = useApiFetch<any>(() => `/api/suppliers/${route.params.id}`);
await loadSupplier();
const supplier = computed(() => {
  const raw = RawSupplier.value;
  return raw?.data || raw;
});
const editing = ref(false);
const editForm = reactive({
  name: "",
  contact: "",
  phone: "",
  email: "",
  address: "",
  remark: "",
  status: "",
});

watch(
  supplier,
  (val: any) => {
    if (val?.id) {
      editForm.name = val.name || "";
      editForm.contact = val.contact || "";
      editForm.phone = val.phone || "";
      editForm.email = val.email || "";
      editForm.address = val.address || "";
      editForm.remark = val.remark || "";
      editForm.status = val.status || "ACTIVE";
    }
  },
  { immediate: true },
);

const handleSave = async () => {
  if (!editForm.name.trim()) return toast.error("名称不能为空");
  try {
    await apiFetch(`/api/suppliers/${route.params.id}`, {
      method: "PATCH",
      body: editForm,
    });
    toast.success("保存成功");
    editing.value = false;
    await loadSupplier();
  } catch (e: any) {
    toast.error(e, "保存失败");
  }
};

const handleDeactivate = async () => {
  if (!confirm("确认停用该供应商？")) return;
  try {
    await apiFetch(`/api/suppliers/${route.params.id}`, {
      method: "PATCH",
      body: { status: "INACTIVE" },
    });
    toast.success("已停用");
    await loadSupplier();
  } catch (e: any) {
    toast.error(e, "操作失败");
  }
};

const handleActivate = async () => {
  try {
    await apiFetch(`/api/suppliers/${route.params.id}`, {
      method: "PATCH",
      body: { status: "ACTIVE" },
    });
    toast.success("已启用");
    await loadSupplier();
  } catch (e: any) {
    toast.error(e, "操作失败");
  }
};

const statusIcon = (s: string) => (s === "ACTIVE" ? "✅" : "🚫");
const statusBadge = (s: string) =>
  s === "ACTIVE"
    ? "bg-green-100 text-green-800 border-green-300"
    : "bg-red-100 text-red-800 border-red-300";
const formatDate = (d: string) => new Date(d).toLocaleDateString("zh-CN");
</script>
