//~~/shared/mappers/baseRepoType/decimal.ts

import { Prisma } from "~~/prisma/generated/client";

/**
 * 与 ORM 无关的精确十进制数值接口
 * 所有业务代码只依赖这个接口，不依赖任何具体 ORM 的实现
 */
export interface IDecimal {
  /** 加法 */
  plus(other: IDecimal | number | string): IDecimal;
  /** 减法 */
  minus(other: IDecimal | number | string): IDecimal;
  /** 乘法 */
  times(other: IDecimal | number | string): IDecimal;
  /** 除法 */
  div(other: IDecimal | number | string): IDecimal;
  /** 取负 */
  negated(): IDecimal;
  /** 绝对值 */
  abs(): IDecimal;
  /** 大于 */
  gt(other: IDecimal | number | string): boolean;
  /** 大于等于 */
  gte(other: IDecimal | number | string): boolean;
  /** 小于 */
  lt(other: IDecimal | number | string): boolean;
  /** 小于等于 */
  lte(other: IDecimal | number | string): boolean;
  /** 等于 */
  eq(other: IDecimal | number | string): boolean;
  /** 转换为数字（仅在最终展示时使用，可能丢失精度） */
  toNumber(): number;
  /** 转换为字符串 */
  toString(): string;
}

/**
 * 通用 Decimal 工厂：根据当前使用的 ORM 创建对应的 Decimal 实例
 * 目前返回 Prisma.Decimal，未来换 ORM 只需改这一个工厂函数
 */
export function createDecimal(value: number | string | bigint): IDecimal {
  // 当前使用 Prisma，未来换 ORM 时只需要改这里
  // bigint 转为 string 以避免精度丢失
  const decimalValue = typeof value === "bigint" ? value.toString() : value;
  return new Prisma.Decimal(decimalValue) as unknown as IDecimal;
}

/**
 * 将 IDecimal 转为 Prisma 可直接使用的值（number 或 string）
 * Prisma 的 Decimal 列接受 number | string | Prisma.Decimal
 * 这里用 toString() 保证精度不丢失
 */
export function toPrismaDecimal(value: IDecimal | number): string | number {
  if (typeof value === "number") return value;
  return value.toString();
}
