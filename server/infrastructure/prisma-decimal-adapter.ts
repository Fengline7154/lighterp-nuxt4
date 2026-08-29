// server/infrastructure/prisma-decimal-adapter.ts
import { Prisma } from "~~/prisma/generated/client";
import type { IDecimal } from "~~/shared/mappers/baseRepoType/decimal";

/**
 * Prisma.Decimal 适配器
 * 实现 IDecimal 接口，内部委托给 Prisma.Decimal
 */
export class PrismaDecimalAdapter implements IDecimal {
  constructor(private readonly value: Prisma.Decimal) {}

  plus(other: IDecimal | number | string): IDecimal {
    return new PrismaDecimalAdapter(this.value.plus(other.toString()));
  }

  minus(other: IDecimal | number | string): IDecimal {
    return new PrismaDecimalAdapter(this.value.minus(other.toString()));
  }

  times(other: IDecimal | number | string): IDecimal {
    return new PrismaDecimalAdapter(this.value.times(other.toString()));
  }

  div(other: IDecimal | number | string): IDecimal {
    return new PrismaDecimalAdapter(this.value.div(other.toString()));
  }

  negated(): IDecimal {
    return new PrismaDecimalAdapter(this.value.negated());
  }

  abs(): IDecimal {
    return new PrismaDecimalAdapter(this.value.abs());
  }

  gt(other: IDecimal | number | string): boolean {
    return this.value.gt(other.toString());
  }

  gte(other: IDecimal | number | string): boolean {
    return this.value.gte(other.toString());
  }

  lt(other: IDecimal | number | string): boolean {
    return this.value.lt(other.toString());
  }

  lte(other: IDecimal | number | string): boolean {
    return this.value.lte(other.toString());
  }

  eq(other: IDecimal | number | string): boolean {
    return this.value.eq(other.toString());
  }

  toNumber(): number {
    return this.value.toNumber();
  }

  toString(): string {
    return this.value.toString();
  }
}
