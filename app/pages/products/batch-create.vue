<template>
  <div>
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink to="/products" class="text-slate-500 hover:text-slate-700"
        >&larr; 返回产品列表</NuxtLink
      >
      <h1 class="text-xl lg:text-2xl font-bold">批量创建产品</h1>
    </div>

    <div class="bg-white rounded-xl shadow p-4 lg:p-6">
      <!-- 桌面端表格 -->
      <div class="hidden md:block overflow-x-auto mb-4">
        <table class="w-full min-w-[700px]">
          <thead>
            <tr class="border-b bg-slate-100">
              <th
                class="text-left py-3 px-2 text-xs font-medium text-slate-500 uppercase"
              >
                名称 *
              </th>
              <th
                class="text-left py-3 px-2 text-xs font-medium text-slate-500 uppercase"
              >
                规格
              </th>
              <th
                class="text-center py-3 px-2 text-xs font-medium text-slate-500 uppercase w-24"
              >
                单位
              </th>
              <th
                class="text-left py-3 px-2 text-xs font-medium text-slate-500 uppercase w-28"
              >
                分类
              </th>
              <th
                class="text-left py-3 px-2 text-xs font-medium text-slate-500 uppercase"
              >
                标签
              </th>
              <th
                class="text-left py-3 px-2 text-xs font-medium text-slate-500 uppercase"
              >
                备注
              </th>
              <th class="w-8"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="(_, i) in items" :key="i" class="even:bg-slate-50/50">
              <td class="py-2 px-2">
                <input
                  v-model="itemAt(i).name"
                  class="w-full min-h-[36px] border border-slate-200 rounded px-2 py-1.5 text-xs"
                  placeholder="产品名称"
                />
              </td>
              <td class="py-2 px-2">
                <input
                  v-model="itemAt(i).spec"
                  class="w-full min-h-[36px] border border-slate-200 rounded px-2 py-1.5 text-xs"
                  placeholder="规格型号"
                />
              </td>
              <td class="py-2 px-2">
                <select
                  v-model="itemAt(i).unit"
                  class="w-full min-h-[36px] border border-slate-200 rounded px-2 py-1.5 text-xs bg-white"
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
              </td>
              <td class="py-2 px-2">
                <select
                  v-model="itemAt(i).category"
                  class="w-full min-h-[36px] border border-slate-200 rounded px-2 py-1.5 text-xs bg-white"
                >
                  <option value="RAW">原材料</option>
                  <option value="SEMI">半成品</option>
                  <option value="FINISHED">成品</option>
                  <option value="PACKAGING">包材</option>
                </select>
              </td>
              <td class="py-2 px-2">
                <input
                  v-model="itemAt(i).tagsStr"
                  class="w-full min-h-[36px] border border-slate-200 rounded px-2 py-1.5 text-xs"
                  placeholder="逗号分隔"
                />
              </td>
              <td class="py-2 px-2">
                <input
                  v-model="itemAt(i).remark"
                  class="w-full min-h-[36px] border border-slate-200 rounded px-2 py-1.5 text-xs"
                  placeholder="备注"
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
              >产品 {{ i + 1 }}</span
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
            class="w-full border rounded px-3 py-2 text-sm"
            placeholder="产品名称 *"
          />
          <div class="grid grid-cols-2 gap-2">
            <input
              v-model="itemAt(i).spec"
              class="w-full border rounded px-3 py-2 text-sm"
              placeholder="规格"
            />
            <select
              v-model="itemAt(i).unit"
              class="w-full min-h-[44px] border rounded px-3 py-2 text-sm bg-white"
            >
              <option value="PCS">个 (PCS)</option>
              <option value="KG">千克 (KG)</option>
              <option value="SET">套 (SET)</option>
              <option value="M">米 (M)</option>
              <option value="L">升 (L)</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <select
              v-model="itemAt(i).category"
              class="w-full min-h-[44px] border rounded px-3 py-2 text-sm bg-white"
            >
              <option value="RAW">原材料</option>
              <option value="SEMI">半成品</option>
              <option value="FINISHED">成品</option>
              <option value="PACKAGING">包材</option>
            </select>
            <input
              v-model="itemAt(i).tagsStr"
              class="w-full border rounded px-3 py-2 text-sm"
              placeholder="标签，逗号分隔"
            />
          </div>
          <input
            v-model="itemAt(i).remark"
            class="w-full border rounded px-3 py-2 text-sm"
            placeholder="备注"
          />
        </div>
      </div>

      <button
        @click="addRow"
        class="min-h-[44px] w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
      >
        + 添加行
      </button>

      <div class="mt-6 flex gap-2">
        <button
          @click="handleSubmit"
          :disabled="submitting"
          class="flex-1 min-h-[48px] bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition font-medium text-sm disabled:opacity-50"
        >
          {{ submitting ? "正在创建..." : "批量创建" }}
        </button>
        <NuxtLink
          to="/products"
          class="flex-1 min-h-[48px] border py-3 rounded-lg text-center hover:bg-slate-50 transition text-sm"
          >取消</NuxtLink
        >
      </div>

      <div v-if="progress.total > 0" class="mt-4 text-sm text-slate-500">
        已完成 {{ progress.done }} / {{ progress.total }}
        <span v-if="progress.errors.length" class="text-red-500 ml-2"
          >（{{ progress.errors.length }} 个失败）</span
        >
      </div>
    </div>
    <!-- 批量创建重名提醒弹窗 -->
    <div
      v-if="showBatchDuplicateModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="showBatchDuplicateModal = false"
      />
      <div
        class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] overflow-auto"
      >
        <h2 class="text-lg font-bold mb-2 text-amber-600">⚠️ 发现同名产品</h2>
        <p class="text-sm text-slate-500 mb-4">
          以下产品名称已存在，是否继续创建？
        </p>
        <div class="space-y-3 mb-4">
          <div
            v-for="dup in batchDuplicates"
            :key="dup.name"
            class="bg-amber-50 border border-amber-200 rounded-lg p-3"
          >
            <div class="text-sm font-medium">{{ dup.name }}</div>
            <div class="text-xs text-slate-500 mt-1">
              已有产品：
              <span
                v-for="(p, i) in dup.products"
                :key="p.id"
                class="font-mono"
              >
                {{ p.code }}（{{ p.spec || "无规格" }}）<span
                  v-if="i < dup.products.length - 1"
                  >、</span
                >
              </span>
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            @click="confirmBatchCreate"
            class="flex-1 min-h-[44px] bg-amber-500 text-white py-2 rounded-lg hover:bg-amber-600 transition text-sm"
          >
            继续创建
          </button>
          <button
            @click="showBatchDuplicateModal = false"
            class="flex-1 min-h-[44px] border py-2 rounded-lg hover:bg-slate-50 transition text-sm"
          >
            取消
          </button>
        </div>
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
  spec: string;
  unit: string;
  category: string;
  tagsStr: string;
  remark: string;
};
const items = reactive<Item[]>([]);

const submitting = ref(false);
const progress = reactive({ total: 0, done: 0, errors: [] as string[] });

function itemAt(i: number): Item {
  return items[i]!;
}
function addRow() {
  items.push({
    name: "",
    spec: "",
    unit: "PCS",
    category: "RAW",
    tagsStr: "",
    remark: "",
  });
}

addRow();

const showBatchDuplicateModal = ref(false);
const batchDuplicates = ref<Array<{ name: string; products: any[] }>>([]);

// 暂存待提交的数据
const pendingPayload = ref<any>(null);

async function handleSubmit() {
  const validItems = items.filter((i) => i.name.trim());
  if (validItems.length === 0) return toast.error("请至少输入一个产品名称");

  const payload = validItems.map((i) => ({
    name: i.name.trim(),
    spec: i.spec || undefined,
    unit: i.unit,
    category: i.category,
    tags: i.tagsStr
      ? i.tagsStr
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [],
    attributes: i.remark ? { remark: i.remark } : undefined,
  }));

  // 查同名产品
  const allNames = validItems.map((i) => i.name.trim());
  const duplicateList: Array<{ name: string; products: any[] }> = [];

  for (const name of allNames) {
    try {
      const existing = await $fetch<any>("/api/products", {
        query: { keyword: name, limit: 10 },
      });
      const sameNameProducts = (existing?.data || []).filter(
        (p: any) => p.name === name,
      );
      if (sameNameProducts.length > 0) {
        duplicateList.push({
          name,
          products: sameNameProducts,
        });
      }
    } catch {
      // 查询失败不阻断
    }
  }

  if (duplicateList.length > 0) {
    batchDuplicates.value = duplicateList;
    pendingPayload.value = payload;
    showBatchDuplicateModal.value = true;
    return;
  }

  await doBatchCreate(payload);
}

async function confirmBatchCreate() {
  showBatchDuplicateModal.value = false;
  if (pendingPayload.value) {
    await doBatchCreate(pendingPayload.value);
    pendingPayload.value = null;
  }
}

async function doBatchCreate(payload: any) {
  try {
    submitting.value = true;
    const res = await apiFetch<{ success: boolean; count: number }>(
      "/api/products/batch",
      { method: "POST", body: { items: payload } },
    );
    toast.success(`成功创建 ${res.count} 个产品`);
    await navigateTo("/products");
  } catch (e: any) {
    toast.error(e, "批量创建失败");
  } finally {
    submitting.value = false;
  }
}
</script>
