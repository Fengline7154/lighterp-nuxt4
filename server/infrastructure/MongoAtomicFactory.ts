// server/infrastructure/base.repository.ts
import type { Model, QueryFilter, Document, Query } from "mongoose";

/**
 * 定义通用的分页返回结构
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 通用查询选项
 */
export interface FindOptions {
  page?: number;
  limit?: number;
  sort?: string | Record<string, 1 | -1>;
  select?: string;
  populate?: string | string[];
}

/**
 * 基础仓库类：支持任意 Mongoose Model
 * @param Model Mongoose 模型实例
 */
export const createBaseRepository = <T extends Document>(Model: Model<T>) => {
  return {
    /**
     * 通用查询（带分页、排序、筛选、投影、关联）
     */
    async find(
      filter: QueryFilter<T> = {},
      options: FindOptions = {},
    ): Promise<PaginatedResult<T>> {
      const { page = 1, limit = 10, sort, select, populate } = options;

      let query: Query<T[], T> = Model.find(filter);

      if (select) query = query.select(select);
      if (populate) query = query.populate(populate);
      if (sort) query = query.sort(sort);

      const skip = (page - 1) * limit;
      query = query.skip(skip).limit(limit);

      // 并行执行查询和计数以提高性能
      const [data, total] = await Promise.all([
        query.exec(),
        Model.countDocuments(filter),
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
     * 根据 ID 查找单个文档
     */
    async findById(id: string): Promise<T | null> {
      return Model.findById(id).exec();
    },

    /**
     * 通用创建
     */
    async create(data: Partial<T>): Promise<T> {
      return Model.create(data);
    },

    /**
     * 通用更新 (通过 Filter)
     */
    async update(
      filter: QueryFilter<T>,
      updateData: Partial<T>,
      options: {
        new?: boolean;
        upsert?: boolean;
        runValidators?: boolean;
      } = {},
    ): Promise<T | null> {
      const {
        new: returnNew = true,
        upsert = false,
        runValidators = true,
      } = options;

      return Model.findOneAndUpdate(filter, updateData, {
        new: returnNew,
        upsert,
        runValidators,
      }).exec();
    },

    /**
     * 批量更新
     */
    async updateMany(
      filter: QueryFilter<T>,
      updateData: Partial<T>,
    ): Promise<any> {
      return Model.updateMany(filter, updateData).exec();
    },

    /**
     * 通用删除 (通过 Filter)
     */
    async delete(filter: QueryFilter<T>): Promise<T | null> {
      return Model.findOneAndDelete(filter).exec();
    },

    /**
     * 批量删除
     */
    async deleteMany(filter: QueryFilter<T>): Promise<any> {
      return Model.deleteMany(filter).exec();
    },
  };
};

// 导出类型以便在其他地方使用
export type BaseRepository<T extends Document> = ReturnType<
  typeof createBaseRepository<T>
>;
