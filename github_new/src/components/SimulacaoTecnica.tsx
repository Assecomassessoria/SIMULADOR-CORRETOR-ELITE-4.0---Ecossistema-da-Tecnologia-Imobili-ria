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
} from "lucide-react";
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
      {/* Sub-Tab: Simulação Técnica */}
      {subTab === "tecnica" && (
        <>
          {/* CAIXA Simulator Link - Topo */}
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

          <div ref={contentRef}>
            {/* Logo do Empreendimento - Colar */}
            <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm mb-4">
              <div className="flex items-center justify-between px-4 py-3 border-b-2 border-gold/50">
                <h2 className="text-sm font-bold text-primary uppercase tracking-wide">Logo do Empreendimento</h2>
              </div>
              <div className="p-4 flex justify-center">
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
                    <p className="text-[9px] text-muted-foreground text-center leading-tight">
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
        </>
      )}

      {/* Sub-Tab Navigation */}
      <div className="flex rounded-lg overflow-hidden border border-border shadow-sm">
        <button
          onClick={() => setSubTab("tecnica")}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
            subTab === "tecnica" ? "elite-gradient text-secondary" : "bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          Simulação Técnica
        </button>
        <button
          onClick={() => setSubTab("sim40")}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
            subTab === "sim40" ? "elite-gradient text-secondary" : "bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          SIMULAÇÃO RÁPIDA 4.0
        </button>
        <button
          onClick={() => setSubTab("custom")}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
            subTab === "custom" ? "elite-gradient text-secondary" : "bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          SIMULAÇÃO CUSTOM
        </button>
        <button
          onClick={() => {
            window.open("https://simuladorhabitacao.caixa.gov.br/simulacao", "_blank");
          }}
          className="flex-1 py-3 text-xs font-bold uppercase tracking-wider bg-card text-muted-foreground hover:bg-muted transition-all"
        >
          CAIXA SIMULAÇÃO
        </button>
      </div>

      {/* Sub-Tab: Simulação 4.0 */}
      {subTab === "sim40" && <Simulacao40 />}

      {/* Sub-Tab: Simulação Custom */}
      {subTab === "custom" && <SimulacaoCustom />}

      {/* Sub-Tab: Simulação Técnica - continued */}
      {subTab === "tecnica" && (
        <>
          {/* Simulação Técnica */}
          <Section
            title="Simulação Técnica"
            subtitle={dataSimulacao()}
            headerExtra={
              <button
                onClick={handleCaixaSimulador}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase hover:opacity-90 transition-opacity"
                style={{ background: "#005ca9", color: "#ffffff" }}
              >
                <ExternalLink className="w-3 h-3" /> CAIXA SIMULADOR
              </button>
            }
          >
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
                  <label className="text-xs font-semibold text-primary">Total de Benefícios Construtora</label>
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
          </Section>

          {/* Simulação Portal CAIXA */}
          <Section title="Simulação Portal CAIXA">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CurrencyInput
                label="Simulação Simulador CAIXA"
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
                label="Subsídio Estadual"
                value={fields.casa}
                onChange={(v) => handleCurrencyInput("casa", v)}
              />
            </div>
            <ResultField label="Total Aprovação" value={formatCurrency(results.totalAprov)} className="mt-3" />
          </Section>

          {/* Parcela Aproximada CAIXA */}
          <Section title="Parcela Aproximada CAIXA">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <CurrencyInput
                label="Parcela futura Caixa"
                value={fields.parcelaCaixa}
                onChange={(v) => handleCurrencyInput("parcelaCaixa", v)}
              />
              <div>
                <label className="block text-xs font-semibold text-primary mb-1">% Fase Obras (Aproximada)</label>
                <select
                  value={fields.percObras}
                  onChange={(e) => updateField("percObras", e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold bg-card"
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
          </Section>

          {/* Entrada Construtora */}
          <Section title="Entrada Construtora | Proposta Fluxo Pagamento">
            {/* Ato Cliente | Saldo Entrada | Sinal (%) | Sinal (R$) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
              <div>
                <label className="block text-xs font-semibold text-primary mb-1">Sinal (%)</label>
                <input
                  type="number"
                  placeholder="%"
                  value={fields.resultPercentual}
                  onChange={(e) => updateField("resultPercentual", e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold bg-card"
                />
              </div>
              <ResultField label="Sinal (R$)" value={formatCurrency(results.sinalValor)} />
            </div>

            {/* Fluxo Obras Const. + Adicional + Nº Parcelas + Total */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
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
              <div>
                <label className="block text-xs font-semibold text-primary mb-1">Nº Parcelas</label>
                <input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={fields.nrParcelasFluxo}
                  onChange={(e) => updateField("nrParcelasFluxo", e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold bg-card"
                />
              </div>
              <ResultField label="Total Fluxo Obras Const." value={formatCurrency(results.totalFluxoObrasConst)} />
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
                  className="w-full px-3 py-2.5 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold bg-card"
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
              <ResultField label="Valor Parcelas Intermediárias" value={formatCurrency(results.valorIntermParc)} />
              <CurrencyInput
                label="Parcela Chaves"
                value={fields.chaves}
                onChange={(v) => handleCurrencyInput("chaves", v)}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 mt-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">
                  Saldo Parcelas Construtora
                </label>
                <div className="px-3 py-2.5 border border-border rounded-md text-sm font-bold text-primary bg-card">
                  {formatCurrency(results.subtotal)}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">
                  Plano Parcelas (meses)
                </label>
                <input
                  type="number"
                  min={1}
                  value={fields.parcelasObras}
                  onChange={(e) => updateField("parcelasObras", e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold bg-card"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">
                  Valor das Parcelas
                </label>
                <div className="px-3 py-2.5 border-2 border-gold/70 rounded-md text-sm font-bold text-primary bg-gold/5">
                  {formatCurrency(results.valorObras)}
                </div>
              </div>
            </div>
          </Section>
        </>
      )}

      {/* Painel Documentos e Relatórios - colapsável */}
      <div className="rounded-lg border-2 border-gold/40 bg-card overflow-hidden">
        <button
          type="button"
          onClick={() => setDocsPanelOpen(!docsPanelOpen)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 elite-gradient text-gold hover:opacity-95 transition-opacity"
          aria-expanded={docsPanelOpen}
        >
          <span className="flex items-center gap-2 font-bold uppercase tracking-wider text-sm">
            <FolderOpen className="w-4 h-4" />
            Documentos e Relatórios
          </span>
          {docsPanelOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {docsPanelOpen && (
          <div className="p-3 space-y-3 bg-background/40">
            {/* Relatórios */}
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[2px] mb-1.5 px-1">
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
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[2px] mb-1.5 px-1">Envio</p>
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
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[2px] mb-1.5 px-1">
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
    <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-gold/50 gap-2 flex-wrap">
        <h2 className="text-sm font-bold text-primary uppercase tracking-wide">{title}</h2>
        {headerExtra}
        {subtitle && <span className="text-xs text-muted-foreground font-semibold">{subtitle}</span>}
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
