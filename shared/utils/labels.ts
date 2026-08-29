// shared/utils/labels.ts

// ==================== 实体类型 ====================
export const entityLabels: Record<string, string> = {
  User: "用户",
  Product: "产品",
  Order: "订单",
  Bom: "BOM",
  Customer: "客户",
  Inventory: "库存",
  Location: "库位",
  Supplier: "供应商",
  ProductionLog: "报工",
  Worker: "员工",
  PurchaseOrder: "采购单",
  Process: "工序",
};

// ==================== 操作类型 ====================
export const actionLabels: Record<string, string> = {
  CREATE: "创建",
  UPDATE: "更新",
  DELETE: "删除",
  STATUS_CHANGE: "状态变更",
  APPROVE: "审批通过",
  OBSOLETE: "废弃",
  START_PRODUCTION: "开始生产",
  SHIP: "发货",
  RECEIPT: "生产入库",
  SAMPLE_DONE: "打样完成",
  MARK_READY: "标记备齐",
  COMPLETE: "订单完成",
  CANCEL: "取消",
  STOCK_IN: "入库",
  STOCK_OUT: "出库",
  TRANSFER: "调拨",
  REVERSAL: "红冲",
  INIT: "初始化",
  RESERVE: "预留",
  RELEASE: "释放预留",
  ALLOCATE: "调配",
  ROUTING_SAVE: "保存工序模板",
  PUBLISH: "发布BOM",
  CLONE: "克隆BOM",
};

// ==================== 操作图标 ====================
export const actionIcons: Record<string, string> = {
  CREATE: "➕",
  UPDATE: "✏️",
  DELETE: "🗑️",
  STATUS_CHANGE: "🔄",
  APPROVE: "✅",
  OBSOLETE: "📦",
  START_PRODUCTION: "🏭",
  SHIP: "📤",
  RECEIPT: "📥",
  SAMPLE_DONE: "📋",
  MARK_READY: "📦",
  COMPLETE: "🏁",
  CANCEL: "❌",
  STOCK_IN: "📥",
  STOCK_OUT: "📤",
  TRANSFER: "🔄",
  REVERSAL: "↩️",
  INIT: "🏁",
  RESERVE: "🔒",
  RELEASE: "🔓",
  ALLOCATE: "📋",
  ROUTING_SAVE: "💾",
  PUBLISH: "✅",
  CLONE: "📋",
};

// ==================== 操作 Badge 样式 ====================
export const actionBadges: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800 border-green-300",
  UPDATE: "bg-blue-100 text-blue-800 border-blue-300",
  DELETE: "bg-red-100 text-red-800 border-red-300",
  STATUS_CHANGE: "bg-amber-100 text-amber-800 border-amber-300",
  APPROVE: "bg-teal-100 text-teal-800 border-teal-300",
  OBSOLETE: "bg-slate-100 text-slate-700 border-slate-300",
  START_PRODUCTION: "bg-purple-100 text-purple-800 border-purple-300",
  SHIP: "bg-cyan-100 text-cyan-800 border-cyan-300",
  RECEIPT: "bg-blue-100 text-blue-800 border-blue-300",
  COMPLETE: "bg-green-100 text-green-800 border-green-300",
  CANCEL: "bg-red-100 text-red-800 border-red-300",
  STOCK_IN: "bg-green-100 text-green-800 border-green-300",
  STOCK_OUT: "bg-red-100 text-red-800 border-red-300",
  TRANSFER: "bg-indigo-100 text-indigo-800 border-indigo-300",
  REVERSAL: "bg-orange-100 text-orange-800 border-orange-300",
  INIT: "bg-slate-100 text-slate-600 border-slate-300",
  RESERVE: "bg-amber-100 text-amber-800 border-amber-300",
  RELEASE: "bg-teal-100 text-teal-800 border-teal-300",
  ALLOCATE: "bg-indigo-100 text-indigo-800 border-indigo-300",
};

// ==================== 字段名映射 ====================
export const fieldLabels: Record<string, Record<string, string>> = {
  User: {
    name: "姓名",
    email: "邮箱",
    phone: "手机号",
    department: "部门",
    status: "状态",
    role: "角色",
  },
  Product: {
    name: "名称",
    spec: "规格",
    unit: "单位",
    category: "分类",
    status: "状态",
    tags: "标签",
  },
  Customer: {
    name: "客户名称",
    contact: "联系人",
    phone: "电话",
    email: "邮箱",
    address: "地址",
    status: "状态",
  },
  Order: { status: "订单状态" },
  Bom: { status: "BOM状态" },
  Supplier: {
    name: "名称",
    contact: "联系人",
    phone: "电话",
    email: "邮箱",
    address: "地址",
    status: "状态",
  },
  Worker: {
    name: "姓名",
    phone: "电话",
    position: "岗位",
    department: "部门",
    status: "状态",
    hourlyRate: "计时工资率",
    unitPrice: "计件单价",
  },
};

// ==================== 值映射 ====================
export const valueLabels: Record<string, Record<string, string>> = {
  category: {
    FINISHED: "成品",
    SEMI: "半成品",
    RAW: "原材料",
    PACKAGING: "包材",
  },
  status: {
    ACTIVE: "正常",
    INACTIVE: "停用",
    DRAFT: "草稿",
    PUBLISHED: "已发布",
    OBSOLETED: "已废弃",
  },
  orderStatus: {
    PENDING: "待审核",
    APPROVED: "已审核",
    SAMPLING: "打样中",
    SAMPLED: "打样完成",
    PRODUCING: "生产中",
    READY: "备货完成",
    COMPLETED: "已完成",
    CANCELLED: "已取消",
  },
  purchaseStatus: {
    PENDING: "待审批",
    APPROVED: "已审批",
    PARTIAL: "部分入库",
    COMPLETED: "已完成",
    CANCELLED: "已取消",
  },
  supplierStatus: {
    ACTIVE: "正常",
    INACTIVE: "停用",
  },
  workerStatus: {
    ACTIVE: "在职",
    INACTIVE: "离职",
  },
  wageType: {
    HOURLY: "计时",
    PIECE: "计件",
  },
  orderType: {
    STANDARD: "标准品",
    VARIANT: "变型品",
    CUSTOM: "定制品",
  },
  reservationType: {
    PRODUCT_RESERVE: "成品预留",
    MATERIAL_RESERVE: "物料预留",
    ALLOCATE: "调配",
  },
  logRelatedType: {
    INIT: "初始化",
    PURCHASE_IN: "采购入库",
    PRODUCTION_IN: "生产入库",
    RETURN_IN: "退货入库",
    TRANSFER_IN: "调拨入库",
    CHECK_IN: "盘盈入库",
    SALES_OUT: "销售出库",
    PRODUCTION_OUT: "生产领料",
    SAMPLE_OUT: "打样领料",
    SCRAP_OUT: "报废出库",
    TRANSFER_OUT: "调拨出库",
    CHECK_OUT: "盘亏出库",
    REVERSAL: "红冲",
    OTHER: "其他",
    ALLOCATE: "调配",
    DEALLOCATE: "撤回调配",
  },
  costDirection: {
    IN: "入库",
    OUT: "出库",
  },
  costType: {
    MATERIAL: "物料",
    LABOR: "人工",
    OVERHEAD: "间接费用",
  },
};

/**
 * 统一的值翻译函数
 * @param field 字段名（如 "category", "status"）
 * @param value 原始值（如 "FINISHED", "ACTIVE"）
 * @returns 中文翻译，未匹配返回原值
 */
export function translateValue(field: string, value: string): string {
  const fieldMap = valueLabels[field];
  if (fieldMap) return fieldMap[value] || value;

  if (field === "status" || field.endsWith("Status")) {
    return valueLabels.status?.[value] || value;
  }

  return value;
}
