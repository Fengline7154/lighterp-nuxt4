// server/repositories/base/prisma.base.repository.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import type { TxContext } from "~~/server/infrastructure/tx";

/**
 * 分页结果接口
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 查询许多记录的选项接口
 */
export interface FindManyOptions {
  page?: number;
  limit?: number;
  orderBy?: any;
  select?: any;
  include?: any;
  where?: any;
}

/**
 * 创建 Prisma 基础仓库实例
 * @param prisma 全局 Prisma 客户端实例
 * @param modelName 模型名称，对应 PrismaClient 中的键
 * @returns 包含常用 CRUD 及批量操作方法的对象，所有方法均支持事务上下文
 */
export function createPrismaBaseRepository<Model extends keyof PrismaClient>(
  prisma: PrismaClient,
  modelName: Model,
) {
  // 根据是否有事务上下文选择客户端
  const getClient = (tx?: TxContext) => tx?.prisma ?? prisma;

  return {
    /**
     * 分页查询多条记录
     */
    async findMany(
      filter: Record<string, any> = {},
      options: FindManyOptions = {},
      tx?: TxContext,
    ): Promise<PaginatedResult<any>> {
      const client = getClient(tx);
      const { page = 1, limit = 10, orderBy, select, include, where } = options;
      const skip = (page - 1) * limit;
      const combinedWhere = { ...filter, ...where };

      const [data, total] = await Promise.all([
        (client as any)[modelName].findMany({
          where: combinedWhere,
          skip,
          take: limit,
          orderBy,
          select,
          include,
        }),
        (client as any)[modelName].count({ where: combinedWhere }),
      ]);

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    },

    /**
     * 查询所有符合条件的记录（不分页）
     */
    async findAll(
      filter: any = {},
      options?: { orderBy?: any; select?: any; include?: any; where?: any },
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      const combinedWhere = { ...filter, ...options?.where };

      return (client as any)[modelName].findMany({
        where: combinedWhere,
        orderBy: options?.orderBy,
        select: options?.select,
        include: options?.include,
      });
    },

    /**
     * 根据 ID 查询单条记录
     */
    async findById(id: string, include?: any, tx?: TxContext) {
      const client = getClient(tx);
      return (client as any)[modelName].findUnique({
        where: { id },
        include,
      });
    },

    /**
     * 查询符合条件的第一条记录（通用）
     * 支持两种调用方式：
     *   1. findFirst(where, tx)           — 不传 options
     *   2. findFirst(where, options, tx)  — 传 options + tx
     */
    async findFirst(
      where: any,
      optionsOrTx?: { select?: any; include?: any } | TxContext,
      tx?: TxContext,
    ): Promise<any> {
      let options: { select?: any; include?: any } | undefined;
      let actualTx: TxContext | undefined;

      if (
        optionsOrTx &&
        typeof optionsOrTx === "object" &&
        "prisma" in optionsOrTx
      ) {
        // 第二个参数是 TxContext
        actualTx = optionsOrTx as TxContext;
      } else {
        // 第二个参数是 options，第三个参数是 tx
        options = optionsOrTx as { select?: any; include?: any } | undefined;
        actualTx = tx;
      }

      const client = getClient(actualTx);
      return (client as any)[modelName].findFirst({
        where,
        select: options?.select,
        include: options?.include,
      });
    },

    /**
     * 创建单条记录
     */
    async create(data: any, tx?: TxContext) {
      const client = getClient(tx);
      return (client as any)[modelName].create({ data });
    },

    /**
     * 更新符合条件的记录（通用，通常配合唯一条件使用）
     * @param where 唯一或限定条件，如 { id: '...' } 或 { email: '...' }
     * @param data  要更新的数据体
     * @param options 可选的 select / include，控制返回字段
     * @param tx 事务上下文
     * @returns 更新后的记录
     */
    async update<T = any>(
      where: Record<string, any>,
      data: any,
      tx?: TxContext,
    ): Promise<T> {
      const client = getClient(tx);
      return (client as any)[modelName].update({
        where,
        data,
      });
    },

    /**
     * 删除单条记录
     */
    async delete(id: string, tx?: TxContext) {
      const client = getClient(tx);
      return (client as any)[modelName].delete({ where: { id } });
    },

    /**
     * 批量创建记录
     */
    async createMany(data: any[], tx?: TxContext) {
      const client = getClient(tx);
      return (client as any)[modelName].createMany({ data });
    },

    /**
     * 批量更新记录（每条记录独立更新）
     */
    async updateMany(
      updates: Array<{ id: string; data: any }>,
      tx?: TxContext,
    ) {
      const client = getClient(tx);
      return client.$transaction(async (innerTx: any) => {
        const results = [];
        for (const { id, data } of updates) {
          results.push(
            (innerTx as any)[modelName].update({ where: { id }, data }),
          );
        }
        return Promise.all(results);
      });
    },

    /**
     * 批量删除记录
     */
    async deleteMany(ids: string[], tx?: TxContext) {
      const client = getClient(tx);
      return (client as any)[modelName].deleteMany({
        where: { id: { in: ids } },
      });
    },

    /**
     * 根据 ID 数组批量查找记录
     */
    async findManyByIds<T = any>(
      ids: string[],
      options?: { select?: any; include?: any },
      tx?: TxContext,
    ): Promise<T[]> {
      const client = getClient(tx);
      return (client as any)[modelName].findMany({
        where: { id: { in: ids } },
        select: options?.select,
        include: options?.include,
      });
    },
    //查找唯一匹配
    async findUnique<T = any>(
      where: Record<string, any>,
      options?: { select?: any; include?: any },
      tx?: TxContext,
    ): Promise<T | null> {
      const client = getClient(tx);
      return (client as any)[modelName].findUnique({
        where,
        select: options?.select,
        include: options?.include,
      });
    },
  };
}
