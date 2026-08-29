// server/api/analytics/monthly-production-summary.get.ts
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";
export default defineEventHandler(async (event) => {
  await requirePermission(event, "report:view");
  const query = getQuery(event);
  const prisma = usePrisma();
  const now = new Date();
  const period = (query.period as string) || "month";

  let startDate: Date;
  if (period === "week") {
    const day = now.getDay();
    startDate = new Date(now);
    startDate.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    startDate.setHours(0, 0, 0, 0);
  } else if (period === "year") {
    startDate = new Date(now.getFullYear(), 0, 1);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const logs = await prisma.inventoryLog.findMany({
    where: { type: "PRODUCTION_IN", createdAt: { gte: startDate } },
    select: { quantity: true, createdAt: true },
  });

  const dailyMap = new Map<string, number>();
  for (const log of logs) {
    const key =
      period === "year"
        ? `${log.createdAt.getUTCFullYear()}-${String(log.createdAt.getUTCMonth() + 1).padStart(2, "0")}`
        : log.createdAt.toISOString().split("T")[0]!;
    dailyMap.set(
      key,
      (dailyMap.get(key) || 0) + Math.abs(Number(log.quantity)),
    );
  }

  const result = [];

  if (period === "year") {
    for (let m = 1; m <= 12; m++) {
      const key = `${now.getUTCFullYear()}-${String(m).padStart(2, "0")}`;
      result.push({ date: `${m}月`, qty: dailyMap.get(key) || 0 });
    }
  } else {
    // 统一用 UTC 日期循环
    const current = new Date(
      Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate(),
      ),
    );
    const end = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    while (current.getTime() <= end.getTime()) {
      const key = current.toISOString().split("T")[0]!;
      result.push({ date: key, qty: dailyMap.get(key) || 0 });
      current.setUTCDate(current.getUTCDate() + 1);
    }
  }

  return { data: result };
});
