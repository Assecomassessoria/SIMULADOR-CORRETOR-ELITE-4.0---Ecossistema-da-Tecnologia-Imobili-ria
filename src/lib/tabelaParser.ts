import * as XLSX from "xlsx";

export interface UnidadeParsed {
  unidade: string;
  andar?: string;
  apto_torre?: string;
  valor_lancamento?: number;
  tipologia?: string;
  metragem?: string;
}

const HEADER_MAP: Record<keyof UnidadeParsed, string[]> = {
  unidade: ["unidade", "unid", "apto", "apartamento", "apt", "n unidade", "número unidade", "n°"],
  andar: ["andar", "pavimento", "piso"],
  apto_torre: ["torre", "bloco", "bl", "tower"],
  valor_lancamento: ["valor lançamento", "valor lancamento", "valor de lançamento", "valor de lancamento", "preço", "preco", "valor", "tabela"],
  tipologia: ["tipologia", "tipo"],
  metragem: ["metragem", "área", "area", "m²", "m2"],
};

const normalize = (s: string) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const parseNumber = (v: any): number | undefined => {
  if (v === null || v === undefined || v === "") return undefined;
  if (typeof v === "number") return v;
  let s = String(v).replace(/[R$\s]/g, "").trim();
  // BR format: 1.234.567,89  →  1234567.89
  if (/,\d{1,2}$/.test(s)) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(/,/g, "");
  }
  const n = parseFloat(s);
  return isNaN(n) ? undefined : n;
};

function mapHeaders(headers: string[]): Partial<Record<keyof UnidadeParsed, number>> {
  const norm = headers.map(normalize);
  const map: Partial<Record<keyof UnidadeParsed, number>> = {};
  (Object.keys(HEADER_MAP) as Array<keyof UnidadeParsed>).forEach((key) => {
    const aliases = HEADER_MAP[key].map(normalize);
    const idx = norm.findIndex((h) => aliases.some((a) => h === a || h.includes(a)));
    if (idx >= 0) map[key] = idx;
  });
  return map;
}

function rowsToUnidades(rows: any[][]): UnidadeParsed[] {
  if (!rows.length) return [];

  // Encontrar linha de cabeçalho (primeira com >= 2 valores texto)
  let headerIdx = 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const r = rows[i] || [];
    const textCount = r.filter((c) => typeof c === "string" && c.trim().length > 0).length;
    if (textCount >= 2) {
      headerIdx = i;
      break;
    }
  }
  const headers = (rows[headerIdx] || []).map((h) => String(h ?? ""));
  const map = mapHeaders(headers);

  if (map.unidade === undefined) {
    throw new Error("Coluna 'Unidade' não encontrada no arquivo. Cabeçalhos esperados: Unidade, Apto, Andar, Torre, Valor de Lançamento.");
  }

  const out: UnidadeParsed[] = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i] || [];
    const unidade = r[map.unidade!];
    if (unidade === undefined || unidade === null || String(unidade).trim() === "") continue;
    out.push({
      unidade: String(unidade).trim(),
      andar: map.andar !== undefined ? (r[map.andar] !== undefined ? String(r[map.andar]).trim() : undefined) : undefined,
      apto_torre: map.apto_torre !== undefined ? (r[map.apto_torre] !== undefined ? String(r[map.apto_torre]).trim() : undefined) : undefined,
      valor_lancamento: map.valor_lancamento !== undefined ? parseNumber(r[map.valor_lancamento]) : undefined,
      tipologia: map.tipologia !== undefined ? (r[map.tipologia] !== undefined ? String(r[map.tipologia]).trim() : undefined) : undefined,
      metragem: map.metragem !== undefined ? (r[map.metragem] !== undefined ? String(r[map.metragem]).trim() : undefined) : undefined,
    });
  }
  return out;
}

export async function parseExcel(file: File): Promise<UnidadeParsed[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" });
  return rowsToUnidades(rows);
}

export async function parsePdf(file: File): Promise<UnidadeParsed[]> {
  // Lazy load pdfjs to avoid bloating initial bundle
  const pdfjs: any = await import("pdfjs-dist");
  // @ts-ignore
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const rows: any[][] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    // Agrupar itens pela posição Y (linha)
    const linesMap = new Map<number, { x: number; str: string }[]>();
    for (const item of content.items as any[]) {
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
  const pdfjs: any = await import("pdfjs-dist");
  // @ts-ignore
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
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

