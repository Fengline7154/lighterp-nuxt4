<!-- pages/users/batch-create.vue -->
<template>
  <div class="max-w-5xl mx-auto">
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink to="/users" class="text-slate-500 hover:text-slate-700"
        >&larr; 返回</NuxtLink
      >
      <h1 class="text-xl lg:text-2xl font-bold">批量创建用户</h1>
    </div>

    <div class="bg-white rounded-xl shadow p-4 lg:p-6">
      <p class="text-sm text-slate-500 mb-4">
        快速初始化核心岗位用户，系统将自动生成工号。建议创建后让各员工自行修改密码。
      </p>

      <!-- 桌面端表格 -->
      <div class="hidden md:block overflow-x-auto mb-4">
        <table class="w-full min-w-[600px]">
          <thead>
            <tr class="border-b bg-slate-100">
              <th
                class="text-left py-3 px-2 text-xs font-medium text-slate-500 uppercase"
              >
                姓名 *
              </th>
              <th
                class="text-left py-3 px-2 text-xs font-medium text-slate-500 uppercase"
              >
                邮箱
              </th>
              <th
                class="text-left py-3 px-2 text-xs font-medium text-slate-500 uppercase"
              >
                手机号
              </th>
              <th
                class="text-left py-3 px-2 text-xs font-medium text-slate-500 uppercase"
              >
                密码 *
              </th>
              <th
                class="text-left py-3 px-2 text-xs font-medium text-slate-500 uppercase"
              >
                角色
              </th>
              <th
                class="text-left py-3 px-2 text-xs font-medium text-slate-500 uppercase"
              >
                部门
              </th>
              <th class="w-8"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="(_, i) in items" :key="i" class="even:bg-slate-50/50">
              <td class="py-2 px-2">
                <input
                  v-model="itemAt(i).name"
                  autocomplete="off"
                  class="w-full min-h-[36px] border border-slate-200 rounded px-2 py-1.5 text-xs"
                  placeholder="姓名"
                />
              </td>
              <td class="py-2 px-2">
                <input
                  v-model="itemAt(i).email"
                  type="email"
                  autocomplete="off"
                  class="w-full min-h-[36px] border border-slate-200 rounded px-2 py-1.5 text-xs"
                  placeholder="邮箱"
                />
              </td>
              <td class="py-2 px-2">
                <input
                  v-model="itemAt(i).phone"
                  type="tel"
                  autocomplete="off"
                  class="w-full min-h-[36px] border border-slate-200 rounded px-2 py-1.5 text-xs"
                  placeholder="手机号"
                />
              </td>
              <td class="py-2 px-2">
                <input
                  v-model="itemAt(i).password"
                  type="text"
                  autocomplete="new-password"
                  class="w-full min-h-[36px] border border-slate-200 rounded px-2 py-1.5 text-xs"
                  placeholder="初始密码"
                />
              </td>
              <td class="py-2 px-2">
                <select
                  v-model="itemAt(i).role"
                  class="w-full min-h-[36px] border border-slate-200 rounded px-2 py-1.5 text-xs bg-white"
                >
                  <option value="staff">员工</option>
                  <option value="seniorStaff">高级员工</option>
                  <option value="manager">经理</option>
                  <option value="warehouseKeeper">仓管</option>
                  <option value="accountant">财务</option>
                  <option value="admin">管理员</option>
                </select>
              </td>
              <td class="py-2 px-2">
                <input
                  v-model="itemAt(i).department"
                  autocomplete="off"
                  class="w-full min-h-[36px] border border-slate-200 rounded px-2 py-1.5 text-xs"
                  placeholder="部门"
                />
              </td>
              <td class="py-2 pr-1 text-center">
                <button
                  @click="items.splice(i, 1)"
                  class="text-red-400 hover:text-red-600 text-lg min-h-[36px] min-w-[36px]"
                >
                  &times;
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 移动端卡片 -->
      <div class="md:hidden space-y-3 mb-4">
        <div
          v-for="(_, i) in items"
          :key="i"
          class="bg-slate-50 rounded-xl p-4 border space-y-2"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-slate-600"
              >用户 {{ i + 1 }}</span
            >
            <button
              @click="items.splice(i, 1)"
              class="text-red-400 hover:text-red-600 text-xl min-h-[36px] min-w-[36px]"
            >
              &times;
            </button>
          </div>
          <input
            v-model="itemAt(i).name"
            autocomplete="off"
            class="w-full border rounded px-3 py-2 text-sm"
            placeholder="姓名 *"
          />
          <input
            v-model="itemAt(i).email"
            type="email"
            autocomplete="off"
            class="w-full border rounded px-3 py-2 text-sm"
            placeholder="邮箱"
          />
          <input
            v-model="itemAt(i).phone"
            type="text"
            autocomplete="off"
            class="w-full border rounded px-3 py-2 text-sm"
            placeholder="手机号"
          />
          <input
            v-model="itemAt(i).password"
            type="text"
            autocomplete="new-password"
            class="w-full border rounded px-3 py-2 text-sm"
            placeholder="初始密码 *"
          />
          <div class="grid grid-cols-2 gap-2">
            <select
              v-model="itemAt(i).role"
              class="w-full min-h-[44px] border rounded px-3 py-2 text-sm bg-white"
            >
              <option value="staff">员工</option>
              <option value="seniorStaff">高级员工</option>
              <option value="manager">经理</option>
              <option value="warehouseKeeper">仓管</option>
              <option value="accountant">财务</option>
              <option value="admin">管理员</option>
            </select>
            <input
              v-model="itemAt(i).department"
              autocomplete="off"
              class="w-full border rounded px-3 py-2 text-sm"
              placeholder="部门"
            />
          </div>
        </div>
      </div>

      <button
        @click="addRow"
        class="min-h-[44px] w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
      >
        + 添加行
      </button>

      <!-- 快速预设 -->
      <div class="mt-4 p-3 bg-slate-50 rounded-lg">
        <p class="text-xs font-medium text-slate-500 mb-2">快速预设</p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            @click="presetSmallFactory"
            class="px-3 py-1.5 bg-white border rounded-lg text-xs hover:bg-blue-50 hover:border-blue-300 transition min-h-[36px]"
          >
            小厂标配（经理+仓管+员工×2）
          </button>
          <button
            type="button"
            @click="presetAccountant"
            class="px-3 py-1.5 bg-white border rounded-lg text-xs hover:bg-blue-50 hover:border-blue-300 transition min-h-[36px]"
          >
            + 财务
          </button>
          <button
            type="button"
            @click="presetClear"
            class="px-3 py-1.5 bg-white border rounded-lg text-xs text-red-400 hover:bg-red-50 hover:border-red-300 transition min-h-[36px]"
          >
            清空
          </button>
        </div>
      </div>

      <div class="mt-6 flex gap-2">
        <button
          @click="handleSubmit"
          :disabled="submitting"
          class="flex-1 min-h-[48px] bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition font-medium text-sm disabled:opacity-50"
        >
          {{ submitting ? "正在创建..." : "批量创建" }}
        </button>
        <NuxtLink
          to="/users"
          class="flex-1 min-h-[48px] border py-3 rounded-lg text-center hover:bg-slate-50 transition text-sm"
          >取消</NuxtLink
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth" as any] });
const toast = useToast();
const { apiFetch } = useApi();

type Item = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  department: string;
};
const items = reactive<Item[]>([]);
const submitting = ref(false);

function itemAt(i: number): Item {
  return items[i]!;
}
function addRow() {
  items.push({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "staff",
    department: "",
  });
}

const presetSmallFactory = () => {
  items.length = 0;
  items.push({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "manager",
    department: "",
  });
  items.push({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "warehouseKeeper",
    department: "",
  });
  items.push({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "staff",
    department: "",
  });
  items.push({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "staff",
    department: "",
  });
};
const presetAccountant = () => {
  items.push({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "accountant",
    department: "",
  });
};
const presetClear = () => {
  items.length = 0;
  addRow();
};

addRow();

const handleSubmit = async () => {
  const valid = items.filter((i) => i.name.trim() && i.password);
  if (valid.length === 0)
    return toast.error("请至少填写一行完整的用户信息（姓名+密码）");

  // 检查重复邮箱
  const emails = valid.map((u) => u.email).filter(Boolean);
  const dupEmail = emails.find((e, i) => emails.indexOf(e) !== i);
  if (dupEmail) return toast.error(`邮箱 "${dupEmail}" 重复，请检查`);

  try {
    submitting.value = true;
    const res = await apiFetch("/api/users/batch", {
      method: "POST",
      body: {
        items: valid.map((u) => ({
          name: u.name.trim(),
          email: u.email || undefined,
          phone: u.phone || undefined,
          password: u.password,
          role: u.role,
          department: u.department || undefined,
        })),
      },
    });
    toast.success(`成功创建 ${res.count} 个用户`);
    await navigateTo("/users");
  } catch (e: any) {
    toast.error(e, "批量创建失败");
  } finally {
    submitting.value = false;
  }
};
</script>
