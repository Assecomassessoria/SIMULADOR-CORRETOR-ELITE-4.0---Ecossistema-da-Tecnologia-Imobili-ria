/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";
// @ts-expect-error worker url import
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Initialize PDF.js worker
if (typeof window !== "undefined" && pdfjsLib) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      workerUrl || `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || "4.0.379"}/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn("Failed to set pdfjs workerUrl, using CDN fallback:", e);
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs`;
  }
}

export interface UnidadeParsed {
  unidade: string;
  andar?: string;
  apto_torre?: string;
  valor_lancamento?: number;
  tipologia?: string;
  metragem?: string;
}

const HEADER_MAP: Record<keyof UnidadeParsed, string[]> = {
  unidade: [
    "unidade", "unid", "unid.", "apto", "apartamento", "apt", "apto.", "n unidade", "numero unidade",
    "número unidade", "n°", "numero", "nº", "casa", "lote", "sala", "conjunto", "imovel", "imóvel",
    "identificacao", "identificação", "autonomo", "autônomo", "unidade privativa"
  ],
  andar: ["andar", "pavimento", "piso", "pav", "pav."],
  apto_torre: ["torre", "bloco", "bl", "bl.", "tower", "edificio", "edifício", "quadra", "fase"],
  valor_lancamento: [
    "valor lançamento", "valor lancamento", "valor de lançamento", "valor de lancamento",
    "preço", "preco", "valor", "tabela", "valor tabela", "valor de venda", "valor venda",
    "venda", "avaliação", "avaliacao", "valor total", "preço total", "preco total", "vlr",
    "vlr total", "valor da unidade", "preço de venda", "preco de venda", "contrato", "valor contrato"
  ],
  tipologia: ["tipologia", "tipo", "dormitórios", "dormitorios", "dorms", "dorm", "quartos", "qtde quartos", "suites", "modelo"],
  metragem: ["metragem", "área", "area", "área privativa", "area privativa", "m²", "m2", "area total", "área total", "área útil", "area util"],
};

const normalize = (s: string) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const parseNumber = (v: any): number | undefined => {
  if (v === null || v === undefined || v === "") return undefined;
  if (typeof v === "number") return isNaN(v) ? undefined : v;
  let s = String(v).replace(/[R$\s\u00A0]/g, "").trim();
  if (!s) return undefined;

  // Handle Brazilian formatting:
  // e.g., "1.234.567,89" or "350.000,00" or "350000,00" or "350,50"
  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (/\.\d{3}(\.\d{3})*$/.test(s) || (s.match(/\./g) || []).length > 1) {
    // "150.000" or "1.250.000" (thousands dots without decimal comma)
    s = s.replace(/\./g, "");
  }

  const n = parseFloat(s);
  return isNaN(n) ? undefined : n;
};

function mapHeaders(headers: string[]): Partial<Record<keyof UnidadeParsed, number>> {
  const norm = headers.map(normalize);
  const map: Partial<Record<keyof UnidadeParsed, number>> = {};
  (Object.keys(HEADER_MAP) as Array<keyof UnidadeParsed>).forEach((key) => {
    const aliases = HEADER_MAP[key].map(normalize);
    const idx = norm.findIndex((h) => aliases.some((a) => h === a || h.startsWith(a) || h.includes(a)));
    if (idx >= 0) map[key] = idx;
  });
  return map;
}

function findBestHeaderRow(rows: any[][]): { headerIdx: number; map: Partial<Record<keyof UnidadeParsed, number>> } {
  let bestIdx = -1;
  let bestScore = -1;
  let bestMap: Partial<Record<keyof UnidadeParsed, number>> = {};

  const maxScan = Math.min(rows.length, 35);
  for (let i = 0; i < maxScan; i++) {
    const r = rows[i] || [];
    const headers = r.map((h) => String(h ?? ""));
    const map = mapHeaders(headers);
    let score = 0;
    if (map.unidade !== undefined) score += 5;
    if (map.valor_lancamento !== undefined) score += 4;
    if (map.apto_torre !== undefined) score += 2;
    if (map.andar !== undefined) score += 2;
    if (map.tipologia !== undefined) score += 1;
    if (map.metragem !== undefined) score += 1;

    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
      bestMap = map;
    }
  }

  // If no unit column explicitly matched, fallback to first row with multiple text columns
  if (bestScore <= 0) {
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const r = rows[i] || [];
      const textCount = r.filter((c) => typeof c === "string" && c.trim().length > 0).length;
      if (textCount >= 2) {
        bestIdx = i;
        bestMap = mapHeaders((rows[i] || []).map((h) => String(h ?? "")));
        break;
      }
    }
  }

  return { headerIdx: Math.max(0, bestIdx), map: bestMap };
}

function rowsToUnidades(rows: any[][]): UnidadeParsed[] {
  if (!rows.length) return [];

  const { headerIdx, map } = findBestHeaderRow(rows);

  // If still missing unidade column, check if column 0 contains values
  let unidadeCol = map.unidade;
  if (unidadeCol === undefined) {
    // If there is any row with at least 1 column, use first column as unit
    const hasData = rows.some((r, i) => i > headerIdx && r && r.length > 0 && String(r[0] ?? "").trim() !== "");
    if (hasData) {
      unidadeCol = 0;
    } else {
      throw new Error(
        "Coluna de identificação da 'Unidade' não encontrada no arquivo. Verifique se a planilha possui colunas como: Unidade, Apto, Torre, Andar e Valor."
      );
    }
  }

  const out: UnidadeParsed[] = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i] || [];
    const unidadeVal = r[unidadeCol];
    if (unidadeVal === undefined || unidadeVal === null || String(unidadeVal).trim() === "") continue;

    const unidadeStr = String(unidadeVal).trim();
    // Skip subtotal or footer rows like "TOTAL", "SOMA", "MÉDIA", "OBSERVAÇÃO"
    const normVal = normalize(unidadeStr);
    if (["total", "totais", "soma", "resumo", "media", "subtotal", "observacoes", "observacao"].includes(normVal)) {
      continue;
    }

    out.push({
      unidade: unidadeStr,
      andar: map.andar !== undefined && r[map.andar] !== undefined ? String(r[map.andar]).trim() || undefined : undefined,
      apto_torre:
        map.apto_torre !== undefined && r[map.apto_torre] !== undefined
          ? String(r[map.apto_torre]).trim() || undefined
          : undefined,
      valor_lancamento: map.valor_lancamento !== undefined ? parseNumber(r[map.valor_lancamento]) : undefined,
      tipologia:
        map.tipologia !== undefined && r[map.tipologia] !== undefined
          ? String(r[map.tipologia]).trim() || undefined
          : undefined,
      metragem:
        map.metragem !== undefined && r[map.metragem] !== undefined
          ? String(r[map.metragem]).trim() || undefined
          : undefined,
    });
  }
  return out;
}

export async function parseExcel(file: File): Promise<UnidadeParsed[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  
  // Try all sheets until finding one with valid units
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" });
    if (rows && rows.length > 1) {
      try {
        const unidades = rowsToUnidades(rows);
        if (unidades.length > 0) {
          return unidades;
        }
      } catch {
        // Continue to next sheet if current sheet fails
      }
    }
  }

  // Fallback to first sheet
  const firstSheet = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1, raw: true, defval: "" });
  return rowsToUnidades(rows);
}

export async function parsePdf(file: File): Promise<UnidadeParsed[]> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const rows: any[][] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    // Agrupar itens pela posição Y (linha)
    const linesMap = new Map<number, { x: number; str: string }[]>();
    for (const item of content.items as any[]) {
      if (!item.str || !item.transform) continue;
      const y = Math.round(item.transform[5]);
      const arr = linesMap.get(y) || [];
      arr.push({ x: item.transform[4], str: item.str });
      linesMap.set(y, arr);
    }
    const sortedYs = Array.from(linesMap.keys()).sort((a, b) => b - a);
    for (const y of sortedYs) {
      const cells = linesMap
        .get(y)!
        .sort((a, b) => a.x - b.x)
        .map((c) => c.str.trim())
        .filter((s) => s.length > 0);
      if (cells.length) rows.push(cells);
    }
  }

  return rowsToUnidades(rows);
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Renderiza páginas de um PDF como JPEGs base64 — usado para OCR de PDFs escaneados.
 * @param scale resolução (1.5 = bom equilíbrio qualidade/tamanho); maxPages limita custo.
 */
export async function renderPdfPagesToImages(file: File, scale = 1.5, maxPages = 10): Promise<string[]> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const total = Math.min(pdf.numPages, maxPages);
  const images: string[] = [];

  for (let p = 1; p <= total; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, viewport }).promise;
    // JPEG comprimido para reduzir payload
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    images.push(dataUrl.split(",")[1] || "");
    canvas.width = 0;
    canvas.height = 0;
  }

  return images;
}

