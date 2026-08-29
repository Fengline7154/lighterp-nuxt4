// server/utils/requireDataAccess.ts
import { H3Event } from "h3";

interface AccessCheckOptions {
  /** 目标数据所属用户ID */
  ownerUserId?: string;
  /** 目标数据所属部门 */
  ownerDepartment?: string | null;
  /** 自定义错误消息 */
  message?: string;
}

/**
 * 校验当前用户是否有权访问目标数据
 * 配合 requirePermission 使用，先验操作权限，再验数据权限
 */
export async function requireDataAccess(
  event: H3Event,
  options: AccessCheckOptions,
) {
  const auth = event.context.auth?.user;
  if (!auth) throw createError({ statusCode: 401, message: "请先登录" });

  const scope = auth.dataScope;

  // 全量权限 — 直接放行
  if (scope.type === "all") return;

  // 仅自己 — 必须匹配 userId
  if (scope.type === "self") {
    if (options.ownerUserId !== undefined && options.ownerUserId !== auth.id) {
      throw createError({
        statusCode: 403,
        message: options.message || "只能操作自己的数据",
      });
    }
  }

  // 本部门 — 必须匹配部门
  if (scope.type === "department") {
    if (
      options.ownerDepartment !== undefined &&
      options.ownerDepartment !== auth.department
    ) {
      throw createError({
        statusCode: 403,
        message: options.message || "只能操作本部门的数据",
      });
    }
  }
}
