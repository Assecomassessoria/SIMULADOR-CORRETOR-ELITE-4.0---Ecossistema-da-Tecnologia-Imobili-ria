import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import {
  Plus,
  Trash2,
  Printer,
  FileDown,
  MessageCircle,
  Copy,
  Check,
  RotateCcw,
  Eraser,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency, parseCurrency } from "@/lib/eliteUtils";
import { OFFICIAL_LOGO_LOCAL, OFFICIAL_LOGO_URL, OFFICIAL_LOGO_PWA } from "@/components/SystemLogo";
import {
  PROPOSTA_DISCLAIMER_LINE_1,
  PROPOSTA_DISCLAIMER_LINE_2,
  escapeHtml,
  formatPhoneMask,
  normalizeBrazilianWhatsApp,
} from "@/components/PropostaClienteModal";
import { toast } from "sonner";

export interface FluxoSerieRow {
  id: string;
  serie: string;
  qtd: string;
  valor: string;
  vencimento: string;
}

export interface FluxoSerieComputed extends FluxoSerieRow {
  qtdNum: number;
  valorUnitario: number;
  subtotal: number;
  percentual: number;
  percentualTexto: string;
}

export interface FluxoPropostaSummary {
  valorContrato: number;
  rows: FluxoSerieComputed[];
  totalValor: number;
  totalPercentual: number;
  diferencaValor: number;
  diferencaPercentual: number;
  isBalanced: boolean;
}

interface PersistedFluxoState {
  cliente: string;
  empreendimento: string;
  valorContrato: string;
  series: FluxoSerieRow[];
}

const STORAGE_KEY = "elite_fluxo_proposta_cliente_v1";

export function createModeloSeries(): FluxoSerieRow[] {
  return [
    { id: "ato", serie: "Ato", qtd: "1", valor: "R$ 4.000,00", vencimento: "12/11/2026" },
    { id: "mensal", serie: "Mensal", qtd: "40", valor: "R$ 676,30", vencimento: "25/12/2026" },
    { id: "semestral", serie: "Semestral", qtd: "6", valor: "R$ 3.000,00", vencimento: "25/06/2027" },
    { id: "anual", serie: "Anual", qtd: "1", valor: "R$ 11.320,95", vencimento: "25/01/2030" },
    { id: "financiamento", serie: "Financiamento", qtd: "1", valor: "R$ 204.000,00", vencimento: "25/01/2030" },
    { id: "fgts", serie: "FGTS", qtd: "1", valor: "R$ 10.627,05", vencimento: "25/01/2030" },
  ];
}

export function createBlankSeries(): FluxoSerieRow[] {
  return [
    { id: "ato", serie: "Ato", qtd: "1", valor: "", vencimento: "" },
    { id: "mensal", serie: "Mensal", qtd: "1", valor: "", vencimento: "" },
    { id: "semestral", serie: "Semestral", qtd: "1", valor: "", vencimento: "" },
    { id: "anual", serie: "Anual", qtd: "1", valor: "", vencimento: "" },
    { id: "financiamento", serie: "Financiamento", qtd: "1", valor: "", vencimento: "" },
    { id: "fgts", serie: "FGTS", qtd: "1", valor: "", vencimento: "" },
  ];
}

const DEFAULT_MODEL_STATE: PersistedFluxoState = {
  cliente: "",
  empreendimento: "",
  valorContrato: "R$ 275.000,00",
  series: createModeloSeries(),
};

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Formats user typing into Brazilian Reais (R$ 0,00) safely without ever returning NaN.
 */
export function maskBrlCurrencyInput(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, "").slice(0, 12);
  if (!digits) return "";
  const cents = parseInt(digits, 10);
  if (!Number.isFinite(cents) || cents === 0) return "";
  const formatted = (cents / 100)
    .toFixed(2)
    .replace(".", ",")
    .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
  return `R$ ${formatted}`;
}

/**
 * Formats user typing into dd/mm/aaaa for VCTO (A PARTIR DE).
 */
export function maskDateBrInput(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function formatPercentBr(percent: number): string {
  const safe = Number.isFinite(percent) ? percent : 0;
  return `${safe.toFixed(2).replace(".", ",")}%`;
}

export function computeFluxoProposta(
  valorContratoRaw: string,
  series: FluxoSerieRow[],
): FluxoPropostaSummary {
  const valorContrato = round2(Math.max(0, parseCurrency(valorContratoRaw)));

  const rows: FluxoSerieComputed[] = series.map((row) => {
    const qtdNum = Math.max(0, parseInt(row.qtd, 10) || 0);
    const valorUnitario = round2(Math.max(0, parseCurrency(row.valor)));
    const subtotal = round2(qtdNum * valorUnitario);
    const percentual = valorContrato > 0 ? (subtotal / valorContrato) * 100 : 0;
    return {
      ...row,
      qtdNum,
      valorUnitario,
      subtotal,
      percentual,
      percentualTexto: formatPercentBr(percentual),
    };
  });

  const totalValor = round2(rows.reduce((acc, r) => acc + r.subtotal, 0));
  const totalPercentual = valorContrato > 0 ? (totalValor / valorContrato) * 100 : 0;
  const diferencaValor = round2(valorContrato - totalValor);
  const diferencaPercentual = valorContrato > 0 ? (diferencaValor / valorContrato) * 100 : 0;
  const isBalanced = valorContrato > 0 && Math.abs(diferencaValor) < 0.01;

  return {
    valorContrato,
    rows,
    totalValor,
    totalPercentual,
    diferencaValor,
    diferencaPercentual,
    isBalanced,
  };
}

export function buildFluxoWhatsAppMessage(params: {
  cliente: string;
  empreendimento: string;
  summary: FluxoPropostaSummary;
}): string {
  const { cliente, empreendimento, summary } = params;
  const lines: string[] = [
    `*CONDIÇÕES PROPOSTAS — FLUXO / PROPOSTA CLIENTE*`,
  ];

  if (cliente.trim()) lines.push(`*Cliente:* ${cliente.trim()}`);
  if (empreendimento.trim()) lines.push(`*Empreendimento:* ${empreendimento.trim()}`);
  lines.push(`*Valor do contrato:* ${formatCurrency(summary.valorContrato)}`, ``);

  summary.rows.forEach((row) => {
    if (!row.serie.trim() && row.subtotal === 0) return;
    const vctoPart = row.vencimento.trim() ? ` | Vcto: ${row.vencimento.trim()}` : "";
    lines.push(
      `• *${row.serie || "Série"}:* ${row.qtdNum}x de ${formatCurrency(row.valorUnitario)} (${row.percentualTexto})${vctoPart}`,
    );
  });

  lines.push(
    ``,
    `*TOTAL:* ${formatCurrency(summary.totalValor)} (${formatPercentBr(summary.totalPercentual)})`,
  );

  if (!summary.isBalanced && summary.valorContrato > 0) {
    const diffLabel =
      summary.diferencaValor > 0
        ? `Saldo restante: ${formatCurrency(summary.diferencaValor)}`
        : `Excede o contrato em: ${formatCurrency(Math.abs(summary.diferencaValor))}`;
    lines.push(diffLabel);
  }

  lines.push(``, `_${PROPOSTA_DISCLAIMER_LINE_1}_`, `*${PROPOSTA_DISCLAIMER_LINE_2}*`);
  return lines.join("\n");
}

function isSafeImageSrc(src?: string | null): src is string {
  if (!src) return false;
  const trimmed = src.trim();
  return (
    trimmed.startsWith("/") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:image/")
  );
}

async function loadSoftWatermarkDataUrl(): Promise<string | null> {
  const sources = [OFFICIAL_LOGO_LOCAL, OFFICIAL_LOGO_PWA, OFFICIAL_LOGO_URL];

  for (const src of sources) {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.crossOrigin = "anonymous";
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Image load failed"));
        el.src = src;
      });

      const size = 560;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);

      ctx.save();
      ctx.globalAlpha = 0.065;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 12, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 12, 12, size - 24, size - 24);
      ctx.restore();

      return canvas.toDataURL("image/jpeg", 0.85);
    } catch {
      // Try next fallback
    }
  }

  return null;
}

export function buildFluxoPrintHtml(params: {
  cliente: string;
  empreendimento: string;
  summary: FluxoPropostaSummary;
  watermarkSrc: string;
  autoPrint?: boolean;
}): string {
  const { cliente, empreendimento, summary, watermarkSrc, autoPrint = false } = params;
  const safeWatermark = isSafeImageSrc(watermarkSrc)
    ? escapeHtml(watermarkSrc)
    : escapeHtml(OFFICIAL_LOGO_LOCAL);
  const rowSpan = summary.rows.length + 2;

  const bodyRows = summary.rows
    .map(
      (r) => `
        <tr>
          <td>${escapeHtml(r.serie || "—")}</td>
          <td class="num center">${escapeHtml(String(r.qtdNum))}</td>
          <td class="num">${escapeHtml(formatCurrency(r.valorUnitario))}</td>
          <td class="num">${escapeHtml(r.percentualTexto)}</td>
          <td class="num">${escapeHtml(r.vencimento || "—")}</td>
        </tr>`,
    )
    .join("");

  const metaLine = [
    cliente.trim() ? `Cliente: <strong>${escapeHtml(cliente.trim())}</strong>` : "",
    empreendimento.trim() ? `Empreendimento: <strong>${escapeHtml(empreendimento.trim())}</strong>` : "",
  ]
    .filter(Boolean)
    .join(" &nbsp;·&nbsp; ");

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Condições Propostas — Fluxo / Proposta Cliente</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .print-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 18px;
      margin-bottom: 16px;
      background: #07162b;
      color: #ffffff;
      border-bottom: 2px solid #C5A028;
    }
    .print-toolbar-title {
      font-size: 13px;
      font-weight: 700;
      color: #E2C058;
    }
    .print-toolbar-btn {
      cursor: pointer;
      border: 0;
      border-radius: 8px;
      padding: 9px 16px;
      font-size: 12px;
      font-weight: 700;
      background: linear-gradient(135deg, #D4AF37, #F1D37A);
      color: #07162b;
    }
    @media print {
      .print-toolbar {
        display: none !important;
      }
    }
    .sheet {
      position: relative;
      width: 100%;
      min-height: 262mm;
      display: flex;
      flex-direction: column;
      background: #ffffff;
      overflow: hidden;
    }
    .watermark {
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 0;
    }
    .watermark img {
      width: 92mm;
      height: 92mm;
      object-fit: cover;
      border-radius: 50%;
      opacity: 0.065;
      filter: grayscale(15%);
    }
    .watermark-caption {
      margin-top: 4mm;
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 2.4px;
      text-transform: uppercase;
      color: #0f172a;
      opacity: 0.06;
    }
    .content {
      position: relative;
      z-index: 1;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .section-bar {
      background: #f1f5f9;
      border-bottom: 2px solid #cbd5e1;
      padding: 10px 14px;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #020617;
      text-transform: uppercase;
    }
    .meta-strip {
      padding: 10px 4px 6px;
      font-size: 11.5px;
      color: #334155;
    }
    .table-wrap {
      margin-top: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: rgba(255, 255, 255, 0.84);
      font-size: 12px;
    }
    th, td {
      border: 1px solid #0f172a;
      padding: 8px 10px;
      text-align: left;
      vertical-align: middle;
    }
    .contract-header {
      font-size: 13px;
      font-weight: 500;
      background: rgba(255, 255, 255, 0.9);
    }
    .contract-header strong {
      font-weight: 800;
      font-variant-numeric: tabular-nums;
    }
    .contrato-span {
      vertical-align: top;
      font-weight: 600;
      width: 15%;
      background: rgba(255, 255, 255, 0.84);
    }
    .col-head {
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 0.3px;
      background: rgba(248, 250, 252, 0.9);
    }
    .num {
      font-variant-numeric: tabular-nums;
    }
    .center {
      text-align: center;
    }
    .total-row td {
      font-weight: 800;
      background: rgba(248, 250, 252, 0.92);
    }
    .footer {
      margin-top: auto;
      padding-top: 32px;
      break-inside: avoid;
    }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 36px;
      margin-bottom: 18px;
    }
    .sig-col {
      border-top: 1px solid #64748b;
      padding-top: 7px;
      text-align: center;
      font-size: 11px;
      font-weight: 700;
    }
    .disclaimer {
      margin: 0;
      text-align: center;
      font-size: 9.5px;
      color: #64748b;
      line-height: 1.5;
    }
    .disclaimer-brand {
      margin: 3px 0 0 0;
      text-align: center;
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 0.6px;
      color: #475569;
    }
  </style>
</head>
<body>
  ${
    autoPrint
      ? `<div class="print-toolbar">
    <span class="print-toolbar-title">Condições Propostas — Fluxo / Proposta Cliente (Folha A4)</span>
    <button type="button" class="print-toolbar-btn" onclick="window.print()">Selecionar Impressora / Imprimir A4</button>
  </div>`
      : ""
  }
  <div class="sheet">
    <div class="watermark" aria-hidden="true">
      <img src="${safeWatermark}" alt="" />
      <div class="watermark-caption">SIMULADOR CORRETOR ELITE 4.0</div>
    </div>
    <div class="content">
      <div class="section-bar">CONDIÇÕES PROPOSTAS</div>
      ${metaLine ? `<div class="meta-strip">${metaLine}</div>` : ""}
      <div class="table-wrap">
        <table>
          <tbody>
            <tr>
              <td colspan="6" class="contract-header">
                Valor do contrato: <strong>${escapeHtml(formatCurrency(summary.valorContrato))}</strong>
              </td>
            </tr>
            <tr>
              <td rowspan="${rowSpan}" class="contrato-span">CONTRATO:</td>
              <th class="col-head">SÉRIE</th>
              <th class="col-head center">QTD</th>
              <th class="col-head">VALOR</th>
              <th class="col-head">PORC. (%)</th>
              <th class="col-head">VCTO (A PARTIR DE)</th>
            </tr>
            ${bodyRows}
            <tr class="total-row">
              <td></td>
              <td class="center">TOTAL:</td>
              <td class="num">${escapeHtml(formatCurrency(summary.totalValor))}</td>
              <td class="num">${escapeHtml(formatPercentBr(summary.totalPercentual))}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
      <footer class="footer">
        <div class="signatures">
          <div class="sig-col">Cliente${cliente.trim() ? `<div style="font-weight:400;color:#64748b;margin-top:2px;">${escapeHtml(cliente.trim())}</div>` : ""}</div>
          <div class="sig-col">Corretor</div>
        </div>
        <p class="disclaimer">${escapeHtml(PROPOSTA_DISCLAIMER_LINE_1)}</p>
        <p class="disclaimer-brand">${escapeHtml(PROPOSTA_DISCLAIMER_LINE_2)}</p>
      </footer>
    </div>
  </div>
  ${
    autoPrint
      ? `<script>
    window.addEventListener("load", function () {
      setTimeout(function () {
        try {
          window.focus();
          window.print();
        } catch (e) {}
      }, 220);
    });
  </script>`
      : ""
  }
</body>
</html>`;
}

async function exportFluxoPdf(params: {
  cliente: string;
  empreendimento: string;
  summary: FluxoPropostaSummary;
  preloadedWatermarkDataUrl?: string | null;
}): Promise<void> {
  const { cliente, empreendimento, summary, preloadedWatermarkDataUrl } = params;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 15;
  const contentW = pageW - margin * 2;

  const wmUrl = preloadedWatermarkDataUrl ?? (await loadSoftWatermarkDataUrl());
  if (wmUrl) {
    const wmSize = 94;
    doc.addImage(wmUrl, "JPEG", (pageW - wmSize) / 2, (pageH - wmSize) / 2 - 4, wmSize, wmSize, undefined, "FAST");
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(232, 236, 242);
  doc.text("SIMULADOR CORRETOR ELITE 4.0", pageW / 2, (pageH + 94) / 2 + 2, { align: "center" });

  let y = 18;
  // Section bar
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentW, 9, "F");
  doc.setDrawColor(197, 160, 40);
  doc.setLineWidth(0.7);
  doc.line(margin, y + 9, pageW - margin, y + 9);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("CONDIÇÕES PROPOSTAS", margin + 3, y + 6.2);
  y += 14;

  if (cliente.trim() || empreendimento.trim()) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const meta = [
      cliente.trim() ? `Cliente: ${cliente.trim()}` : "",
      empreendimento.trim() ? `Empreendimento: ${empreendimento.trim()}` : "",
    ]
      .filter(Boolean)
      .join("   |   ");
    doc.text(meta, margin + 1, y);
    y += 7;
  }

  // Table geometry matching reference image
  const colW = [28, 34, 16, 38, 24, 40]; // sum = 180mm = contentW
  const colX: number[] = [];
  let cursorX = margin;
  colW.forEach((w) => {
    colX.push(cursorX);
    cursorX += w;
  });

  const rowH = 9.5;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.3);

  // Top full-width Valor do contrato row
  doc.rect(margin, y, contentW, rowH + 1, "S");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("Valor do contrato:", margin + 3, y + 7);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(summary.valorContrato), margin + 36, y + 7);
  y += rowH + 1;

  const tableStartY = y;
  const totalRows = summary.rows.length + 2; // header + series + total
  const totalTableH = totalRows * rowH;

  // Left spanning CONTRATO: cell
  doc.rect(colX[0], tableStartY, colW[0], totalTableH, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("CONTRATO:", colX[0] + 2.5, tableStartY + 6.5);

  // Header row (cols 1..5)
  const headers = ["SÉRIE", "QTD", "VALOR", "PORC. (%)", "VCTO (A PARTIR DE)"];
  headers.forEach((h, idx) => {
    const c = idx + 1;
    doc.rect(colX[c], y, colW[c], rowH, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(h, colX[c] + 2.5, y + 6.3);
  });
  y += rowH;

  // Data rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  summary.rows.forEach((row) => {
    const vals = [
      row.serie || "—",
      String(row.qtdNum),
      formatCurrency(row.valorUnitario),
      row.percentualTexto,
      row.vencimento || "—",
    ];
    vals.forEach((val, idx) => {
      const c = idx + 1;
      doc.rect(colX[c], y, colW[c], rowH, "S");
      doc.setTextColor(15, 23, 42);
      const clipped = val.length > 22 ? `${val.slice(0, 21)}…` : val;
      doc.text(clipped, colX[c] + 2.5, y + 6.3);
    });
    y += rowH;
  });

  // Total row
  const totalVals = ["", "TOTAL:", formatCurrency(summary.totalValor), formatPercentBr(summary.totalPercentual), ""];
  totalVals.forEach((val, idx) => {
    const c = idx + 1;
    doc.rect(colX[c], y, colW[c], rowH, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    if (val) doc.text(val, colX[c] + 2.5, y + 6.3);
  });

  // Signatures + Disclaimer at bottom of A4
  const sigY = Math.max(y + 30, 238);
  const sigW = (contentW - 18) / 2;
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.35);
  doc.line(margin, sigY, margin + sigW, sigY);
  doc.line(margin + sigW + 18, sigY, pageW - margin, sigY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Cliente", margin + sigW / 2, sigY + 5, { align: "center" });
  doc.text("Corretor", margin + sigW + 18 + sigW / 2, sigY + 5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(PROPOSTA_DISCLAIMER_LINE_1, pageW / 2, sigY + 16, { align: "center", maxWidth: contentW });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(PROPOSTA_DISCLAIMER_LINE_2, pageW / 2, sigY + 23, { align: "center", maxWidth: contentW });

  const safeClient = (cliente.trim() || "Cliente").replace(/[^a-zA-Z0-9À-ÿ_-]+/g, "_").slice(0, 32);
  doc.save(`Fluxo_Proposta_${safeClient}.pdf`);
}

function loadInitialState(): PersistedFluxoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_MODEL_STATE;
    const parsed = JSON.parse(raw) as Partial<PersistedFluxoState>;
    if (!parsed || !Array.isArray(parsed.series) || parsed.series.length === 0) {
      return DEFAULT_MODEL_STATE;
    }
    return {
      cliente: typeof parsed.cliente === "string" ? parsed.cliente : "",
      empreendimento: typeof parsed.empreendimento === "string" ? parsed.empreendimento : "",
      valorContrato: typeof parsed.valorContrato === "string" ? parsed.valorContrato : "R$ 275.000,00",
      series: parsed.series.map((s, idx) => ({
        id: typeof s.id === "string" ? s.id : `serie-${idx}`,
        serie: typeof s.serie === "string" ? s.serie : "",
        qtd: typeof s.qtd === "string" ? s.qtd : "1",
        valor: typeof s.valor === "string" ? s.valor : "",
        vencimento: typeof s.vencimento === "string" ? s.vencimento : "",
      })),
    };
  } catch {
    return DEFAULT_MODEL_STATE;
  }
}

function isRunningInsideIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export default function FluxoPropostaCliente() {
  const [state, setState] = useState<PersistedFluxoState>(loadInitialState);
  const [expanded, setExpanded] = useState(true);
  const [whatsAppPhone, setWhatsAppPhone] = useState("");
  const [copied, setCopied] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [watermarkDataUrl, setWatermarkDataUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  useEffect(() => {
    if (watermarkDataUrl) return;
    let cancelled = false;
    loadSoftWatermarkDataUrl().then((url) => {
      if (!cancelled && url) setWatermarkDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [watermarkDataUrl]);

  const summary = useMemo(
    () => computeFluxoProposta(state.valorContrato, state.series),
    [state.valorContrato, state.series],
  );

  const updateRow = (id: string, patch: Partial<FluxoSerieRow>) => {
    setState((prev) => ({
      ...prev,
      series: prev.series.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }));
  };

  const handleAddRow = () => {
    const newId = `serie-${Date.now()}`;
    setState((prev) => ({
      ...prev,
      series: [
        ...prev.series,
        { id: newId, serie: "Intermediária", qtd: "1", valor: "", vencimento: "" },
      ],
    }));
  };

  const handleRemoveRow = (id: string) => {
    setState((prev) => {
      if (prev.series.length <= 1) return prev;
      return {
        ...prev,
        series: prev.series.filter((r) => r.id !== id),
      };
    });
  };

  const handleResetModelo = () => {
    setState((prev) => ({
      ...prev,
      valorContrato: "R$ 275.000,00",
      series: createModeloSeries(),
    }));
    toast.success("Modelo de fluxo carregado.");
  };

  const handleClearValues = () => {
    setState((prev) => ({
      ...prev,
      valorContrato: "",
      series: createBlankSeries(),
    }));
    toast.info("Valores limpos para nova simulação de fluxo.");
  };

  const handlePrintA4 = () => {
    const resolvedWatermark = watermarkDataUrl || `${window.location.origin}${OFFICIAL_LOGO_LOCAL}`;

    // Direct print via dedicated isolated print class on current page first; fallback to Blob tab if sandboxed
    document.body.classList.add("fluxo-print-mode");
    let beforePrintFired = false;
    const onBeforePrint = () => {
      beforePrintFired = true;
    };
    window.addEventListener("beforeprint", onBeforePrint, { once: true });
    const startMs = performance.now();
    let printThrew = false;

    try {
      window.focus();
      window.print();
    } catch {
      printThrew = true;
    } finally {
      window.removeEventListener("beforeprint", onBeforePrint);
      document.body.classList.remove("fluxo-print-mode");
    }

    const elapsedMs = performance.now() - startMs;
    const blockedBySandbox = printThrew || (isRunningInsideIframe() && !beforePrintFired && elapsedMs < 150);

    if (!blockedBySandbox) {
      return;
    }

    const html = buildFluxoPrintHtml({
      cliente: state.cliente,
      empreendimento: state.empreendimento,
      summary,
      watermarkSrc: resolvedWatermark,
      autoPrint: true,
    });
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.info("Abrindo Condições Propostas em nova aba para seleção de impressora.");
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  };

  const handleDownloadPdf = async () => {
    setPdfGenerating(true);
    try {
      await exportFluxoPdf({
        cliente: state.cliente,
        empreendimento: state.empreendimento,
        summary,
        preloadedWatermarkDataUrl: watermarkDataUrl,
      });
      toast.success("PDF das Condições Propostas gerado.");
    } catch (err) {
      console.error("[FluxoPropostaCliente] PDF generation failed:", err);
      toast.error("Não foi possível gerar o PDF. Use Imprimir A4.");
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleCopyMessage = async () => {
    try {
      const msg = buildFluxoWhatsAppMessage({
        cliente: state.cliente,
        empreendimento: state.empreendimento,
        summary,
      });
      await navigator.clipboard.writeText(msg);
      setCopied(true);
      toast.success("Fluxo copiado para a área de transferência.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar automaticamente.");
    }
  };

  const handleSendWhatsApp = () => {
    const digits = normalizeBrazilianWhatsApp(whatsAppPhone);
    if (!digits) {
      toast.error("Informe o WhatsApp do cliente com DDD (ex: 11 99999-9999).");
      return;
    }
    const msg = buildFluxoWhatsAppMessage({
      cliente: state.cliente,
      empreendimento: state.empreendimento,
      summary,
    });
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Abrindo WhatsApp com o fluxo formatado.");
  };

  return (
    <section
      id="fluxo-proposta-cliente-section"
      aria-label="Fluxo e Proposta Cliente com Percentuais"
      className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
    >
      {/* ── Section Header (hidden on print) ── */}
      <div className="fluxo-no-print bg-primary px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex items-center gap-2.5 text-left min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded"
        >
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-primary-foreground tracking-wide uppercase">
              Fluxo / Proposta Cliente (com Percentuais)
            </h3>
            <p className="text-[11px] text-slate-300 truncate">
              Condições propostas em R$ com cálculo automático de percentual sobre o valor do contrato
            </p>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-secondary shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-secondary shrink-0" />
          )}
        </button>

        {expanded && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrintA4}
              className="min-h-[38px] px-3 py-1.5 rounded-lg border border-secondary/50 bg-primary text-secondary text-xs font-bold hover:bg-secondary/15 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              Imprimir A4
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={pdfGenerating}
              className="min-h-[38px] px-3 py-1.5 rounded-lg gold-gradient text-primary text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <FileDown className="w-3.5 h-3.5 shrink-0" />
              {pdfGenerating ? "Gerando..." : "Baixar PDF"}
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* ── Top Client & Contract Value Bar (hidden on print; printed inside table) ── */}
          <div className="fluxo-no-print grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-4">
              <label
                htmlFor="fluxo-valor-contrato"
                className="block text-[11px] font-bold text-primary uppercase tracking-wider mb-1"
              >
                Valor do contrato (R$)
              </label>
              <input
                id="fluxo-valor-contrato"
                type="text"
                inputMode="numeric"
                value={state.valorContrato}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    valorContrato: maskBrlCurrencyInput(e.target.value),
                  }))
                }
                placeholder="R$ 0,00"
                className="w-full min-h-[42px] px-3 py-2 border-2 border-secondary/70 rounded-lg text-sm font-extrabold text-primary bg-background tabular-nums focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
              />
            </div>

            <div className="md:col-span-4">
              <label
                htmlFor="fluxo-cliente"
                className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1"
              >
                Cliente (opcional)
              </label>
              <input
                id="fluxo-cliente"
                type="text"
                maxLength={100}
                value={state.cliente}
                onChange={(e) => setState((prev) => ({ ...prev, cliente: e.target.value }))}
                placeholder="Nome do cliente"
                className="w-full min-h-[42px] px-3 py-2 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring"
              />
            </div>

            <div className="md:col-span-4">
              <label
                htmlFor="fluxo-empreendimento"
                className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1"
              >
                Empreendimento / Unidade (opcional)
              </label>
              <input
                id="fluxo-empreendimento"
                type="text"
                maxLength={100}
                value={state.empreendimento}
                onChange={(e) => setState((prev) => ({ ...prev, empreendimento: e.target.value }))}
                placeholder="Ex: Residencial Vista Verde - Apto 804"
                className="w-full min-h-[42px] px-3 py-2 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring"
              />
            </div>
          </div>

          {/* ── Printable CONDIÇÕES PROPOSTAS Table (exact reference model) ── */}
          <div
            id="fluxo-proposta-printable"
            className="relative bg-white text-slate-900 rounded-lg border border-slate-300 overflow-hidden"
          >
            {/* Subtle watermark only visible on print */}
            <div
              className="fluxo-print-watermark hidden pointer-events-none select-none"
              aria-hidden="true"
            >
              <img
                src={watermarkDataUrl || OFFICIAL_LOGO_LOCAL}
                alt=""
                referrerPolicy="no-referrer"
                className="w-80 h-80 object-cover rounded-full opacity-[0.065]"
              />
              <span className="mt-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-900 opacity-[0.06]">
                Simulador Corretor Elite 4.0
              </span>
            </div>

            <div className="relative z-10">
              {/* Top gray bar matching CONDIÇÕES PROPOSTAS */}
              <div className="bg-slate-100 border-b border-slate-300 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-slate-950">
                  CONDIÇÕES PROPOSTAS
                </h4>
                <div className="fluxo-no-print flex items-center gap-1.5 text-xs tabular-nums">
                  {summary.valorContrato > 0 && summary.isBalanced && (
                    <span className="flex items-center gap-1 font-semibold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      Fechamento exato · 100,00% do contrato
                    </span>
                  )}
                  {summary.valorContrato > 0 && !summary.isBalanced && summary.diferencaValor > 0 && (
                    <span className="flex items-center gap-1 font-semibold text-amber-700">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Saldo pendente: {formatCurrency(summary.diferencaValor)} ({formatPercentBr(summary.diferencaPercentual)})
                    </span>
                  )}
                  {summary.valorContrato > 0 && !summary.isBalanced && summary.diferencaValor < 0 && (
                    <span className="flex items-center gap-1 font-semibold text-red-700">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Excede contrato em {formatCurrency(Math.abs(summary.diferencaValor))} ({formatPercentBr(Math.abs(summary.diferencaPercentual))})
                    </span>
                  )}
                </div>
              </div>

              {(state.cliente.trim() || state.empreendimento.trim()) && (
                <div className="hidden print:block px-4 pt-3 text-xs text-slate-700">
                  {state.cliente.trim() && (
                    <span>
                      Cliente: <strong>{state.cliente.trim()}</strong>
                    </span>
                  )}
                  {state.cliente.trim() && state.empreendimento.trim() && <span> · </span>}
                  {state.empreendimento.trim() && (
                    <span>
                      Empreendimento: <strong>{state.empreendimento.trim()}</strong>
                    </span>
                  )}
                </div>
              )}

              {/* Bordered Model Table */}
              <div className="p-3 sm:p-4 overflow-x-auto">
                <table className="w-full min-w-[680px] border-collapse border border-slate-900 text-xs sm:text-sm bg-white/85">
                  <tbody>
                    {/* Valor do contrato full-width header row */}
                    <tr>
                      <td
                        colSpan={7}
                        className="border border-slate-900 px-3 py-2.5 bg-white text-slate-950"
                      >
                        <span className="font-medium mr-1.5">Valor do contrato:</span>
                        <strong className="font-extrabold text-sm sm:text-base tabular-nums">
                          {formatCurrency(summary.valorContrato)}
                        </strong>
                      </td>
                    </tr>

                    {/* Column headers with left spanning CONTRATO: cell */}
                    <tr className="bg-slate-50/90 text-slate-950">
                      <td
                        rowSpan={summary.rows.length + 2}
                        className="border border-slate-900 px-3 py-2.5 align-top font-bold text-xs tracking-wide w-[112px] bg-white/90"
                      >
                        CONTRATO:
                      </td>
                      <th className="border border-slate-900 px-2.5 py-2 text-left text-[11px] font-bold uppercase tracking-wide">
                        SÉRIE
                      </th>
                      <th className="border border-slate-900 px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wide w-[74px]">
                        QTD
                      </th>
                      <th className="border border-slate-900 px-2.5 py-2 text-left text-[11px] font-bold uppercase tracking-wide w-[180px]">
                        VALOR
                      </th>
                      <th className="border border-slate-900 px-2.5 py-2 text-right text-[11px] font-bold uppercase tracking-wide w-[96px]">
                        PORC. (%)
                      </th>
                      <th className="border border-slate-900 px-2.5 py-2 text-left text-[11px] font-bold uppercase tracking-wide w-[148px]">
                        VCTO (A PARTIR DE)
                      </th>
                      <th className="fluxo-no-print border border-slate-900 px-1.5 py-2 text-center text-[11px] font-bold uppercase w-[42px]">
                        <span className="sr-only">Ação</span>
                      </th>
                    </tr>

                    {/* Editable Series Rows */}
                    {summary.rows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="border border-slate-900 px-2 py-1.5">
                          <input
                            type="text"
                            aria-label={`Série ${row.serie}`}
                            maxLength={40}
                            value={row.serie}
                            onChange={(e) => updateRow(row.id, { serie: e.target.value })}
                            placeholder="Nome da série"
                            className="fluxo-no-print w-full px-1.5 py-1 rounded border border-transparent hover:border-slate-300 focus:border-secondary focus:bg-white focus:outline-none text-xs sm:text-sm font-medium text-slate-950 bg-transparent"
                          />
                          <span className="hidden print:inline font-medium">{row.serie || "—"}</span>
                        </td>

                        <td className="border border-slate-900 px-1.5 py-1.5 text-center">
                          <input
                            type="number"
                            min={0}
                            max={600}
                            aria-label={`Quantidade ${row.serie}`}
                            value={row.qtd}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/\D/g, "").slice(0, 3);
                              updateRow(row.id, { qtd: cleaned });
                            }}
                            className="fluxo-no-print w-full text-center px-1 py-1 rounded border border-transparent hover:border-slate-300 focus:border-secondary focus:bg-white focus:outline-none text-xs sm:text-sm tabular-nums text-slate-950 bg-transparent"
                          />
                          <span className="hidden print:inline tabular-nums">{row.qtdNum}</span>
                        </td>

                        <td className="border border-slate-900 px-2 py-1.5">
                          <input
                            type="text"
                            inputMode="numeric"
                            aria-label={`Valor unitário ${row.serie}`}
                            value={row.valor}
                            onChange={(e) =>
                              updateRow(row.id, { valor: maskBrlCurrencyInput(e.target.value) })
                            }
                            placeholder="R$ 0,00"
                            className="fluxo-no-print w-full px-1.5 py-1 rounded border border-transparent hover:border-slate-300 focus:border-secondary focus:bg-white focus:outline-none text-xs sm:text-sm font-semibold tabular-nums text-slate-950 bg-transparent"
                          />
                          {row.qtdNum > 1 && row.subtotal > 0 && (
                            <div className="fluxo-no-print px-1.5 text-[10px] text-slate-500 tabular-nums">
                              Subtotal: {formatCurrency(row.subtotal)}
                            </div>
                          )}
                          <span className="hidden print:inline tabular-nums">
                            {formatCurrency(row.valorUnitario)}
                          </span>
                        </td>

                        <td className="border border-slate-900 px-2.5 py-1.5 text-right font-bold tabular-nums text-slate-950 bg-slate-50/40">
                          {row.percentualTexto}
                        </td>

                        <td className="border border-slate-900 px-2 py-1.5">
                          <input
                            type="text"
                            inputMode="numeric"
                            aria-label={`Vencimento ${row.serie}`}
                            maxLength={10}
                            value={row.vencimento}
                            onChange={(e) =>
                              updateRow(row.id, { vencimento: maskDateBrInput(e.target.value) })
                            }
                            placeholder="dd/mm/aaaa"
                            className="fluxo-no-print w-full px-1.5 py-1 rounded border border-transparent hover:border-slate-300 focus:border-secondary focus:bg-white focus:outline-none text-xs sm:text-sm tabular-nums text-slate-950 bg-transparent"
                          />
                          <span className="hidden print:inline tabular-nums">
                            {row.vencimento || "—"}
                          </span>
                        </td>

                        <td className="fluxo-no-print border border-slate-900 px-1 py-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(row.id)}
                            disabled={summary.rows.length <= 1}
                            title="Remover série"
                            aria-label={`Remover série ${row.serie}`}
                            className="p-1.5 rounded text-slate-400 hover:text-destructive disabled:opacity-30 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* TOTAL Row */}
                    <tr className="bg-slate-50 font-extrabold text-slate-950">
                      <td className="border border-slate-900 px-2.5 py-2.5" />
                      <td className="border border-slate-900 px-2 py-2.5 text-center text-xs uppercase tracking-wide">
                        TOTAL:
                      </td>
                      <td className="border border-slate-900 px-2.5 py-2.5 text-sm tabular-nums">
                        {formatCurrency(summary.totalValor)}
                      </td>
                      <td
                        className={`border border-slate-900 px-2.5 py-2.5 text-right text-sm tabular-nums ${
                          summary.valorContrato > 0 && !summary.isBalanced
                            ? summary.diferencaValor > 0
                              ? "text-amber-700"
                              : "text-red-700"
                            : "text-slate-950"
                        }`}
                      >
                        {formatPercentBr(summary.totalPercentual)}
                      </td>
                      <td className="border border-slate-900 px-2.5 py-2.5" />
                      <td className="fluxo-no-print border border-slate-900 px-1.5 py-2.5" />
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Print-only signatures & official disclaimer */}
              <div className="hidden print:block px-4 pt-12 pb-2 space-y-5">
                <div className="grid grid-cols-2 gap-12">
                  <div className="pt-6 border-t border-slate-500 text-center text-xs font-bold text-slate-900">
                    Cliente
                    {state.cliente.trim() && (
                      <div className="font-normal text-slate-500 mt-0.5">{state.cliente.trim()}</div>
                    )}
                  </div>
                  <div className="pt-6 border-t border-slate-500 text-center text-xs font-bold text-slate-900">
                    Corretor
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-[10px] text-slate-500">{PROPOSTA_DISCLAIMER_LINE_1}</p>
                  <p className="text-[10px] font-bold text-slate-700">{PROPOSTA_DISCLAIMER_LINE_2}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom Controls: Add Series / Model / Clear + WhatsApp Share ── */}
          <div className="fluxo-no-print flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAddRow}
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                Adicionar Série
              </button>
              <button
                type="button"
                onClick={handleResetModelo}
                className="min-h-[38px] px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold hover:bg-muted transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                Carregar Modelo
              </button>
              <button
                type="button"
                onClick={handleClearValues}
                className="min-h-[38px] px-3 py-1.5 rounded-lg border border-border bg-background text-muted-foreground hover:text-destructive hover:border-destructive/40 text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Eraser className="w-3.5 h-3.5 shrink-0" />
                Limpar Valores
              </button>
            </div>

            <div className="flex items-center gap-1.5 w-full lg:w-auto">
              <input
                type="tel"
                inputMode="tel"
                aria-label="WhatsApp do cliente para envio do fluxo"
                value={whatsAppPhone}
                onChange={(e) => setWhatsAppPhone(formatPhoneMask(e.target.value))}
                placeholder="WhatsApp (11) 99999-9999"
                className="flex-1 lg:w-48 min-h-[38px] px-3 py-1.5 border border-border rounded-lg text-xs tabular-nums bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring"
              />
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#1fb858] text-slate-950 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                WhatsApp
              </button>
              <button
                type="button"
                onClick={handleCopyMessage}
                title="Copiar resumo do fluxo"
                aria-label="Copiar resumo do fluxo"
                className="min-h-[38px] min-w-[38px] rounded-lg border border-border bg-background text-foreground hover:bg-muted flex items-center justify-center shrink-0 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print-only A4 portal mounted directly on document.body for zero-bleed single-page printing */}
      {typeof document !== "undefined" &&
        createPortal(
          <div
            data-fluxo-print-portal="true"
            aria-hidden="true"
            className="hidden bg-white text-slate-900"
          >
            <div className="fluxo-print-watermark pointer-events-none select-none">
              <img
                src={watermarkDataUrl || OFFICIAL_LOGO_LOCAL}
                alt=""
                referrerPolicy="no-referrer"
                className="w-80 h-80 object-cover rounded-full opacity-[0.065]"
              />
              <span className="mt-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-900 opacity-[0.06]">
                Simulador Corretor Elite 4.0
              </span>
            </div>

            <div className="fluxo-print-content relative z-10 flex flex-col flex-1">
              <div className="bg-slate-100 border-b-2 border-[#C5A028] px-4 py-2.5">
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-950">
                  CONDIÇÕES PROPOSTAS
                </h2>
              </div>

              {(state.cliente.trim() || state.empreendimento.trim()) && (
                <div className="px-1 pt-3 pb-1 text-xs text-slate-700">
                  {state.cliente.trim() && (
                    <span>
                      Cliente: <strong>{state.cliente.trim()}</strong>
                    </span>
                  )}
                  {state.cliente.trim() && state.empreendimento.trim() && <span> · </span>}
                  {state.empreendimento.trim() && (
                    <span>
                      Empreendimento: <strong>{state.empreendimento.trim()}</strong>
                    </span>
                  )}
                </div>
              )}

              <div className="mt-3">
                <table className="w-full border-collapse border border-slate-900 text-xs bg-white/85">
                  <tbody>
                    <tr>
                      <td colSpan={6} className="border border-slate-900 px-3 py-2.5 bg-white/90 text-slate-950">
                        <span className="font-medium mr-1.5">Valor do contrato:</span>
                        <strong className="font-extrabold text-sm tabular-nums">
                          {formatCurrency(summary.valorContrato)}
                        </strong>
                      </td>
                    </tr>
                    <tr className="bg-slate-50/90 text-slate-950">
                      <td
                        rowSpan={summary.rows.length + 2}
                        className="border border-slate-900 px-3 py-2.5 align-top font-bold text-xs w-[112px] bg-white/85"
                      >
                        CONTRATO:
                      </td>
                      <th className="border border-slate-900 px-2.5 py-2 text-left text-[11px] font-bold uppercase">
                        SÉRIE
                      </th>
                      <th className="border border-slate-900 px-2 py-2 text-center text-[11px] font-bold uppercase w-[64px]">
                        QTD
                      </th>
                      <th className="border border-slate-900 px-2.5 py-2 text-left text-[11px] font-bold uppercase">
                        VALOR
                      </th>
                      <th className="border border-slate-900 px-2.5 py-2 text-right text-[11px] font-bold uppercase w-[88px]">
                        PORC. (%)
                      </th>
                      <th className="border border-slate-900 px-2.5 py-2 text-left text-[11px] font-bold uppercase">
                        VCTO (A PARTIR DE)
                      </th>
                    </tr>
                    {summary.rows.map((row) => (
                      <tr key={`print-${row.id}`}>
                        <td className="border border-slate-900 px-2.5 py-2 font-medium">{row.serie || "—"}</td>
                        <td className="border border-slate-900 px-2 py-2 text-center tabular-nums">{row.qtdNum}</td>
                        <td className="border border-slate-900 px-2.5 py-2 tabular-nums">
                          {formatCurrency(row.valorUnitario)}
                        </td>
                        <td className="border border-slate-900 px-2.5 py-2 text-right font-bold tabular-nums">
                          {row.percentualTexto}
                        </td>
                        <td className="border border-slate-900 px-2.5 py-2 tabular-nums">
                          {row.vencimento || "—"}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50/95 font-extrabold text-slate-950">
                      <td className="border border-slate-900 px-2.5 py-2.5" />
                      <td className="border border-slate-900 px-2 py-2.5 text-center uppercase">TOTAL:</td>
                      <td className="border border-slate-900 px-2.5 py-2.5 text-sm tabular-nums">
                        {formatCurrency(summary.totalValor)}
                      </td>
                      <td className="border border-slate-900 px-2.5 py-2.5 text-right text-sm tabular-nums">
                        {formatPercentBr(summary.totalPercentual)}
                      </td>
                      <td className="border border-slate-900 px-2.5 py-2.5" />
                    </tr>
                  </tbody>
                </table>
              </div>

              <footer className="mt-auto pt-12 space-y-5">
                <div className="grid grid-cols-2 gap-12">
                  <div className="pt-6 border-t border-slate-500 text-center text-xs font-bold text-slate-900">
                    Cliente
                    {state.cliente.trim() && (
                      <div className="font-normal text-slate-500 mt-0.5">{state.cliente.trim()}</div>
                    )}
                  </div>
                  <div className="pt-6 border-t border-slate-500 text-center text-xs font-bold text-slate-900">
                    Corretor
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-[10px] text-slate-500">{PROPOSTA_DISCLAIMER_LINE_1}</p>
                  <p className="text-[10px] font-bold text-slate-700">{PROPOSTA_DISCLAIMER_LINE_2}</p>
                </div>
              </footer>
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}
