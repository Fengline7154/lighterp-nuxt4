// server/services/analytics.service.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createBomRepository } from "~~/server/repositories/postgres/bom.repository";
import {
  createDecimal,
  type IDecimal,
} from "~~/shared/mappers/baseRepoType/decimal";

export const createAnalyticsService = (prisma: PrismaClient) => {
  const bomRepo = createBomRepository(prisma);

  return {
    /** 仪表盘汇总 */
    async getDashboard() {
      const [
        pendingOrders,
        producingOrders,
        todayReceipts,
        lowStock,
        overStock,
        activeBoms,
      ] = await Promise.all([
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.order.count({ where: { status: "PRODUCING" } }),
        prisma.orderReceipt.aggregate({
          where: {
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
          _sum: { quantity: true },
        }),
        prisma.inventory.count({ where: { quantity: { lte: 10 } } }),
        prisma.inventory.count({ where: { quantity: { gte: 1000 } } }),
        prisma.bom.count({ where: { status: "PUBLISHED" } }),
      ]);

      return {
        pendingOrders,
        producingOrders,
        todayInbound: todayReceipts._sum.quantity
          ? String(todayReceipts._sum.quantity)
          : "0",
        lowStock,
        overStock,
        activeBoms,
      };
    },

    /** 订单概览 */
    async getOrderSummary() {
      const result = await prisma.order.groupBy({
        by: ["status"],
        _count: { id: true },
        _sum: { totalAmount: true },
        orderBy: { status: "asc" },
      });

      const total = result.reduce((s: number, r: any) => s + r._count.id, 0);

      return {
        total,
        items: result.map((r: any) => ({
          status: r.status,
          count: r._count.id,
          amount: r._sum.totalAmount ? String(r._sum.totalAmount) : "0",
          percentage:
            total > 0 ? ((r._count.id / total) * 100).toFixed(1) : "0",
        })),
      };
    },

    /** 库存概览 */
    async getInventorySummary() {
      const result = await prisma.inventory.aggregate({
        _count: { id: true },
        _sum: { quantity: true },
        _avg: { quantity: true },
        _min: { quantity: true },
        _max: { quantity: true },
      });

      return {
        totalSkus: result._count.id,
        totalQuantity: result._sum.quantity
          ? String(result._sum.quantity)
          : "0",
        avgQuantity: result._avg.quantity ? String(result._avg.quantity) : "0",
        minQuantity: result._min.quantity ? String(result._min.quantity) : "0",
        maxQuantity: result._max.quantity ? String(result._max.quantity) : "0",
      };
    },

    /** BOM 概览 */
    async getBomSummary() {
      const active = await prisma.bom.count({ where: { status: "PUBLISHED" } });
      const total = await prisma.bom.count();
      const byStatus = await prisma.bom.groupBy({
        by: ["status"],
        _count: { id: true },
      });

      return {
        total,
        active,
        byStatus: byStatus.map((b: any) => ({
          status: b.status,
          count: b._count.id,
        })),
      };
    },

    async getShortage() {
      const producingOrders = await prisma.order.findMany({
        where: { status: { in: ["APPROVED", "PRODUCING"] } },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  category: true,
                  unit: true,
                },
              },
            },
          },
        },
      });

      if (producingOrders.length === 0) {
        return { shortages: [], totalOrders: 0 };
      }

      const expandBom = async (
        productId: string,
        productName: string,
        parentQuantity: IDecimal,
        depth: number = 0,
      ): Promise<Map<string, { productName: string; quantity: IDecimal }>> => {
        const result = new Map<
          string,
          { productName: string; quantity: IDecimal }
        >();
        if (depth >= 10) return result;

        const bom = await bomRepo.findActiveByProductId(productId);
        if (!bom || bom.items.length === 0) {
          result.set(productId, { productName, quantity: parentQuantity });
          return result;
        }

        for (const bomItem of bom.items) {
          const childQty = createDecimal(String(bomItem.quantity)).times(
            parentQuantity,
          );
          const childResult = await expandBom(
            bomItem.materialId,
            bomItem.materialName,
            childQty,
            depth + 1,
          );
          for (const [matId, matData] of childResult) {
            const existing = result.get(matId);
            if (existing) {
              existing.quantity = existing.quantity.plus(matData.quantity);
            } else {
              result.set(matId, {
                productName: matData.productName,
                quantity: matData.quantity,
              });
            }
          }
        }
        return result;
      };

      const materialMap = new Map<
        string,
        {
          productName: string;
          productCode: string;
          unit: string;
          orders: Array<{ orderCode: string; demand: string; source: string }>;
        }
      >();

      for (const order of producingOrders) {
        for (const item of order.items) {
          const totalQty = createDecimal(String(item.quantity));
          const fulfilled = createDecimal(String(item.fulfilledQuantity));
          const remaining = totalQty.minus(fulfilled);
          if (remaining.lte(0)) continue;

          const expandedMaterials = await expandBom(
            item.productId,
            item.productName,
            remaining,
            0,
          );

          for (const [materialId, matData] of expandedMaterials) {
            const existing = materialMap.get(materialId);
            const entry = {
              orderCode: order.orderCode,
              demand: matData.quantity.toString(),
              source: `${item.productName}(BOM)`,
            };
            if (existing) {
              existing.orders.push(entry);
            } else {
              const material = await prisma.product.findUnique({
                where: { id: materialId },
                select: { name: true, code: true, unit: true },
              });
              materialMap.set(materialId, {
                productName: material?.name || matData.productName,
                productCode: material?.code || materialId,
                unit: material?.unit || "",
                orders: [entry],
              });
            }
          }
        }
      }

      const allMaterialIds = [...materialMap.keys()];
      const inventories = await prisma.inventory.findMany({
        where: { productId: { in: allMaterialIds } },
      });
      const invMap = new Map(inventories.map((i) => [i.productId, i]));

      const shortages: Array<{
        productId: string;
        productCode: string;
        productName: string;
        unit: string;
        demand: string;
        available: string;
        realShortage: string;
        orderCount: number;
      }> = [];

      for (const [productId, data] of materialMap) {
        const totalDemand = data.orders.reduce(
          (s, o) => s.plus(createDecimal(o.demand)),
          createDecimal(0),
        );
        const inv = invMap.get(productId);
        const invQty = inv
          ? createDecimal(String(inv.quantity))
          : createDecimal(0);
        const realShortage = totalDemand.minus(invQty);

        if (realShortage.gt(0)) {
          shortages.push({
            productId,
            productCode: data.productCode,
            productName: data.productName,
            unit: data.unit || "",
            demand: totalDemand.toString(),
            available: invQty.toString(),
            realShortage: realShortage.toString(),
            orderCount: data.orders.length,
          });
        }
      }

      return {
        shortages: shortages.sort((a, b) => {
          const diff = createDecimal(b.realShortage).minus(
            createDecimal(a.realShortage),
          );
          return diff.gt(0) ? 1 : diff.lt(0) ? -1 : 0;
        }),
        totalOrders: producingOrders.length,
      };
    },

    async getShortageDetail(productId: string) {
      const producingOrders = await prisma.order.findMany({
        where: { status: { in: ["APPROVED", "PRODUCING"] } },
        include: {
          items: {
            select: {
              productId: true,
              productName: true,
              quantity: true,
              fulfilledQuantity: true,
            },
          },
        },
      });

      const details: Array<{
        orderCode: string;
        productName: string;
        demand: string;
        source: string;
      }> = [];

      const findInBom = async (
        targetProductId: string,
        currentProductId: string,
        parentQuantity: IDecimal,
        depth: number = 0,
      ): Promise<IDecimal> => {
        if (depth >= 10) return createDecimal(0);
        if (currentProductId === targetProductId) return parentQuantity;

        const bom = await bomRepo.findActiveByProductId(currentProductId);
        if (!bom || bom.items.length === 0) return createDecimal(0);

        let totalDemand = createDecimal(0);
        for (const bomItem of bom.items) {
          const childQty = createDecimal(String(bomItem.quantity)).times(
            parentQuantity,
          );
          totalDemand = totalDemand.plus(
            await findInBom(
              targetProductId,
              bomItem.materialId,
              childQty,
              depth + 1,
            ),
          );
        }
        return totalDemand;
      };

      for (const order of producingOrders) {
        for (const item of order.items) {
          const totalQty = createDecimal(String(item.quantity));
          const fulfilled = createDecimal(String(item.fulfilledQuantity));
          const remaining = totalQty.minus(fulfilled);
          if (remaining.lte(0)) continue;

          if (item.productId === productId) {
            details.push({
              orderCode: order.orderCode,
              productName: item.productName,
              demand: remaining.toString(),
              source: "直接订单",
            });
            continue;
          }

          const bomDemand = await findInBom(
            productId,
            item.productId,
            remaining,
            0,
          );

          if (bomDemand.gt(0)) {
            details.push({
              orderCode: order.orderCode,
              productName: item.productName,
              demand: bomDemand.toString(),
              source: "BOM 展开",
            });
          }
        }
      }

      return details;
    },
    /** 员工综合工资汇总（工序报工 + 杂费报工） */
    async getWageSummary(params: {
      startDate?: string;
      endDate?: string;
      orderId?: string;
      workerId?: string;
      groupBy?: string;
    }) {
      const where: any = {};

      if (params.orderId) where.orderId = params.orderId;
      if (params.workerId) where.workerId = params.workerId;
      if (params.startDate || params.endDate) {
        where.createdAt = {};
        if (params.startDate) where.createdAt.gte = new Date(params.startDate);
        if (params.endDate)
          where.createdAt.lte = new Date(
            new Date(params.endDate).setHours(23, 59, 59, 999),
          );
      }

      // 并行查询两个数据源
      const [productionLogs, miscCosts] = await Promise.all([
        prisma.productionLog.findMany({
          where,
          include: {
            worker: { select: { id: true, code: true, name: true } },
            order: { select: { id: true, orderCode: true } },
            product: { select: { id: true, code: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
        }),
        prisma.orderMiscCost.findMany({
          where: { ...where, status: "ACTIVE" },
          include: {
            worker: { select: { id: true, code: true, name: true } },
            order: { select: { id: true, orderCode: true } },
          },
          orderBy: { createdAt: "asc" },
        }),
      ]);

      // 合并为统一格式
      const records: any[] = [];

      for (const log of productionLogs) {
        records.push({
          type: "PRODUCTION",
          id: log.id,
          date: log.createdAt.toISOString().split("T")[0],
          description: log.processName,
          amount: Number(log.laborCost || 0),
          orderCode: log.order?.orderCode || null,
          workerId: log.workerId,
          workerName: log.worker?.name || "未指定",
          workerCode: log.worker?.code || null,
          orderId: log.orderId,
          productId: log.product?.id || null,
          productCode: log.product?.code || null,
          productName: log.product?.name || null,
        });
      }

      for (const cost of miscCosts) {
        records.push({
          type: "MISC",
          id: cost.id,
          date: cost.createdAt.toISOString().split("T")[0],
          description: cost.description,
          amount: Number(cost.amount),
          orderCode: cost.order?.orderCode || null,
          workerId: cost.workerId,
          workerName: cost.worker?.name || cost.workerName || "未指定",
          workerCode: cost.worker?.code || null,
          orderId: cost.orderId,
        });
      }

      // 分组聚合
      const groupBy = params.groupBy || "worker";
      const groups = new Map<string, any>();

      for (const record of records) {
        let key = "";
        if (groupBy === "worker") {
          key = record.workerId || record.workerName;
        } else if (groupBy === "order") {
          key = record.orderId || record.orderCode || "unbound";
        } else if (groupBy === "worker+order") {
          key = `${record.workerId || record.workerName}::${record.orderId || record.orderCode || "unbound"}`;
        } else {
          key = "all";
        }

        if (!groups.has(key)) {
          groups.set(key, {
            key,
            workerId: record.workerId,
            workerName: record.workerName,
            workerCode: record.workerCode,
            orderId: record.orderId,
            orderCode: record.orderCode,
            productionTotal: 0,
            miscTotal: 0,
            totalAmount: 0,
            productionCount: 0,
            miscCount: 0,
            records: [],
          });
        }

        const group = groups.get(key)!;
        if (record.type === "PRODUCTION") {
          group.productionTotal += record.amount;
          group.productionCount += 1;
        } else {
          group.miscTotal += record.amount;
          group.miscCount += 1;
        }
        group.totalAmount += record.amount;
        group.records.push(record);
      }

      // 按 totalAmount 降序
      const data = [...groups.values()].sort(
        (a, b) => b.totalAmount - a.totalAmount,
      );

      const summary = {
        totalAmount: records.reduce((s, r) => s + r.amount, 0),
        productionTotal: records
          .filter((r) => r.type === "PRODUCTION")
          .reduce((s, r) => s + r.amount, 0),
        miscTotal: records
          .filter((r) => r.type === "MISC")
          .reduce((s, r) => s + r.amount, 0),
        totalCount: records.length,
        groupCount: data.length,
      };

      return { data, summary };
    },
  };
};
