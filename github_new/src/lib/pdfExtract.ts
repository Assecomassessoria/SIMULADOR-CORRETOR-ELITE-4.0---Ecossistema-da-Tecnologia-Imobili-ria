// Extração de texto de PDFs no cliente usando pdfjs-dist
import * as pdfjsLib from "pdfjs-dist";
// @ts-ignore - worker URL
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export async function extractPdfText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str || "").join(" ");
    fullText += `\n--- Página ${i} ---\n${strings}`;
  }
  return fullText.trim();
}
