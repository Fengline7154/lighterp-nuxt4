import { p } from "vue-router/dist/router-CWoNjPRp.mjs";

export type UserRole =
  | "admin"
  | "manager"
  | "seniorStaff"
  | "staff"
  | "warehouseKeeper"
  | "accountant";
/**
 * 权限模板定义
 * 采用 "模块:操作" 的命名规范
 */
export const PermissionTemplates = {
  // ========== 订单管理模块 ==========
  order: {
    view: "order:view", // 查看订单列表
    detail: "order:detail", // 查看订单详情
    create: "order:create", // 创建订单
    edit: "order:edit", // 编辑订单
    delete: "order:delete", // 删除订单
    approve: "order:approve", // 审批订单
    cancel: "order:cancel", // 取消订单
    ship: "order:ship", //订单发货
    export: "order:export", // 导出订单
    print: "order:print", // 打印订单
  },
  // ========== 采购管理模块 ==========
  purchase: {
    view: "purchase:view", // 查看采购单列表/详情
    create: "purchase:create", // 创建采购单
    edit: "purchase:edit", // 编辑采购单
    approve: "purchase:approve", // 审批采购单
    cancel: "purchase:cancel", // 取消采购单
    receipt: "purchase:receipt", // 采购入库
    supplierView: "purchase:supplier-view", // 查看供应商
    supplierManage: "purchase:supplier-manage", // 管理供应商（增删改）
  },
  //=========产品管理模块=============
  product: {
    view: "product:view", //查看产品
    create: "product:create", //创建产品
    edit: "product:edit", //编辑产品
    delete: "product:delete", //删除产品
    status: "product:status", //停用/启用产品
  },
  // ========== 库存管理模块 ==========
  inventory: {
    view: "inventory:view", // 查看库存
    adjust: "inventory:adjust", // 调整库存
    transfer: "inventory:transfer", // 调拨库存
    check: "inventory:check", // 盘点库存
    warning: "inventory:warning", // 库存预警设置
    import: "inventory:import", // 导入库存
    export: "inventory:export", // 导出库存
  },

  // ========== BOM管理模块 ==========
  bom: {
    view: "bom:view", // 查看BOM
    create: "bom:create", // 创建BOM
    edit: "bom:edit", // 编辑BOM
    delete: "bom:delete", // 删除BOM
    copy: "bom:copy", // 复制BOM
    version: "bom:version", // 版本管理
    approve: "bom:approve",
  },
  //=========生产报工模块=============
  production: {
    view: "production:view", // 查看生产进度/报工记录
    report: "production:report", // 提交报工
    revise: "production:revise", // 修改/作废报工
  },
  //=========工资模块==================
  wage: {
    view: "wage:view", //查看工资报表
  },
  // ========== 工序模板模块 ==========
  process: {
    view: "process:view", // 查看工序列表/模板
    manage: "process:manage", // 创建/编辑工序模板
  },

  // ========== 人员管理模块 ==========
  staff: {
    view: "staff:view", // 查看员工
    manage: "staff:manage", // 管理员工（增删改）
    schedule: "staff:schedule", // 排班管理
    attendance: "staff:attendance", // 考勤管理
  },
  //=============客户管理模块=================
  customer: {
    view: "customer:view", //查看客户
    create: "customer:create", //创建客户
    edit: "customer:edit", //编辑客户
    delete: "customer:delete", //删除(停用)客户
  },

  // ========== 用户管理模块（系统级）==========
  user: {
    view: "user:view", // 查看用户列表
    create: "user:create", // 创建用户
    edit: "user:edit", // 编辑用户
    delete: "user:delete", // 删除用户
    assignRole: "user:assign-role", // 分配角色
    resetPassword: "user:reset-password", // 重置密码
  },

  // ========== 敏感数据模块 ==========
  data: {
    viewCost: "data:view-cost", // 查看成本价
    viewProfit: "data:view-profit", // 查看利润
    viewMargin: "data:view-margin", // 查看毛利率
    viewSupplier: "data:view-supplier", // 查看供应商信息
  },

  // ========== 报表模块 ==========
  report: {
    view: "report:view", // 查看报表
    create: "report:create", // 创建报表
    export: "report:export", // 导出报表
    viewFinancial: "report:view-financial", // 查看财务报表
  },

  // ========== 系统设置模块 ==========
  system: {
    config: "system:config", // 系统配置
    log: "system:log", // 查看日志
    backup: "system:backup", // 备份数据
    restore: "system:restore", // 恢复数据
  },
};

/**
 * 角色默认权限配置
 */
export const RoleDefaultPermissions = {
  // 超级管理员 - 拥有所有权限
  admin: ["*"],

  // 经理 - 大部分权限，但不能管理系统和用户
  manager: [
    // 订单模块
    PermissionTemplates.order.view,
    PermissionTemplates.order.detail,
    PermissionTemplates.order.create,
    PermissionTemplates.order.edit,
    PermissionTemplates.order.approve,
    PermissionTemplates.order.cancel,
    PermissionTemplates.order.export,
    PermissionTemplates.order.ship,
    //采购模块
    PermissionTemplates.purchase.view,
    PermissionTemplates.purchase.create,
    PermissionTemplates.purchase.edit,
    PermissionTemplates.purchase.approve,
    PermissionTemplates.purchase.cancel,
    PermissionTemplates.purchase.receipt,
    PermissionTemplates.purchase.supplierView,
    PermissionTemplates.purchase.supplierManage,
    // 库存模块
    PermissionTemplates.inventory.view,
    PermissionTemplates.inventory.adjust,
    PermissionTemplates.inventory.transfer,
    PermissionTemplates.inventory.check,
    //生产报工模块
    PermissionTemplates.production.view,
    PermissionTemplates.production.report,
    PermissionTemplates.production.revise,
    //工资模块
    PermissionTemplates.wage.view,
    //工序模板模块
    PermissionTemplates.process.view,
    PermissionTemplates.process.manage,
    // BOM模块
    PermissionTemplates.bom.view,
    PermissionTemplates.bom.create,
    PermissionTemplates.bom.edit,
    // 客户模块
    PermissionTemplates.customer.view,
    PermissionTemplates.customer.create,
    PermissionTemplates.customer.edit,

    // 产品模块
    PermissionTemplates.product.view,
    PermissionTemplates.product.create,
    PermissionTemplates.product.edit,

    // BOM 审批
    PermissionTemplates.bom.approve,
    // 人员模块（只能查看）
    PermissionTemplates.staff.view,
    PermissionTemplates.staff.manage,
    PermissionTemplates.staff.schedule,

    // 数据权限（经理可以看到成本）
    PermissionTemplates.data.viewCost,
    PermissionTemplates.data.viewProfit,

    // 报表模块
    PermissionTemplates.report.view,
    PermissionTemplates.report.export,

    // 注意：没有 user: 和 system: 的权限
  ],

  // 高级员工
  seniorStaff: [
    // 订单模块（不能审批）
    PermissionTemplates.order.view,
    PermissionTemplates.order.detail,
    PermissionTemplates.order.create,
    PermissionTemplates.order.edit,
    //采购模块
    PermissionTemplates.purchase.view,
    PermissionTemplates.purchase.supplierView,
    // 库存模块（只能查看和调整，不能调拨）
    PermissionTemplates.inventory.view,
    PermissionTemplates.inventory.adjust,

    // BOM模块（只能查看）
    PermissionTemplates.bom.view,
    // 客户模块
    PermissionTemplates.customer.view,

    // 产品模块
    PermissionTemplates.product.view,
    //生产报工
    PermissionTemplates.production.view,
    PermissionTemplates.production.report,
    //工序模板
    PermissionTemplates.process.view, // 高级员工可以查看工序
    // 人员模块（只能查看）
    PermissionTemplates.staff.view,

    // 报表模块（只能查看）
    PermissionTemplates.report.view,

    // 注意：没有成本权限
  ],

  // 普通员工
  staff: [
    // 订单模块（只能查看和创建）
    PermissionTemplates.order.view,
    PermissionTemplates.order.detail,
    PermissionTemplates.order.create,

    // 库存模块（只能查看）
    PermissionTemplates.inventory.view,
    //生产报工
    PermissionTemplates.production.view,
    //PermissionTemplates.production.report, //对于小厂,报工一般由主管进行,需要扫描报工时,该权限再启用
    //工序模板
    PermissionTemplates.process.view, // 普通员工可以查看工序
    // 产品模块
    PermissionTemplates.product.view,
    // BOM模块（只能查看）
    PermissionTemplates.bom.view,

    // 人员模块（只能查看基本信息）
    PermissionTemplates.staff.view,

    // 没有报表权限
  ],

  // 仓库管理员
  warehouseKeeper: [
    // 订单模块（只能查看）
    PermissionTemplates.order.view,
    PermissionTemplates.order.ship,
    //采购模块
    PermissionTemplates.purchase.view,
    PermissionTemplates.purchase.receipt, // 仓库负责采购入库
    PermissionTemplates.purchase.supplierView,
    // 库存模块（全权限）
    PermissionTemplates.inventory.view,
    PermissionTemplates.inventory.adjust,
    PermissionTemplates.inventory.transfer,
    PermissionTemplates.inventory.check,
    PermissionTemplates.inventory.import,
    PermissionTemplates.inventory.export,
    //报工模块
    PermissionTemplates.production.view, // 仓库可以看到生产进度
    // 产品模块
    PermissionTemplates.product.view,
    // BOM模块（只能查看）
    PermissionTemplates.bom.view,
  ],

  // 财务人员（如果有这个角色）
  accountant: [
    // 订单模块（只能查看）
    PermissionTemplates.order.view,
    PermissionTemplates.order.detail,
    //采购模块
    PermissionTemplates.purchase.view, // 财务可以查看采购单
    //工资模块
    PermissionTemplates.wage.view,
    // 数据权限（全部）
    PermissionTemplates.data.viewCost,
    PermissionTemplates.data.viewProfit,
    PermissionTemplates.data.viewMargin,

    // 报表模块（财务相关）
    PermissionTemplates.report.view,
    PermissionTemplates.report.viewFinancial,
    PermissionTemplates.report.export,

    // 没有库存操作权限
  ],
};

// 5. 类型守卫函数
export const isValidRole = (role: string): role is UserRole => {
  return [
    "admin",
    "manager",
    "seniorStaff",
    "staff",
    "warehouseKeeper",
    "accountant",
  ].includes(role);
};

export const getDefaultPermissions = (role: UserRole): string[] => {
  // 类型守卫：检查role是否是有效的UserRole
  if (isValidRole(role)) {
    return RoleDefaultPermissions[role];
  }

  console.warn(`未知的角色类型: ${role}，返回空权限`);
  return [];
};

/**
 * 辅助函数：检查权限是否有效
 */

export const ALL_PERMISSIONS = Object.values(PermissionTemplates).flatMap(
  (category) => Object.values(category),
);

export const ALL_PERMISSIONS_SET = new Set(ALL_PERMISSIONS);

/**
 * 检查权限是否有效
 */
export const isValidPermission = (permission: string): boolean => {
  // 使用 Set 查找，O(1) 时间复杂度
  return ALL_PERMISSIONS_SET.has(permission) || permission === "*";
};

/**
 * 验证权限数组是否全部有效
 * @param permissions - 权限数组
 * @returns {boolean} - 全部有效返回 true，否则返回 false
 */
export function validatePermissions(permissions: string[]): boolean {
  // 如果不是数组，直接返回 false
  if (!Array.isArray(permissions)) {
    return false;
  }

  // 遍历检查每个权限
  for (const permission of permissions) {
    if (!isValidPermission(permission)) {
      return false; // 发现无效权限，立即返回 false
    }
  }

  return true; // 所有权限都有效
}
/**
 * 过滤权限数组，仅保留在 PermissionTemplates 中定义的合法权限
 * @param permissions - 待过滤的权限数组（可能包含无效或脏数据）
 * @returns 仅包含合法权限的数组，去重
 */
export function filterValidPermissions(permissions: string[]): string[] {
  if (!Array.isArray(permissions)) return [];

  const valid: string[] = [];
  const seen = new Set<string>();

  for (const perm of permissions) {
    // "*" 是超级管理员通配符，直接返回
    if (perm === "*") return ["*"];

    if (isValidPermission(perm) && !seen.has(perm)) {
      valid.push(perm);
      seen.add(perm);
    }
  }

  // 开发环境记录被过滤掉的无效权限
  if (import.meta.dev && valid.length < permissions.length) {
    const invalid = permissions.filter((p) => !isValidPermission(p));
    console.warn("[Permission Filter] 过滤掉无效权限:", invalid);
  }

  return valid;
}
