// server/services/sequence.service.ts
import { PrismaClient } from "~~/prisma/generated/client";
import { createSequenceRepository } from "~~/server/repositories/postgres/sequence.repository";

/**
 * 创建序列号生成服务实例
 *
 * @remarks
 * 该服务负责生成具有业务含义的唯一标识符（如员工工号、订单号）。
 * 它依赖于底层的 Sequence Repository 来保证序列号的原子性递增，防止并发冲突。
 *
 * @param prisma Prisma 客户端实例
 * @returns 包含各类编码生成方法的对象
 */
export const createSequenceService = (prisma: PrismaClient) => {
  // 初始化序列号数据仓库，用于获取全局唯一的递增序列
  const seqRepo = createSequenceRepository(prisma);

  return {
    /**
     * 生成格式化的用户工号
     *
     * @description
     * 规则：{年份}{4位递增序列}
     * 示例：20230001, 20230002, ..., 20240001
     *
     * @returns Promise<string> 返回生成的员工工号字符串
     */
    async getFormattedUserCode(): Promise<string> {
      const year = new Date().getFullYear();
      const seqKey = `user_code:${year}`;
      const seqValue = await seqRepo.getNextSequence(seqKey);
      return `USER-${year}${String(seqValue).padStart(4, "0")}`;
    },

    /**
     * 生成格式化的订单编号
     *
     * @description
     * 规则：ORD-{年份}{4位递增序列}
     * 示例：ORD-20250001, ORD-20250002, ...
     *
     * @returns Promise<string> 返回生成的订单编号字符串
     */
    async getFormattedOrderCode(): Promise<string> {
      const year = new Date().getFullYear();
      const seqKey = `order_code:${year}`;
      const seqValue = await seqRepo.getNextSequence(seqKey);
      return `ORD-${year}${String(seqValue).padStart(4, "0")}`;
    },

    /**
     * 生成格式化的产品编码
     *
     * @description
     * 规则：P-{年份}{4位递增序列}
     * 示例：P-20250001, P-20250002, ...
     *
     * @returns Promise<string> 返回生成的产品编码字符串
     */
    async getFormattedProductCode(): Promise<string> {
      const year = new Date().getFullYear();
      const seqKey = `product_code:${year}`;
      const seqValue = await seqRepo.getNextSequence(seqKey);
      return `P-${year}${String(seqValue).padStart(4, "0")}`;
    },

    /**
     * 生成格式化的入库单号
     *
     * @description
     * 规则：RC-{年份}{4位递增序列}
     * 示例：RC-20250001, RC-20250002, ...
     *
     * @returns Promise<string> 返回生成的入库单号字符串
     */
    async getFormattedReceiptCode(): Promise<string> {
      const year = new Date().getFullYear();
      const seqKey = `RC_code:${year}`;
      const seqValue = await seqRepo.getNextSequence(seqKey);
      return `RC-${year}${String(seqValue).padStart(4, "0")}`;
    },

    /**
     * 生成格式化的 BOM 单号
     *
     * @description
     * 规则：BOM-{年份}{4位递增序列}
     * 示例：BOM-20250001, BOM-20250002, ...
     *
     * @returns Promise<string> 返回生成的 BOM 单号字符串
     */
    async getFormattedBomCode(): Promise<string> {
      const year = new Date().getFullYear();
      const seqKey = `BOM_code:${year}`;
      const seqValue = await seqRepo.getNextSequence(seqKey);
      return `BOM-${year}${String(seqValue).padStart(4, "0")}`;
    },

    /**
     * 生成格式化的客户编号
     *
     * @description
     * 规则：CUS-{年份}{4位递增序列}
     * 示例：CUS-20250001, CUS-20250002, ...
     *
     * @returns Promise<string> 返回生成的客户编号字符串
     */
    async getFormattedCustomerCode(): Promise<string> {
      const year = new Date().getFullYear();
      const seqKey = `customer_code:${year}`;
      const seqValue = await seqRepo.getNextSequence(seqKey);
      return `CUS-${year}${String(seqValue).padStart(4, "0")}`;
    },

    async getFormattedWorkerCode(): Promise<string> {
      const year = new Date().getFullYear();
      const seqKey = `employee_code:${year}`;
      const seqValue = await seqRepo.getNextSequence(seqKey);
      return `EMY-${year}${String(seqValue).padStart(4, "0")}`;
    },

    async getFormattedLocationCode(): Promise<string> {
      const year = new Date().getFullYear();
      const seqKey = `location_code:${year}`;
      const seqValue = await seqRepo.getNextSequence(seqKey);
      return `LOC-${year}${String(seqValue).padStart(4, "0")}`;
    },

    /**
     * 生成格式化的供应商编号
     *
     * @description
     * 规则：SUP-{年份}{4位递增序列}
     * 示例：SUP-20240001
     *
     * @returns Promise<string> 返回生成的供应商编号字符串
     */
    async getFormattedSupplierCode(): Promise<string> {
      const year = new Date().getFullYear();
      const seqKey = `supplier_code:${year}`;
      const seqValue = await seqRepo.getNextSequence(seqKey);
      return `SUP-${year}${String(seqValue).padStart(4, "0")}`;
    },
    //采购单
    async getFormattedPurchaseOrderCode(): Promise<string> {
      const year = new Date().getFullYear();
      const seqKey = `purchase_order_code:${year}`;
      const seqValue = await seqRepo.getNextSequence(seqKey);
      return `PO-${year}${String(seqValue).padStart(4, "0")}`;
    },
    //采购入库单
    async getFormattedPurchaseReceiptCode(): Promise<string> {
      const year = new Date().getFullYear();
      const seqKey = `PR_code:${year}`;
      const seqValue = await seqRepo.getNextSequence(seqKey);
      return `PR-${year}${String(seqValue).padStart(4, "0")}`;
    },
  };
};
