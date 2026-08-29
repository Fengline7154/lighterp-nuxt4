<template>
  <div class="min-h-screen flex bg-gray-50">
    <!-- 移动端遮罩 -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/30 z-40 lg:hidden"
      @click="sidebarOpen = false"
    />
    <ClientOnly>
      <!-- 侧边栏 -->
      <aside
        :class="[
          'fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 text-white flex-shrink-0 transform transition-transform duration-300 flex flex-col',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ]"
      >
        <div
          class="p-6 text-xl font-bold border-b border-slate-700 flex items-center justify-between flex-shrink-0"
        >
          <span>ERP 系统</span>
          <button
            @click="sidebarOpen = false"
            class="lg:hidden text-slate-400 hover:text-white"
          >
            &times;
          </button>
        </div>
        <nav class="p-4 space-y-1 flex-1 overflow-y-auto">
          <div
            v-for="group in filteredMenuGroups"
            :key="group.label"
            class="mb-2"
          >
            <button
              @click="toggleGroup(group.label)"
              class="flex items-center justify-between w-full px-4 py-2 rounded hover:bg-slate-700 transition text-sm font-medium"
            >
              <span>{{ group.icon }} {{ group.label }}</span>
              <svg
                class="w-4 h-4 transition-transform"
                :class="{ 'rotate-90': expandedGroups.has(group.label) }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <div
              v-show="expandedGroups.has(group.label)"
              class="ml-4 space-y-1 mt-1"
            >
              <NuxtLink
                v-for="item in group.children"
                :key="item.to"
                :to="item.to"
                class="block px-4 py-2 rounded text-sm hover:bg-slate-700 transition"
                active-class="bg-slate-700 text-white"
                @click="sidebarOpen = false"
              >
                {{ item.label }}
              </NuxtLink>
            </div>
          </div>
        </nav>
        <div class="p-4 border-t border-slate-700 flex-shrink-0">
          <button
            @click="handleLogout"
            class="block w-full text-left px-4 py-2 rounded hover:bg-slate-700 transition text-sm text-slate-400"
          >
            退出登录
          </button>
        </div>
      </aside>
    </ClientOnly>
    <!-- 主内容区 -->
    <main class="flex-1 overflow-auto p-6 lg:ml-64 text-sm lg:text-base">
      <!-- 移动端顶部栏 -->
      <div class="lg:hidden mb-4 flex items-center gap-4">
        <button
          @click="sidebarOpen = true"
          class="text-slate-600 hover:text-slate-800"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <h1 class="text-lg font-bold">ERP 系统</h1>
      </div>

      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { resetAccessToken } from "~/composables/useApi";
const authStore = useAuthStore();
const sidebarOpen = ref(false);
const route = useRoute();

// 菜单分组定义
const menuGroups = [
  {
    label: "订单与生产",
    icon: "📋",
    children: [
      {
        label: "工作台",
        to: "/dashboard",
        roles: ["*"], // 登录即可访问
      },
      {
        label: "报表中心",
        to: "/analytics",
        roles: [
          "admin",
          "manager",
          "seniorStaff",
          "warehouseKeeper",
          "accountant",
        ],
      },
      {
        label: "订单管理",
        to: "/orders",
        roles: ["admin", "manager", "seniorStaff", "staff", "accountant"],
      },
      {
        label: "采购管理",
        to: "/purchase-orders",
        roles: ["admin", "manager", "warehouseKeeper", "accountant"],
      },
      {
        label: "缺料分析",
        to: "/shortage",
        roles: ["admin", "manager", "seniorStaff", "warehouseKeeper"],
      },
      {
        label: "报工管理",
        to: "/production-logs",
        roles: ["admin", "manager", "seniorStaff", "staff"],
      },
      {
        label: "工资汇总",
        to: "/wage-summary",
        roles: ["admin", "manager", "accountant"],
      },
      {
        label: "物料需求计算",
        to: "/material-calculator",
        roles: ["admin", "manager", "seniorStaff", "warehouseKeeper"],
      },
    ],
  },
  {
    label: "库存与产品",
    icon: "📦",
    children: [
      {
        label: "库存管理",
        to: "/inventory",
        roles: ["admin", "manager", "warehouseKeeper"],
      },
      {
        label: "产品管理",
        to: "/products",
        roles: ["admin", "manager", "warehouseKeeper", "seniorStaff"],
      },
      {
        label: "BOM 管理",
        to: "/bom",
        roles: ["admin", "manager", "seniorStaff"],
      },
      {
        label: "库位管理",
        to: "/locations",
        roles: ["admin", "manager", "warehouseKeeper"],
      },
      {
        label: "入库记录",
        to: "/receipts",
        roles: ["admin", "manager", "warehouseKeeper"],
      },
      {
        label: "库存流水",
        to: "/inventory-logs",
        roles: ["admin", "manager", "warehouseKeeper", "accountant"],
      },
      {
        label: "工序管理",
        to: "/processes",
        roles: ["admin", "manager", "seniorStaff"],
      },
    ],
  },
  {
    label: "人员与客户",
    icon: "👥",
    children: [
      {
        label: "供应商管理",
        to: "/suppliers",
        roles: [
          "admin",
          "manager",
          "warehouseKeeper",
          "seniorStaff",
          "accountant",
        ],
      },
      {
        label: "员工管理",
        to: "/workers",
        roles: ["admin", "manager"],
      },
      {
        label: "客户管理",
        to: "/customers",
        roles: ["admin", "manager", "seniorStaff", "accountant"],
      },
      { label: "用户管理", to: "/users", roles: ["admin"] },
      {
        label: "个人中心",
        to: "/profile",
        roles: ["*"], // 登录即可访问
      },
    ],
  },
  {
    label: "系统",
    icon: "⚙️",
    children: [
      { label: "操作日志", to: "/audit-logs", roles: ["admin", "manager"] },
    ],
  },
];

// 根据用户角色过滤菜单项，没有可显示子项的组也隐藏
const filteredMenuGroups = computed(() => {
  const role = authStore.user?.role;
  const isAdmin = role === "admin";

  return menuGroups
    .map((group) => ({
      ...group,
      children: group.children.filter((item) => {
        // 通配符：登录即可见
        if (item.roles.includes("*")) return true;
        // admin 可见全部
        if (isAdmin) return true;
        // 非 admin 且有角色时，按角色匹配
        if (!role) return false;
        return item.roles.includes(role);
      }),
    }))
    .filter((group) => group.children.length > 0);
});

// 展开状态：使用 Set 记录展开的分组 label
const expandedGroups = ref(new Set<string>());

// 初始化时展开包含当前路由的分组
onMounted(() => {
  const currentPath = route.path;
  for (const group of filteredMenuGroups.value) {
    if (group.children.some((item) => currentPath.startsWith(item.to))) {
      expandedGroups.value.add(group.label);
    }
  }
  // 如果没有任何展开，默认展开第一个有子项的组
  if (expandedGroups.value.size === 0 && filteredMenuGroups.value.length > 0) {
    expandedGroups.value.add(filteredMenuGroups.value[0]!.label);
  }
});

// 切换分组折叠状态
const toggleGroup = (label: string) => {
  const newSet = new Set(expandedGroups.value);
  if (newSet.has(label)) {
    newSet.delete(label);
  } else {
    newSet.add(label);
  }
  expandedGroups.value = newSet;
};

const handleLogout = async () => {
  resetAccessToken();
  await $fetch("/api/auth/logout", { method: "POST" });
  authStore.resetState();
  await navigateTo("/login");
};
</script>
