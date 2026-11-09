<template>
  <div>
    <h1 class="text-xl lg:text-2xl font-bold mb-4">财务工作台</h1>
    <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
      <NuxtLink
        to="/wage-summary"
        class="group bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 rounded-xl shadow-sm hover:shadow-md p-6 transition-all border border-emerald-200/50"
      >
        <div
          class="text-4xl mb-3 group-hover:scale-110 transition-transform origin-left"
        >
          💰
        </div>
        <div class="font-semibold text-slate-800 text-lg">工资汇总</div>
        <div class="text-xs text-slate-500 mt-1">按员工/订单分组</div>
      </NuxtLink>
      <NuxtLink
        to="/inventory-logs"
        class="group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl shadow-sm hover:shadow-md p-6 transition-all border border-blue-200/50"
      >
        <div
          class="text-4xl mb-3 group-hover:scale-110 transition-transform origin-left"
        >
          📋
        </div>
        <div class="font-semibold text-slate-800 text-lg">库存流水</div>
        <div class="text-xs text-slate-500 mt-1">出入库明细</div>
      </NuxtLink>
      <NuxtLink
        to="/analytics"
        class="group bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl shadow-sm hover:shadow-md p-6 transition-all border border-purple-200/50"
      >
        <div
          class="text-4xl mb-3 group-hover:scale-110 transition-transform origin-left"
        >
          📊
        </div>
        <div class="font-semibold text-slate-800 text-lg">报表中心</div>
        <div class="text-xs text-slate-500 mt-1">产量/订单/库存</div>
      </NuxtLink>
      <NuxtLink
        to="/suppliers"
        class="group bg-gradient-to-br from-teal-50 to-teal-100 hover:from-teal-100 hover:to-teal-200 rounded-xl shadow-sm hover:shadow-md p-6 transition-all border border-teal-200/50"
      >
        <div
          class="text-4xl mb-3 group-hover:scale-110 transition-transform origin-left"
        >
          🏢
        </div>
        <div class="font-semibold text-slate-800 text-lg">供应商</div>
        <div class="text-xs text-slate-500 mt-1">采购往来</div>
      </NuxtLink>
      <NuxtLink
        to="/customers"
        class="group bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-xl shadow-sm hover:shadow-md p-6 transition-all border border-orange-200/50"
      >
        <div
          class="text-4xl mb-3 group-hover:scale-110 transition-transform origin-left"
        >
          👥
        </div>
        <div class="font-semibold text-slate-800 text-lg">客户</div>
        <div class="text-xs text-slate-500 mt-1">客户档案</div>
      </NuxtLink>
      <NuxtLink
        to="/audit-logs"
        class="group bg-gradient-to-br from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 rounded-xl shadow-sm hover:shadow-md p-6 transition-all border border-slate-200/50"
      >
        <div
          class="text-4xl mb-3 group-hover:scale-110 transition-transform origin-left"
        >
          📝
        </div>
        <div class="font-semibold text-slate-800 text-lg">操作日志</div>
        <div class="text-xs text-slate-500 mt-1">审计追溯</div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts"></script>
