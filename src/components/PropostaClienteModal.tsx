import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import {
  X,
  Printer,
  FileDown,
  MessageCircle,
  Copy,
  Check,
  FileSignature,
  Calendar,
  Hash,
  Building2,
  StickyNote,
} from "lucide-react";
import { formatCurrency, parseCurrency, type AdminData } from "@/lib/eliteUtils";
import { toast } from "sonner";

export interface PropostaSimulacaoFields {
  infoEmp: string;
  infoCli: string;
  infoM2: string;
  infoAndar: string;
  infoApto: string;
  infoCons: string;
  infoCreci: string;
  infoCpf: string;
  avaliacao: string;
  lancamento: string;
  campanha: string;
  aprovacao: string;
  fgts: string;
  subsidio: string;
  casa: string;
  parcelaCaixa: string;
  resultPercentual: string;
  atoCliente: string;
  intermediarias: string;
  chaves: string;
  parcInterm: string;
  parcelasObras: string;
  planoMesesPosObras: string;
  valorObrasManual: string;
}

export interface PropostaSimulacaoResults {
  totalAprov: number;
  entradaConstrutora: number;
  atoClienteValor: number;
  sinalValor: number;
  valorIntermParc: number;
  valorObras: number;
  totalPosObras: number;
  prestacaoEstimadaPosObras: number;
}

export interface PropostaClienteData {
  numeroProposta: string;
  emitidaEm: string;
  validaAte: string;
  validadeDias: number;
  clienteNome: string;
  clienteCpf: string;
  empreendimento: string;
  unidadeAndar: string;
  areaM2: string;
  construtora: string;
  valorImovelTexto: string;
  financiamentoAprovadoTexto: string;
  fgtsTexto: string;
  subsidioFederalTexto: string;
  subsidioEstadualTexto: string;
  totalAprovacaoTexto: string;
  entradaClienteTexto: string;
  atoAssinaturaTexto: string;
  saldoEntradaTexto: string;
  sinalDesejavelTexto: string;
  parcelasObrasTexto: string;
  intermediariasTexto: string;
  parcelaChavesTexto: string;
  totalPosEntregaTexto: string;
  planoPosEntregaTexto: string;
  prestacaoPosEntregaTexto: string;
  corretorNome: string;
  corretorCreci: string;
  observacoes: string;
}

export interface PropostaClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  fields: PropostaSimulacaoFields;
  results: PropostaSimulacaoResults;
  adminData?: AdminData;
  logoEmp?: string | null;
}

export function generatePropostaNumero(baseDate: Date = new Date()): string {
  const y = baseDate.getFullYear();
  const m = String(baseDate.getMonth() + 1).padStart(2, "0");
  const d = String(baseDate.getDate()).padStart(2, "0");
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `PROP-${y}${m}${d}-${rand}`;
}

export function formatDateBR(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export function computePropostaDates(
  validadeDias: number,
  baseDate: Date = new Date(),
): { emitidaEm: string; validaAte: string } {
  const safeDays = Number.isFinite(validadeDias) ? Math.max(1, Math.min(365, Math.floor(validadeDias))) : 7;
  const emitDate = new Date(baseDate.getTime());
  const validDate = new Date(baseDate.getTime());
  validDate.setDate(validDate.getDate() + safeDays);
  return {
    emitidaEm: formatDateBR(emitDate),
    validaAte: formatDateBR(validDate),
  };
}

export function normalizeBrazilianWhatsApp(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, "");
  if (digits.length < 10) return "";
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits.slice(0, 15);
}

export function formatPhoneMask(rawPhone: string): string {
  const d = rawPhone.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function buildPropostaClienteData(params: {
  fields: PropostaSimulacaoFields;
  results: PropostaSimulacaoResults;
  adminData?: AdminData;
  numeroProposta: string;
  validadeDias: number;
  construtora: string;
  observacoes: string;
  baseDate?: Date;
}): PropostaClienteData {
  const { fields, results, adminData, numeroProposta, validadeDias, construtora, observacoes, baseDate } = params;
  const { emitidaEm, validaAte } = computePropostaDates(validadeDias, baseDate);

  const apto = fields.infoApto.trim();
  const andar = fields.infoAndar.trim();
  const unidadeAndar =
    apto && andar ? `${apto} / ${andar}` : apto || andar || "—";

  const rawM2 = fields.infoM2.trim();
  const areaM2 = rawM2
    ? /m²|m2/i.test(rawM2)
      ? rawM2
      : `${rawM2} m²`
    : "—";

  const valorImovelNum = parseCurrency(fields.lancamento) || parseCurrency(fields.avaliacao);
  const aprovacaoNum = parseCurrency(fields.aprovacao);
  const fgtsNum = parseCurrency(fields.fgts);
  const subsidioFedNum = parseCurrency(fields.subsidio);
  const subsidioEstNum = parseCurrency(fields.casa);
  const chavesNum = parseCurrency(fields.chaves);

  const saldoEntrada = Math.max(0, (results.entradaConstrutora || 0) - (results.atoClienteValor || 0));
  const percSinal = parseFloat(fields.resultPercentual) || 0;
  const percSinalFmt = `${percSinal.toFixed(2).replace(".", ",")}%`;

  const numParcelasObras = Math.max(1, parseInt(fields.parcelasObras, 10) || 1);
  const valorParcelaObras = fields.valorObrasManual
    ? parseCurrency(fields.valorObrasManual)
    : results.valorObras || 0;

  const numParcInterm = Math.max(1, parseInt(fields.parcInterm, 10) || 1);
  const planoMesesPos = Math.max(0, parseInt(fields.planoMesesPosObras, 10) || 0);

  return {
    numeroProposta: numeroProposta.trim() || generatePropostaNumero(baseDate),
    emitidaEm,
    validaAte,
    validadeDias: Math.max(1, Math.min(365, Math.floor(validadeDias) || 7)),
    clienteNome: fields.infoCli.trim() || "—",
    clienteCpf: fields.infoCpf.trim(),
    empreendimento: fields.infoEmp.trim() || adminData?.empName?.trim() || "—",
    unidadeAndar,
    areaM2,
    construtora: construtora.trim() || "—",
    valorImovelTexto: valorImovelNum > 0 ? formatCurrency(valorImovelNum) : "—",
    financiamentoAprovadoTexto: aprovacaoNum > 0 ? formatCurrency(aprovacaoNum) : "—",
    fgtsTexto: formatCurrency(fgtsNum),
    subsidioFederalTexto: formatCurrency(subsidioFedNum),
    subsidioEstadualTexto: formatCurrency(subsidioEstNum),
    totalAprovacaoTexto: formatCurrency(results.totalAprov || 0),
    entradaClienteTexto: formatCurrency(results.entradaConstrutora || 0),
    atoAssinaturaTexto: formatCurrency(results.atoClienteValor || 0),
    saldoEntradaTexto: formatCurrency(saldoEntrada),
    sinalDesejavelTexto: `${percSinalFmt} — ${formatCurrency(results.sinalValor || 0)}`,
    parcelasObrasTexto: `${numParcelasObras}x de ${formatCurrency(valorParcelaObras)}`,
    intermediariasTexto: `${numParcInterm}x de ${formatCurrency(results.valorIntermParc || 0)}`,
    parcelaChavesTexto: chavesNum > 0 ? formatCurrency(chavesNum) : "—",
    totalPosEntregaTexto: formatCurrency(results.totalPosObras || 0),
    planoPosEntregaTexto: `${planoMesesPos} ${planoMesesPos === 1 ? "mês" : "meses"}`,
    prestacaoPosEntregaTexto: `${formatCurrency(results.prestacaoEstimadaPosObras || 0)}/mês`,
    corretorNome: fields.infoCons.trim() || adminData?.brokerName?.trim() || "",
    corretorCreci: fields.infoCreci.trim() || adminData?.creci?.trim() || "",
    observacoes: observacoes.trim(),
  };
}

export function buildPropostaWhatsAppMessage(data: PropostaClienteData): string {
  const lines: string[] = [
    `*PROPOSTA COMERCIAL — PROPOSTA DE COMPRA*`,
    `Nº: ${data.numeroProposta}`,
    `Emitida: ${data.emitidaEm} | Válida até: ${data.validaAte}`,
    ``,
    `*CLIENTE:* ${data.clienteNome}`,
    ``,
    `*IMÓVEL*`,
    `• Empreendimento: ${data.empreendimento}`,
    `• Unidade / Andar: ${data.unidadeAndar}`,
    `• Área (m²): ${data.areaM2}`,
    `• Construtora: ${data.construtora}`,
    `• Valor do imóvel: ${data.valorImovelTexto}`,
    ``,
    `*FINANCIAMENTO CAIXA*`,
    `• Financiamento aprovado: ${data.financiamentoAprovadoTexto}`,
    `• FGTS: ${data.fgtsTexto}`,
    `• Subsídio Gov. Federal: ${data.subsidioFederalTexto}`,
    `• Subsídio Estadual: ${data.subsidioEstadualTexto}`,
    `• *Total aprovação:* ${data.totalAprovacaoTexto}`,
    ``,
    `*ENTRADA CONSTRUTORA*`,
    `• Entrada do cliente: ${data.entradaClienteTexto}`,
    `• Ato (na assinatura): ${data.atoAssinaturaTexto}`,
    `• Saldo da entrada: ${data.saldoEntradaTexto}`,
    `• Sinal desejável: ${data.sinalDesejavelTexto}`,
    `• Parcelas de obras: ${data.parcelasObrasTexto}`,
    `• Intermediárias: ${data.intermediariasTexto}`,
    `• Parcela chaves: ${data.parcelaChavesTexto}`,
    ``,
    `*PARC. PÓS-ENTREGA*`,
    `• Total pós-entrega: ${data.totalPosEntregaTexto}`,
    `• Plano: ${data.planoPosEntregaTexto}`,
    `• Prestação estimada: ${data.prestacaoPosEntregaTexto}`,
  ];

  if (data.observacoes) {
    lines.push(``, `*OBSERVAÇÕES*`, data.observacoes);
  }

  if (data.corretorNome || data.corretorCreci) {
    const brokerLine = [
      data.corretorNome ? `Corretor: ${data.corretorNome}` : "",
      data.corretorCreci ? `CRECI: ${data.corretorCreci}` : "",
    ]
      .filter(Boolean)
      .join(" | ");
    lines.push(``, brokerLine);
  }

  lines.push(
    ``,
    `_Simulação de caráter informativo. Valores sujeitos à análise e aprovação de crédito, disponibilidade da unidade e tabela vigente da construtora._`,
  );

  return lines.join("\n");
}

export function buildPropostaWhatsAppUrl(rawPhone: string, message: string): string | null {
  const digits = normalizeBrazilianWhatsApp(rawPhone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates a crisp native vector A4 PDF matching the exact Proposta de Compra layout.
 */
export function exportPropostaClientePdf(data: PropostaClienteData): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const margin = 16;
  const contentW = pageW - margin * 2;
  const goldR = 197;
  const goldG = 160;
  const goldB = 40;
  const navyR = 15;
  const navyG = 23;
  const navyB = 42;
  const mutedR = 100;
  const mutedG = 116;
  const mutedB = 139;
  const borderR = 226;
  const borderG = 232;
  const borderB = 240;

  let y = 18;

  // Header left
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(mutedR, mutedG, mutedB);
  doc.text("PROPOSTA COMERCIAL", margin, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(navyR, navyG, navyB);
  doc.text("Proposta de Compra", margin, y + 7);

  // Header right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(navyR, navyG, navyB);
  doc.text(data.numeroProposta, pageW - margin, y, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Emitida: ${data.emitidaEm}`, pageW - margin, y + 4.8, { align: "right" });
  doc.text(`Válida até: ${data.validaAte}`, pageW - margin, y + 9.2, { align: "right" });

  // Gold horizontal rule
  y += 13;
  doc.setDrawColor(goldR, goldG, goldB);
  doc.setLineWidth(0.9);
  doc.line(margin, y, pageW - margin, y);

  // Client section
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(mutedR, mutedG, mutedB);
  doc.text("CLIENTE", margin + 2, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(navyR, navyG, navyB);
  const clientLine = data.clienteCpf ? `${data.clienteNome}  ·  CPF: ${data.clienteCpf}` : data.clienteNome;
  doc.text(clientLine, margin + 2, y + 5.5);

  y += 12;

  const colGap = 6;
  const colW = (contentW - colGap) / 2;

  const drawCard = (
    x: number,
    topY: number,
    width: number,
    height: number,
    title: string,
    rows: Array<{ label: string; value: string; boldRow?: boolean }>,
  ) => {
    doc.setDrawColor(borderR, borderG, borderB);
    doc.setFillColor(255, 255, 255);
    doc.setLineWidth(0.35);
    doc.roundedRect(x, topY, width, height, 2.5, 2.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(146, 114, 24);
    doc.text(title, x + 5, topY + 7);

    let rowY = topY + 14;
    rows.forEach((row, idx) => {
      if (idx > 0) {
        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.25);
        doc.line(x + 5, rowY - 4.5, x + width - 5, rowY - 4.5);
      }
      if (row.boldRow) {
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.35);
        doc.line(x + 5, rowY - 4.5, x + width - 5, rowY - 4.5);
      }

      doc.setFont("helvetica", row.boldRow ? "bold" : "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(row.boldRow ? navyR : mutedR, row.boldRow ? navyG : mutedG, row.boldRow ? navyB : mutedB);
      doc.text(row.label, x + 5, rowY);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(navyR, navyG, navyB);
      const truncatedVal = row.value.length > 34 ? `${row.value.slice(0, 33)}…` : row.value;
      doc.text(truncatedVal, x + width - 5, rowY, { align: "right" });

      rowY += 7.5;
    });
  };

  // Row 1 cards: IMÓVEL & FINANCIAMENTO CAIXA
  const row1H = 52;
  drawCard(margin, y, colW, row1H, "IMÓVEL", [
    { label: "Empreendimento", value: data.empreendimento },
    { label: "Unidade / Andar", value: data.unidadeAndar },
    { label: "Área (m²)", value: data.areaM2 },
    { label: "Construtora", value: data.construtora },
    { label: "Valor do imóvel", value: data.valorImovelTexto, boldRow: true },
  ]);

  drawCard(margin + colW + colGap, y, colW, row1H, "FINANCIAMENTO CAIXA", [
    { label: "Financiamento aprovado", value: data.financiamentoAprovadoTexto },
    { label: "FGTS", value: data.fgtsTexto },
    { label: "Subsídio Gov. Federal", value: data.subsidioFederalTexto },
    { label: "Subsídio Estadual", value: data.subsidioEstadualTexto },
    { label: "Total aprovação", value: data.totalAprovacaoTexto, boldRow: true },
  ]);

  y += row1H + 6;

  // Row 2 cards: ENTRADA CONSTRUTORA & PARC. PÓS-ENTREGA
  const row2H = 66;
  drawCard(margin, y, colW, row2H, "ENTRADA CONSTRUTORA", [
    { label: "Entrada do cliente", value: data.entradaClienteTexto },
    { label: "Ato (na assinatura)", value: data.atoAssinaturaTexto },
    { label: "Saldo da entrada", value: data.saldoEntradaTexto },
    { label: "Sinal desejável", value: data.sinalDesejavelTexto },
    { label: "Parcelas de obras", value: data.parcelasObrasTexto },
    { label: "Intermediárias", value: data.intermediariasTexto },
    { label: "Parcela chaves", value: data.parcelaChavesTexto },
  ]);

  drawCard(margin + colW + colGap, y, colW, row2H, "PARC. PÓS-ENTREGA", [
    { label: "Total pós-entrega", value: data.totalPosEntregaTexto },
    { label: "Plano", value: data.planoPosEntregaTexto },
    { label: "Prestação estimada", value: data.prestacaoPosEntregaTexto, boldRow: true },
  ]);

  y += row2H + 8;

  // Optional Observações box
  if (data.observacoes) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const wrappedNotes = doc.splitTextToSize(data.observacoes, contentW - 10);
    const notesH = Math.max(18, 12 + wrappedNotes.length * 4.5);

    doc.setDrawColor(borderR, borderG, borderB);
    doc.setFillColor(248, 250, 252);
    doc.setLineWidth(0.35);
    doc.roundedRect(margin, y, contentW, notesH, 2.5, 2.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(146, 114, 24);
    doc.text("OBSERVAÇÕES", margin + 5, y + 6.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(wrappedNotes, margin + 5, y + 12);

    y += notesH + 10;
  } else {
    y += 8;
  }

  // Signatures
  const sigY = Math.max(y + 12, 226);
  const sigLineW = (contentW - 16) / 2;

  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.35);
  doc.line(margin, sigY, margin + sigLineW, sigY);
  doc.line(margin + sigLineW + 16, sigY, pageW - margin, sigY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(navyR, navyG, navyB);
  doc.text("Cliente", margin + sigLineW / 2, sigY + 5, { align: "center" });
  if (data.clienteNome && data.clienteNome !== "—") {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(mutedR, mutedG, mutedB);
    doc.text(data.clienteNome, margin + sigLineW / 2, sigY + 9.5, { align: "center" });
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(navyR, navyG, navyB);
  doc.text("Corretor", margin + sigLineW + 16 + sigLineW / 2, sigY + 5, { align: "center" });
  const brokerMeta = [data.corretorNome, data.corretorCreci ? `CRECI ${data.corretorCreci}` : ""]
    .filter(Boolean)
    .join(" · ");
  if (brokerMeta) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(mutedR, mutedG, mutedB);
    doc.text(brokerMeta, margin + sigLineW + 16 + sigLineW / 2, sigY + 9.5, { align: "center" });
  }

  // Disclaimer footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(mutedR, mutedG, mutedB);
  doc.text(
    "Simulação de caráter informativo. Valores sujeitos à análise e aprovação de crédito, disponibilidade da unidade e tabela vigente da construtora.",
    pageW / 2,
    sigY + 18,
    { align: "center", maxWidth: contentW },
  );

  const safeFileClient = (data.clienteNome && data.clienteNome !== "—" ? data.clienteNome : "Cliente")
    .replace(/[^a-zA-Z0-9À-ÿ_-]+/g, "_")
    .slice(0, 32);
  const safePropNum = data.numeroProposta.replace(/[^a-zA-Z0-9_-]+/g, "");
  doc.save(`Proposta_${safePropNum}_${safeFileClient}.pdf`);
}

export default function PropostaClienteModal({
  isOpen,
  onClose,
  fields,
  results,
  adminData,
  logoEmp,
}: PropostaClienteModalProps) {
  const [numeroProposta, setNumeroProposta] = useState<string>(() => generatePropostaNumero());
  const [validadeDias, setValidadeDias] = useState<number>(7);
  const [construtora, setConstrutora] = useState<string>("");
  const [observacoes, setObservacoes] = useState<string>("");
  const [whatsAppPhone, setWhatsAppPhone] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Refresh proposal number whenever modal opens fresh
  useEffect(() => {
    if (isOpen) {
      setNumeroProposta((prev) => prev || generatePropostaNumero());
    }
  }, [isOpen]);

  // Clean up print mode class if user cancels or unmounts
  useEffect(() => {
    const handleAfterPrint = () => {
      document.body.classList.remove("proposta-print-mode");
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
      document.body.classList.remove("proposta-print-mode");
    };
  }, []);

  const proposta = useMemo(
    () =>
      buildPropostaClienteData({
        fields,
        results,
        adminData,
        numeroProposta,
        validadeDias,
        construtora,
        observacoes,
      }),
    [fields, results, adminData, numeroProposta, validadeDias, construtora, observacoes],
  );

  if (!isOpen) return null;

  const handlePrintA4 = () => {
    document.body.classList.add("proposta-print-mode");
    setTimeout(() => {
      window.print();
    }, 60);
  };

  const handleDownloadPdf = () => {
    try {
      exportPropostaClientePdf(proposta);
      toast.success("PDF A4 da proposta gerado com sucesso.");
    } catch (err) {
      console.error("[PropostaClienteModal] PDF generation failed:", err);
      toast.error("Não foi possível gerar o PDF. Tente novamente ou use Imprimir.");
    }
  };

  const handleSendWhatsApp = () => {
    const message = buildPropostaWhatsAppMessage(proposta);
    const url = buildPropostaWhatsAppUrl(whatsAppPhone, message);
    if (!url) {
      toast.error("Informe o WhatsApp do cliente com DDD (ex: 11 99999-9999).");
      return;
    }

    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Abrindo WhatsApp com a proposta formatada.");
  };

  const handleCopyMessage = async () => {
    try {
      const message = buildPropostaWhatsAppMessage(proposta);
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success("Texto da proposta copiado para a área de transferência.");
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Não foi possível copiar automaticamente.");
    }
  };

  return createPortal(
    <div
      data-proposta-portal="true"
      className="fixed inset-0 z-[1600] bg-slate-950/85 backdrop-blur-sm overflow-y-auto overscroll-contain p-0 sm:p-4 lg:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Proposta para o Cliente"
    >
      <div className="mx-auto w-full max-w-5xl space-y-4">
        {/* Top Action & Configuration Bar (hidden on print) */}
        <div className="proposta-no-print bg-[#07162b] border-b sm:border border-gold/30 sm:rounded-2xl p-4 sm:p-5 text-white shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl gold-gradient text-primary flex items-center justify-center shrink-0">
                <FileSignature className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-gold truncate">
                  Proposta para o Cliente
                </h2>
                <p className="text-xs text-slate-300 truncate">
                  Pronta para WhatsApp, impressão A4 e download em PDF
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePrintA4}
                className="min-h-[42px] px-3.5 py-2 rounded-xl border border-gold/40 bg-primary/60 text-gold text-xs font-bold hover:bg-gold/15 transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <Printer className="w-4 h-4 shrink-0" />
                Imprimir A4
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="min-h-[42px] px-3.5 py-2 rounded-xl gold-gradient text-primary text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5 whitespace-nowrap"
              >
                <FileDown className="w-4 h-4 shrink-0" />
                Baixar PDF
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar proposta"
                className="min-h-[42px] min-w-[42px] rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Broker Proposal Extras + WhatsApp Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-gold/15">
            <div className="md:col-span-3">
              <label htmlFor="prop-numero" className="flex items-center gap-1 text-[11px] font-semibold text-gold/85 mb-1">
                <Hash className="w-3.5 h-3.5" /> Número da proposta
              </label>
              <input
                id="prop-numero"
                type="text"
                value={numeroProposta}
                onChange={(e) => setNumeroProposta(e.target.value.slice(0, 32))}
                className="w-full min-h-[42px] px-3 py-2 text-base sm:text-xs font-mono rounded-xl bg-primary/70 border border-gold/30 text-gold focus:outline-none focus:border-gold"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="prop-validade" className="flex items-center gap-1 text-[11px] font-semibold text-gold/85 mb-1">
                <Calendar className="w-3.5 h-3.5" /> Validade (dias)
              </label>
              <input
                id="prop-validade"
                type="number"
                min={1}
                max={365}
                value={validadeDias}
                onChange={(e) => setValidadeDias(Math.max(1, Math.min(365, parseInt(e.target.value, 10) || 1)))}
                className="w-full min-h-[42px] px-3 py-2 text-base sm:text-xs tabular-nums rounded-xl bg-primary/70 border border-gold/30 text-gold focus:outline-none focus:border-gold"
              />
            </div>

            <div className="md:col-span-3">
              <label htmlFor="prop-construtora" className="flex items-center gap-1 text-[11px] font-semibold text-gold/85 mb-1">
                <Building2 className="w-3.5 h-3.5" /> Construtora (opcional)
              </label>
              <input
                id="prop-construtora"
                type="text"
                value={construtora}
                onChange={(e) => setConstrutora(e.target.value.slice(0, 80))}
                placeholder="Ex: Cury, MRV, Direcional..."
                className="w-full min-h-[42px] px-3 py-2 text-base sm:text-xs rounded-xl bg-primary/70 border border-gold/30 text-white placeholder:text-slate-400 focus:outline-none focus:border-gold"
              />
            </div>

            <div className="md:col-span-4">
              <label htmlFor="prop-whatsapp" className="flex items-center gap-1 text-[11px] font-semibold text-gold/85 mb-1">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp do cliente (com DDD)
              </label>
              <div className="flex gap-1.5">
                <input
                  id="prop-whatsapp"
                  type="tel"
                  inputMode="tel"
                  value={whatsAppPhone}
                  onChange={(e) => setWhatsAppPhone(formatPhoneMask(e.target.value))}
                  placeholder="(11) 99999-9999"
                  className="flex-1 min-w-0 min-h-[42px] px-3 py-2 text-base sm:text-xs tabular-nums rounded-xl bg-primary/70 border border-gold/30 text-white placeholder:text-slate-400 focus:outline-none focus:border-gold"
                />
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#1fb858] text-slate-950 font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  Enviar
                </button>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  title="Copiar texto formatado da proposta"
                  aria-label="Copiar texto da proposta"
                  className="min-h-[42px] min-w-[42px] rounded-xl border border-gold/30 bg-primary/70 text-gold hover:bg-gold/15 flex items-center justify-center shrink-0 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="md:col-span-12">
              <label htmlFor="prop-obs" className="flex items-center gap-1 text-[11px] font-semibold text-gold/85 mb-1">
                <StickyNote className="w-3.5 h-3.5" /> Observações da proposta (aparecem na folha A4, PDF e WhatsApp)
              </label>
              <textarea
                id="prop-obs"
                rows={2}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value.slice(0, 600))}
                placeholder="Ex: Condição promocional válida para assinatura até o final do mês, documentação ITBI e registro inclusos..."
                className="w-full px-3 py-2 text-base sm:text-xs rounded-xl bg-primary/70 border border-gold/30 text-white placeholder:text-slate-400 focus:outline-none focus:border-gold resize-none"
              />
            </div>
          </div>
        </div>

        {/* Printable A4 Proposal Document */}
        <article
          id="proposta-cliente-a4"
          className="bg-white text-slate-900 sm:rounded-2xl shadow-2xl border border-slate-200 px-5 py-7 sm:px-10 sm:py-10 mx-auto"
        >
          {/* Document Header */}
          <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b-[3px] border-[#C5A028]">
            <div className="flex items-center gap-3.5">
              {logoEmp && (
                <img
                  src={logoEmp}
                  alt={proposta.empreendimento}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-lg object-contain border border-slate-200 p-1 shrink-0"
                />
              )}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Proposta Comercial
                </p>
                <h1 className="text-2xl sm:text-[28px] font-extrabold text-slate-950 tracking-tight leading-tight">
                  Proposta de Compra
                </h1>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs leading-relaxed tabular-nums">
              <p className="font-bold text-slate-900 font-mono text-sm">{proposta.numeroProposta}</p>
              <p className="text-slate-600">Emitida: {proposta.emitidaEm}</p>
              <p className="text-slate-600">Válida até: {proposta.validaAte}</p>
            </div>
          </header>

          {/* Client Identity Strip */}
          <section className="py-5 px-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Cliente</p>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-base sm:text-lg font-bold text-slate-950">{proposta.clienteNome}</p>
              {proposta.clienteCpf && (
                <span className="text-xs text-slate-500 tabular-nums">CPF: {proposta.clienteCpf}</span>
              )}
            </div>
          </section>

          {/* 2x2 Financial & Property Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4">
            {/* Card 1: IMÓVEL */}
            <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <h2 className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#9A7417] mb-3">
                Imóvel
              </h2>
              <dl className="divide-y divide-slate-100 text-xs sm:text-sm">
                <ProposalRow label="Empreendimento" value={proposta.empreendimento} />
                <ProposalRow label="Unidade / Andar" value={proposta.unidadeAndar} />
                <ProposalRow label="Área (m²)" value={proposta.areaM2} />
                <ProposalRow label="Construtora" value={proposta.construtora} />
                <ProposalRow label="Valor do imóvel" value={proposta.valorImovelTexto} highlight />
              </dl>
            </section>

            {/* Card 2: FINANCIAMENTO CAIXA */}
            <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <h2 className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#9A7417] mb-3">
                Financiamento CAIXA
              </h2>
              <dl className="divide-y divide-slate-100 text-xs sm:text-sm">
                <ProposalRow label="Financiamento aprovado" value={proposta.financiamentoAprovadoTexto} />
                <ProposalRow label="FGTS" value={proposta.fgtsTexto} />
                <ProposalRow label="Subsídio Gov. Federal" value={proposta.subsidioFederalTexto} />
                <ProposalRow label="Subsídio Estadual" value={proposta.subsidioEstadualTexto} />
                <ProposalRow label="Total aprovação" value={proposta.totalAprovacaoTexto} highlight />
              </dl>
            </section>

            {/* Card 3: ENTRADA CONSTRUTORA */}
            <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <h2 className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#9A7417] mb-3">
                Entrada Construtora
              </h2>
              <dl className="divide-y divide-slate-100 text-xs sm:text-sm">
                <ProposalRow label="Entrada do cliente" value={proposta.entradaClienteTexto} />
                <ProposalRow label="Ato (na assinatura)" value={proposta.atoAssinaturaTexto} />
                <ProposalRow label="Saldo da entrada" value={proposta.saldoEntradaTexto} />
                <ProposalRow label="Sinal desejável" value={proposta.sinalDesejavelTexto} />
                <ProposalRow label="Parcelas de obras" value={proposta.parcelasObrasTexto} />
                <ProposalRow label="Intermediárias" value={proposta.intermediariasTexto} />
                <ProposalRow label="Parcela chaves" value={proposta.parcelaChavesTexto} />
              </dl>
            </section>

            {/* Card 4: PARC. PÓS-ENTREGA */}
            <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <h2 className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#9A7417] mb-3">
                Parc. Pós-Entrega
              </h2>
              <dl className="divide-y divide-slate-100 text-xs sm:text-sm">
                <ProposalRow label="Total pós-entrega" value={proposta.totalPosEntregaTexto} />
                <ProposalRow label="Plano" value={proposta.planoPosEntregaTexto} />
                <ProposalRow label="Prestação estimada" value={proposta.prestacaoPosEntregaTexto} highlight />
              </dl>
            </section>
          </div>

          {/* Optional Observations */}
          {proposta.observacoes && (
            <section className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <h2 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#9A7417] mb-1.5">
                Observações
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {proposta.observacoes}
              </p>
            </section>
          )}

          {/* Signature Footer */}
          <footer className="mt-10 sm:mt-14 pt-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-8 sm:gap-12">
              <div className="pt-8 border-t border-slate-400 text-center">
                <p className="text-xs sm:text-sm font-bold text-slate-900">Cliente</p>
                {proposta.clienteNome !== "—" && (
                  <p className="text-xs text-slate-500 mt-0.5">{proposta.clienteNome}</p>
                )}
              </div>

              <div className="pt-8 border-t border-slate-400 text-center">
                <p className="text-xs sm:text-sm font-bold text-slate-900">Corretor</p>
                {(proposta.corretorNome || proposta.corretorCreci) && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {[
                      proposta.corretorNome,
                      proposta.corretorCreci ? `CRECI ${proposta.corretorCreci}` : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              Simulação de caráter informativo. Valores sujeitos à análise e aprovação de crédito, disponibilidade da
              unidade e tabela vigente da construtora.
            </p>
          </footer>
        </article>
      </div>
    </div>,
    document.body,
  );
}

function ProposalRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`py-2 flex items-baseline justify-between gap-3 ${highlight ? "pt-2.5 border-t border-slate-300" : ""}`}>
      <dt className={highlight ? "font-bold text-slate-900" : "text-slate-600"}>{label}</dt>
      <dd className="font-bold text-slate-950 text-right tabular-nums break-words max-w-[60%]">{value}</dd>
    </div>
  );
}
