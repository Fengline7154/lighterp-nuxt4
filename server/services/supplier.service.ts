// server/services/supplier.service.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createSupplierRepository } from "~~/server/repositories/postgres/supplier.repository";
import { createSequenceService } from "~~/server/services/sequence.service";
import { runInTransaction } from "~~/server/utils/transaction";
import type { TxContext } from "~~/server/infrastructure/tx";
import { createError } from "h3";

export const createSupplierService = (prisma: PrismaClient) => {
  const repo = createSupplierRepository(prisma);
  const seqService = createSequenceService(prisma);
  // 脱敏工具
  function maskPhone(phone?: string | null) {
    if (!phone) return phone;
    return phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
  }

  function maskEmail(email?: string | null) {
    if (!email) return email;
    const [name, domain] = email.split("@");
    if (name && domain) {
      const masked = name.charAt(0) + "***" + name.charAt(name.length - 1);
      return `${masked}@${domain}`;
    } else {
      throw createError({
        statusCode: 400,
        message: "请输入有效的邮箱格式",
      });
    }
  }

  function sanitizeSupplier(supplier: any, canViewSensitive: boolean) {
    if (canViewSensitive) return supplier;
    return {
      ...supplier,
      contact: supplier.contact ? "***" : supplier.contact,
      phone: maskPhone(supplier.phone),
      email: maskEmail(supplier.email),
      address: supplier.address ? "***" : supplier.address,
    };
  }

  return {
    async getList(
      params: {
        page: number;
        limit: number;
        keyword?: string;
        status?: string;
      },
      canViewSensitive: boolean = false,
    ) {
      const where: any = {};
      if (params.keyword) {
        where.OR = [
          { name: { contains: params.keyword } },
          { code: { contains: params.keyword } },
          { phone: { contains: params.keyword } },
        ];
      }
      if (params.status) where.status = params.status;
      const result = await repo.findMany(where, {
        page: params.page,
        limit: params.limit,
        orderBy: { code: "asc" },
      });
      result.data = result.data.map((s: any) =>
        sanitizeSupplier(s, canViewSensitive),
      );
      return result;
    },

    async getAll(canViewSensitive: boolean = false) {
      const suppliers = await repo.findAll(
        { status: "ACTIVE" },
        { orderBy: { code: "asc" } },
      );
      return suppliers.map((s: any) => sanitizeSupplier(s, canViewSensitive));
    },

    async getById(id: string, canViewSensitive: boolean = false) {
      const supplier = await repo.findById(id);
      if (!supplier)
        throw createError({ statusCode: 404, message: "供应商不存在" });
      return sanitizeSupplier(supplier, canViewSensitive);
    },

    async create(
      data: {
        name: string;
        contact?: string;
        phone?: string;
        email?: string;
        address?: string;
        remark?: string;
      },
      tx?: TxContext,
    ) {
      return runInTransaction(tx, prisma, async (txCtx) => {
        const code = await seqService.getFormattedSupplierCode();
        return repo.create({ ...data, code }, txCtx);
      });
    },

    async update(
      id: string,
      data: {
        name?: string;
        contact?: string;
        phone?: string;
        email?: string;
        address?: string;
        remark?: string;
        status?: string;
      },
      tx?: TxContext,
    ) {
      return runInTransaction(tx, prisma, async (txCtx) => {
        const existing = await repo.findById(id, undefined, txCtx);
        if (!existing)
          throw createError({ statusCode: 404, message: "供应商不存在" });

        // 过滤脱敏占位值，避免覆盖真实数据
        const cleanData: typeof data = {};
        for (const [key, value] of Object.entries(data)) {
          if (value === undefined) continue;

          if (typeof value === "string") {
            // 联系方式脱敏后的格式：***、****、138****5678、a***b@domain.com
            if (
              value === "***" || // contact/address 脱敏
              /\*{3,}/.test(value) || // 包含连续星号
              (key === "phone" && value.includes("****")) || // 电话中间打码
              (key === "email" && value.includes("***")) // 邮箱打码
            ) {
              continue; // 跳过脱敏值
            }
          }

          cleanData[key as keyof typeof data] = value;
        }

        return repo.update({ id }, cleanData, txCtx);
      });
    },
  };
};
