// server/application/user.application.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createUserService } from "~~/server/services/user.service";
import { createAuditService } from "~~/server/services/audit.service";
import { createPrismaTxContext } from "~~/server/infrastructure/tx";
import type { RequestContext } from "~~/shared/types/request";
import type { UserRole } from "~~/server/infrastructure/permissionTemplate";
import { createError } from "h3";

/**
 * 角色等级定义（数值越大权限越高）
 * 用于创建/修改用户时的角色等级校验
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 4,
  manager: 3,
  seniorStaff: 2,
  warehouseKeeper: 2,
  accountant: 2,
  staff: 1,
};

/**
 * 校验操作者是否有权限分配目标角色
 */
function assertRoleAssignmentAllowed(
  ctx: RequestContext,
  targetRole: UserRole | string,
  targetCustomPermissions?: string[],
) {
  const operatorRole = ctx.role as UserRole | undefined;
  const operatorPermissions = ctx.permissions || [];

  // Admin 或通配符权限可以分配任何角色
  if (operatorRole === "admin" || operatorPermissions.includes("*")) return;

  const operatorLevel = ROLE_HIERARCHY[operatorRole as UserRole] || 0;
  const targetLevel = ROLE_HIERARCHY[targetRole as UserRole] || 0;

  // 1. 不能创建/分配比自己等级高的角色
  if (targetLevel > operatorLevel) {
    throw createError({
      statusCode: 403,
      message: "无权分配高于自身等级的角色",
    });
  }

  // 2. 创建 admin 必须是 admin
  if (targetRole === "admin") {
    throw createError({
      statusCode: 403,
      message: "只有管理员才能创建管理员账号",
    });
  }

  // 3. 自定义权限不能包含自己没有的权限
  if (targetCustomPermissions?.length) {
    const operatorPerms = new Set(operatorPermissions);
    const invalidPerms = targetCustomPermissions.filter(
      (p) => p !== "*" && !operatorPerms.has(p),
    );
    if (invalidPerms.length > 0) {
      throw createError({
        statusCode: 403,
        message: `无权授予以下权限: ${invalidPerms.join(", ")}`,
      });
    }
  }
}

export const createUserApplication = (prisma: PrismaClient) => {
  const userService = createUserService(prisma);
  const auditService = createAuditService(prisma);

  return {
    /**
     * 创建单个用户（含角色分配权限校验）
     */
    async createUser(ctx: RequestContext, rawdata: unknown) {
      const targetData = rawdata as {
        role?: string;
        customPermissions?: string[];
      };

      // 前置校验
      if (targetData.role) {
        assertRoleAssignmentAllowed(
          ctx,
          targetData.role,
          targetData.customPermissions,
        );
      }

      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);
        return userService.createUser(ctx, rawdata, txCtx);
      });
    },

    /**
     * 批量创建用户（含角色分配权限校验）
     */
    async batchCreateUsers(ctx: RequestContext, rawdata: unknown) {
      const data = rawdata as {
        items: Array<{
          name: string;
          email?: string;
          password: string;
          role: string;
          department?: string;
          customPermissions?: string[];
        }>;
      };

      if (!data.items?.length) {
        throw createError({ statusCode: 400, message: "请至少提供一个用户" });
      }

      // 前置校验：检查每一个目标角色
      for (const item of data.items) {
        assertRoleAssignmentAllowed(ctx, item.role, item.customPermissions);
      }

      return prisma.$transaction(async (tx) => {
        const txCtx = createPrismaTxContext(tx);
        const created: any[] = [];

        for (const item of data.items) {
          const user = await userService.createUser(ctx, item, txCtx);
          created.push(user);
        }

        await auditService.log(ctx.operatorId, "User", "batch", "CREATE", {
          remark: `批量创建 ${created.length} 个用户`,
        });

        return {
          success: true,
          count: created.length,
          data: created.map((u) => ({
            id: u.id,
            badgeCode: u.badgeCode,
            name: u.name,
          })),
        };
      });
    },
  };
};
