/* eslint-disable @typescript-eslint/no-explicit-any */
// Extração de texto de PDFs no cliente usando pdfjs-dist
import * as pdfjsLib from "pdfjs-dist";
// @ts-expect-error worker URL
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

if (typeof window !== "undefined" && pdfjsLib) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      workerUrl || `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || "4.0.379"}/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn("Failed to set pdfjs workerUrl, using CDN fallback:", e);
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs`;
  }
}

export async function extractPdfText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = (content.items as any[]).map((item: any) => item.str || "").join(" ");
    fullText += `\n--- Página ${i} ---\n${strings}`;
  }
  return fullText.trim();
}

