// server/utils/pdf/generator.ts
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getChineseFontBase64 } from "./fonts";

export const generatePdf = async (options: {
  title?: string;
  fontSize?: number;
  render: (doc: jsPDF) => void;
}): Promise<Buffer> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // 注册中文字体
  const fonts = getChineseFontBase64();
  if (fonts.regular) {
    doc.addFileToVFS("NotoSansSC-Regular.ttf", fonts.regular);
    doc.addFont("NotoSansSC-Regular.ttf", "NotoSansSC", "normal");
  }
  if (fonts.bold) {
    doc.addFileToVFS("NotoSansSC-Bold.ttf", fonts.bold);
    doc.addFont("NotoSansSC-Bold.ttf", "NotoSansSC", "bold");
  }
  if (fonts.regular) {
    doc.setFont("NotoSansSC", "normal");
  }

  doc.setFontSize(options.fontSize || 10);
  options.render(doc);

  const buffer = Buffer.from(doc.output("arraybuffer"));
  return buffer;
};
