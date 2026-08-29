// server/utils/buildRequestContext.ts
import type { H3Event } from "h3";
import type { RequestContext } from "~~/shared/types/request";

/**
 * 从 H3 事件中提取请求上下文（认证信息）
 * 所有 API 层调用服务层前，必须通过此函数构建 ctx
 */
export function buildRequestContext(event: H3Event): RequestContext {
  const auth = event.context.auth?.user;

  return {
    operatorId: auth?.id ?? "",
    sessionId: auth?.sessionId ?? "",
    role: auth?.role ?? null,
    department: auth?.department ?? null,
    permissions: auth?.permissions ?? [],
  };
}
