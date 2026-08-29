// server/services/purchase-order.service.ts
import type {
  PrismaClient,
  PurchaseOrderStatus,
} from "~~/prisma/generated/client";
import { createPurchaseOrderRepository } from "~~/server/repositories/postgres/purchase-order.repository";
import { createSequenceService } from "~~/server/services/sequence.service";
import {
  createDecimal,
  toPrismaDecimal,
  type IDecimal,
} from "~~/shared/mappers/baseRepoType/decimal";
import { runInTransaction } from "~~/server/utils/transaction";
import type { TxContext } from "~~/server/infrastructure/tx";

export const createPurchaseOrderService = (prisma: PrismaClient) => {
  const repo = createPurchaseOrderRepository(prisma);
  const seqService = createSequenceService(prisma);

  return {
    async getList(params: {
      page: number;
      limit: number;
      keyword?: string;
      status?: string;
      supplierId?: string;
      startDate?: string;
      endDate?: string;
    }) {
      const where: any = {};
      if (params.keyword) {
        where.OR = [
          { orderCode: { contains: params.keyword } },
          { supplier: { name: { contains: params.keyword } } },
        ];
      }
      if (params.status) where.status = params.status;
      if (params.supplierId) where.supplierId = params.supplierId;
      if (params.startDate || params.endDate) {
        where.createdAt = {};
        if (params.startDate) where.createdAt.gte = new Date(params.startDate);
        if (params.endDate)
          where.createdAt.lte = new Date(
            new Date(params.endDate).setHours(23, 59, 59, 999),
          );
      }
      return repo.findMany(where, {
        page: params.page,
        limit: params.limit,
        orderBy: { createdAt: "desc" },
        include: { supplier: { select: { name: true } }, items: true },
      });
    },
    /** 更新采购单基本信息 */
    async update(
      id: string,
      data: {
        expectedDate?: Date | null;
        remark?: string;
      },
      tx?: TxContext,
    ) {
      return runInTransaction(tx, prisma, async (txCtx) => {
        const existing = await repo.findById(id);
        if (!existing)
          throw createError({ statusCode: 404, message: "采购单不存在" });
        return repo.update({ id }, data, txCtx);
      });
    },
    async getById(id: string, canViewSensitive: boolean = false) {
      const order = await repo.findById(id, {
        supplier: {
          select: canViewSensitive
            ? {
                id: true,
                code: true,
                name: true,
                contact: true,
                phone: true,
                email: true,
                address: true,
                remark: true,
                status: true,
              }
            : {
                id: true,
                code: true,
                name: true,
                status: true,
              },
        },
        items: {
          include: {
            product: {
              select: { code: true, name: true, spec: true, unit: true },
            },
          },
        },
        receipts: {
          include: {
            location: { select: { code: true, name: true } },
            orderItem: {
              select: {
                productName: true,
                product: { select: { unit: true } },
              },
            },
            operator: { select: { badgeCode: true, name: true } },
          },
        },
      });

      return order;
    },

    /** 创建采购单 */
    async create(
      data: {
        supplierId: string;
        createdById: string;
        expectedDate?: string;
        remark?: string;
        items: Array<{
          productId: string;
          productName: string;
          spec?: string;
          unit?: string;
          quantity: number | string;
          unitPrice: number | string;
        }>;
      },
      tx?: TxContext,
    ) {
      return runInTransaction(tx, prisma, async (txCtx) => {
        const orderCode = await seqService.getFormattedPurchaseOrderCode();

        const totalAmount = data.items.reduce((sum, item) => {
          const lineTotal = createDecimal(item.quantity).times(
            createDecimal(item.unitPrice),
          );
          return sum.plus(lineTotal);
        }, createDecimal(0));

        return repo.createWithItems(
          {
            orderCode,
            supplierId: data.supplierId,
            createdById: data.createdById,
            expectedDate: data.expectedDate
              ? new Date(data.expectedDate)
              : undefined,
            totalAmount: toPrismaDecimal(totalAmount),
            remark: data.remark,
            items: data.items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              spec: item.spec,
              unit: item.unit || "PCS",
              quantity: toPrismaDecimal(createDecimal(item.quantity)),
              unitPrice: toPrismaDecimal(createDecimal(item.unitPrice)),
            })),
          },
          txCtx,
        );
      });
    },

    /** 审批 */
    async approve(id: string, approvedById: string, tx?: TxContext) {
      return repo.approve(id, approvedById, tx);
    },

    /** 更新状态 */
    async updateStatus(
      id: string,
      status: PurchaseOrderStatus,
      tx?: TxContext,
    ) {
      return repo.updateStatus(id, status, tx);
    },

    /** 增量更新已入库数量 */
    async incrementReceivedQty(
      itemId: string,
      qty: number | string,
      tx?: TxContext,
    ) {
      return repo.incrementReceivedQty(itemId, qty, tx);
    },
  };
};
