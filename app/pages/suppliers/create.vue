<!-- pages/suppliers/create.vue -->
<template>
  <div class="max-w-lg mx-auto">
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink to="/suppliers" class="text-slate-500 hover:text-slate-700"
        >&larr; 返回</NuxtLink
      >
      <h1 class="text-xl lg:text-2xl font-bold">新增供应商</h1>
    </div>

    <div class="bg-white rounded-xl shadow p-4 lg:p-6">
      <form @submit.prevent="handleCreate" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >名称 *</label
          ><input
            v-model="form.name"
            required
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >联系人</label
          ><input
            v-model="form.contact"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >电话</label
          ><input
            v-model="form.phone"
            type="tel"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >邮箱</label
          ><input
            v-model="form.email"
            type="email"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >地址</label
          ><input
            v-model="form.address"
            class="w-full min-h-[44px] border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >备注</label
          ><textarea
            v-model="form.remark"
            rows="2"
            class="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          ></textarea>
        </div>
        <button
          type="submit"
          class="w-full min-h-[48px] bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition font-medium text-sm"
        >
          创建供应商
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth" as any] });
const toast = useToast();
const { apiFetch } = useApi();

const form = reactive({
  name: "",
  contact: "",
  phone: "",
  email: "",
  address: "",
  remark: "",
});

const handleCreate = async () => {
  if (!form.name.trim()) return toast.error("供应商名称不能为空");
  try {
    await apiFetch("/api/suppliers", { method: "POST", body: form });
    toast.success("供应商创建成功");
    await navigateTo("/suppliers");
  } catch (e: any) {
    toast.error(e, "创建失败");
  }
};
</script>
