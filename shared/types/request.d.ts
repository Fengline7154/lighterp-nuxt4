/**
 * 请求上下文，从后端认证中间件提取的安全信息
 * 所有服务层方法的第一个参数应为 RequestContext
 */
export interface RequestContext {
  /** 当前操作人（系统用户）ID */
  operatorId: string;
  /** 当前会话 ID */
  sessionId?: string;
  /** 当前用户角色（可选，方便服务层做权限判断） */
  role?: string | null;
  /** 当前用户所属部门（可选，用于数据权限过滤） */
  department?: string | null;

  permissions?: string[];
}
