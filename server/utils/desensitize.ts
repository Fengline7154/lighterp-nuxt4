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

  return {
    ...order,
    totalAmount: "***",
    customer: undefined,
  };
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
