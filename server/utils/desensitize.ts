// server/utils/desensitize.ts

/**
 * 判断用户是否有权查看敏感数据
 */
export function canViewSensitive(permissions: string[]): boolean {
  return (
    permissions.includes("*") ||
    permissions.includes("data:view-cost") ||
    permissions.includes("data:view-profit") ||
    permissions.includes("report:view-financial")
  );
}

/**
 * 订单脱敏：无敏感权限时隐藏客户和金额
 */
export function desensitizeOrder(order: any, permissions: string[]): any {
  if (!order) return order;
  if (canViewSensitive(permissions)) return order;

  const result: any = {
    ...order,
    totalAmount: "***",
  };

  // 客户：保留识别信息，脱敏联系方式
  if (order.customer) {
    result.customer = {
      ...order.customer,
      contact: null,
      phone: null,
      email: null,
      address: null,
    };
  }

  // ✅ 订单明细：脱敏单价（用 null 标记，前端显示 ***）
  if (Array.isArray(order.items)) {
    result.items = order.items.map((item: any) => ({
      ...item,
      unitPrice: null,
    }));
  }

  return result;
}

/**
 * 订单列表脱敏
 */
export function desensitizeOrderList(result: any, permissions: string[]): any {
  if (!result?.data) return result;
  return {
    ...result,
    data: result.data.map((order: any) => desensitizeOrder(order, permissions)),
  };
}
