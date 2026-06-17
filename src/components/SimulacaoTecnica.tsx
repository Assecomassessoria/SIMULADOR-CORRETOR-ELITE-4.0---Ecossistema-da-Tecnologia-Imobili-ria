import { useState, useCallback, useRef, useEffect } from "react";
import {
  Share2,
  Printer,
  Mail,
  MessageSquare,
  FileText,
  Trash2,
  ExternalLink,
  Image,
  X,
  CalendarClock,
  FileCheck,
  QrCode,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatCurrency, parseCurrency, formatCurrencyInput, formatCRECI, AdminData } from "@/lib/eliteUtils";
import RelatorioVencimentos from "@/components/RelatorioVencimentos";
import { useToast } from "@/hooks/use-toast";
import Simulacao40 from "@/components/Simulacao40";
import SimulacaoCustom from "@/components/SimulacaoCustom";
import WhatsappQrCard from "@/components/marketing/WhatsappQrCard";
import { useUnidadeLookup } from "@/hooks/useUnidadeLookup";

interface CalcResults {
  descLanc: number;
  documentos: number;
  beneficios: number;
  totalAprov: number;
  futuroCaixa: number;
  entradaConstrutora: number;
  atoClienteValor: number;
  sinalValor: number;
  fluxoObras: number;
  valorIntermParc: number;
  subtotal: number;
  valorObras: number;
  totalFluxoObrasConst: number;
  percBeneficios: number;
}

interface SimulacaoProps {
  adminData?: AdminData;
  onDataUpdate?: (fields: Record<string, string>, results: Record<string, number>) => void;
  isVisitor?: boolean;
}

export default function SimulacaoTecnica({ adminData, onDataUpdate, isVisitor = false }: SimulacaoProps) {
  const { toast } = useToast();
  const { lookup: lookupUnidade } = useUnidadeLookup();
  const [unidadeAutoFilled, setUnidadeAutoFilled] = useState<null | { atualizado_em?: string; manual?: boolean }>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [subTab, setSubTab] = useState<"tecnica" | "sim40" | "custom" | "caixa">("tecnica");

  const handleNavigateToBloco4 = useCallback(() => {
    setSubTab("tecnica");
    setDashboardOpen(true);
    setTimeout(() => {
      const element = document.getElementById("bloco-4-dashboard");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 150);
  }, []);

  const handleNavigateToBloco5 = useCallback(() => {
    setSubTab("tecnica");
    setDocsPanelOpen(true);
    setTimeout(() => {
      const element = document.getElementById("bloco-5-documentos");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 150);
  }, []);

  const [fields, setFields] = useState({
    infoEmp: "",
    infoCli: "",
    infoM2: "",
    infoAndar: "",
    infoApto: "",
    infoCons: "",
    infoCreci: "",
    infoCpf: "",
    avaliacao: "",
    lancamento: "",
    campanha: "",
    aprovacao: "",
    fgts: "",
    subsidio: "",
    casa: "",
    parcelaCaixa: "",
    percObras: "0",
    resultPercentual: "",
    atoCliente: "",
    sinal: "",
    intermediarias: "",
    chaves: "",
    parcInterm: "1",
    parcelasObras: "1",
    fluxoConstAdicional: "",
    nrParcelasFluxo: "1",
    documentos: "", // editable override for ITBI
  });

  const [logoEmp, setLogoEmp] = useState<string | null>(null);
  const [docMenuOpen, setDocMenuOpen] = useState(false);
  const [printMenuOpen, setPrintMenuOpen] = useState(false);
  const [vencimentosOpen, setVencimentosOpen] = useState(false);
  const [waConnectOpen, setWaConnectOpen] = useState(false);
  const [docsPanelOpen, setDocsPanelOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("elite_docs_panel_open");
    return saved === null ? true : saved === "1";
  });
  useEffect(() => {
    try {
      localStorage.setItem("elite_docs_panel_open", docsPanelOpen ? "1" : "0");
    } catch {}
  }, [docsPanelOpen]);

  const [dashboardOpen, setDashboardOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("elite_dashboard_open");
    return saved === null ? true : saved === "1";
  });
  useEffect(() => {
    try {
      localStorage.setItem("elite_dashboard_open", dashboardOpen ? "1" : "0");
    } catch {}
  }, [dashboardOpen]);

  // Load admin data into fields
  useEffect(() => {
    if (adminData) {
      setFields((prev) => ({
        ...prev,
        infoEmp: adminData.empName || prev.infoEmp,
        infoCons: adminData.brokerName || prev.infoCons,
        infoCreci: adminData.creci || prev.infoCreci,
      }));
    }
  }, [adminData]);

  const [results, setResults] = useState<CalcResults>({
    descLanc: 0,
    documentos: 0,
    beneficios: 0,
    totalAprov: 0,
    futuroCaixa: 0,
    entradaConstrutora: 0,
    atoClienteValor: 0,
    sinalValor: 0,
    fluxoObras: 0,
    valorIntermParc: 0,
    subtotal: 0,
    valorObras: 0,
    totalFluxoObrasConst: 0,
    percBeneficios: 0,
  });

  const calc = useCallback((updated: typeof fields) => {
    const avaliacao = parseCurrency(updated.avaliacao);
    const lanc = parseCurrency(updated.lancamento) || 0;
    const camp = parseCurrency(updated.campanha) || 0;

    const descLanc = Math.max(0, avaliacao - lanc);
    // Use manual override if set, otherwise auto-calculate 4%
    const docs = updated.documentos ? parseCurrency(updated.documentos) : lanc * 0.04;
    const beneficios = descLanc + docs + camp;
    const percBeneficios = lanc > 0 ? (beneficios / lanc) * 100 : 0;

    const aprov = parseCurrency(updated.aprovacao);
    const fgts = parseCurrency(updated.fgts);
    const subs = parseCurrency(updated.subsidio);
    const casa = parseCurrency(updated.casa);
    const totalAprov = aprov + fgts + subs + casa;

    const parcelaFutura = parseCurrency(updated.parcelaCaixa) || 0;
    const percObras = parseFloat(updated.percObras) || 0;
    const futuroCaixa = parcelaFutura * (percObras / 100);

    const entradaConstrutora = Math.max(0, lanc - totalAprov - camp);

    const atoClienteValor = parseCurrency(updated.atoCliente) || 0;

    // Se Ato Cliente > Entrada, o excedente abate do Total Aprovação e Fluxo Obras = 0
    const excessoAto = Math.max(0, atoClienteValor - entradaConstrutora);
    let totalAprovAjustado = excessoAto > 0 ? Math.max(0, totalAprov - excessoAto) : totalAprov;

    const porcentagemSinal = parseFloat(updated.resultPercentual) || 0;
    const sinalValor = (lanc - camp) * (porcentagemSinal / 100);

    const fluxoObras = excessoAto > 0 ? 0 : Math.max(0, entradaConstrutora - atoClienteValor - sinalValor);

    const interm = parseCurrency(updated.intermediarias);
    const chv = parseCurrency(updated.chaves);
    const numParcInterm = parseInt(updated.parcInterm) || 1;
    const valorIntermParc = interm / numParcInterm;

    const sub = fluxoObras - interm - chv;
    const parcelas = parseInt(updated.parcelasObras) || 1;
    const valorObras = sub / parcelas;

    // Bloquear Fluxo Const. Adicional se Ato Cliente < Saldo Entrada
    const saldoEntradaCalc = Math.max(0, entradaConstrutora - atoClienteValor);
    const fluxoAdicionalBloqueado = atoClienteValor < saldoEntradaCalc;
    const fluxoConstAdicionalVal = fluxoAdicionalBloqueado ? 0 : parseCurrency(updated.fluxoConstAdicional) || 0;
    const nrParcelasFluxoVal = parseInt(updated.nrParcelasFluxo) || 1;
    const totalFluxoObrasConst = fluxoConstAdicionalVal * nrParcelasFluxoVal;

    // Se Total Fluxo Obras Const. > 0, abate do Total Aprovação
    if (totalFluxoObrasConst > 0) {
      totalAprovAjustado = Math.max(0, totalAprovAjustado - totalFluxoObrasConst);
    }

    setResults({
      descLanc,
      documentos: docs,
      beneficios,
      percBeneficios,
      totalAprov: totalAprovAjustado,
      futuroCaixa,
      entradaConstrutora,
      atoClienteValor,
      sinalValor,
      fluxoObras,
      valorIntermParc,
      subtotal: sub,
      valorObras,
      totalFluxoObrasConst,
    });
  }, []);

  const updateField = (name: string, value: string) => {
    const updated = { ...fields, [name]: value };
    setFields(updated);
    calc(updated);
  };

  // Notify parent of data changes for dashboard charts
  useEffect(() => {
    onDataUpdate?.(fields, results as unknown as Record<string, number>);
  }, [fields, results, onDataUpdate]);

  const handleCurrencyInput = (name: string, rawValue: string) => {
    const formatted = formatCurrencyInput(rawValue);
    updateField(name, formatted);
  };

  const handleCreci = (value: string) => {
    updateField("infoCreci", formatCRECI(value));
  };

  const handleUnidadeLookup = async () => {
    const emp = fields.infoEmp?.trim();
    const unid = fields.infoApto?.trim();
    if (!emp || !unid) return;
    const r = await lookupUnidade(emp, unid);
    if (!r) return;
    if (r.found) {
      const updated = { ...fields };
      if (r.andar) updated.infoAndar = String(r.andar);
      if (r.apto_torre)
        updated.infoApto = String(r.apto_torre).includes(unid) ? updated.infoApto : `${unid} · ${r.apto_torre}`;
      if (r.valor_lancamento) updated.lancamento = formatCurrencyInput(String(Math.round(r.valor_lancamento * 100)));
      if (r.metragem && !updated.infoM2) updated.infoM2 = String(r.metragem);
      setFields(updated);
      calc(updated);
      setUnidadeAutoFilled({ atualizado_em: r.atualizado_em, manual: false });
      toast({
        title: "Unidade localizada na tabela oficial",
        description: `Andar, Apto e Valor de Lançamento preenchidos automaticamente. Atualizado em ${r.atualizado_em ? new Date(r.atualizado_em).toLocaleDateString("pt-BR") : "—"}.`,
      });
    } else {
      setUnidadeAutoFilled(null);
      toast({
        title: "Unidade não localizada",
        description: "Preencha Andar e Valor de Lançamento manualmente.",
        variant: "destructive",
      });
    }
  };

  // Auto-fill documentos when lancamento changes and documentos is empty
  useEffect(() => {
    const lanc = parseCurrency(fields.lancamento) || 0;
    if (lanc > 0 && !fields.documentos) {
      // Don't set field, just let calc use auto value
      calc(fields);
    }
  }, [fields.lancamento]);

  const getDocumentosValue = () => {
    if (fields.documentos) return parseCurrency(fields.documentos);
    const lanc = parseCurrency(fields.lancamento) || 0;
    return lanc * 0.04;
  };

  const dataSimulacao = () => {
    const hoje = new Date();
    const validade = new Date();
    validade.setDate(hoje.getDate() + 5);
    const opt: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" };
    return `DATA: ${hoje.toLocaleDateString("pt-BR", opt)} | VALIDADE: ${validade.toLocaleDateString("pt-BR", opt)}`;
  };

  // Handle paste for logo
  const processLogoFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Arquivo precisa ser uma imagem.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Imagem muito grande. Máximo 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setLogoEmp(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleLogoPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) processLogoFile(file);
        return;
      }
    }
  };

  // Global paste listener: cola a logo mesmo sem foco na área quando não há logo
  useEffect(() => {
    if (logoEmp) return;
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            processLogoFile(file);
          }
          return;
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [logoEmp]);

  const buildShareText = () => {
    const lines = [
      `*SIMULADOR CORRETOR DE ELITE 4.0*`,
      `━━━━━━━━━━━━━━━━━━━━━`,
      dataSimulacao(),
      "",
      fields.infoEmp ? `📍 *Empreendimento:* ${fields.infoEmp}` : "",
      fields.infoCli ? `👤 *Cliente:* ${fields.infoCli}` : "",
      fields.infoM2 ? `📐 *Unidade m²:* ${fields.infoM2}` : "",
      fields.infoAndar ? `🏢 *Andar:* ${fields.infoAndar}` : "",
      fields.infoApto ? `🚪 *Apto:* ${fields.infoApto}` : "",
      fields.infoCons ? `🤝 *Consultor:* ${fields.infoCons}` : "",
      fields.infoCreci ? `📋 *CRECI:* ${fields.infoCreci}` : "",
      fields.infoCpf ? `🪪 *CPF:* ${fields.infoCpf}` : "",
      "",
      `💰 *SIMULAÇÃO TÉCNICA*`,
      `━━━━━━━━━━━━━━━━━━━━━`,
      fields.avaliacao ? `Valor Avaliação CAIXA: ${fields.avaliacao}` : "",
      fields.lancamento ? `Valor de Lançamento: ${fields.lancamento}` : "",
      results.descLanc ? `Desconto de Lançamento: ${formatCurrency(results.descLanc)}` : "",
      results.documentos ? `Doc + ITBI Grátis (4%): ${formatCurrency(results.documentos)}` : "",
      fields.campanha ? `Desconto Campanha: ${fields.campanha}` : "",
      results.beneficios ? `✅ Total Benefícios: ${formatCurrency(results.beneficios)}` : "",
      "",
      `📊 *PARCELA APROXIMADA CAIXA*`,
      `━━━━━━━━━━━━━━━━━━━━━`,
      fields.parcelaCaixa ? `Parcela Futura Caixa: ${fields.parcelaCaixa}` : "",
      fields.percObras ? `% Fase Obras: ${fields.percObras}%` : "",
      results.futuroCaixa ? `Valor Aprox. Fase Obras: ${formatCurrency(results.futuroCaixa)}` : "",
      "",
      `🏦 *SIMULAÇÃO PORTAL CAIXA*`,
      `━━━━━━━━━━━━━━━━━━━━━`,
      fields.aprovacao ? `Simulação CAIXA: ${fields.aprovacao}` : "",
      fields.fgts ? `FGTS: ${fields.fgts}` : "",
      fields.subsidio ? `Subsídio Gov. Federal: ${fields.subsidio}` : "",
      fields.casa ? `Subsídio Estadual: ${fields.casa}` : "",
      results.totalAprov ? `✅ Total Aprovação: ${formatCurrency(results.totalAprov)}` : "",
      "",
      `📊 *ENTRADA CONSTRUTORA*`,
      `━━━━━━━━━━━━━━━━━━━━━`,
      results.entradaConstrutora ? `Entrada Cliente: ${formatCurrency(results.entradaConstrutora)}` : "",
      results.atoClienteValor ? `Ato Cliente: ${formatCurrency(results.atoClienteValor)}` : "",
      results.entradaConstrutora
        ? `Saldo Entrada: ${formatCurrency(Math.max(0, results.entradaConstrutora - results.atoClienteValor))}`
        : "",
      fields.resultPercentual ? `Sinal %: ${fields.resultPercentual}%` : "",
      results.sinalValor ? `Sinal (R$): ${formatCurrency(results.sinalValor)}` : "",
      `Fluxo Obras Const.: ${formatCurrency(results.fluxoObras)}`,
      `Fluxo Const. Adicional: ${fields.fluxoConstAdicional || "R$ 0,00"}`,
      `Nº Parcelas Fluxo: ${fields.nrParcelasFluxo || "0"}`,
      `Total Fluxo Obras Const.: ${formatCurrency(results.totalFluxoObrasConst)}`,
      fields.intermediarias ? `Total Intermediárias: ${fields.intermediarias}` : "",
      fields.parcInterm
        ? `Parcelas Intermediárias: ${fields.parcInterm}x de ${formatCurrency(results.valorIntermParc)}`
        : "",
      fields.chaves ? `Parcela Chaves: ${fields.chaves}` : "",
      results.subtotal ? `Saldo Parcelas Obras: ${formatCurrency(results.subtotal)}` : "",
      fields.parcelasObras ? `Plano de Obras: ${fields.parcelasObras} meses` : "",
      results.valorObras ? `Valor Parcelas Obras: ${formatCurrency(results.valorObras)}` : "",
      "",
      `_Simulador Corretor de Elite 4.0 - Venda Segura_`,
    ];
    return lines.filter(Boolean).join("\n");
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(buildShareText());
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handlePrint = () => {
    const printContent = contentRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const empImg = adminData?.imgEmp || logoEmp;
    const brokerImg = adminData?.imgBroker;

    const headerImagesHtml =
      empImg || brokerImg
        ? `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <div>${empImg ? `<img src="${empImg}" alt="Empreendimento" style="max-height:70px;max-width:200px;object-fit:contain;border-radius:6px;" />` : ""}</div>
          <div>${brokerImg ? `<img src="${brokerImg}" alt="Corretor" style="height:70px;width:70px;object-fit:cover;border-radius:50%;border:2px solid #C5A028;" />` : ""}</div>
        </div>`
        : "";

    printWindow.document.write(`
      <html>
        <head>
          <title>Simulação - Corretor de Elite 4.0</title>
          <style>
            body { font-family: 'Poppins', Arial, sans-serif; padding: 20px; color: #0A192F; }
            h1 { font-size: 16px; text-align: center; border-bottom: 2px solid #C5A028; padding-bottom: 8px; }
            .section { margin: 16px 0; padding: 12px; border: 1px solid #ddd; border-radius: 6px; }
            .section h2 { font-size: 13px; color: #0A192F; border-bottom: 1px solid #C5A028; padding-bottom: 4px; margin-bottom: 8px; }
            .row { display: flex; gap: 16px; margin: 6px 0; flex-wrap: wrap; }
            .field { flex: 1; min-width: 200px; }
            .field label { font-size: 10px; font-weight: 600; color: #555; display: block; }
            .field span { font-size: 13px; font-weight: 600; }
            .highlight { color: #C5A028; font-weight: 700; }
            .footer { text-align: center; font-size: 9px; color: #888; margin-top: 24px; border-top: 1px solid #ddd; padding-top: 8px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          ${headerImagesHtml}
          <h1>💎 SIMULADOR CORRETOR DE ELITE 4.0</h1>
          <p style="text-align:center;font-size:11px;color:#888;">${dataSimulacao()}</p>

          <div class="section">
            <h2>Dados do Empreendimento</h2>
            <div class="row">
              <div class="field"><label>Empreendimento</label><span>${fields.infoEmp || "-"}</span></div>
              <div class="field"><label>Cliente</label><span>${fields.infoCli || "-"}</span></div>
            </div>
            <div class="row">
              <div class="field"><label>Unidade m²</label><span>${fields.infoM2 || "-"}</span></div>
              <div class="field"><label>Andar</label><span>${fields.infoAndar || "-"}</span></div>
              <div class="field"><label>Apto</label><span>${fields.infoApto || "-"}</span></div>
            </div>
            <div class="row">
              <div class="field"><label>Consultor</label><span>${fields.infoCons || "-"}</span></div>
              <div class="field"><label>CRECI</label><span>${fields.infoCreci || "-"}</span></div>
            </div>
            ${fields.infoCpf ? `<div class="row"><div class="field"><label>CPF</label><span>${fields.infoCpf}</span></div></div>` : ""}
          </div>

          <div class="section">
            <h2>Simulação Técnica (Empreendimento)</h2>
            <div class="row">
              <div class="field"><label>Valor Avaliação CAIXA</label><span>${fields.avaliacao || "-"}</span></div>
              <div class="field"><label>Valor de Lançamento</label><span>${fields.lancamento || "-"}</span></div>
            </div>
            <div class="row">
              <div class="field"><label>Desconto de Lançamento</label><span>${formatCurrency(results.descLanc)}</span></div>
              <div class="field"><label>Doc + ITBI Grátis (4%)</label><span>${formatCurrency(results.documentos)}</span></div>
            </div>
            <div class="row">
              <div class="field"><label>Desconto Campanha</label><span>${fields.campanha || "-"}</span></div>
              <div class="field"><label>Total Benefícios</label><span class="highlight">${formatCurrency(results.beneficios)}</span></div>
            </div>
          </div>

          <div class="section">
            <h2>Parcela Aproximada CAIXA</h2>
            <div class="row">
              <div class="field"><label>Parcela Futura Caixa</label><span>${fields.parcelaCaixa || "-"}</span></div>
              <div class="field"><label>% Fase Obras</label><span>${fields.percObras || "0"}%</span></div>
              <div class="field"><label>Valor Aprox. Fase Obras</label><span>${formatCurrency(results.futuroCaixa)}</span></div>
            </div>
          </div>

          <div class="section">
            <h2>Simulação Portal CAIXA</h2>
            <div class="row">
              <div class="field"><label>Simulação CAIXA</label><span>${fields.aprovacao || "-"}</span></div>
              <div class="field"><label>FGTS</label><span>${fields.fgts || "-"}</span></div>
            </div>
            <div class="row">
              <div class="field"><label>Subsídio Gov.</label><span>${fields.subsidio || "-"}</span></div>
              <div class="field"><label>FGTS | Subsidio Estadual</label><span>${fields.casa || "-"}</span></div>
            </div>
            <div class="row">
              <div class="field"><label>Total Aprovação</label><span class="highlight">${formatCurrency(results.totalAprov)}</span></div>
            </div>
          </div>

          <div class="section">
            <h2>Entrada Construtora | Proposta Fluxo Pagamento</h2>
            <div class="row">
              <div class="field"><label>Entrada Cliente</label><span class="highlight">${formatCurrency(results.entradaConstrutora)}</span></div>
              <div class="field"><label>Ato Cliente</label><span>${formatCurrency(results.atoClienteValor)}</span></div>
              <div class="field"><label>Saldo Entrada</label><span>${formatCurrency(Math.max(0, results.entradaConstrutora - results.atoClienteValor))}</span></div>
            </div>
            <div class="row">
              <div class="field"><label>Sinal %</label><span>${fields.resultPercentual || "0"}%</span></div>
              <div class="field"><label>Sinal (R$)</label><span>${formatCurrency(results.sinalValor)}</span></div>
            </div>
            <div class="row">
              <div class="field"><label>Fluxo Obras Const.</label><span>${formatCurrency(results.fluxoObras)}</span></div>
              <div class="field"><label>Fluxo Const. Adicional</label><span>${fields.fluxoConstAdicional || "R$ 0,00"}</span></div>
              <div class="field"><label>Nº Parcelas</label><span>${fields.nrParcelasFluxo || "0"}</span></div>
              <div class="field"><label>Total Fluxo Obras Const.</label><span class="highlight">${formatCurrency(results.totalFluxoObrasConst)}</span></div>
            </div>
            <div class="row">
              <div class="field"><label>Total Intermediárias</label><span>${fields.intermediarias || "-"}</span></div>
              <div class="field"><label>Parcelas Intermediárias (${fields.parcInterm}x)</label><span>${formatCurrency(results.valorIntermParc)}</span></div>
              <div class="field"><label>Parcela Chaves</label><span>${fields.chaves || "-"}</span></div>
            </div>
            <div class="row">
              <div class="field"><label>Saldo Parcelas Construtora</label><span>${formatCurrency(results.subtotal)}</span></div>
              <div class="field"><label>Plano de Obras</label><span>${fields.parcelasObras} meses</span></div>
              <div class="field"><label>Valor Parcelas Obras</label><span class="highlight">${formatCurrency(results.valorObras)}</span></div>
            </div>
          </div>

          <div style="margin:20px 0;padding:14px;border:1px solid #C5A028;border-radius:6px;font-size:11px;color:#0A192F;line-height:1.6;text-align:justify;">
            <strong>Aqui está o seu plano de obras conosco.</strong> Faremos uma simulação para validarmos sua margem no banco.<br/>
            <strong>Aviso Legal:</strong> As condições apresentadas são simulações sujeitas à aprovação final e análise de crédito. Para garantirmos essas condições, o próximo passo é a análise de crédito oficial, onde o banco confirma a viabilidade da operação.
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handlePrintModelo02 = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const empImg = adminData?.imgEmp || logoEmp;
    const brokerImg = adminData?.imgBroker;

    const hoje = new Date();
    const dd = String(hoje.getDate()).padStart(2, "0");
    const mm = String(hoje.getMonth() + 1).padStart(2, "0");
    const yyyy = hoje.getFullYear();
    const ref = `#${yyyy}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

    const cliente = fields.infoCli || "—";
    const empreendimento = fields.infoEmp || "—";
    const consultor = `${fields.infoCons || "—"}${fields.infoCreci ? ` (CRECI ${fields.infoCreci})` : ""}`;
    const unidade = `${fields.infoApto ? `Apto ${fields.infoApto}` : "—"}${fields.infoAndar ? ` - Torre/Andar ${fields.infoAndar}` : ""}`;

    const valorLanc = fields.lancamento || "R$ 0,00";
    const valorAval = fields.avaliacao || "R$ 0,00";

    const sinal = formatCurrency(results.sinalValor);
    const nParc = fields.nrParcelasFluxo || "0";
    const mensais = formatCurrency(results.totalFluxoObrasConst);
    const nInterm = fields.parcInterm || "0";
    const interm = fields.intermediarias || "R$ 0,00";
    const fgts = fields.fgts || "R$ 0,00";
    const subsidio = fields.subsidio || "R$ 0,00";
    const chaves = fields.chaves || "R$ 0,00";
    const atoCliente = formatCurrency(results.atoClienteValor);
    const entradaConst = formatCurrency(results.entradaConstrutora);

    printWindow.document.write(`<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8">
<title>Proposta Consultoria de Elite - ${cliente}</title>
<style>
  body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.5; color: #0A192F; margin: 0; padding: 20px; background: #f3f4f6; }
  .proposta-container { max-width: 820px; margin: auto; background: #fff; border: 1px solid #ddd; padding: 28px; border-radius: 8px; box-shadow: 0 6px 18px rgba(0,0,0,0.08); }
  .header { text-align: center; margin-bottom: 18px; border-bottom: 2px solid #C5A028; padding-bottom: 12px; }
  .header-imgs { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .header-imgs img.emp { max-height: 60px; max-width: 180px; object-fit: contain; border-radius: 4px; }
  .header-imgs img.broker { height: 60px; width: 60px; object-fit: cover; border-radius: 50%; border: 2px solid #C5A028; }
  .header h1 { font-size: 20px; letter-spacing: 3px; margin: 6px 0; color: #0A192F; }
  .header .brand { color: #C5A028; font-weight: 800; }
  .header p { font-size: 11px; color: #555; margin: 4px 0; }
  h2 { font-size: 13px; background: #0A192F; color: #C5A028; padding: 8px 12px; margin: 18px 0 10px; border-radius: 4px; letter-spacing: 1px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 12px; }
  th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; vertical-align: top; }
  th { background-color: #f4f4f4; color: #0A192F; font-weight: 700; width: 22%; }
  .highlight { color: #C5A028; font-weight: 700; }
  .legal { margin-top: 18px; padding: 12px; border: 1px solid #C5A028; border-radius: 6px; font-size: 10.5px; line-height: 1.5; text-align: justify; }
  .footer { text-align: center; font-size: 10px; color: #888; margin-top: 18px; border-top: 1px solid #eee; padding-top: 8px; }
  @media print { body { background: #fff; padding: 0; } .proposta-container { box-shadow: none; border: none; border-radius: 0; } .no-print { display: none !important; } }
  .actions { text-align: center; margin-top: 20px; }
  .actions button { background: #C5A028; color: #0A192F; font-weight: bold; border: none; padding: 10px 28px; border-radius: 6px; cursor: pointer; font-size: 13px; letter-spacing: 1px; }
</style></head><body>
<div class="proposta-container">
  <div class="header">
    <div class="header-imgs">
      <div>${empImg ? `<img class="emp" src="${empImg}" alt="Empreendimento" />` : ""}</div>
      <div>${brokerImg ? `<img class="broker" src="${brokerImg}" alt="Corretor" />` : ""}</div>
    </div>
    <h1><span class="brand">CONSULTORIA DE ELITE</span></h1>
    <p><strong>Ref:</strong> ${ref} &nbsp;|&nbsp; <strong>Emissão:</strong> ${dd}/${mm}/${yyyy}</p>
  </div>

  <h2>1. Identificação Geral</h2>
  <table>
    <tr><th>Cliente</th><td>${cliente}</td><th>Empreendimento</th><td>${empreendimento}</td></tr>
    <tr><th>Consultor</th><td>${consultor}</td><th>Unidade</th><td>${unidade}</td></tr>
    ${fields.infoCpf ? `<tr><th>CPF</th><td>${fields.infoCpf}</td><th>Metragem</th><td>${fields.infoM2 || "—"} m²</td></tr>` : ""}
  </table>

  <h2>2. Engenharia de Valores</h2>
  <table>
    <tr><th>Ativo</th><th>Valor Lançamento</th><th>Valor Avaliação</th></tr>
    <tr><td>Valor Global</td><td>${valorLanc}</td><td class="highlight">${valorAval}</td></tr>
    <tr><td>Total Benefícios</td><td colspan="2" class="highlight">${formatCurrency(results.beneficios)}</td></tr>
  </table>

  <h2>3. Entrada Construtora | Proposta Fluxo Pagamento</h2>
  <table>
    <tr><th>Componente</th><th>Valor</th></tr>
    <tr><td>Entrada Cliente</td><td class="highlight">${entradaConst}</td></tr>
    <tr><td>Ato Cliente</td><td>${atoCliente}</td></tr>
    <tr><td>Saldo Entrada</td><td>${formatCurrency(Math.max(0, results.entradaConstrutora - results.atoClienteValor))}</td></tr>
    <tr><td>Sinal %</td><td>${fields.resultPercentual || "0"}%</td></tr>
    <tr><td>Sinal (R$)</td><td>${sinal}</td></tr>
    <tr><td>Fluxo Obras Const.</td><td>${formatCurrency(results.fluxoObras)}</td></tr>
    <tr><td>Fluxo Const. Adicional</td><td>${fields.fluxoConstAdicional || "R$ 0,00"}</td></tr>
    <tr><td>Nº Parcelas</td><td>${nParc}</td></tr>
    <tr><td>Total Fluxo Obras Const.</td><td class="highlight">${mensais}</td></tr>
    <tr><td>Total Intermediárias</td><td>${interm}</td></tr>
    <tr><td>Parcelas Intermediárias (${nInterm}x)</td><td>${formatCurrency(results.valorIntermParc)}</td></tr>
    <tr><td>Parcela Chaves</td><td>${chaves}</td></tr>
    <tr><td>Saldo Parcelas Construtora</td><td>${formatCurrency(results.subtotal)}</td></tr>
    <tr><td>Plano de Obras</td><td>${fields.parcelasObras || "0"} meses</td></tr>
    <tr><td>Valor Parcelas Obras</td><td class="highlight">${formatCurrency(results.valorObras)}</td></tr>
    <tr><td>FGTS</td><td>${fgts}</td></tr>
    <tr><td>Subsídio</td><td>${subsidio}</td></tr>
  </table>

  <h2>4. Aprovação CAIXA</h2>
  <table>
    <tr><th>Simulação CAIXA</th><td>${fields.aprovacao || "—"}</td><th>Parcela Futura</th><td>${fields.parcelaCaixa || "—"}</td></tr>
    <tr><th>Total Aprovação</th><td colspan="3" class="highlight">${formatCurrency(results.totalAprov)}</td></tr>
  </table>

  <div class="legal">
    <strong>Aviso Legal:</strong> As condições apresentadas nesta proposta são simulações sujeitas à aprovação final e análise de crédito junto à instituição financeira. Para garantir essas condições, o próximo passo é a análise de crédito oficial, onde o banco confirma a viabilidade da operação.
  </div>

  <div class="footer">
    💎 SIMULADOR CORRETOR DE ELITE 4.0 &nbsp;|&nbsp; Emitido em ${dd}/${mm}/${yyyy}
  </div>

  <div class="actions no-print">
    <button onclick="window.print()">Imprimir / Salvar PDF</button>
  </div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print();},300);}</script>
</body></html>`);
    printWindow.document.close();
  };

  const handleEmail = () => {
    if (isVisitor) {
      alert("Função disponível apenas para assinantes ativos.");
      return;
    }
    const cliente = fields.infoCli || "Cliente";
    window.location.href = `mailto:?subject=Simulação - ${cliente}&body=Segue os detalhes...`;
  };

  const handleDocsWhatsApp = () => {
    if (isVisitor) {
      alert("Função disponível apenas para assinantes ativos.");
      return;
    }
    const cliente = fields.infoCli || "Cliente";
    const text = `Olá ${cliente}, por favor, envie seus documentos em PDF (RG/CNH, CERTIDÃO DE NASCIMENTO/CASAMENTO, CPF, C.T.P.S, 3 Últimos Comprovante de Renda, Extrato do FGTS, Comprovante de Residência, Declaração do Imposto de Renda + Recibo de Entrega do IR). Sendo Casado ou compor renda enviar os mesmos documentos solicitados. Renda Informal, sem registro, os últimos 6 meses de movimentação bancária, com limite de cheque especial ou 3 faturas do Cartão de crédito completas, Declaração de Renda constando profissão, data inicial da atividade e renda mensal para darmos continuidade à sua aprovação na Caixa.`;
    const phone = adminData?.whatsapp?.replace(/\D/g, "") || "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleDocumentosCaixa = () => {
    if (isVisitor) {
      alert("Função disponível apenas para assinantes ativos.");
      return;
    }
    const cliente = fields.infoCli || "";
    const cpf = fields.infoCpf || "";

    // Coleta de dados via prompt (mantendo o padrão existente)
    const clienteEdit = window.prompt("Nome do 1º Proponente:", cliente) || cliente;
    const cpfEdit = window.prompt("CPF do 1º Proponente:", cpf) || cpf;

    let nomeCliente2 = "";
    let cpfCliente2 = "";
    const temConjuge = window.confirm("Deseja incluir Cônjuge/2º Proponente?");
    if (temConjuge) {
      nomeCliente2 = window.prompt("Nome do Cônjuge/2º Proponente:") || "";
      cpfCliente2 = window.prompt("CPF do Cônjuge/2º Proponente:") || "";
    }

    const hoje = new Date();
    const meses = [
      "janeiro",
      "fevereiro",
      "março",
      "abril",
      "maio",
      "junho",
      "julho",
      "agosto",
      "setembro",
      "outubro",
      "novembro",
      "dezembro",
    ];
    const cidadeManual = window.prompt("Digite a Cidade para o documento:", "São Paulo");
    const cidade = cidadeManual || "São Paulo";
    const dataTexto = `${cidade}, ${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Autorização Pesquisa Cadastral - ${clienteEdit}</title>
    <style>
        @page { size: A4; margin: 15mm 20mm; }
        body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #000; margin: 0; padding: 20px; background-color: #fff; }
        .document-container { max-width: 800px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; color: #005ca9; }
        .sigilo-box { border: 1px solid #000; padding: 5px 10px; text-align: center; font-size: 11px; }
        .title { text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 20px; }
        .checkbox-group { margin-bottom: 15px; font-size: 13px; }
        .agency-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .agency-table td { border: 1px solid #000; padding: 5px 10px; height: 30px; vertical-align: top; font-size: 11px; }
        .section-title { font-weight: bold; margin-bottom: 5px; font-size: 13px; }
        .client-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .client-table th, .client-table td { border: 1px solid #000; padding: 8px; }
        .col-nome { width: 70%; text-align: left; }
        .col-cpf { width: 30%; text-align: center; }
        .terms-title { font-weight: bold; font-style: italic; margin-bottom: 10px; }
        ul, ol { margin-top: 5px; margin-bottom: 15px; padding-left: 25px; }
        ol { list-style-type: lower-alpha; }
        li { margin-bottom: 8px; text-align: justify; }
        .date-section { margin-top: 30px; margin-bottom: 40px; }
        .signatures { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .sign-box { width: 45%; text-align: center; font-size: 11px; }
        .sign-line { border-bottom: 1px solid #000; height: 40px; margin-bottom: 5px; }
        .footer { border-top: 2px solid #005ca9; padding-top: 10px; font-size: 9px; color: #333; text-align: left; line-height: 1.2; }
        @media print { body { padding: 0; } }
    </style>
</head>
<body>
<div class="document-container">
    <div class="header">
        <div class="logo">CAIXA</div>
        <div class="sigilo-box">Grau de sigilo<br><strong>#PUBLICO</strong></div>
    </div>
    <div class="title">Autorização para Pesquisa Cadastral de Cliente – Rede Parceira</div>
    <div class="checkbox-group">
        <div>☐ UL - Unidade Lotérica</div>
        <div>☑ CCA - Correspondente CAIXA AQUI</div>
    </div>
    <table class="agency-table">
        <tr>
            <td style="width: 20%;">Cód. UL/CCA<br><br></td>
            <td style="width: 20%;">Cód Ag. Vinc.<br><br></td>
            <td style="width: 60%;">Nome da Agência<br><br></td>
        </tr>
    </table>
    <div class="section-title">Pesquisa Cadastral do(s) Cliente(es):</div>
    <table class="client-table">
        <tr>
            <th class="col-nome">Nome do Cliente (es)</th>
            <th class="col-cpf">CPF/CNPJ Cliente (es)</th>
        </tr>
        <tr>
            <td class="col-nome">${clienteEdit.toUpperCase()}</td>
            <td class="col-cpf">${cpfEdit}</td>
        </tr>
        <tr>
            <td class="col-nome">${nomeCliente2.toUpperCase()}</td>
            <td class="col-cpf">${cpfCliente2}</td>
        </tr>
    </table>
    <div class="terms-title">Autorizo a CAIXA ECONÔMICA FEDERAL:</div>
    <ul>
        <li>Nos termos das Resoluções BACEN nº 3.920/10 e 5.037/22:
            <ul>
                <li>a consultar as informações consolidadas a respeito das operações de crédito e câmbio constantes em meu nome no SCR - BACEN, gerido pelo Banco Central do Brasil, ou dos sistemas que venham a complementá-lo ou a substituí-lo;</li>
                <li>a fornecer informações sobre as operações de crédito e câmbio por mim realizadas com a CAIXA, no sentido de compor o cadastro do SCR - BACEN;</li>
                <li>ao arquivamento dos meus dados cadastrais.</li>
            </ul>
        </li>
        <li>Respeitadas as disposições legais em vigor:
            <ul>
                <li>a consulta e arquivamento dos meus dados cadastrais e de idoneidade, nos serviços de proteção ao crédito com as quais a CAIXA mantém convênio firmado e que deles poderá se utilizar.</li>
            </ul>
        </li>
    </ul>
    <div class="terms-title">Estou ciente de que:</div>
    <ol>
        <li>o SCR - BACEN é um cadastro que visa prover o BACEN de informações, para fins de monitoramento do crédito no sistema financeiro e para o exercício de suas atividades de fiscalização, e é utilizado para propiciar o intercâmbio de informações entre instituições financeiras, conforme Resolução BACEN nº 5.037/22, sobre o montante de responsabilidades de clientes em operações de crédito e de câmbio;</li>
        <li>poderei ter acesso aos dados constantes em meu nome no SCR por meio das Centrais de Atendimento ao Público do BACEN e/ou por meio do endereço http://www.bcb.gov.br;</li>
        <li>os pedidos de correção e/ou exclusão quanto às informações constantes do SCR deverão ser dirigidos à instituição responsável pela remessa das informações ao BACEN, por meio de requerimento escrito e fundamentado, ou, quando for o caso, pela respectiva decisão judicial;</li>
        <li>o BACEN é autorizado a tornar disponíveis às Instituições que podem consultar o SCR BACEN informações consolidadas sobre as minhas operações de crédito e de câmbio, respeitadas as regras estabelecidas pelo próprio BACEN.</li>
    </ol>
    <div class="date-section">
        ${dataTexto}<br>
        <span style="font-size: 10px;">Local/Data</span>
    </div>
    <div class="signatures">
        <div class="sign-box"><div class="sign-line"></div>Assinatura Cliente</div>
        <div class="sign-box"><div class="sign-line"></div>Assinatura sob carimbo do responsável pela prospecção do produto -<br>Empregado Caixa - se Agência/PA ou<br>Correspondente CAIXA AQUI, se CCA</div>
    </div>
    <div class="signatures">
        <div class="sign-box"><div class="sign-line"></div>Assinatura Cliente / Cônjuge do Cliente</div>
    </div>
    <div class="footer">
        <strong>SAC CAIXA:</strong> 0800 726 0101 (informações, reclamações, sugestões e elogios)<br>
        Para Pessoas com deficiência auditiva ou de fala: 0800 726 2492<br>
        <strong>Alô CAIXA:</strong> 4004 0104 (capitais e regiões metropolitanas) ou 0800 104 0104 (demais localidades)<br>
        <strong>Ouvidoria:</strong> 0800 725 7474<br>
        caixa.gov.br
    </div>
</div>
<script>window.onload=function(){window.print();}</script>
</body>
</html>`);
    printWindow.document.close();
  };

  const handleFichaCadastral = async () => {
    if (isVisitor) {
      alert("Função disponível apenas para assinantes ativos.");
      return;
    }
    const cliente = fields.infoCli || "";
    const cpf = fields.infoCpf || "";

    try {
      const existingPdfBytes = await fetch("/docs/FICHA_CADASTRAL.pdf").then((res) => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const page = pdfDoc.getPages()[0];
      const fontSize = 10;
      const color = rgb(0, 0, 0.6);

      // DATA - usar data do sistema
      const hoje = new Date();
      const dd = hoje.getDate().toString().padStart(2, "0");
      const mm = (hoje.getMonth() + 1).toString().padStart(2, "0");
      const yyyy = hoje.getFullYear();
      page.drawText(dd, { x: 130, y: 585, size: 10, font, color });
      page.drawText(mm, { x: 158, y: 585, size: 10, font, color });
      page.drawText(yyyy.toString(), { x: 183, y: 585, size: 10, font, color });

      // CORRETOR
      const corretor = fields.infoCreci ? `CRECI ${fields.infoCreci}` : "";
      page.drawText(corretor, { x: 300, y: 585, size: fontSize, font, color });

      // TORRE
      page.drawText(fields.infoAndar || "", { x: 468, y: 585, size: fontSize, font, color });

      // UNIDADE
      page.drawText(fields.infoApto || "", { x: 540, y: 585, size: fontSize, font, color });

      // NOME
      page.drawText(cliente, { x: 100, y: 567, size: fontSize, font, color });

      // CPF
      page.drawText(cpf, { x: 90, y: 525, size: fontSize, font, color });

      // VALOR IMÓVEL - formatado R$ com decimais
      const avaliacaoVal = parseCurrency(fields.avaliacao);
      if (avaliacaoVal > 0) {
        page.drawText(formatCurrency(avaliacaoVal), { x: 140, y: 385, size: fontSize, font, color });
      }

      // VALOR FGTS - formatado R$ com decimais
      const fgtsVal = parseCurrency(fields.fgts);
      if (fgtsVal > 0) {
        page.drawText(formatCurrency(fgtsVal), { x: 440, y: 385, size: fontSize, font, color });
      }

      // Local e data no rodapé
      const meses = [
        "janeiro",
        "fevereiro",
        "março",
        "abril",
        "maio",
        "junho",
        "julho",
        "agosto",
        "setembro",
        "outubro",
        "novembro",
        "dezembro",
      ];
      const localData = `_________, ${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`;
      page.drawText(localData, { x: 180, y: 118, size: 9, font, color: rgb(0, 0, 0) });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `FICHA_CADASTRAL_${cliente.replace(/\s+/g, "_") || "cliente"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao gerar Ficha Cadastral:", err);
      alert("Erro ao gerar a Ficha Cadastral. Tente novamente.");
    }
  };

  const handleFichaCadastralEditavel = () => {
    if (isVisitor) {
      alert("Função disponível apenas para assinantes ativos.");
      return;
    }
    const hoje = new Date();
    const dia = hoje.getDate().toString().padStart(2, "0");
    const meses = [
      "JANEIRO",
      "FEVEREIRO",
      "MARÇO",
      "ABRIL",
      "MAIO",
      "JUNHO",
      "JULHO",
      "AGOSTO",
      "SETEMBRO",
      "OUTUBRO",
      "NOVEMBRO",
      "DEZEMBRO",
    ];
    const mesNome = meses[hoje.getMonth()];
    const ano = hoje.getFullYear();

    const empreendimento = (fields as any).infoEmpr || "";
    const torre = fields.infoAndar || "";
    const unidade = fields.infoApto || "";
    const corretor = fields.infoCreci ? `CRECI ${fields.infoCreci}` : "";
    const cliente = fields.infoCli || "";
    const cpf = fields.infoCpf || "";

    const w = window.open("", "_blank");
    if (!w) return;
    w.document
      .write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Ficha Cadastral Padrão Editável</title>
<style>
  *{box-sizing:border-box;font-family:Arial,Helvetica,sans-serif;}
  body{background:#f3f4f6;padding:20px;margin:0;color:#0A192F;}
  .sheet{max-width:820px;margin:0 auto;background:#fff;padding:32px;box-shadow:0 10px 25px rgba(0,0,0,.12);border-radius:8px;}
  h1{text-align:center;font-size:18px;margin:8px 0 4px;letter-spacing:2px;color:#0A192F;}
  .brand{text-align:center;font-size:22px;font-weight:900;color:#C5A028;letter-spacing:3px;}
  h2{font-size:13px;background:#0A192F;color:#C5A028;padding:6px 10px;margin:18px 0 8px;border-radius:4px;letter-spacing:1px;}
  .row{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:8px;}
  .field{flex:1;min-width:160px;display:flex;flex-direction:column;font-size:11px;}
  .field label{font-weight:bold;margin-bottom:2px;color:#0A192F;text-transform:uppercase;font-size:10px;}
  .field input{border:none;border-bottom:1px solid #999;padding:4px 2px;font-size:12px;outline:none;background:transparent;}
  .field input:focus{border-bottom:1.5px solid #C5A028;}
  .opts{display:flex;gap:14px;margin-top:4px;font-size:12px;}
  .opts label{font-weight:normal;display:flex;align-items:center;gap:4px;}
  .footer-row{display:flex;justify-content:space-between;align-items:flex-end;margin-top:32px;gap:20px;}
  .data-box{font-size:12px;}
  .sig{flex:1;text-align:center;border-top:1px solid #333;padding-top:4px;font-size:11px;max-width:300px;}
  .actions{text-align:center;margin-top:24px;}
  .actions button{background:#C5A028;color:#0A192F;font-weight:bold;border:none;padding:10px 28px;border-radius:6px;cursor:pointer;font-size:13px;letter-spacing:1px;}
  .actions button:hover{opacity:.9;}
  .field input.invalid{border-bottom:1.5px solid #dc2626;background:#fef2f2;}
  .err{color:#dc2626;font-size:10px;margin-top:2px;min-height:12px;}
  @media print{
    body{background:#fff;padding:0;}
    .sheet{box-shadow:none;border-radius:0;padding:18px;}
    .no-print{display:none !important;}
    .field input{border-bottom:1px solid #000;background:#fff !important;}
    .err{display:none;}
  }
</style></head><body>
<div class="sheet">
  <input class="brand" type="text" maxlength="60" placeholder="SIMULADOR CORRETOR ELITE" value="SIMULADOR CORRETOR ELITE" title="Edite com o nome da construtora" style="width:100%;text-align:center;border:none;border-bottom:1px dashed #C5A028;background:transparent;outline:none;text-transform:uppercase;" />
  <h1>FICHA DE CADASTRO DE CLIENTE</h1>

  <div class="row">
    <div class="field"><label>Empreendimento:</label><input value="${empreendimento}"></div>
    <div class="field"><label>Torre:</label><input value="${torre}"></div>
    <div class="field"><label>Unidade:</label><input value="${unidade}"></div>
  </div>

  <h2>DADOS PESSOAIS</h2>
  <div class="row">
    <div class="field"><label>Corretor:</label><input value="${corretor}"></div>
    <div class="field"><label>Nome Cliente:</label><input value="${cliente}"></div>
  </div>
  <div class="row">
    <div class="field"><label>Celular:</label><input id="f_cel" maxlength="15" placeholder="(00) 00000-0000"><div class="err" id="e_cel"></div></div>
    <div class="field"><label>Email:</label><input id="f_email" type="email" maxlength="255" placeholder="exemplo@dominio.com"><div class="err" id="e_email"></div></div>
  </div>
  <div class="row">
    <div class="field"><label>CPF:</label><input id="f_cpf" maxlength="14" placeholder="000.000.000-00" value="${cpf}"><div class="err" id="e_cpf"></div></div>
    <div class="field"><label>RG:</label><input id="f_rg" maxlength="20"></div>
    <div class="field"><label>Estado Civil:</label><input maxlength="40"></div>
    <div class="field"><label>Regime de Casamento:</label><input maxlength="60"></div>
  </div>

  <h2>ENDEREÇO</h2>
  <div class="row">
    <div class="field" style="flex:3"><label>Endereço:</label><input maxlength="120"></div>
    <div class="field"><label>Nº:</label><input maxlength="10"></div>
    <div class="field"><label>Complemento:</label><input maxlength="40"></div>
  </div>
  <div class="row">
    <div class="field"><label>CEP:</label><input id="f_cep" maxlength="9" placeholder="00000-000"><div class="err" id="e_cep"></div></div>
    <div class="field"><label>Bairro:</label><input maxlength="60"></div>
    <div class="field"><label>Cidade:</label><input maxlength="60"></div>
  </div>

  <h2>PERFIL PROFISSIONAL E FINANCEIRO</h2>
  <div class="row">
    <div class="field"><label>Possui Imóvel?</label>
      <div class="opts"><label><input type="checkbox"> SIM</label><label><input type="checkbox"> NÃO</label></div>
    </div>
    <div class="field"><label>Comprom. Financeiro:</label>
      <div class="opts"><label><input type="checkbox"> EMPRÉSTIMO</label><label><input type="checkbox"> FINANCIAMENTO</label></div>
    </div>
  </div>
  <div class="row">
    <div class="field"><label>Profissão:</label><input></div>
    <div class="field"><label>Empresa onde trabalha:</label><input></div>
  </div>
  <div class="row">
    <div class="field"><label>Renda Mensal Bruta:</label><input></div>
    <div class="field"><label>Possui outras rendas:</label><input></div>
  </div>

  <h2>DADOS DO FINANCIAMENTO / MODALIDADE</h2>
  <div class="row">
    <div class="field"><label>Modalidade:</label>
      <div class="opts"><label><input type="checkbox"> MCMV</label><label><input type="checkbox"> SBPE</label></div>
    </div>
    <div class="field"><label>Amortização:</label>
      <div class="opts"><label><input type="checkbox"> PRICE</label><label><input type="checkbox"> SAC</label></div>
    </div>
  </div>
  <div class="row">
    <div class="field"><label>Valor FGTS:</label><input value="${fields.fgts || ""}"></div>
    <div class="field"><label>Possui 3 anos de contribuição ao FGTS?</label>
      <div class="opts"><label><input type="checkbox"> SIM</label><label><input type="checkbox"> NÃO</label></div>
    </div>
  </div>
  <div class="row">
    <div class="field"><label>Possui dependente ou o financiamento possui 2 participantes?</label>
      <div class="opts"><label><input type="checkbox"> SIM</label><label><input type="checkbox"> NÃO</label></div>
    </div>
  </div>

  <div class="footer-row">
    <div class="data-box"><strong>${dia}</strong> DE <strong>${mesNome}</strong> DE <strong>${ano}</strong></div>
    <div class="sig">Assinatura do Cliente</div>
  </div>

  <div class="actions no-print">
    <button onclick="validarEImprimir()">Imprimir / Salvar PDF</button>
  </div>
</div>
<script>
  function onlyDigits(s){return (s||'').replace(/\\D/g,'');}
  function maskCPF(v){v=onlyDigits(v).slice(0,11);if(v.length>9)return v.replace(/(\\d{3})(\\d{3})(\\d{3})(\\d{1,2})/,'$1.$2.$3-$4');if(v.length>6)return v.replace(/(\\d{3})(\\d{3})(\\d{1,3})/,'$1.$2.$3');if(v.length>3)return v.replace(/(\\d{3})(\\d{1,3})/,'$1.$2');return v;}
  function maskCEP(v){v=onlyDigits(v).slice(0,8);if(v.length>5)return v.replace(/(\\d{5})(\\d{1,3})/,'$1-$2');return v;}
  function maskCel(v){v=onlyDigits(v).slice(0,11);if(v.length>10)return v.replace(/(\\d{2})(\\d{5})(\\d{1,4})/,'($1) $2-$3');if(v.length>6)return v.replace(/(\\d{2})(\\d{4})(\\d{1,4})/,'($1) $2-$3');if(v.length>2)return v.replace(/(\\d{2})(\\d{1,5})/,'($1) $2');if(v.length>0)return '('+v;return v;}
  function validaCPF(c){c=onlyDigits(c);if(c.length!==11||/^(\\d)\\1+$/.test(c))return false;var s=0,r,i;for(i=0;i<9;i++)s+=parseInt(c[i])*(10-i);r=(s*10)%11;if(r===10)r=0;if(r!==parseInt(c[9]))return false;s=0;for(i=0;i<10;i++)s+=parseInt(c[i])*(11-i);r=(s*10)%11;if(r===10)r=0;return r===parseInt(c[10]);}
  function bind(id,fn){var el=document.getElementById(id);if(!el)return;el.addEventListener('input',function(){el.value=fn(el.value);el.classList.remove('invalid');var er=document.getElementById('e_'+id.split('_')[1]);if(er)er.textContent='';});}
  bind('f_cpf',maskCPF);bind('f_cep',maskCEP);bind('f_cel',maskCel);
  function setErr(id,msg){var el=document.getElementById(id);var er=document.getElementById('e_'+id.split('_')[1]);if(el)el.classList.toggle('invalid',!!msg);if(er)er.textContent=msg||'';}
  function validarEImprimir(){
    var ok=true;
    var cpf=document.getElementById('f_cpf').value.trim();
    if(cpf&&!validaCPF(cpf)){setErr('f_cpf','CPF inválido');ok=false;}else setErr('f_cpf','');
    var cep=document.getElementById('f_cep').value.trim();
    if(cep&&onlyDigits(cep).length!==8){setErr('f_cep','CEP deve ter 8 dígitos');ok=false;}else setErr('f_cep','');
    var cel=document.getElementById('f_cel').value.trim();
    if(cel){var d=onlyDigits(cel);if(d.length<10||d.length>11){setErr('f_cel','Celular deve ter 10 ou 11 dígitos');ok=false;}else setErr('f_cel','');}else setErr('f_cel','');
    var em=document.getElementById('f_email').value.trim();
    if(em&&!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(em)){setErr('f_email','E-mail inválido');ok=false;}else setErr('f_email','');
    if(!ok){alert('Corrija os campos destacados antes de imprimir.');return;}
    window.print();
  }
</script>
</body></html>`);
    w.document.close();
  };

  const handleDeclaracaoParentesco = () => {
    if (isVisitor) {
      alert("Função disponível apenas para assinantes ativos.");
      return;
    }
    const proponente = fields.infoCli || "";
    const cpfProp = fields.infoCpf || "";
    const hoje = new Date().toISOString().split("T")[0];

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Declaração de Parentesco, Residência e Ausência de Rendimentos</title>
<style>
:root{--caixa-blue:#005ca9;--caixa-orange:#f37021;--text-color:#333;}
body{font-family:Arial,sans-serif;color:var(--text-color);line-height:1.6;margin:0;padding:20px;background:#f4f4f9;}
.document-container{max-width:800px;margin:0 auto;background:#fff;padding:40px;border:1px solid #ddd;box-shadow:0 4px 8px rgba(0,0,0,.05);box-sizing:border-box;}
.header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid var(--caixa-blue);padding-bottom:15px;margin-bottom:30px;}
.logo-caixa{font-weight:900;color:var(--caixa-blue);font-size:24px;letter-spacing:2px;}
.confidential-tag{font-size:11px;font-weight:bold;color:#666;letter-spacing:1px;}
h1{font-size:18px;text-align:center;color:var(--caixa-blue);margin-bottom:30px;text-transform:uppercase;font-weight:bold;}
.doc-code{font-size:12px;color:#888;text-align:right;margin-bottom:20px;}
p{font-size:14px;text-align:justify;margin-bottom:20px;text-indent:40px;}
input[type=text],input[type=date]{border:none;border-bottom:1px dotted var(--caixa-blue);color:#000;font-size:14px;padding:2px 5px;background:#fffbfa;font-family:inherit;}
input[type=text]:focus,input[type=date]:focus{outline:none;border-bottom:1px solid var(--caixa-orange);background:#fff;}
.input-large{width:280px;}.input-medium{width:180px;}.input-small{width:120px;}
.section-title{font-size:14px;font-weight:bold;margin-top:30px;margin-bottom:15px;color:#000;text-transform:uppercase;text-indent:0;}
.spouse-section{border:1px dashed #ccc;padding:15px;margin-top:25px;background:#fafafa;border-radius:4px;}
.signatures-container{margin-top:50px;display:grid;grid-template-columns:1fr 1fr;gap:40px 20px;}
.signature-block{text-align:center;font-size:13px;}
.signature-line{border-top:1px solid #333;margin-bottom:5px;margin-top:40px;}
.footer-page{font-size:11px;color:#999;text-align:center;margin-top:40px;border-top:1px solid #eee;padding-top:10px;}
@media print{body{background:none;padding:0;}.document-container{border:none;box-shadow:none;padding:0;max-width:100%;}input[type=text],input[type=date]{background:transparent !important;border-bottom:none !important;}.spouse-section{border:none;background:transparent;padding:0;}.no-print{display:none;}}
.btn-print{position:fixed;bottom:20px;right:20px;background:var(--caixa-orange);color:#fff;border:none;padding:12px 24px;font-size:14px;font-weight:bold;border-radius:5px;cursor:pointer;box-shadow:0 4px 6px rgba(0,0,0,.1);}
.btn-print:hover{background:#d65c14;}
</style></head><body>
<button class="btn-print no-print" onclick="window.print()">Imprimir / Salvar PDF</button>
<div class="document-container">
  <div class="header">
    <div class="logo-caixa">CAIXA</div>
    <div class="confidential-tag">#EXTERNO.CONFIDENCIAL</div>
  </div>
  <div class="doc-code">Mo43000</div>
  <h1>Declaração de Parentesco, Residência e Ausência de Rendimentos</h1>
  <p>
    Eu, <input type="text" class="input-large" placeholder="Nome completo do parente">,
    CPF nº <input type="text" class="input-medium" placeholder="000.000.000-00">,
    estado civil <input type="text" class="input-small" placeholder="Estado civil">,
    declaro que sou <input type="text" class="input-small" placeholder="Grau de parentesco">
    do proponente <input type="text" class="input-large" value="${proponente}">,
    CPF nº <input type="text" class="input-medium" value="${cpfProp}">, com quem resido no mesmo endereço há pelo menos 6 (seis) meses.
  </p>
  <p>
    Declaro ainda que não possuo nenhum tipo de rendimento, seja renda formal ou informal exceto os benefícios temporários de natureza indenizatória, assistencial ou previdenciária, como auxílio-doença, auxílio-acidente, seguro-desemprego, benefício de prestação continuada (BPC) e benefício do Programa Bolsa Família, ou outros que vierem a substituí-los de acordo com a Lei 14.620 de 13/07/2023 e dependo financeiramente do proponente acima qualificado.
  </p>
  <p>
    Declaro também que não participo como dependente de nenhum outro contrato de financiamento habitacional e não possuo financiamento ativo no SFH.
  </p>
  <div class="spouse-section">
    <p style="text-indent:0;font-style:italic;font-size:13px;margin-bottom:10px;">(Se o parente for casado, preencha o trecho abaixo)</p>
    <p>
      Eu, <input type="text" class="input-large" placeholder="Nome do cônjuge do parente">,
      declaro que também não possuo nenhum tipo de rendimento, seja renda formal ou informal, exceto os benefícios temporários de natureza indenizatória, assistencial ou previdenciária, como auxílio-doença, auxílio-acidente, seguro-desemprego, benefício de prestação continuada (BPC) e benefício do Programa Bolsa Família, ou outros que vierem a substituí-los de acordo com a Lei 14.620 de 13/07/2023.
    </p>
  </div>
  <div class="section-title">Responsabilidade pelas Informações Declaradas</div>
  <p>
    Responsabilizo-me pela exatidão e veracidade das informações declaradas e estou ciente de que, se falsas as declarações, ficarei sujeito às penas da lei, ficando, ainda, obrigado(a) a devolver os valores indevidamente sacados da conta vinculada do FGTS e/ou descontos concedidos pelo FGTS nos termos da Resolução do Conselho Curador do FGTS nº 702/12, suas alterações e aditamentos, acrescidos de correção monetária e juros sem prejuízo do vencimento antecipado da dívida decorrente do crédito concedido, com a consequente cobrança administrativa/judicial.
  </p>
  <p style="text-indent:0;">Data: <input type="date" class="input-medium" value="${hoje}"></p>
  <div class="signatures-container">
    <div class="signature-block"><div class="signature-line"></div>Assinatura do parente</div>
    <div class="signature-block"><div class="signature-line"></div>Assinatura do cônjuge do parente (se houver)</div>
    <div class="signature-block" style="grid-column:1/-1;max-width:50%;margin:0 auto;"><div class="signature-line"></div>Assinatura do proponente</div>
  </div>
  <div class="footer-page">Mo43000 — Página 1 de 1</div>
</div>
</body></html>`);
    w.document.close();
  };

  const handleCartaCancelamento = async () => {
    if (isVisitor) {
      alert("Função disponível apenas para assinantes ativos.");
      return;
    }

    // Coletar todos os dados ANTES de gerar o PDF, na ordem: Nome, CPF, RG
    let cliente = fields.infoCli || "";
    if (!cliente) {
      cliente = window.prompt("Nome do Cliente:", "") || "";
    }
    let cpf = fields.infoCpf || "";
    if (!cpf) {
      cpf = window.prompt("CPF do Cliente:", "") || "";
    }
    const rgValue = window.prompt("RG do Cliente (para a Carta de Cancelamento):", "") || "";
    const corrAnterior = window.prompt("Nome do Correspondente Anterior:", "") || "";
    const cidadeManual = window.prompt("Digite a Cidade:", "São Paulo") || "São Paulo";

    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const page = pdfDoc.addPage([595.28, 841.89]); // A4
      const { width } = page.getSize();
      const margin = 60;
      const textColor = rgb(0, 0, 0);
      let y = 780;

      const drawCentered = (text: string, yPos: number, size: number, useBold = false) => {
        const f = useBold ? fontBold : font;
        const tw = f.widthOfTextAtSize(text, size);
        page.drawText(text, { x: (width - tw) / 2, y: yPos, size, font: f, color: textColor });
      };

      const drawLine = (label: string, value: string, yPos: number) => {
        const labelW = font.widthOfTextAtSize(label, 11);
        page.drawText(label, { x: margin, y: yPos, size: 11, font, color: textColor });
        if (value) {
          page.drawText(value, { x: margin + labelW + 2, y: yPos, size: 11, font: fontBold, color: rgb(0, 0, 0.5) });
        }
        const totalW = width - margin * 2;
        const filledW = labelW + (value ? fontBold.widthOfTextAtSize(value, 11) : 0) + 2;
        const lineStart = margin + filledW + 2;
        if (lineStart < margin + totalW) {
          page.drawLine({
            start: { x: lineStart, y: yPos - 2 },
            end: { x: margin + totalW, y: yPos - 2 },
            thickness: 0.5,
            color: rgb(0.3, 0.3, 0.3),
          });
        }
      };

      // Header
      drawCentered("À CAIXA ECONÔMICA FEDERAL", y, 14, true);
      y -= 30;
      drawCentered("A/C: Correspondente Caixa Aqui (CCA) / Gerência de Habitação", y, 10, true);
      y -= 25;
      drawCentered("Assunto: Solicitação de Cancelamento de Avaliação/Cadastro SICAQ", y, 10, true);
      y -= 35;

      // Paragraph 1
      const p1a = "Eu, ";
      const p1aW = font.widthOfTextAtSize(p1a, 11);
      page.drawText(p1a, { x: margin, y, size: 11, font, color: textColor });
      if (cliente) {
        page.drawText(cliente, { x: margin + p1aW, y, size: 11, font: fontBold, color: rgb(0, 0, 0.5) });
      }
      const nameEndX = margin + p1aW + (cliente ? fontBold.widthOfTextAtSize(cliente, 11) : 0);
      page.drawLine({
        start: { x: nameEndX + 2, y: y - 2 },
        end: { x: width - margin, y: y - 2 },
        thickness: 0.5,
        color: rgb(0.3, 0.3, 0.3),
      });

      y -= 20;
      drawLine("inscrito(a) no CPF sob o nº ", cpf, y);

      y -= 20;
      drawLine("e RG nº ", rgValue, y);

      y -= 20;
      const wrapText = (text: string, maxWidth: number, f: typeof font, size: number) => {
        const words = text.split(" ");
        const lines: string[] = [];
        let current = "";
        for (const word of words) {
          const test = current ? current + " " + word : word;
          if (f.widthOfTextAtSize(test, size) > maxWidth) {
            lines.push(current);
            current = word;
          } else {
            current = test;
          }
        }
        if (current) lines.push(current);
        return lines;
      };

      const bodyText1 =
        "venho por meio desta solicitar formalmente o CANCELAMENTO DE TODAS AS AVALIAÇÕES DE RISCO DE CADASTROS realizados em meu nome no sistema SICAQ (CCA), vinculados ao Correspondente";
      const lines1 = wrapText(bodyText1, width - margin * 2, font, 11);
      for (const line of lines1) {
        page.drawText(line, { x: margin, y, size: 11, font, color: textColor });
        y -= 16;
      }

      // Correspondente anterior field
      drawLine("Correspondente ", corrAnterior + " (ANTERIOR).", y);
      y -= 28;

      const bodyText2 =
        "Declaro que desejo realizar a desvinculação da referida unidade/proposta para dar continuidade ao processo através de outro Correspondente Caixa Aqui ou agência física, sem impedimentos de nova avaliação.";
      const lines2 = wrapText(bodyText2, width - margin * 2, font, 11);
      for (const line of lines2) {
        page.drawText(line, { x: margin, y, size: 11, font, color: textColor });
        y -= 16;
      }
      y -= 12;

      const bodyText3 =
        "Estou ciente de que as avaliações no SICAQ têm prazo de validade (geralmente 180 dias) e que a alteração de dados pode resultar em necessidade de nova análise documental.";
      const lines3 = wrapText(bodyText3, width - margin * 2, font, 11);
      for (const line of lines3) {
        page.drawText(line, { x: margin, y, size: 11, font, color: textColor });
        y -= 16;
      }
      y -= 12;

      page.drawText("Solicito que este cancelamento seja efetivado com a maior brevidade possível.", {
        x: margin,
        y,
        size: 11,
        font,
        color: textColor,
      });
      y -= 40;

      // Local e Data
      const hoje = new Date();
      const meses = [
        "janeiro",
        "fevereiro",
        "março",
        "abril",
        "maio",
        "junho",
        "julho",
        "agosto",
        "setembro",
        "outubro",
        "novembro",
        "dezembro",
      ];
      const dataTexto = `${cidadeManual}, ${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}.`;
      drawCentered(dataTexto, y, 11, false);
      y -= 50;

      // Signature line
      page.drawLine({
        start: { x: margin + 60, y },
        end: { x: width - margin - 60, y },
        thickness: 0.5,
        color: textColor,
      });
      y -= 14;
      drawCentered("[Assinatura do Cliente]", y, 9, false);
      y -= 30;

      // Nome completo
      drawLine("[Nome Completo do Cliente] ", cliente, y);
      y -= 25;

      // Telefone
      drawLine("[Telefone de Contato] ", "", y);

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `CARTA_CANCELAMENTO_${cliente.replace(/\s+/g, "_") || "cliente"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao gerar Carta de Cancelamento:", err);
      alert("Erro ao gerar a Carta de Cancelamento. Tente novamente.");
    }
  };

  const handleClearForm = () => {
    if (isVisitor) {
      alert("Função disponível apenas para assinantes ativos.");
      return;
    }
    if (confirm("Deseja realmente limpar todos os dados do formulário?")) {
      setFields({
        infoEmp: adminData?.empName || "",
        infoCli: "",
        infoM2: "",
        infoAndar: "",
        infoApto: "",
        infoCons: adminData?.brokerName || "",
        infoCreci: adminData?.creci || "",
        infoCpf: "",
        avaliacao: "",
        lancamento: "",
        campanha: "",
        aprovacao: "",
        fgts: "",
        subsidio: "",
        casa: "",
        parcelaCaixa: "",
        percObras: "0",
        resultPercentual: "",
        atoCliente: "",
        sinal: "",
        intermediarias: "",
        chaves: "",
        parcInterm: "1",
        parcelasObras: "1",
        fluxoConstAdicional: "",
        nrParcelasFluxo: "1",
        documentos: "",
      });
      setResults({
        descLanc: 0,
        documentos: 0,
        beneficios: 0,
        totalAprov: 0,
        futuroCaixa: 0,
        entradaConstrutora: 0,
        atoClienteValor: 0,
        sinalValor: 0,
        fluxoObras: 0,
        valorIntermParc: 0,
        subtotal: 0,
        valorObras: 0,
        totalFluxoObrasConst: 0,
        percBeneficios: 0,
      });
      setLogoEmp(null);
    }
  };

  const [caixaWaiting, setCaixaWaiting] = useState(false);

  const handleCaixaSimulador = () => {
    setCaixaWaiting(true);
    alert("Consulte os valores e preencha o fechamento no SIMULADOR CORRETOR ELITE 4.0");
    window.open("https://simuladorhabitacao.caixa.gov.br/simulacao", "_blank");
  };

  return (
    <div
      className={`space-y-6 animate-fade-in ${isVisitor ? "[&_input]:pointer-events-none [&_input]:opacity-70 [&_textarea]:pointer-events-none [&_select]:pointer-events-none" : ""}`}
    >
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* MENU LATERAL ESQUERDO (Navegação Principal) */}
        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2 bg-card p-4 rounded-xl border border-border shadow-sm lg:sticky lg:top-4">
          <div className="pb-2 border-b border-border mb-2">
            <span className="text-[10px] font-black text-primary uppercase tracking-[2px]">NAVEGAÇÃO PRINCIPAL</span>
          </div>

          <button
            onClick={() => setSubTab("tecnica")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wider rounded-lg transition-all text-left ${
              subTab === "tecnica"
                ? "bg-[#002D72] text-white border-b-2 border-b-gold shadow-md"
                : "bg-[#F8FAFC] text-muted-foreground border border-border hover:bg-muted"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${subTab === "tecnica" ? "bg-gold" : "bg-muted-foreground/30"}`}></span>
            A - Simulação Técnica
          </button>

          <button
            onClick={() => setSubTab("sim40")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wider rounded-lg transition-all text-left ${
              subTab === "sim40"
                ? "bg-[#002D72] text-white border-b-2 border-b-gold shadow-md"
                : "bg-[#F8FAFC] text-muted-foreground border border-border hover:bg-muted"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${subTab === "sim40" ? "bg-gold" : "bg-muted-foreground/30"}`}></span>
            B - SIMULAÇÃO RÁPIDA 4.0
          </button>

          <button
            onClick={() => setSubTab("custom")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wider rounded-lg transition-all text-left ${
              subTab === "custom"
                ? "bg-[#002D72] text-white border-b-2 border-b-gold shadow-md"
                : "bg-[#F8FAFC] text-muted-foreground border border-border hover:bg-muted"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${subTab === "custom" ? "bg-gold" : "bg-muted-foreground/30"}`}></span>
            C - SIMULAÇÃO CUSTOM
          </button>

          <button
            onClick={() => {
              window.open("https://simuladorhabitacao.caixa.gov.br/simulacao", "_blank");
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-gold font-black uppercase tracking-wider rounded-lg transition-all text-left bg-[#F8FAFC] text-[#005ca9] border border-border hover:bg-[#005ca9]/10"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#005ca9]" />
            D - CAIXA SIMULAÇÃO
          </button>

          <div className="pb-2 border-b border-border mt-4 mb-2">
            <span className="text-[10px] font-black text-primary uppercase tracking-[2px]">NAVEGAÇÃO INTERATIVA</span>
          </div>

          <button
            onClick={handleNavigateToBloco4}
            className={`w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all text-left ${
              subTab === "tecnica" && dashboardOpen
                ? "bg-[#002D72]/10 text-[#002D72] border-l-4 border-l-gold shadow-sm"
                : "bg-[#F8FAFC] text-muted-foreground border border-border hover:bg-muted"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#002D72]" />
            Bloco 4: Dashboard Interativo (Gráficos e Indicadores)
          </button>

          <button
            onClick={handleNavigateToBloco5}
            className={`w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all text-left ${
              subTab === "tecnica" && docsPanelOpen
                ? "bg-[#002D72]/10 text-[#002D72] border-l-4 border-l-gold shadow-sm"
                : "bg-[#F8FAFC] text-muted-foreground border border-border hover:bg-muted"
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#002D72]" />
            Bloco 5: Documentos e Relatórios
          </button>
        </div>

        {/* PAINEL CENTRAL DE CONTEÚDO (Fluxo de Blocos) */}
        <div className="flex-1 w-full space-y-6">
          {/* DADOS DO EMPREENDIMENTO (Sempre no topo da área central de conteúdo) */}
          <div ref={contentRef} className="space-y-4">
            {/* Logo do Empreendimento - Colar */}
            <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b-2 border-gold/50">
                <h2 className="text-sm font-bold text-primary uppercase tracking-wide">Logo do Empreendimento</h2>
              </div>
              <div className="p-4 flex justify-center bg-[#F8FAFC]/50">
                {logoEmp ? (
                  <div className="relative">
                    <img
                      src={logoEmp}
                      alt="Logo Empreendimento"
                      className="w-24 h-24 object-contain rounded border border-border"
                    />
                    <button
                      onClick={() => setLogoEmp(null)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label
                    className="w-24 h-24 border-2 border-dashed border-gold/40 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gold/5 transition-colors"
                    onPaste={handleLogoPaste}
                    tabIndex={0}
                    onClick={(e) => (e.currentTarget as HTMLElement).focus()}
                  >
                    <Image className="w-6 h-6 text-gold/50 mb-1" />
                    <p className="text-[9px] text-muted-foreground text-center leading-tight font-medium">
                      Cole (Ctrl+V)
                      <br />
                      ou clique
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) processLogoFile(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Dados do Empreendimento */}
            <Section title="Dados do Empreendimento">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  placeholder="Empreendimento"
                  value={fields.infoEmp}
                  onChange={(v) => updateField("infoEmp", v)}
                />
                <Input placeholder="Cliente" value={fields.infoCli} onChange={(v) => updateField("infoCli", v)} />
                <Input
                  placeholder="Unidade / Apto"
                  value={fields.infoApto}
                  onChange={(v) => {
                    updateField("infoApto", v);
                    if (unidadeAutoFilled) setUnidadeAutoFilled({ ...unidadeAutoFilled, manual: true });
                  }}
                  onBlur={handleUnidadeLookup}
                  className={
                    unidadeAutoFilled?.manual
                      ? "border-amber-500"
                      : unidadeAutoFilled
                        ? "border-emerald-500"
                        : "border-border"
                  }
                />
                <Input
                  placeholder="Andar"
                  value={fields.infoAndar}
                  onChange={(v) => {
                    updateField("infoAndar", v);
                    if (unidadeAutoFilled) setUnidadeAutoFilled({ ...unidadeAutoFilled, manual: true });
                  }}
                  className={
                    unidadeAutoFilled?.manual
                      ? "border-amber-500"
                      : unidadeAutoFilled
                        ? "border-emerald-500"
                        : "border-border"
                  }
                />
                <Input placeholder="Unidade m²" value={fields.infoM2} onChange={(v) => updateField("infoM2", v)} />
                <Input placeholder="Consultor" value={fields.infoCons} onChange={(v) => updateField("infoCons", v)} />
                <Input
                  placeholder="CPF (somente para MO)"
                  value={fields.infoCpf}
                  onChange={(v) => updateField("infoCpf", v)}
                />
                <Input placeholder="CRECI/SP (000.000-F)" value={fields.infoCreci} onChange={handleCreci} />
              </div>
              {unidadeAutoFilled && (
                <p className={`text-[10px] mt-1 ${unidadeAutoFilled.manual ? "text-amber-600" : "text-emerald-600"}`}>
                  {unidadeAutoFilled.manual
                    ? "⚠ Valores ajustados manualmente (sobrescrevem a tabela oficial)."
                    : `✓ Tabela oficial · atualizada em ${unidadeAutoFilled.atualizado_em ? new Date(unidadeAutoFilled.atualizado_em).toLocaleDateString("pt-BR") : "—"}.`}
                </p>
              )}
            </Section>
          </div>

          {/* Sub-Tab: Simulação Rápida 4.0 */}
          {subTab === "sim40" && (
            <div className="bg-card rounded-lg border border-border p-4 shadow-sm animate-fade-in">
              <Simulacao40 />
            </div>
          )}

          {/* Sub-Tab: Simulação Custom */}
          {subTab === "custom" && (
            <div className="bg-card rounded-lg border border-border p-4 shadow-sm animate-fade-in">
              <SimulacaoCustom />
            </div>
          )}

          {/* Sub-Tab: Simulação Técnica (Sequência Vertical de Blocos de cima para baixo) */}
          {subTab === "tecnica" && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Box Informativo CAIXA - Topo */}
              <div className="bg-card rounded-lg border border-border p-3 flex flex-col sm:flex-row items-center gap-3">
                <p className="text-[10px] text-muted-foreground italic flex-1">
                  "Aqui está o seu plano de obras conosco. Faremos uma simulação para validarmos sua margem possível com o
                  banco. Aviso Legal: As condições apresentadas são simulações sujeitas à aprovação final e análise de
                  crédito. Para garantirmos essas condições, o próximo passo é a análise de crédito oficial, onde o banco
                  confirma a viabilidade da operação."
                </p>
                <a
                  href="https://simuladorhabitacao.caixa.gov.br/simulacao"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold uppercase whitespace-nowrap hover:opacity-90 transition-opacity"
                  style={{ background: "#005ca9", color: "#ffffff" }}
                >
                  <ExternalLink className="w-4 h-4" /> Simulador CAIXA
                </a>
              </div>

              {/* Bloco 1: Simulação Técnica (incluindo o subbloco CAIXA SIMULADOR) */}
              <div className="bg-card rounded-xl border border-border p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-primary/20 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-gold"></span>
                    <h3 className="text-sm font-extrabold text-primary uppercase tracking-wider">
                      Bloco 1: Simulação Técnica
                    </h3>
                  </div>
                  <button
                    onClick={handleCaixaSimulador}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase bg-[#005ca9] text-white hover:opacity-90 transition-opacity"
                  >
                    <ExternalLink className="w-3 h-3" /> CAIXA SIMULADOR
                  </button>
                </div>

                {caixaWaiting && (
                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 text-center animate-fade-in mb-3">
                    <p className="text-xs font-bold text-accent uppercase tracking-wider animate-pulse">
                      ⏳ Aguardando dados da simulação...
                    </p>
                    <button
                      onClick={() => setCaixaWaiting(false)}
                      className="text-[10px] text-muted-foreground underline mt-1 hover:text-foreground"
                    >
                      Já preenchi os dados
                    </button>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <CurrencyInput
                    label="Valor Avaliação CAIXA"
                    value={fields.avaliacao}
                    onChange={(v) => handleCurrencyInput("avaliacao", v)}
                  />
                  <CurrencyInput
                    label="Valor de Lançamento"
                    value={fields.lancamento}
                    onChange={(v) => handleCurrencyInput("lancamento", v)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <ResultField label="Desconto de Lançamento" value={formatCurrency(results.descLanc)} />
                  <CurrencyInput
                    label="Documentação + ITBI Grátis (4%)"
                    value={fields.documentos || formatCurrencyInput(String(Math.round(getDocumentosValue() * 100)))}
                    onChange={(v) => handleCurrencyInput("documentos", v)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <CurrencyInput
                    label="Desconto Campanha mês"
                    value={fields.campanha}
                    onChange={(v) => handleCurrencyInput("campanha", v)}
                  />
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-primary">Total Benefícios</label>
                      <label className="text-xs font-semibold text-primary">Percentual</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2.5 rounded-md border-l-4 bg-blue-50 border-l-gold text-primary text-sm font-bold">
                        {formatCurrency(results.beneficios)}
                      </div>
                      <span className="text-sm font-bold text-primary whitespace-nowrap">
                        {results.percBeneficios.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="pt-2 text-[10px] text-muted-foreground italic text-right border-t border-primary/10">
                  {dataSimulacao()}
                </div>
              </div>

              {/* Bloco 2: Simulação Portal CAIXA */}
              <div className="bg-card rounded-xl border border-border p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-primary/20 pb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-gold"></span>
                  <h3 className="text-sm font-extrabold text-primary uppercase tracking-wider">
                    Bloco 2: Simulação Portal CAIXA
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CurrencyInput
                    label="Simulação Simulador CAIXA (Financiamento)"
                    value={fields.aprovacao}
                    onChange={(v) => handleCurrencyInput("aprovacao", v)}
                  />
                  <CurrencyInput
                    label="Saldo do FGTS"
                    value={fields.fgts}
                    onChange={(v) => handleCurrencyInput("fgts", v)}
                  />
                  <CurrencyInput
                    label="Subsídio Gov. Federal"
                    value={fields.subsidio}
                    onChange={(v) => handleCurrencyInput("subsidio", v)}
                  />
                  <CurrencyInput
                    label="Subsídio Estadual (Casa Paulista)"
                    value={fields.casa}
                    onChange={(v) => handleCurrencyInput("casa", v)}
                  />
                </div>
                <ResultField label="Total Aprovação / Financiamento" value={formatCurrency(results.totalAprov)} className="mt-3 bg-blue-50/30" />

                <div className="flex items-center gap-2 border-b border-primary/20 pt-4 pb-2">
                  <span className="w-2 h-2 rounded-full bg-gold"></span>
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wide">
                    Parcela Aproximada CAIXA
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <CurrencyInput
                    label="Parcela futura Caixa (Primeira)"
                    value={fields.parcelaCaixa}
                    onChange={(v) => handleCurrencyInput("parcelaCaixa", v)}
                  />
                  <div>
                    <label className="block text-xs font-semibold text-primary mb-1">% Fase Obras (Aproximada)</label>
                    <select
                      value={fields.percObras}
                      onChange={(e) => updateField("percObras", e.target.value)}
                      className="w-full px-3 py-2.5 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold bg-[#F8FAFC]"
                    >
                      {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((v) => (
                        <option key={v} value={v}>
                          {v}%
                        </option>
                      ))}
                    </select>
                  </div>
                  <ResultField label="Valor Aprox. Fase Obras" value={formatCurrency(results.futuroCaixa)} />
                </div>
              </div>

              {/* Bloco 3: Entrada Construtora | Fluxo Pagamento */}
              <div className="bg-card rounded-xl border border-border p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-primary/20 pb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-gold"></span>
                  <h3 className="text-sm font-extrabold text-primary uppercase tracking-wider">
                    Bloco 3: Entrada Construtora | Fluxo Pagamento
                  </h3>
                </div>

                {/* Ato Cliente | Saldo Entrada | Sinal (%) | Sinal (R$) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative group">
                    <CurrencyInput
                      label="Ato Cliente"
                      value={fields.atoCliente}
                      onChange={(v) => handleCurrencyInput("atoCliente", v)}
                    />
                    <div className="absolute left-0 -top-8 z-50 hidden group-hover:flex group-focus-within:flex bg-amber-600 text-white text-[10px] font-semibold px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none">
                      ⚠️ Usar ato cliente se maior que sinal
                    </div>
                  </div>
                  <ResultField
                    label="Saldo Entrada"
                    value={formatCurrency(Math.max(0, results.entradaConstrutora - results.atoClienteValor))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-primary mb-1">Sinal (%)</label>
                    <input
                      type="number"
                      placeholder="%"
                      value={fields.resultPercentual}
                      onChange={(e) => updateField("resultPercentual", e.target.value)}
                      className="w-full px-3 py-2.5 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold bg-[#F8FAFC]"
                    />
                  </div>
                  <ResultField label="Sinal (R$)" value={formatCurrency(results.sinalValor)} />
                </div>

                {/* Fluxo Obras Const. + Adicional + Nº Parcelas + Total */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <ResultField label="Fluxo Obras Const." value={formatCurrency(results.fluxoObras)} success />
                  {(() => {
                    const saldoEntrada = Math.max(0, results.entradaConstrutora - results.atoClienteValor);
                    const bloqueado = results.atoClienteValor < saldoEntrada;
                    return (
                      <div
                        onClick={() => {
                          if (bloqueado) {
                            toast({
                              title: "Campo bloqueado",
                              description: "Ato Cliente deve ser maior ou igual ao Saldo Entrada para liberar este campo.",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <CurrencyInput
                          label="Fluxo Const. Adicional"
                          value={bloqueado ? "" : fields.fluxoConstAdicional}
                          onChange={(v) => !bloqueado && handleCurrencyInput("fluxoConstAdicional", v)}
                        />
                      </div>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-primary mb-1">Nº Parcelas</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="1"
                      value={fields.nrParcelasFluxo}
                      onChange={(e) => updateField("nrParcelasFluxo", e.target.value)}
                      className="w-full px-3 py-2.5 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold bg-[#F8FAFC]"
                    />
                  </div>
                  <ResultField label="Total fluxo obras" value={formatCurrency(results.totalFluxoObrasConst)} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <CurrencyInput
                    label="Total Intermediárias"
                    value={fields.intermediarias}
                    onChange={(v) => handleCurrencyInput("intermediarias", v)}
                  />
                  <div>
                    <label className="block text-xs font-semibold text-primary mb-1">Parcelamento Intermediárias</label>
                    <select
                      value={fields.parcInterm}
                      onChange={(e) => updateField("parcInterm", e.target.value)}
                      className="w-full px-3 py-2.5 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold bg-[#F8FAFC]"
                    >
                      {[1, 2, 3, 4, 5, 6].map((v) => (
                        <option key={v} value={v}>
                          {String(v).padStart(2, "0")}x
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <ResultField label="Valor Intermediárias" value={formatCurrency(results.valorIntermParc)} />
                  <CurrencyInput
                    label="Parcela Chaves"
                    value={fields.chaves}
                    onChange={(v) => handleCurrencyInput("chaves", v)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-border">
                  <div>
                    <label className="block text-[9px] font-semibold text-muted-foreground mb-1 uppercase">
                      Saldo Construtora
                    </label>
                    <div className="px-2 py-2.5 border border-border rounded-md text-xs font-bold text-primary bg-[#F8FAFC] truncate" title={formatCurrency(results.subtotal)}>
                      {formatCurrency(results.subtotal)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-muted-foreground mb-1 uppercase">
                      Plano (meses)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={fields.parcelasObras}
                      onChange={(e) => updateField("parcelasObras", e.target.value)}
                      className="w-full px-2 py-2.5 border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold bg-[#F8FAFC]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-muted-foreground mb-1 uppercase">
                      Valor Parcelas
                    </label>
                    <div className="px-2 py-2.5 border-2 border-gold/70 rounded-md text-xs font-bold text-primary bg-gold/5 truncate" title={formatCurrency(results.valorObras)}>
                      {formatCurrency(results.valorObras)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloco 4: Dashboard Interativo */}
              <div id="bloco-4-dashboard" className="bg-card rounded-xl border border-border p-5 space-y-4 shadow-sm scroll-mt-24">
                <div className="flex items-center justify-between border-b border-primary/20 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-gold"></span>
                    <h3 className="text-sm font-extrabold text-primary uppercase tracking-wider">
                      Bloco 4: Dashboard Interativo (Gráficos e Indicadores)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDashboardOpen(!dashboardOpen)}
                    className="p-1.5 px-3 bg-[#002D72]/5 hover:bg-[#002D72]/15 text-primary border border-[#002D72]/15 rounded-xl flex items-center gap-2 transition-all text-xs font-black uppercase tracking-wider"
                    aria-expanded={dashboardOpen}
                  >
                    <span>{dashboardOpen ? "Recolher" : "Expandir"}</span>
                    {dashboardOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
                {dashboardOpen && <DashboardInterativo fields={fields} results={results} />}
              </div>

              {/* Bloco 5: Documentos e Relatórios (posicionado na base da página) */}
              <div id="bloco-5-documentos" className="rounded-xl border-2 border-gold/40 bg-card overflow-hidden shadow-sm scroll-mt-24">
                <button
                  type="button"
                  onClick={() => setDocsPanelOpen(!docsPanelOpen)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-4 elite-gradient text-gold hover:opacity-95 transition-opacity"
                  aria-expanded={docsPanelOpen}
                >
                  <span className="flex items-center gap-2 font-bold uppercase tracking-wider text-sm text-secondary">
                    <FolderOpen className="w-4 h-4 text-gold" />
                    Bloco 5: Documentos e Relatórios
                  </span>
                  {docsPanelOpen ? <ChevronUp className="w-4 h-4 text-gold" /> : <ChevronDown className="w-4 h-4 text-gold" />}
                </button>

                {docsPanelOpen && (
                  <div className="p-4 space-y-4 bg-background/40">
                    {/* Relatórios */}
                    <div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-[2px] mb-2.5 px-1">
                        Relatórios
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handlePrint}
                          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-xs font-bold uppercase gold-gradient text-primary hover:opacity-90 transition-opacity"
                        >
                          <Printer className="w-4 h-4" /> Gerar PDF
                        </button>
                        <button
                          onClick={() => {
                            if (isVisitor) {
                              alert("Função disponível apenas para assinantes ativos.");
                              return;
                            }
                            setVencimentosOpen(true);
                          }}
                          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-xs font-bold uppercase bg-card text-primary border-2 border-gold hover:bg-gold/10 transition-colors"
                        >
                          <CalendarClock className="w-4 h-4" /> Gerar Vencimentos
                        </button>
                        <div className="relative col-span-2">
                          <button
                            onClick={() => setPrintMenuOpen(!printMenuOpen)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-xs font-bold uppercase bg-card text-primary border border-border hover:opacity-90 transition-opacity"
                          >
                            <Printer className="w-4 h-4" /> Gerar Relatório ▾
                          </button>
                          {printMenuOpen && (
                            <div className="absolute bottom-full mb-1 left-0 z-50 min-w-[220px] rounded-md border bg-popover p-1 shadow-lg">
                              <button
                                onClick={() => {
                                  setPrintMenuOpen(false);
                                  handlePrint();
                                }}
                                className="w-full text-left px-3 py-2 text-xs rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                              >
                                Modelo 01 — Padrão Elite
                              </button>
                              <button
                                onClick={() => {
                                  setPrintMenuOpen(false);
                                  handlePrintModelo02();
                                }}
                                className="w-full text-left px-3 py-2 text-xs rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                              >
                                Modelo 02 — Consultoria de Elite
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Envio */}
                    <div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-[2px] mb-2.5 px-1">Envio</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <button
                            onClick={handleWhatsApp}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-xs font-bold uppercase text-accent-foreground hover:opacity-90 transition-opacity"
                            style={{ background: "#25D366" }}
                          >
                            <Share2 className="w-4 h-4" /> WhatsApp
                          </button>
                          <button
                            onClick={() => setWaConnectOpen(true)}
                            title="Conectar WhatsApp por QR Code"
                            className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#128C7E] text-white border-2 border-card flex items-center justify-center hover:scale-110 transition-transform"
                          >
                            <QrCode className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={handleEmail}
                          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-xs font-bold uppercase text-accent-foreground hover:opacity-90 transition-opacity"
                          style={{ background: "#EA4335" }}
                        >
                          <Mail className="w-4 h-4" /> E-mail
                        </button>
                      </div>
                    </div>

                    {/* Documentos */}
                    <div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-[2px] mb-2.5 px-1">
                        Documentos
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handleDocsWhatsApp}
                          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-xs font-bold uppercase text-accent-foreground hover:opacity-90 transition-opacity"
                          style={{ background: "#34B7F1" }}
                        >
                          <FileText className="w-4 h-4" /> Documentos
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setDocMenuOpen(!docMenuOpen)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-xs font-bold uppercase hover:opacity-90 transition-opacity"
                            style={{ background: "#C5A028", color: "#0A192F" }}
                          >
                            <FileCheck className="w-4 h-4" /> Documentos CAIXA ▾
                          </button>
                          {docMenuOpen && (
                            <div className="absolute bottom-full mb-1 left-0 z-50 min-w-[220px] rounded-md border bg-popover p-1 shadow-lg">
                              <button
                                onClick={() => {
                                  setDocMenuOpen(false);
                                  handleDocumentosCaixa();
                                }}
                                className="w-full text-left px-3 py-2 text-xs rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                              >
                                1 - Ficha MO (Autorização de Pesquisa)
                              </button>
                              <button
                                onClick={() => {
                                  setDocMenuOpen(false);
                                  handleFichaCadastral();
                                }}
                                className="w-full text-left px-3 py-2 text-xs rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                              >
                                2 - Ficha Cadastral
                              </button>
                              <button
                                onClick={() => {
                                  setDocMenuOpen(false);
                                  handleCartaCancelamento();
                                }}
                                className="w-full text-left px-3 py-2 text-xs rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                              >
                                3 - Carta de Cancelamento
                              </button>
                              <button
                                onClick={() => {
                                  setDocMenuOpen(false);
                                  handleFichaCadastralEditavel();
                                }}
                                className="w-full text-left px-3 py-2 text-xs rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                              >
                                4 - Ficha Cadastral Padrão Editável
                              </button>
                              <button
                                onClick={() => {
                                  setDocMenuOpen(false);
                                  handleDeclaracaoParentesco();
                                }}
                                className="w-full text-left px-3 py-2 text-xs rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                              >
                                5 - Declaração de Parentesco
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Zona de risco */}
                    <div className="pt-2 border-t border-border">
                      <button
                        onClick={handleClearForm}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-xs font-bold uppercase bg-muted text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" /> Limpar Dados
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>

      <RelatorioVencimentos
        isOpen={vencimentosOpen}
        onClose={() => setVencimentosOpen(false)}
        mode="simulacao"
        simulacaoData={{
          entradaConstrutora: results.entradaConstrutora,
          atoClienteValor: results.atoClienteValor,
          sinalValor: results.sinalValor,
          intermediarias: parseCurrency(fields.intermediarias),
          parcInterm: parseInt(fields.parcInterm) || 1,
          valorIntermParc: results.valorIntermParc,
          chaves: parseCurrency(fields.chaves),
          valorObras: results.valorObras,
          parcelasObras: parseInt(fields.parcelasObras) || 1,
          fluxoObras: results.fluxoObras,
          fluxoConstAdicional: parseCurrency(fields.fluxoConstAdicional),
          totalFluxoObrasConst: results.totalFluxoObrasConst,
        }}
      />

      {waConnectOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setWaConnectOpen(false)}
        >
          <div className="relative max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setWaConnectOpen(false)}
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-card border-2 border-gold text-gold flex items-center justify-center hover:scale-110 transition-transform z-10"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
            <WhatsappQrCard />
          </div>
        </div>
      )}
    </div>
  );
}

interface DashboardInterativoProps {
  fields: any;
  results: any;
}

function DashboardInterativo({ fields, results }: DashboardInterativoProps) {
  const [chartType, setChartType] = useState<"pizza" | "barras">("pizza");
  const [activePreset, setActivePreset] = useState<"geral" | "beneficios" | "recursos" | "pagamentos" | "todos" | "custom">("geral");

  // States for "Comprometimento de Renda"
  const [rendaInput, setRendaInput] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("elite_sim_renda_cliente") || "";
  });

  const [vencInterm, setVencInterm] = useState<string>(() => {
    if (typeof window === "undefined") return "10/12/2026";
    return localStorage.getItem("elite_sim_venc_interm") || "10/12/2026";
  });

  const [vencChaves, setVencChaves] = useState<string>(() => {
    if (typeof window === "undefined") return "15/06/2027";
    return localStorage.getItem("elite_sim_venc_chaves") || "15/06/2027";
  });

  const [overrideValorInterm, setOverrideValorInterm] = useState<string>("");
  const [overrideValorChaves, setOverrideValorChaves] = useState<string>("");

  // Get current mapped metrics with their live values and customized colors
  const avaliacao = parseCurrency(fields.avaliacao) || 0;
  const lancamento = parseCurrency(fields.lancamento) || 0;
  const descLanc = results.descLanc || 0;
  const documentos = results.documentos || 0;
  const campanha = parseCurrency(fields.campanha) || 0;
  const totalBeneficios = results.beneficios || 0;
  
  const financiamento = parseCurrency(fields.aprovacao) || 0;
  const fgts = parseCurrency(fields.fgts) || 0;
  const subsidioFed = parseCurrency(fields.subsidio) || 0;
  const subsidioEst = parseCurrency(fields.casa) || 0;
  const totalAprov = results.totalAprov || 0;
  
  const atoCliente = results.atoClienteValor || 0;
  const entradaConstrutora = results.entradaConstrutora || 0;
  const saldoEntrada = Math.max(0, entradaConstrutora - atoCliente);
  const fluxoConstAdicional = parseCurrency(fields.fluxoConstAdicional) || 0;
  const totalFluxoObras = results.totalFluxoObrasConst || 0;
  const totalInterm = parseCurrency(fields.intermediarias) || 0;
  const valorInterm = results.valorIntermParc || 0;
  const saldoConst = results.subtotal || 0;
  const valorParcelas = results.valorObras || 0;
  const sinalValor = results.sinalValor || 0;
  const parcelaChaves = parseCurrency(fields.chaves) || 0;

  // Scalar values (non-monetary)
  const nrParcelasFluxo = fields.nrParcelasFluxo || "0";
  const parcIntermText = fields.parcInterm ? `${fields.parcInterm}x` : "0x";
  const planoMeses = fields.parcelasObras || "—";

  const allMetrics = [
    { id: "avaliacao", label: "Valor Avaliação", value: avaliacao, color: "#475569", group: "Imóvel" },
    { id: "lancamento", label: "Valor de Lançamento", value: lancamento, color: "#64748B", group: "Imóvel" },
    { id: "descLanc", label: "Desconto Lançamento", value: descLanc, color: "#C5A028", group: "Benefícios" },
    { id: "documentos", label: "Documentação ITBI", value: documentos, color: "#10B981", group: "Benefícios" },
    { id: "campanha", label: "Desconto Campanha", value: campanha, color: "#059669", group: "Benefícios" },
    { id: "totalBeneficios", label: "Total Benefício", value: totalBeneficios, color: "#D97706", group: "Benefícios", isHighlight: true },
    { id: "financiamento", label: "Simulador CAIXA (Financiamento)", value: financiamento, color: "#002D72", group: "Financiamento" },
    { id: "fgts", label: "Saldo do FGTS", value: fgts, color: "#005ca9", group: "Financiamento" },
    { id: "subsidio", label: "Subsídio Gov. Federal", value: subsidioFed, color: "#2563EB", group: "Financiamento" },
    { id: "casa", label: "Subsídio Estadual (Casa Paulista)", value: subsidioEst, color: "#3B82F6", group: "Financiamento" },
    { id: "atoCliente", label: "Ato Cliente", value: atoCliente, color: "#EA580C", group: "Construtora" },
    { id: "saldoEntrada", label: "Saldo Entrada", value: saldoEntrada, color: "#CA8A04", group: "Construtora" },
    { id: "fluxoConstAdicional", label: "Fluxo Const. Adicional", value: fluxoConstAdicional, color: "#FBBF24", group: "Construtora" },
    { id: "totalFluxoObras", label: "Total fluxo obras", value: totalFluxoObras, color: "#06B6D4", group: "Construtora" },
    { id: "sinalValor", label: "Sinal (R$)", value: sinalValor, color: "#F43F5E", group: "Construtora" },
    { id: "valorInterm", label: "Valor Intermediárias", value: valorInterm, color: "#7C3AED", group: "Construtora" },
    { id: "totalInterm", label: "Total Intermediárias", value: totalInterm, color: "#8B5CF6", group: "Construtora" },
    { id: "parcelaChaves", label: "Parcela Chaves", value: parcelaChaves, color: "#DB2777", group: "Construtora" },
    { id: "saldoConst", label: "Saldo Construtora", value: saldoConst, color: "#4B5563", group: "Construtora" },
    { id: "valorParcelas", label: "Valor Parcelas", value: valorParcelas, color: "#EC4899", group: "Construtora" },
  ];

  // Presets definition mapping
  const presetMapping: Record<string, string[]> = {
    geral: ["financiamento", "fgts", "subsidio", "casa", "saldoEntrada", "atoCliente", "sinalValor", "parcelaChaves"],
    beneficios: ["descLanc", "documentos", "campanha", "totalBeneficios"],
    recursos: ["financiamento", "fgts", "subsidio", "casa", "atoCliente", "saldoEntrada", "sinalValor", "parcelaChaves"],
    pagamentos: ["atoCliente", "saldoEntrada", "sinalValor", "totalFluxoObras", "totalInterm", "parcelaChaves", "saldoConst", "valorParcelas"],
    todos: allMetrics.map((m) => m.id),
  };

  const [selectedIds, setSelectedIds] = useState<string[]>(presetMapping.geral);

  // When preset is clicked, set its active IDs
  const handlePresetSelect = (p: typeof activePreset) => {
    setActivePreset(p);
    if (p !== "custom") {
      setSelectedIds(presetMapping[p]);
    }
  };

  const toggleMetric = (id: string) => {
    setActivePreset("custom");
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Filter out any selected metrics that have 0 value to clean up the chart
  const activeData = allMetrics
    .filter((m) => selectedIds.includes(m.id) && m.value > 0)
    .map((m) => ({
      name: m.label,
      value: m.value,
      color: m.color,
    }));

  const totalSum = activeData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Dynamic Selector Toolbar */}
      <div className="flex flex-col gap-4 bg-[#F8FAFC] p-4 rounded-xl border border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-black uppercase text-muted-foreground mr-1 tracking-wider">Filtros:</span>
            {[
              { id: "geral", label: "Geral" },
              { id: "recursos", label: "Recursos" },
              { id: "pagamentos", label: "Fluxo Pagto" },
              { id: "beneficios", label: "Benefícios" },
              { id: "todos", label: "Ver Tudo" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handlePresetSelect(p.id as any)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-all duration-200 border ${
                  activePreset === p.id
                    ? "bg-[#002D72] text-white border-primary shadow-sm"
                    : "bg-white text-muted-foreground hover:bg-muted border-border"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Chart Type Selector */}
          <div className="flex items-center bg-white p-1 rounded-lg border border-border self-start sm:self-auto">
            <button
              onClick={() => setChartType("pizza")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide transition-all ${
                chartType === "pizza"
                  ? "bg-gold text-[#0A192F] shadow-sm font-black"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              🍕 Donut
            </button>
            <button
              onClick={() => setChartType("barras")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide transition-all ${
                chartType === "barras"
                  ? "bg-gold text-[#0A192F] shadow-sm font-black"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              📊 Barras
            </button>
          </div>
        </div>

        {/* Dynamic Metric Toggles */}
        <div className="space-y-2 pt-2 border-t border-border/80">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Selecione valores personalizados no gráfico:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
            {allMetrics.map((m) => {
              const isSelected = selectedIds.includes(m.id);
              const isAvailable = m.value > 0;
              return (
                <button
                  key={m.id}
                  disabled={!isAvailable}
                  onClick={() => toggleMetric(m.id)}
                  className={`flex items-center justify-between text-[11px] px-2.5 py-2 rounded-lg border transition-all truncate text-left ${
                    !isAvailable
                      ? "opacity-40 cursor-not-allowed bg-slate-50 border-dashed"
                      : isSelected
                      ? "font-bold shadow-xs scale-[1.01]"
                      : "bg-white hover:bg-slate-50 text-muted-foreground"
                  }`}
                  style={{
                    borderColor: isSelected && isAvailable ? m.color : "rgb(226, 232, 240)",
                    borderWidth: isSelected ? "2px" : "1px",
                    background: isSelected && isAvailable ? `${m.color}12` : "white",
                  }}
                >
                  <span className="truncate flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: m.color }}
                    />
                    {m.label}
                  </span>
                  <span className="font-extrabold text-[10px] ml-1 shrink-0" style={{ color: isSelected ? m.color : "inherit" }}>
                    {isAvailable ? formatCurrency(m.value) : "—"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
        {totalSum === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-xs text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-primary/20 p-6">
            <BarChart3 className="w-8 h-8 text-gold animate-pulse mb-2" />
            <span className="font-bold uppercase tracking-wider mb-1 text-primary">Aguardando dados numéricos</span>
            <span>Preencha os valores nas seções acima para ativar o gráfico interativo de simulação.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Visual Chart Frame */}
            <div className="lg:col-span-7 h-64 w-full flex items-center justify-center relative bg-[#F8FAFC]/50 rounded-xl border border-border p-3">
              {chartType === "pizza" ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activeData}
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={activeData.length > 1 ? 3 : 0}
                        dataKey="value"
                      >
                        {activeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Central Text on Donut */}
                  <div className="absolute flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[9px] uppercase tracking-[1.5px] text-muted-foreground font-black">Soma Ativa</span>
                    <span className="text-sm font-black text-primary bg-white/80 px-2 py-0.5 rounded shadow-sm">{formatCurrency(totalSum)}</span>
                  </div>
                </>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activeData} margin={{ top: 15, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 9, fontWeight: "bold", fill: "#64748B" }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={45}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fontWeight: "semibold", fill: "#64748B" }}
                      tickFormatter={(v) => `R$ ${Math.round(v / 1000)}k`}
                      width={55}
                    />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {activeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Live Chart Legend & Mathematical Proportions */}
            <div className="lg:col-span-5 space-y-3">
              <div className="border-b border-border pb-2">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-0.5">Representação Ativa</span>
                <span className="text-xs text-muted-foreground">Proporções dinâmicas dos valores ativos no gráfico atual:</span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {activeData.map((item, index) => {
                  const pct = totalSum > 0 ? (item.value / totalSum) * 100 : 0;
                  return (
                    <div key={index} className="flex flex-col gap-0.5 p-2 rounded bg-[#F8FAFC] border border-border/60 hover:bg-white transition-colors">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5 truncate">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="truncate text-[11px] text-primary">{item.name}</span>
                        </span>
                        <span className="text-primary font-bold text-[11px] font-mono shrink-0">{formatCurrency(item.value)}</span>
                      </div>
                      {/* Percent status bar */}
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground min-w-[32px] text-right">{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Extra Highlight Badges (Total Benefício em Destaque & Secondary Metrics) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* TOTAL BENEFÍCIO EM DESTAQUE */}
        <div className="md:col-span-2 rounded-xl p-4 bg-emerald-50 border-2 border-emerald-500/40 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-800">Total Benefício em Destaque</span>
            <p className="text-lg font-black text-emerald-700 font-mono tracking-tight">{formatCurrency(totalBeneficios)}</p>
            <p className="text-[10px] text-emerald-600/90 font-medium">Soma de descontos de lançamento, campanha e benefícios de documentações.</p>
          </div>
          <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-600 text-lg">
            💎
          </div>
        </div>

        {/* Nº PARCELAS DO FLUXO */}
        <div className="rounded-xl p-4 bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#002D72]">Nº Parcelas Fluxo</span>
            <p className="text-lg font-black text-[#002D72]">{nrParcelasFluxo} parcelas</p>
            <p className="text-[10px] text-muted-foreground">Frequência mensal do fluxo de obras</p>
          </div>
          <div className="bg-[#002D72]/5 p-2 rounded-lg text-[#002D72] text-sm font-bold">
            {nrParcelasFluxo}x
          </div>
        </div>

        {/* INTERMEDIÁRIAS */}
        <div className="rounded-xl p-4 bg-purple-50 border border-purple-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-purple-800">Pagtos Intermediários</span>
            <p className="text-lg font-black text-purple-700">{parcIntermText}</p>
            <p className="text-[10px] text-purple-600">Reflete parcelamentos maiores no decorrer das obras</p>
          </div>
          <div className="bg-purple-100 p-2 rounded-lg text-purple-800 text-xs font-extrabold uppercase">
            {parcIntermText}
          </div>
        </div>

        {/* PLANO DE MESES (CONSTRUTORA) */}
        <div className="rounded-xl p-4 bg-amber-50 border border-amber-200 flex items-center justify-between md:col-start-1 md:col-span-2">
          <div className="space-y-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-800">Plano Construtora (meses)</span>
            <p className="text-lg font-black text-amber-700">{planoMeses} meses</p>
            <p className="text-[10px] text-amber-600">Tempo de vigência acordado no plano de parcelamento estruturado</p>
          </div>
          <div className="bg-amber-100 p-2.5 rounded-xl text-amber-700 text-base font-bold">
            📅
          </div>
        </div>

        {/* VALOR PARCELAS (CONSTRUTORA) */}
        <div className="rounded-xl p-4 bg-pink-50 border-2 border-pink-400/40 flex items-center justify-between md:col-span-2">
          <div className="space-y-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-pink-800">Valor das Parcelas</span>
            <p className="text-lg font-black text-pink-700 font-mono">{formatCurrency(valorParcelas)}</p>
            <p className="text-[10px] text-pink-600">Encargo mensal estimado a ser quitado com a construtora</p>
          </div>
          <div className="bg-pink-100 p-2.5 rounded-xl text-pink-700 text-base font-bold">
            📄
          </div>
        </div>
      </div>

      {/* SEÇÃO: COMPROMETIMENTO DE RENDA DO CLIENTE */}
      <div className="mt-8 bg-[#0B192F] text-white rounded-2xl p-5 border border-[#1E3A8A]/50 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[#C5A010]/20 rounded-lg shrink-0">
            <BarChart3 className="w-5 h-5 text-[#C5A059]" />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-white">💰 Comprometimento de Renda</h4>
            <p className="text-[11px] text-slate-300">Monitore a saúde financeira do cliente simulando o impacto real das parcelas por vencimento.</p>
          </div>
        </div>

        {(() => {
          const rendaCalculada = parseCurrency(rendaInput) || 0;
          const instValueCalc = valorParcelas;
          const intermValueCalc = overrideValorInterm ? parseCurrency(overrideValorInterm) : valorInterm;
          const chavesValueCalc = overrideValorChaves ? parseCurrency(overrideValorChaves) : (parseCurrency(fields.chaves) || 0);

          const instPct = rendaCalculada > 0 ? (instValueCalc / rendaCalculada) * 100 : 0;
          const intermTotalCalc = intermValueCalc + instValueCalc;
          const intermPct = rendaCalculada > 0 ? (intermTotalCalc / rendaCalculada) * 100 : 0;
          const chavesTotalCalc = chavesValueCalc + instValueCalc;
          const chavesPct = rendaCalculada > 0 ? (chavesTotalCalc / rendaCalculada) * 100 : 0;

          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Inputs Section */}
              <div className="lg:col-span-4 bg-[#112240] p-4 rounded-xl border border-slate-700/60 space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-[#C5A059] tracking-widest mb-1.5">Renda do Cliente</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">R$</span>
                    <input
                      type="text"
                      placeholder="Ex: R$ 5.000,00"
                      value={rendaInput}
                      onChange={(e) => {
                        const formatted = formatCurrencyInput(e.target.value);
                        setRendaInput(formatted);
                        localStorage.setItem("elite_sim_renda_cliente", formatted);
                      }}
                      className="w-full bg-[#0A192F] text-white font-extrabold text-sm rounded-lg pl-9 pr-3 py-1.5 border border-slate-600 focus:outline-none focus:border-[#C5A059] transition-colors font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-700/70">
                  <label className="block text-[9px] font-black uppercase text-[#C5A059] tracking-widest mb-1.5">📅 Vencimento Intermediárias</label>
                  <input
                    type="text"
                    placeholder="Ex: 10/12/2026"
                    value={vencInterm}
                    onChange={(e) => {
                      setVencInterm(e.target.value);
                      localStorage.setItem("elite_sim_venc_interm", e.target.value);
                    }}
                    className="w-full bg-[#0A192F] text-white text-xs rounded-lg px-3 py-1.5 border border-slate-600 focus:outline-none focus:border-[#C5A059] transition-colors"
                  />
                  <label className="block text-[9px] font-black uppercase text-slate-400 tracking-widest mt-2 mb-1">Valor Intermediária</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1.5 text-[11px] text-slate-400 font-bold">R$</span>
                    <input
                      type="text"
                      placeholder={formatCurrency(valorInterm)}
                      value={overrideValorInterm}
                      onChange={(e) => {
                        const formatted = formatCurrencyInput(e.target.value);
                        setOverrideValorInterm(formatted);
                      }}
                      className="w-full bg-[#0A192F] text-white font-bold text-xs rounded-lg pl-9 pr-3 py-1 border border-slate-600 focus:outline-none focus:border-[#C5A059] transition-colors font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-700/70">
                  <label className="block text-[9px] font-black uppercase text-[#C5A059] tracking-widest mb-1.5">🔑 Vencimento Chaves</label>
                  <input
                    type="text"
                    placeholder="Ex: 15/06/2027"
                    value={vencChaves}
                    onChange={(e) => {
                      setVencChaves(e.target.value);
                      localStorage.setItem("elite_sim_venc_chaves", e.target.value);
                    }}
                    className="w-full bg-[#0A192F] text-white text-xs rounded-lg px-3 py-1.5 border border-slate-600 focus:outline-none focus:border-[#C5A059] transition-colors"
                  />
                  <label className="block text-[9px] font-black uppercase text-slate-400 tracking-widest mt-2 mb-1">Valor Parcela Chaves</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1.5 text-[11px] text-slate-400 font-bold">R$</span>
                    <input
                      type="text"
                      placeholder={formatCurrency(parseCurrency(fields.chaves) || 0)}
                      value={overrideValorChaves}
                      onChange={(e) => {
                        const formatted = formatCurrencyInput(e.target.value);
                        setOverrideValorChaves(formatted);
                      }}
                      className="w-full bg-[#0A192F] text-white font-bold text-xs rounded-lg pl-9 pr-3 py-1 border border-slate-600 focus:outline-none focus:border-[#C5A059] transition-colors font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Calculations & Results Metrics */}
              <div className="lg:col-span-8 space-y-4">
                {rendaCalculada === 0 ? (
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 bg-[#112240] rounded-xl border border-dashed border-slate-700/80">
                    <span className="text-3xl mb-3">💸</span>
                    <span className="text-xs font-black uppercase tracking-wider text-[#C5A059]">Insira a renda mensal do cliente</span>
                    <p className="text-[11px] text-slate-400 max-w-sm mt-1.5">Informe a renda do cliente à esquerda para demonstrar as proporções reais de comprometimento das parcelas.</p>
                  </div>
                ) : (
                  <div className="space-y-5 bg-[#112240] p-5 rounded-xl border border-slate-700/60">
                    {/* Metric Renda em Destaque */}
                    <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                      <div>
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Renda Declarada</span>
                        <span className="text-2xl font-extrabold text-[#C5A059] font-mono">{formatCurrency(rendaCalculada)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-0.5">Status Geral</span>
                        <span className={`text-[10px] uppercase font-black px-3 py-1 rounded-full ${
                          instPct <= 30 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-400/20" :
                          instPct <= 45 ? "bg-amber-500/10 text-amber-400 border border-amber-400/20" :
                          "bg-rose-500/10 text-rose-400 border border-rose-400/20"
                        }`}>
                          {instPct <= 30 ? "Margem Segura ✓" : instPct <= 45 ? "Atenção ⚠️" : "Alto Risco 🚨"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {/* Item 1: Valor das Parcelas Padrão (Mensal) */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-200">1. Parcelas Mensais da Construtora</span>
                          <span className="font-mono text-slate-100">{formatCurrency(instValueCalc)} / Mês</span>
                        </div>
                        {/* Progress Bar & Indicators */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                instPct <= 30 ? "bg-emerald-500" : instPct <= 45 ? "bg-amber-500" : "bg-rose-500"
                              }`}
                              style={{ width: `${Math.min(instPct, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-black min-w-[45px] text-right ${
                            instPct <= 30 ? "text-emerald-400" : instPct <= 45 ? "text-amber-400" : "text-rose-400"
                          }`}>
                            {instPct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex justify-between">
                          <span>Impacto sobre a renda mensal recorrente.</span>
                          {instPct > 30 && <span className="text-amber-400 font-medium font-bold">Ideal compor renda familiar.</span>}
                        </div>
                      </div>

                      {/* Item 2: Intermediária Vencimento + Parcela */}
                      <div className="space-y-1.5 pt-4 border-t border-slate-700/60">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-200">2. Mês com Intermediária</span>
                            {vencInterm && (
                              <span className="text-[9px] font-black text-[#C5A059] bg-[#C5A010]/20 px-1.5 py-0.5 rounded border border-[#C5A059]/20">Venc. {vencInterm}</span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-slate-100">{formatCurrency(intermTotalCalc)}</span>
                            <p className="text-[9px] text-slate-400 font-medium">({formatCurrency(intermValueCalc)} interm. + {formatCurrency(instValueCalc)} parc.)</p>
                          </div>
                        </div>
                        {/* Progress Bar & Indicators */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                intermPct <= 30 ? "bg-emerald-500" : intermPct <= 45 ? "bg-amber-500" : "bg-rose-500"
                              }`}
                              style={{ width: `${Math.min(intermPct, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-black min-w-[45px] text-right ${
                            intermPct <= 30 ? "text-emerald-400" : intermPct <= 45 ? "text-amber-400" : "text-rose-400"
                          }`}>
                            {intermPct.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Impacto acumulado no mês de vencimento da parcela intermediária somada à parcela normal.
                        </p>
                      </div>

                      {/* Item 3: Parcela Chaves + Parcela */}
                      <div className="space-y-1.5 pt-4 border-t border-slate-700/60">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-200">3. Mês da Parcela Chaves</span>
                            {vencChaves && (
                              <span className="text-[9px] font-black text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">Venc. {vencChaves}</span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-slate-100">{formatCurrency(chavesTotalCalc)}</span>
                            <p className="text-[9px] text-slate-400 font-medium">({formatCurrency(chavesValueCalc)} chaves + {formatCurrency(instValueCalc)} parc.)</p>
                          </div>
                        </div>
                        {/* Progress Bar & Indicators */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                chavesPct <= 30 ? "bg-emerald-500" : chavesPct <= 45 ? "bg-amber-500" : "bg-rose-500"
                              }`}
                              style={{ width: `${Math.min(chavesPct, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-black min-w-[45px] text-right ${
                            chavesPct <= 30 ? "text-emerald-400" : chavesPct <= 45 ? "text-amber-400" : "text-rose-400"
                          }`}>
                            {chavesPct.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Impacto acumulado no mês da parcela das chaves de entrega somada à parcela normal.
                        </p>
                      </div>
                    </div>

                    {/* Info Disclaimer Alert */}
                    <div className="mt-3 p-3.5 rounded-lg bg-blue-500/10 text-slate-300 text-[11px] border border-blue-500/20 flex gap-2">
                      <span className="text-sm shrink-0">💡</span>
                      <div>
                        <span className="font-bold text-blue-300">Dica do Elite:</span> O comprometimento financeiro ideal em parcelas mensais imobiliárias é de até <span className="font-bold text-white">30% da renda familiar total</span> para garantir a segurança no fluxo de obras do cliente.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// Sub-components
function Section({
  title,
  subtitle,
  children,
  headerExtra,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  headerExtra?: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-lg border border-primary/20 overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between px-4 py-3 elite-gradient border-b border-gold gap-2 flex-wrap">
        <h2 className="text-xs font-bold text-gold uppercase tracking-wider">{title}</h2>
        {headerExtra}
        {subtitle && <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider">{subtitle}</span>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Input({
  placeholder,
  value,
  onChange,
  onBlur,
  className,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  className?: string;
}) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className={`w-full px-3 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold bg-card ${className || "border-border"}`}
    />
  );
}

function CurrencyInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-primary mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold bg-card"
      />
    </div>
  );
}

function ResultField({
  label,
  value,
  highlight,
  success,
  large,
  className,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  success?: boolean;
  large?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-primary mb-1">{label}</label>
      <div
        className={`px-3 py-2.5 rounded-md border-l-4 text-sm font-bold
        ${highlight ? "bg-blue-50 border-l-gold text-primary" : ""}
        ${success ? "bg-green-50 border-l-success text-success" : ""}
        ${!highlight && !success ? "bg-muted border-l-gold/50 text-primary" : ""}
        ${large ? "text-lg" : ""}
      `}
      >
        {value}
      </div>
    </div>
  );
}
