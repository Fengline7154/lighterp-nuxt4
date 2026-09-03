// server/api/import/products.post.ts
import { usePrisma } from "~~/server/config/prisma";
import { requirePermission } from "~~/server/utils/requirePermission";
import { buildRequestContext } from "~~/server/utils/buildRequestContext";
import { createSequenceService } from "~~/server/services/sequence.service";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "data:export");

  const ctx = buildRequestContext(event);
  const prisma = usePrisma();
  const seqService = createSequenceService(prisma);

  const formData = await readMultipartFormData(event);
  const file = formData?.find((f) => f.name === "file");
  if (!file?.data) {
    throw createError({ statusCode: 400, message: "请上传 CSV 文件" });
  }

  const content = Buffer.from(file.data).toString("utf-8");
  const lines = content.split("\n").filter((l) => l.trim());

  if (lines.length < 2) {
    throw createError({ statusCode: 400, message: "CSV 文件为空" });
  }

  const parseLine = (line: string): string[] =>
    line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));

  const headers = parseLine(lines[0]!);
  const rows = lines.slice(1).map(parseLine);

  // 校验表头
  const requiredHeaders = ["名称", "单位"];
  for (const h of requiredHeaders) {
    if (!headers.includes(h)) {
      throw createError({ statusCode: 400, message: `缺少必填列: ${h}` });
    }
  }

  const nameIdx = headers.indexOf("名称");
  const specIdx = headers.indexOf("规格");
  const unitIdx = headers.indexOf("单位");
  const categoryIdx = headers.indexOf("类别");
  const packUnitIdx = headers.indexOf("包装单位");

  if (nameIdx === -1 || unitIdx === -1) {
    throw createError({
      statusCode: 400,
      message: "表头解析失败，请使用下载的模板",
    });
  }

  const validUnits = [
    "PCS",
    "PAIR",
    "SET",
    "T",
    "KG",
    "G",
    "MG",
    "KM",
    "M",
    "CM",
    "MM",
    "M2",
    "CM2",
    "M3",
    "L",
    "ML",
    "ROLL",
    "BAG",
    "BOX",
    "CARTON",
    "BOTTLE",
  ];

  // 中文类别映射
  const categoryMap: Record<string, string> = {
    成品: "FINISHED",
    半成品: "SEMI",
    原材料: "RAW",
    包材: "PACKAGING",
  };

  const validCategories = ["FINISHED", "SEMI", "RAW", "PACKAGING"];

  const errors: string[] = [];
  const products: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const lineNum = i + 2;

    const name = row[nameIdx] || "";
    const spec = row[specIdx] || "";
    const rawUnit = row[unitIdx] || "";
    const rawCategory = row[categoryIdx] || "原材料";
    const packUnit = row[packUnitIdx] || "";

    // 跳过示例行
    if (name === "帐篷布" && spec === "210D牛津布") continue;

    if (!name) {
      errors.push(`第 ${lineNum} 行：名称为空`);
      continue;
    }
    if (!rawUnit) {
      errors.push(`第 ${lineNum} 行：单位为空`);
      continue;
    }
    if (!validUnits.includes(rawUnit)) {
      errors.push(
        `第 ${lineNum} 行：单位 "${rawUnit}" 不合法，可选值：${validUnits.join(", ")}`,
      );
      continue;
    }

    // 类别映射：中文转英文，支持直接填英文
    const category = categoryMap[rawCategory] || rawCategory;
    if (!validCategories.includes(category)) {
      errors.push(
        `第 ${lineNum} 行：类别 "${rawCategory}" 不合法，可选值：成品、半成品、原材料、包材`,
      );
      continue;
    }

    // 检查名称唯一性
    const existing = await prisma.product.findFirst({
      where: { name },
      select: { id: true },
    });
    if (existing) {
      errors.push(`第 ${lineNum} 行：产品名称 "${name}" 已存在`);
      continue;
    }

    products.push({
      name,
      unit: rawUnit,
      category,
      spec,
      packUnit,
    });
  }

  if (errors.length > 0) {
    return {
      success: false,
      message: `导入失败，${errors.length} 个错误：\n${errors.slice(0, 10).join("\n")}`,
    };
  }

  let created = 0;
  try {
    await prisma.$transaction(async (tx) => {
      for (const p of products) {
        const code = await seqService.getFormattedProductCode();
        await tx.product.create({
          data: {
            code,
            name: p.name,
            spec: p.spec || null,
            unit: p.unit,
            category: p.category,
            packUnit: p.packUnit || null,
          },
        });
        created++;
      }
    });
  } catch (e: any) {
    return {
      success: false,
      message: `导入过程中出错：${e.message}`,
    };
  }

  return { success: true, message: `成功导入 ${created} 个产品` };
});
