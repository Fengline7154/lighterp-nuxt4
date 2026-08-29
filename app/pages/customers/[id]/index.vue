<template>
  <div class="max-w-2xl mx-auto">
    <div class="flex items-center gap-4 mb-6 flex-wrap">
      <NuxtLink to="/customers" class="text-slate-500 hover:text-slate-700"
        >&larr; 返回</NuxtLink
      >
      <h1 class="text-xl lg:text-2xl font-bold">客户详情</h1>
      <button
        @click="editing = !editing"
        class="ml-auto min-h-[44px] px-4 py-2 border rounded-lg text-sm hover:bg-slate-50 transition"
      >
        {{ editing ? "取消" : "编辑" }}
      </button>
    </div>

    <div v-if="customer" class="bg-white rounded-xl shadow p-4 lg:p-6">
      <!-- 查看模式 -->
      <div v-if="!editing" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Info label="客户编号" :value="customer.code || '-'" />
        <Info label="客户名称" :value="customer.name" />
        <Info label="联系人" :value="customer.contact || '-'" />
        <Info label="电话" :value="customer.phone || '-'" />
        <Info label="邮箱" :value="customer.email || '-'" />
        <Info label="地址" :value="customer.address || '-'" />
        <Info label="状态">
          <span
            :class="statusBadge(customer.status)"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
          >
            {{ statusIcon(customer.status) }}
            {{ customer.status === "ACTIVE" ? "正常" : "停用" }}
          </span>
        </Info>
        <Info label="创建时间" :value="formatDate(customer.createdAt)" />
      </div>

      <!-- 编辑模式 -->
      <div v-else class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >客户名称</label
          >
          <input
            v-model="editForm.name"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >联系人</label
          >
          <input
            v-model="editForm.contact"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >电话</label
          >
          <input
            v-model="editForm.phone"
            type="tel"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >邮箱</label
          >
          <input
            v-model="editForm.email"
            type="email"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >地址</label
          >
          <input
            v-model="editForm.address"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >状态</label
          >
          <select
            v-model="editForm.status"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
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
const route = useRoute();
const { data: customer, refresh } = await useFetch(
  `/api/customers/${route.params.id}`,
);

const editing = ref(false);

const editForm = reactive({
  name: "",
  contact: "",
  phone: "",
  email: "",
  address: "",
  status: "ACTIVE",
});

watch(
  customer,
  (val) => {
    if (val) {
      editForm.name = val.name || "";
      editForm.contact = val.contact || "";
      editForm.phone = val.phone || "";
      editForm.email = val.email || "";
      editForm.address = val.address || "";
      editForm.status = val.status || "ACTIVE";
    }
  },
  { immediate: true },
);

const handleSave = async () => {
  if (!editForm.name.trim()) return toast.error("客户名称不能为空");
  try {
    await $fetch(`/api/customers/${route.params.id}`, {
      method: "PATCH" as any,
      body: editForm,
    });
    toast.success("保存成功");
    editing.value = false;
    await refresh();
  } catch (e: any) {
    toast.error(e, "保存失败");
  }
};

const formatDate = (d: string) => new Date(d).toLocaleDateString("zh-CN");
const statusIcon = (s: string) => (s === "ACTIVE" ? "✅" : "🚫");
const statusBadge = (s: string) =>
  s === "ACTIVE"
    ? "bg-green-100 text-green-800 border-green-300"
    : "bg-red-100 text-red-800 border-red-300";
</script>
