import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "bom:view");

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400 });

  const prisma = usePrisma();
  const bom = await prisma.bom.findUnique({
    where: { id },
    select: { productId: true },
  });
  if (!bom) throw createError({ statusCode: 404 });

  return prisma.bom.findMany({
    where: { productId: bom.productId },
    orderBy: { version: "desc" },
    select: {
      id: true,
      bomCode: true,
      version: true,
      status: true,
      createdAt: true,
    },
  });
});
