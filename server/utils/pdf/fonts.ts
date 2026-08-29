// server/utils/pdf/fonts.ts
import fs from "fs";
import path from "path";

let cachedFonts: { regular: string; bold: string } | null = null;

export const getChineseFontBase64 = (): { regular: string; bold: string } => {
  if (cachedFonts) return cachedFonts;

  // 按优先级查找字体文件
  const fontCandidates = [
    // 1. public 目录（Nuxt 标准静态资源，build 时自动复制）
    path.resolve(process.cwd(), "public/fonts"),
    // 2. .output 部署产物中的 public
    path.resolve(process.cwd(), ".output/public/fonts"),
    // 3. 开发环境兼容：原 shared 目录
    path.resolve(process.cwd(), "shared/assets/fonts"),
    // 4. 系统字体目录（Linux 部署环境）
    "/usr/share/fonts/opentype/noto",
    "/usr/share/fonts/truetype/noto",
  ];

  const regularNames = [
    "NotoSansSC-6.ttf",
    "NotoSansSC-Regular.ttf",
    "NotoSansCJK-Regular.ttc",
  ];
  const boldNames = [
    "Noto-Sans-SC-Bold-2.ttf",
    "NotoSansSC-Bold.ttf",
    "NotoSansCJK-Bold.ttc",
  ];

  let regularBase64 = "";
  let boldBase64 = "";

  // 查找 Regular 字体
  for (const dir of fontCandidates) {
    for (const name of regularNames) {
      const filePath = path.join(dir, name);
      if (fs.existsSync(filePath)) {
        regularBase64 = fs.readFileSync(filePath).toString("base64");
        break;
      }
    }
    if (regularBase64) break;
  }

  // 查找 Bold 字体
  for (const dir of fontCandidates) {
    for (const name of boldNames) {
      const filePath = path.join(dir, name);
      if (fs.existsSync(filePath)) {
        boldBase64 = fs.readFileSync(filePath).toString("base64");
        break;
      }
    }
    if (boldBase64) break;
  }

  if (regularBase64) {
    cachedFonts = {
      regular: regularBase64,
      // Bold 找不到时用 Regular 兜底
      bold: boldBase64 || regularBase64,
    };
    return cachedFonts;
  }

  console.warn("未找到中文字体文件，PDF 将显示乱码");
  return { regular: "", bold: "" };
};
