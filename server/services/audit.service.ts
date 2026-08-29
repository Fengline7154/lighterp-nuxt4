// server/services/audit.service.ts
import type { PrismaClient } from "~~/prisma/generated/client";
import { createAuditRepository } from "~~/server/repositories/postgres/audit.repository";

export const createAuditService = (prisma: PrismaClient) => {
  // 创建 Repository 实例
  const auditRepo = createAuditRepository(prisma);

  return {
    /**
     * 记录操作日志
     * @param operatorId 操作人 ID
     * @param entity 实体类型：User/Product/Order/Bom 等
     * @param entityId 实体 ID
     * @param action 操作：CREATE/UPDATE/DELETE/STATUS_CHANGE/APPROVE/OBSOLETE
     * @param detail 变更详情：{ field?, oldValue?, newValue?, remark? }
     */
    async log(
      operatorId: string,
      entity: string,
      entityId: string,
      action: string,
      detail?: {
        field?: string;
        oldValue?: string;
        newValue?: string;
        remark?: string;
      },
    ) {
      // 调用 Repository 的 createLog 方法（审计日志通常独立于业务事务，不传 tx）
      return auditRepo.createLog({
        operatorId,
        entity,
        entityId,
        action,
        field: detail?.field,
        oldValue: detail?.oldValue,
        newValue: detail?.newValue,
        remark: detail?.remark,
      });
    },

    /**
     * 查询操作日志（含补全信息）
     */
    async getList(options: {
      page: number;
      limit: number;
      entity?: string;
      entityId?: string;
      operatorId?: string;
      action?: string;
      startDate?: string;
      endDate?: string;
    }) {
      // 1. 使用 Repository 进行分页查询
      const { data, total, page, limit, totalPages } = await auditRepo.findMany(
        {
          page: options.page,
          limit: options.limit,
          entity: options.entity,
          entityId: options.entityId,
          operatorId: options.operatorId,
          action: options.action,
          startDate: options.startDate,
          endDate: options.endDate,
          orderBy: { createdAt: "desc" }, // 默认排序
        },
      );

      // 若没有数据，直接返回（避免后续补全查询）
      if (data.length === 0) {
        return {
          data: [],
          page,
          limit,
          total,
          totalPages,
        };
      }

      // 2. 补全操作人信息（工号、姓名）
      const userIds = [...new Set(data.map((l) => l.operatorId))];
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, badgeCode: true, name: true },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));

      // 3. 按 entity 类型分组收集 entityId，批量获取业务编码
      const entityGroups: Record<string, string[]> = {};
      for (const log of data) {
        if (!entityGroups[log.entity]) {
          entityGroups[log.entity] = [];
        }
        entityGroups[log.entity]!.push(log.entityId);
      }

      const entityCodeMap = new Map<string, string>();
      const promises: Promise<void>[] = [];

      for (const [entity, ids] of Object.entries(entityGroups)) {
        const uniqueIds = [...new Set(ids)];
        switch (entity) {
          case "User":
            promises.push(
              prisma.user
                .findMany({
                  where: { id: { in: uniqueIds } },
                  select: { id: true, badgeCode: true },
                })
                .then((rows) => {
                  for (const r of rows)
                    entityCodeMap.set(`User:${r.id}`, r.badgeCode);
                }),
            );
            break;
          case "Product":
            promises.push(
              prisma.product
                .findMany({
                  where: { id: { in: uniqueIds } },
                  select: { id: true, code: true },
                })
                .then((rows) => {
                  for (const r of rows)
                    entityCodeMap.set(`Product:${r.id}`, r.code);
                }),
            );
            break;
          case "Order":
            promises.push(
              prisma.order
                .findMany({
                  where: { id: { in: uniqueIds } },
                  select: { id: true, orderCode: true },
                })
                .then((rows) => {
                  for (const r of rows)
                    entityCodeMap.set(`Order:${r.id}`, r.orderCode);
                }),
            );
            break;
          case "Bom":
            promises.push(
              prisma.bom
                .findMany({
                  where: { id: { in: uniqueIds } },
                  select: { id: true, bomCode: true },
                })
                .then((rows) => {
                  for (const r of rows)
                    entityCodeMap.set(`Bom:${r.id}`, r.bomCode);
                }),
            );
            break;
          case "Customer":
            promises.push(
              prisma.customer
                .findMany({
                  where: { id: { in: uniqueIds } },
                  select: { id: true, code: true },
                })
                .then((rows) => {
                  for (const r of rows)
                    entityCodeMap.set(`Customer:${r.id}`, r.code);
                }),
            );
            break;
          case "Inventory":
            promises.push(
              prisma.inventory
                .findMany({
                  where: { id: { in: uniqueIds } },
                  select: { id: true, product: { select: { code: true } } },
                })
                .then((rows) => {
                  for (const r of rows)
                    entityCodeMap.set(`Inventory:${r.id}`, r.product.code);
                }),
            );
          case "Supplier":
            promises.push(
              prisma.supplier
                .findMany({
                  where: { id: { in: uniqueIds } },
                  select: { id: true, code: true },
                })
                .then((rows) => {
                  for (const r of rows)
                    entityCodeMap.set(`Supplier:${r.id}`, r.code);
                }),
            );
            break;
          case "PurchaseOrder":
            promises.push(
              prisma.purchaseOrder
                .findMany({
                  where: { id: { in: uniqueIds } },
                  select: { id: true, orderCode: true },
                })
                .then((rows) => {
                  for (const r of rows)
                    entityCodeMap.set(`PurchaseOrder:${r.id}`, r.orderCode);
                }),
            );
            break;
          case "Worker":
            promises.push(
              prisma.worker
                .findMany({
                  where: { id: { in: uniqueIds } },
                  select: { id: true, code: true },
                })
                .then((rows) => {
                  for (const r of rows)
                    entityCodeMap.set(`Worker:${r.id}`, r.code);
                }),
            );
            break;
          case "Location":
            promises.push(
              prisma.location
                .findMany({
                  where: { id: { in: uniqueIds } },
                  select: { id: true, code: true },
                })
                .then((rows) => {
                  for (const r of rows)
                    entityCodeMap.set(`Location:${r.id}`, r.code);
                }),
            );
            break;
          case "Process":
            promises.push(
              prisma.process
                .findMany({
                  where: { id: { in: uniqueIds } },
                  select: { id: true, name: true },
                })
                .then((rows) => {
                  for (const r of rows)
                    entityCodeMap.set(`Process:${r.id}`, r.name);
                }),
            );
            break;
          case "OrderReceipt":
            promises.push(
              prisma.orderReceipt
                .findMany({
                  where: { id: { in: uniqueIds } },
                  select: { id: true, receiptCode: true },
                })
                .then((rows) => {
                  for (const r of rows)
                    entityCodeMap.set(`OrderReceipt:${r.id}`, r.receiptCode);
                }),
            );
            break;
          case "PurchaseReceipt":
            promises.push(
              prisma.purchaseReceipt
                .findMany({
                  where: { id: { in: uniqueIds } },
                  select: { id: true, receiptCode: true },
                })
                .then((rows) => {
                  for (const r of rows)
                    entityCodeMap.set(`PurchaseReceipt:${r.id}`, r.receiptCode);
                }),
            );
            break;
          case "ProductionLog":
            promises.push(
              prisma.productionLog
                .findMany({
                  where: { id: { in: uniqueIds } },
                  select: { id: true, processName: true, createdAt: true },
                })
                .then((rows) => {
                  for (const r of rows)
                    entityCodeMap.set(`ProductionLog:${r.id}`, r.processName);
                }),
            );
            break;
          case "OrderMiscCost":
            promises.push(
              prisma.orderMiscCost
                .findMany({
                  where: { id: { in: uniqueIds } },
                  select: { id: true, description: true },
                })
                .then((rows) => {
                  for (const r of rows)
                    entityCodeMap.set(`OrderMiscCost:${r.id}`, r.description);
                }),
            );
            break;
          case "OrderProcessPlan":
            promises.push(
              prisma.orderProcessPlan
                .findMany({
                  where: { id: { in: uniqueIds } },
                  select: { id: true, processName: true },
                })
                .then((rows) => {
                  for (const r of rows)
                    entityCodeMap.set(
                      `OrderProcessPlan:${r.id}`,
                      r.processName,
                    );
                }),
            );
            break;
          case "InventoryLog":
            promises.push(
              prisma.inventoryLog
                .findMany({
                  where: { id: { in: uniqueIds } },
                  select: { id: true, relatedCode: true, type: true },
                })
                .then((rows) => {
                  for (const r of rows)
                    entityCodeMap.set(
                      `InventoryLog:${r.id}`,
                      r.relatedCode || r.type,
                    );
                }),
            );
            break;
          default:
            break;
        }
      }
      await Promise.all(promises);

      // 4. 组装最终结果
      const enriched = data.map((log) => ({
        ...log,
        operatorBadge: userMap.get(log.operatorId)?.badgeCode || log.operatorId,
        operatorName: userMap.get(log.operatorId)?.name || "",
        entityCode:
          entityCodeMap.get(`${log.entity}:${log.entityId}`) || undefined,
      }));

      return {
        data: enriched,
        page,
        limit,
        total,
        totalPages,
      };
    },
  };
};
