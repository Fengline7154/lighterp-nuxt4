<template>
  <div>
    <h1 class="text-xl lg:text-2xl font-bold mb-6">数据导出</h1>

    <div class="bg-white rounded-xl shadow p-6 space-y-4">
      <div
        v-for="item in exportTypes"
        :key="item.key"
        class="flex items-center justify-between border-b last:border-0 py-3"
      >
        <div>
          <div class="font-medium text-sm">{{ item.label }}</div>
          <div class="text-xs text-slate-400">{{ item.desc }}</div>
        </div>
        <button
          @click="handleExport(item.key)"
          class="min-h-[44px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
        >
          导出 CSV
        </button>
      </div>
    </div>

    <div class="mt-8 bg-white rounded-xl shadow p-6">
      <h2 class="font-semibold mb-3">产品导入</h2>

      <div
        class="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4 text-xs text-slate-600 space-y-1"
      >
        <p class="font-medium text-slate-700">填写说明：</p>
        <p>1. 下载 CSV 模板，删除示例行后填入实际数据</p>
        <p>
          2. 必填字段：<span class="font-medium">名称</span>、<span
            class="font-medium"
            >单位</span
          >
        </p>
        <p>3. 可选字段：规格、类别、包装单位（不填类别默认"原材料"）</p>
        <p>
          4. 单位可选值：PCS(个), PAIR(双), SET(套), T(吨), KG(千克), G(克),
          MG(毫克), KM(千米), M(米), CM(厘米), MM(毫米), M2(平方米),
          CM2(平方厘米), M3(立方米), L(升), ML(毫升), ROLL(卷), BAG(包/袋),
          BOX(箱), CARTON(纸箱), BOTTLE(瓶)
        </p>
        <p>
          5. 类别可选值：<span class="font-medium">成品</span>、<span
            class="font-medium"
            >半成品</span
          >、<span class="font-medium">原材料</span>、<span class="font-medium"
            >包材</span
          >（模板内填中文，导入时自动转换）
        </p>
        <p>6. 产品名称不能与现有产品重复</p>
        <p>7. 产品编码由系统自动生成，无需填写</p>
        <p class="text-red-500">
          8. 导入时如有错误，系统会提示具体行号和原因，请修正后重新上传
        </p>
      </div>

      <div class="flex gap-2 flex-wrap">
        <button
          @click="downloadTemplate"
          class="min-h-[44px] px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition text-sm"
        >
          下载模板
        </button>
        <label
          class="min-h-[44px] px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm cursor-pointer flex items-center"
        >
          上传 CSV
          <input
            type="file"
            accept=".csv"
            class="hidden"
            @change="handleUpload"
          />
        </label>
      </div>

      <div
        v-if="importResult"
        class="mt-4 text-sm whitespace-pre-line"
        :class="importResult.success ? 'text-green-600' : 'text-red-600'"
      >
        {{ importResult.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth" as any] });

const toast = useToast();
const { apiFetch } = useApi();

const exportTypes = [
  { key: "orders", label: "订单", desc: "所有订单及明细" },
  { key: "inventory", label: "库存", desc: "当前库存及可用量" },
  { key: "products", label: "产品", desc: "所有产品基础信息" },
  { key: "production-logs", label: "报工记录", desc: "所有生产报工明细" },
  { key: "workers", label: "员工列表", desc: "所有员工信息" },
];

const handleExport = async (key: string) => {
  try {
    const blob = await $fetch<Blob>(`/api/export/${key}`, {
      responseType: "blob",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${key}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("导出成功");
  } catch (e: any) {
    toast.error(e?.data?.message || "导出失败");
  }
};

const downloadTemplate = async () => {
  try {
    const blob = await $fetch<Blob>("/api/import/products/template", {
      responseType: "blob",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  } catch (e: any) {
    toast.error("模板下载失败");
  }
};

const importResult = ref<any>(null);

const handleUpload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await $fetch<any>("/api/import/products", {
      method: "POST",
      body: formData,
    });
    importResult.value = res;
    if (res.success) {
      toast.success("导入成功");
    } else {
      toast.error(res.message || "导入失败");
    }
  } catch (e: any) {
    importResult.value = {
      success: false,
      message: e?.data?.message || "导入失败",
    };
  }
};
</script>
