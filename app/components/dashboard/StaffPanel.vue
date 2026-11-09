<template>
  <div>
    <h1 class="text-xl lg:text-2xl font-bold mb-4">我的工作台</h1>
    <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
      <NuxtLink
        to="/production-logs?action=quick-report"
        class="group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl shadow-sm hover:shadow-md p-6 transition-all border border-blue-200/50"
      >
        <div
          class="text-4xl mb-3 group-hover:scale-110 transition-transform origin-left"
        >
          ⏱️
        </div>
        <div class="font-semibold text-slate-800 text-lg">快速报工</div>
        <div class="text-xs text-slate-500 mt-1">登记工序完成数量</div>
      </NuxtLink>
      <NuxtLink
        to="/orders"
        class="group bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 rounded-xl shadow-sm hover:shadow-md p-6 transition-all border border-emerald-200/50"
      >
        <div
          class="text-4xl mb-3 group-hover:scale-110 transition-transform origin-left"
        >
          📋
        </div>
        <div class="font-semibold text-slate-800 text-lg">订单列表</div>
        <div class="text-xs text-slate-500 mt-1">查看当前订单</div>
      </NuxtLink>
      <NuxtLink
        to="/production-logs"
        class="group bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl shadow-sm hover:shadow-md p-6 transition-all border border-purple-200/50"
      >
        <div
          class="text-4xl mb-3 group-hover:scale-110 transition-transform origin-left"
        >
          📝
        </div>
        <div class="font-semibold text-slate-800 text-lg">报工记录</div>
        <div class="text-xs text-slate-500 mt-1">已报工明细</div>
      </NuxtLink>
      <NuxtLink
        to="/material-calculator"
        class="group bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 rounded-xl shadow-sm hover:shadow-md p-6 transition-all border border-amber-200/50"
      >
        <div
          class="text-4xl mb-3 group-hover:scale-110 transition-transform origin-left"
        >
          🧩
        </div>
        <div class="font-semibold text-slate-800 text-lg">物料计算</div>
        <div class="text-xs text-slate-500 mt-1">按订单算需求</div>
      </NuxtLink>
      <NuxtLink
        to="/inventory"
        class="group bg-gradient-to-br from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200 rounded-xl shadow-sm hover:shadow-md p-6 transition-all border border-cyan-200/50"
      >
        <div
          class="text-4xl mb-3 group-hover:scale-110 transition-transform origin-left"
        >
          📦
        </div>
        <div class="font-semibold text-slate-800 text-lg">库存查看</div>
        <div class="text-xs text-slate-500 mt-1">产品库存量</div>
      </NuxtLink>
      <NuxtLink
        to="/profile"
        class="group bg-gradient-to-br from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 rounded-xl shadow-sm hover:shadow-md p-6 transition-all border border-slate-200/50"
      >
        <div
          class="text-4xl mb-3 group-hover:scale-110 transition-transform origin-left"
        >
          👤
        </div>
        <div class="font-semibold text-slate-800 text-lg">个人中心</div>
        <div class="text-xs text-slate-500 mt-1">账号信息</div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts"></script>
