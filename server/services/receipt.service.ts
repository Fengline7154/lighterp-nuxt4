// server/services/receipt.service.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createSequenceService } from "~~/server/services/sequence.service";
import { createReceiptRepository } from "~~/server/repositories/postgres/receipt.repository";
import { createBomRepository } from "~~/server/repositories/postgres/bom.repository";
import { createOrderReservationRepository } from "../repositories/postgres/order-reservation.repository";
import {
  createDecimal,
  type IDecimal,
} from "~~/shared/mappers/baseRepoType/decimal";
import { runInTransaction } from "~~/server/utils/transaction";
import type { TxContext } from "~~/server/infrastructure/tx";

export interface ReceiptListFilter {
  page: number;
  limit: number;
  receiptCode?: string;
  orderId?: string;
  productId?: string;
  startDate?: Date;
  endDate?: Date;
  sortField?: string;
  sortDir?: string;
}

export const createReceiptService = (prisma: PrismaClient) => {
  const receiptRepo = createReceiptRepository(prisma);
  const bomRepo = createBomRepository(prisma);
  const reservationRepo = createOrderReservationRepository(prisma);
  const seqService = createSequenceService(prisma);

  return {
    // ==================== 读操作 ====================

    /** 入库单列表 */
    async getList(filter: ReceiptListFilter) {
      const {
        page,
        limit,
        receiptCode,
        orderId,
        productId,
        startDate,
        endDate,
        sortField,
        sortDir,
      } = filter;
      const result = await receiptRepo.findManyWithDetails({
        receiptCode,
        orderId,
        productId,
        startDate,
        endDate,
        page,
        limit,
        sortField: sortField || "createdAt",
        sortDir: sortDir || "desc",
      });
      return {
        data: result.data,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      };
    },

    /** 入库单详情 */
    async getById(id: string) {
      const receipt = await receiptRepo.findByIdWithDetails(id);
      if (!receipt)
        throw createError({ statusCode: 404, message: "入库记录不存在" });
      return receipt;
    },

    // ==================== 写操作（纯原子能力） ====================

    /**
     * 创建入库单记录（只写入库单，不改库存、不写流水）
     */
    async createReceipt(
      params: {
        orderId: string;
        orderItemId: string;
        productId: string;
        quantity: number;
        operatorId: string;
        type?: string;
        remark?: string;
        locationId?: string;
      },
      tx?: TxContext,
    ) {
      const {
        orderId,
        orderItemId,
        productId,
        quantity,
        operatorId,
        type = "PRODUCTION_IN",
        remark,
        locationId,
      } = params;

      return runInTransaction(tx, prisma, async (txCtx) => {
        const receiptCode = await seqService.getFormattedReceiptCode();

        return receiptRepo.createReceipt(
          {
            orderId,
            orderItemId,
            productId,
            quantity,
            receiptCode,
            operatorId,
            remark: remark || `${typeLabel(type)}入库`,
            locationId,
          },
          txCtx,
        );
      });
    },

    /**
     * BOM 展开：递归展开到底层物料，返回物料 → 需求量的映射
     * 纯计算，不写库。入库冲销和订单审批预留共用
     */
    async expandBomMaterials(
      bomId: string,
      multiplier: number | string,
      tx?: TxContext,
    ): Promise<Map<string, IDecimal>> {
      const qty = createDecimal(multiplier);
      const materialMap = new Map<string, IDecimal>();

      const expand = async (b: any, multiplier: IDecimal, depth: number) => {
        if (depth > 10) return;
        for (const item of b.items) {
          const childQty = createDecimal(String(item.quantity)).times(
            multiplier,
          );
          const subBom = await bomRepo.findActiveByProductId(
            item.materialId,
            tx,
          );
          if (subBom) {
            await expand(subBom, childQty, depth + 1);
          } else {
            const existing = materialMap.get(item.materialId);
            materialMap.set(
              item.materialId,
              existing ? existing.plus(childQty) : childQty,
            );
          }
        }
      };

      const bom = await bomRepo.findById(bomId, { items: true }, tx);
      if (bom) {
        await expand(bom, qty, 0);
      }

      return materialMap;
    },
  };
};

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    PURCHASE_IN: "采购",
    PRODUCTION_IN: "生产",
    RETURN_IN: "退货",
    TRANSFER_IN: "调拨",
    CHECK_IN: "盘盈",
    INIT: "初始化",
  };
  return map[type] || type;
}
