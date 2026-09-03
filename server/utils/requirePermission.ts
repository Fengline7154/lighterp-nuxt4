// server/utils/requirePermission.ts
import { H3Event } from "h3";
import { createUserRepository } from "~~/server/repositories/postgres/user.repository";
import { usePrisma } from "~~/server/config/prisma";

// context 类型声明保留你原有的完整定义...

export async function requirePermission(event: H3Event, requiredPerm?: string) {
  // 1. 中间件已注入，说明已登录
  if (event.context.auth?.user?.id) {
    const userId = event.context.auth.user.id;

    // 从数据库获取完整用户信息（含 permissions）
    const userRepo = createUserRepository(usePrisma());
    const user = await userRepo.findById(userId);

    if (!user) {
      throw createError({ statusCode: 401, message: "用户不存在" });
    }

    if (user.status === "INACTIVE") {
      throw createError({ statusCode: 403, message: "账号已被禁用" });
    }

    // 注入完整上下文
    event.context.auth = {
      user: {
        id: user.id,
        badgeCode: user.badgeCode,
        name: user.name,
        status: user.status as any,
        role: user.role ?? "staff",
        sessionId: event.context.auth.user.sessionId,
        permissions: user.permissions ?? [],
        department: user.department,
        dataScope: computeDataScope(user.role, user.department),
      },
    };

    // 检查权限
    if (requiredPerm) {
      const requiredPerms = Array.isArray(requiredPerm)
        ? requiredPerm
        : [requiredPerm];

      if (
        !user.permissions?.includes("*") &&
        !requiredPerms.some((perm) => user.permissions?.includes(perm))
      ) {
        throw createError({ statusCode: 403, message: "权限不足" });
      }
    }

    return true;
  }

  // 2. 中间件未注入，说明无 token，要求登录
  throw createError({ statusCode: 401, message: "请先登录" });
}

function computeDataScope(role: string | null, department: string | null) {
  switch (role) {
    case "admin":
      return { type: "all" as const };

    case "manager":
      return department
        ? { type: "department" as const, departmentIds: [department] }
        : { type: "all" as const };

    case "seniorStaff":
      // 高级员工能看到本部门
      return department
        ? { type: "department" as const, departmentIds: [department] }
        : { type: "self" as const };

    case "warehouseKeeper":
      // 仓管只看自己，但后续可按仓库维度扩展
      return { type: "self" as const };

    case "accountant":
      // 财务可能看全部数据用于核算，但无操作权限
      return { type: "all" as const };

    case "staff":
    default:
      return { type: "self" as const };
  }
}
