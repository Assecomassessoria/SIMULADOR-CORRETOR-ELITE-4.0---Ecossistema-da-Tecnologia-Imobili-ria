import { useState, useEffect } from "react";
import { Printer, CalendarClock, X, Send, ChevronRight } from "lucide-react";
import { formatCurrency, AdminData } from "@/lib/eliteUtils";
import RelatorioVencimentos from "@/components/RelatorioVencimentos";

interface ProSolutoProps {
  adminData?: AdminData;
  isVisitor?: boolean;
}

export default function ProSoluto({ adminData, isVisitor = false }: ProSolutoProps) {
  const [cadastro, setCadastro] = useState({
    empreendimento: "",
    cliente: "",
    unidade: "",
    andar: "",
    apto: "",
    consultor: "",
    creci: "",
  });

  const updateCadastro = (key: string, val: string) => setCadastro((prev) => ({ ...prev, [key]: val }));

  const [base, setBase] = useState({
    avalCaixa: 0,
    valLanc: 0,
    descConst: 0,
    subsidio: 0,
    casaPaulist: 0,
    totalFin: 0,
    itbiRegistro: 0, // editable ITBI+Registro override; 0 = auto (4%)
    itbiManual: false, // flag if user manually edited
  });

  const [op1, setOp1] = useState({ pSinal: 5, vInter: 0, qInter: 3, vChaves: 0, qObras: 36 });
  const [op2, setOp2] = useState({ pSinal: 5, vInter: 0, qInter: 3, vChaves: 0, pMaxPos: 5, qObras: 36, qPos: 24 });
  const [op3, setOp3] = useState({
    renda: 0,
    parcCaixa: 0,
    percComp: 20,
    pSinal: 5,
    vInter: 0,
    qInter: 3,
    vChaves: 0,
    qObras: 36,
    pPos: 5,
    qPos: 24,
  });
  const [op4, setOp4] = useState({
    renda: 0,
    parcCaixa: 0,
    percComp: 20,
    pSinal: 5,
    vInter: 0,
    qInter: 3,
    vChaves: 0,
    qObras: 36,
    pPos: 5,
    qPos: 24,
  });

  const f = formatCurrency;

  const [vencimentosOpen, setVencimentosOpen] = useState(false);
  const [vencimentosOpcao, setVencimentosOpcao] = useState(1);
  const [expandedOption, setExpandedOption] = useState<1 | 2 | 3 | 4 | null>(null);

  // ESC fecha o overlay
  useEffect(() => {
    if (expandedOption === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setExpandedOption(null); };
    window.addEventListener("keydown", onKey);
    // bloqueia scroll do body
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [expandedOption]);

  // Base calculations
  const entrada = base.valLanc - base.descConst - base.subsidio - base.casaPaulist - base.totalFin;
  const itbi = base.itbiManual ? base.itbiRegistro : base.valLanc * 0.04;
  const percImovel = base.valLanc > 0 ? ((entrada / base.valLanc) * 100).toFixed(3) : "0.000";

  // Op1
  const vSinal1 = (base.valLanc - base.descConst) * (op1.pSinal / 100);
  const pInter1 = op1.qInter > 0 ? op1.vInter / op1.qInter : 0;
  const saldoObras1 = entrada - vSinal1 - op1.vInter - op1.vChaves;
  const mensal1 = op1.qObras > 0 ? saldoObras1 / op1.qObras : 0;

  // Op2
  const vSinal2 = (base.valLanc - base.descConst) * (op2.pSinal / 100);
  const o2VTotalPos = (base.valLanc - base.descConst) * (op2.pMaxPos / 100);
  const o2PInter = op2.qInter > 0 ? op2.vInter / op2.qInter : 0;
  const o2SaldoObras = entrada - vSinal2 - op2.vInter - op2.vChaves - o2VTotalPos;
  const o2MObras = op2.qObras > 0 ? o2SaldoObras / op2.qObras : 0;
  const o2MPos = op2.qPos > 0 ? o2VTotalPos / op2.qPos : 0;
  const o2Status =
    op2.pMaxPos > 5
      ? { text: "APROVADO | CONSULTOR ADM/GERÊNCIA", color: "success" as const }
      : { text: "APROVADO | CONSULTOR ADM", color: "success" as const };

  // Op3
  const sug3 = op3.renda * (op3.percComp / 100);
  const vSinal3 = (base.valLanc - base.descConst) * (op3.pSinal / 100);
  const pInter3 = op3.qInter > 0 ? op3.vInter / op3.qInter : 0;
  const saldoObraPos3 = entrada - vSinal3 - op3.vInter - op3.vChaves;
  const vTotalPos3 = (base.valLanc - base.descConst) * (op3.pPos / 100);
  const mPos3 = op3.qPos > 0 ? vTotalPos3 / op3.qPos : 0;
  const saldoSoObras3 = saldoObraPos3 - vTotalPos3;
  const mObras3 = op3.qObras > 0 ? saldoSoObras3 / op3.qObras : 0;
  const o3ParcCaixaMaisSug = op3.parcCaixa + sug3;
  const o3RendaExcedida = op3.renda > 0 && o3ParcCaixaMaisSug > op3.renda * 0.5;
  const o3Status =
    op3.renda === 0
      ? { text: "INFORME A RENDA BRUTA PARA VALIDAÇÃO", color: "warning" as const }
      : o3RendaExcedida
        ? { text: "PARC. CAIXA + SUGERIDA ACIMA DE 50% DA RENDA", color: "destructive" as const }
        : mPos3 <= sug3 + 0.01
          ? { text: "APROVADO | CONSULTOR ADM/GERENCIA", color: "success" as const }
          : { text: "REVISAR FLUXO (ACIMA DA RENDA PERMITIDA)", color: "destructive" as const };

  // Op4
  const sug4 = op4.renda * (op4.percComp / 100);
  const vSinal4 = (base.valLanc - base.descConst) * (op4.pSinal / 100);
  const pPos4 = op4.pPos / 100;
  const vTotalPos4 = (base.valLanc - base.descConst) * pPos4;
  const mPos4 = op4.qPos > 0 ? vTotalPos4 / op4.qPos : 0;
  const saldoObraEPas4 = entrada - vSinal4 - op4.vInter - op4.vChaves;
  const mObras4 = op4.qObras > 0 ? (saldoObraEPas4 - vTotalPos4) / op4.qObras : 0;
  const o4ParcCaixaMaisSug = op4.parcCaixa + sug4;
  const o4RendaExcedida = op4.renda > 0 && o4ParcCaixaMaisSug > op4.renda * 0.5;
  const o4Status =
    op4.renda === 0
      ? { text: "INFORME A RENDA BRUTA PARA VALIDAÇÃO", color: "warning" as const }
      : o4RendaExcedida
        ? { text: "PARC. CAIXA + SUGERIDA ACIMA DE 50% DA RENDA", color: "destructive" as const }
        : mPos4 > sug4 + 0.01
          ? { text: "REPROVADO | PARCELA PÓS ACIMA DO PERMITIDO", color: "destructive" as const }
          : { text: "APROVADO | CONSULTOR ADM/GERENCIA", color: "success" as const };

  const updateBase = (key: string, val: number) => setBase((prev) => ({ ...prev, [key]: val }));

  const printOption = (
    title: string,
    rows: { label: string; value: string }[],
    statusText?: string,
    statusColor?: string,
  ) => {
    if (isVisitor) {
      alert("Função disponível apenas para assinantes ativos.");
      return;
    }
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = rows
      .map(
        (r) => `
      <tr>
        <td class="label">${r.label}</td>
        <td class="value">${r.value}</td>
      </tr>
    `,
      )
      .join("");

    const statusHtml = statusText
      ? `
      <div style="margin-top:12px;padding:10px;border:2px solid ${statusColor === "success" ? "#16a34a" : statusColor === "destructive" ? "#dc2626" : "#f59e0b"};
        border-radius:6px;text-align:center;font-weight:700;font-size:12px;text-transform:uppercase;
        color:${statusColor === "success" ? "#16a34a" : statusColor === "destructive" ? "#dc2626" : "#f59e0b"};">
        ${statusText}
      </div>`
      : "";

    const empImg = adminData?.imgEmp;
    const brokerImg = adminData?.imgBroker;
    const headerImagesHtml =
      empImg || brokerImg
        ? `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <div>${empImg ? `<img src="${empImg}" alt="Empreendimento" style="max-height:70px;max-width:200px;object-fit:contain;border-radius:6px;" />` : ""}</div>
          <div>${brokerImg ? `<img src="${brokerImg}" alt="Corretor" style="height:70px;width:70px;object-fit:cover;border-radius:50%;border:2px solid #C5A028;" />` : ""}</div>
        </div>`
        : "";

    const commentLines = Array(6).fill(0).map((_, i) => `
      <div style="border-bottom:1px solid #ccc;height:22px;margin-bottom:2px;"></div>
    `).join("");

    printWindow.document.write(`<html><head><title>${title}</title>
      <style>
        body { font-family: 'Poppins', Arial, sans-serif; padding: 20px; color: #0A192F; font-size: 12px; }
        h1 { font-size: 15px; text-align: center; border-bottom: 2px solid #C5A028; padding-bottom: 8px; margin: 0 0 12px; }
        h2 { font-size: 13px; color: #0A192F; border-bottom: 1px solid #C5A028; padding-bottom: 4px; margin: 0 0 8px; }
        .section { margin: 12px 0; padding: 10px; border: 1px solid #ddd; border-radius: 6px; }
        .cadastro-section { margin: 12px 0; padding: 10px; border: 1px solid #C5A028; border-radius: 6px; background: #fafaf5; }
        .cadastro-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; }
        .cadastro-grid .cfield label { font-size: 9px; font-weight: 600; color: #555; display: block; }
        .cadastro-grid .cfield span { font-size: 12px; font-weight: 600; }
        table.data { width: 100%; border-collapse: collapse; }
        table.data tr { border-bottom: 1px solid #e5e5e5; }
        table.data tr:last-child { border-bottom: none; }
        table.data td { padding: 5px 4px; }
        table.data td.label { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #333; width: 60%; }
        table.data td.value { font-size: 12px; font-weight: 700; text-align: right; color: #0A192F; width: 40%; }
        .base-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; }
        .base-grid .bfield label { font-size: 9px; font-weight: 600; color: #555; display: block; }
        .base-grid .bfield span { font-size: 12px; font-weight: 700; }
        .highlight { color: #C5A028; }
        .footer { text-align: center; font-size: 9px; color: #888; margin-top: 16px; border-top: 1px solid #ddd; padding-top: 6px; }
        .comments { margin-top: 16px; }
        .comments h3 { font-size: 11px; font-weight: 700; margin-bottom: 6px; color: #555; text-transform: uppercase; }
        @media print { body { padding: 10px; } }
      </style></head><body>
      ${headerImagesHtml}
      <h1>💎 SIMULADOR CORRETOR DE ELITE 4.0</h1>
      ${(cadastro.empreendimento || cadastro.cliente || cadastro.unidade || cadastro.consultor) ? `
      <div class="cadastro-section">
        <h2>Cadastro</h2>
        <div class="cadastro-grid">
          ${cadastro.empreendimento ? `<div class="cfield"><label>Empreendimento</label><span>${cadastro.empreendimento}</span></div>` : ''}
          ${cadastro.cliente ? `<div class="cfield"><label>Cliente</label><span>${cadastro.cliente}</span></div>` : ''}
          ${cadastro.unidade ? `<div class="cfield"><label>Unidade</label><span>${cadastro.unidade}</span></div>` : ''}
          ${cadastro.andar ? `<div class="cfield"><label>Andar</label><span>${cadastro.andar}</span></div>` : ''}
          ${cadastro.apto ? `<div class="cfield"><label>Apto</label><span>${cadastro.apto}</span></div>` : ''}
          ${cadastro.consultor ? `<div class="cfield"><label>Consultor</label><span>${cadastro.consultor}</span></div>` : ''}
          ${cadastro.creci ? `<div class="cfield"><label>CRECI</label><span>${cadastro.creci}</span></div>` : ''}
        </div>
      </div>` : ''}
      <div class="section">
        <h2>Base de Cálculo</h2>
        <div class="base-grid">
          <div class="bfield"><label>Avaliação Caixa</label><span>${f(base.avalCaixa)}</span></div>
          <div class="bfield"><label>Valor Lançamento</label><span>${f(base.valLanc)}</span></div>
          <div class="bfield"><label>ITBI + Registro</label><span>${f(itbi)}</span></div>
          <div class="bfield"><label>Desc. Construtora</label><span>${f(base.descConst)}</span></div>
          <div class="bfield"><label>Subsídio</label><span>${f(base.subsidio)}</span></div>
          <div class="bfield"><label>Subsídio Estadual</label><span>${f(base.casaPaulist)}</span></div>
          <div class="bfield"><label>Total Financiamento</label><span>${f(base.totalFin)}</span></div>
          <div class="bfield"><label>Entrada Cliente</label><span class="highlight">${f(entrada)}</span></div>
          <div class="bfield"><label>% do Imóvel</label><span>${percImovel}%</span></div>
        </div>
      </div>
      <div class="section">
        <h2>${title}</h2>
        <table class="data">
          ${rowsHtml}
        </table>
        ${statusHtml}
      </div>
      <div style="margin:12px 0;padding:10px;border:1px solid #C5A028;border-radius:6px;font-size:10px;color:#0A192F;line-height:1.5;text-align:justify;">
        <strong>Aqui está o seu plano de pagamento conosco.</strong> Faremos uma simulação para validarmos sua margem no banco.<br/>
        <strong>Aviso Legal:</strong> As condições apresentadas são simulações sujeitas à aprovação final e análise de crédito. Para garantirmos essas condições, o próximo passo é a análise de crédito oficial, onde o banco confirma a viabilidade da operação.
      </div>
      <div class="comments">
        <h3>Observações / Comentários</h3>
        ${commentLines}
      </div>
    </body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const printOp1 = () =>
    printOption(
      "OPÇÃO 01 – Fluxo Durante Construtora",
      [
        { label: "Entrada c/ Construtora", value: f(entrada) },
        { label: `Sinal (${op1.pSinal}%)`, value: f(vSinal1) },
        { label: `Total Intermediárias`, value: f(op1.vInter) },
        { label: `Parcelas Intermediárias (${op1.qInter}x)`, value: f(pInter1) },
        { label: "Parcela Chaves", value: f(op1.vChaves) },
        { label: "Saldo Entr. Construtora", value: f(saldoObras1) },
        { label: `Total Parc. Construtora (${op1.qObras}x)`, value: f(mensal1) },
      ],
      "APROVADO",
      "success",
    );

  const printOp2 = () =>
    printOption(
      "OPÇÃO 02 – Base Percentual Máximo",
      [
        { label: "Entrada Cliente", value: f(entrada) },
        { label: `Sinal (${op2.pSinal}%)`, value: f(vSinal2) },
        { label: "Total Intermediárias", value: f(op2.vInter) },
        { label: `Parcelas Intermediárias (${op2.qInter}x)`, value: f(o2PInter) },
        { label: "Parcela Chaves", value: f(op2.vChaves) },
        { label: "Saldo Entr. Construtora", value: f(o2SaldoObras + o2VTotalPos) },
        { label: `Parc. Construtora (${op2.qObras}x)`, value: f(o2MObras) },
        { label: `% Máx Pós-Entrega`, value: `${op2.pMaxPos}%` },
        { label: "Valor Máx. Pós-Entrega", value: f(o2VTotalPos) },
        { label: `Saldo Pós-Entrega`, value: f(o2VTotalPos) },
        { label: `Parc. Pós-Entrega (${op2.qPos}x)`, value: f(o2MPos) },
      ],
      o2Status.text,
      o2Status.color,
    );

  const printOp3 = () =>
    printOption(
      "OPÇÃO 03 – Renda Máxima Construtora/Pós",
      [
        { label: "Renda Cliente", value: f(op3.renda) },
        { label: "Parcelas Caixa", value: f(op3.parcCaixa) },
        { label: `% Máx. Renda Bruta`, value: `${op3.percComp}%` },
        { label: "Parcela Sugerida", value: f(sug3) },
        { label: "Entrada Cliente", value: f(entrada) },
        { label: `Sinal (${op3.pSinal}%)`, value: f(vSinal3) },
        { label: "Total Intermediárias", value: f(op3.vInter) },
        { label: `Parcelas Intermediárias (${op3.qInter}x)`, value: f(pInter3) },
        { label: "Parcela Chaves", value: f(op3.vChaves) },
        { label: "Saldo Entr. Construtora+Pós", value: f(saldoObraPos3) },
        { label: "Saldo Parc. Const Obras (Obras-Pós Obras)", value: f(saldoObraPos3 - vTotalPos3) },
        { label: `Parc. Construtora (${op3.qObras}x)`, value: f(mObras3) },
        { label: `Máx. Pós-Entrega (${op3.pPos}%)`, value: f(vTotalPos3) },
        { label: `Parc. Pós-Entrega (${op3.qPos}x)`, value: f(mPos3) },
      ],
      o3Status.text,
      o3Status.color,
    );

  const printOp4 = () =>
    printOption(
      "OPÇÃO 04 – Renda Máxima % (Construtora|Pós-Construtora)",
      [
        { label: "Renda Cliente", value: f(op4.renda) },
        { label: "Parcelas Caixa", value: f(op4.parcCaixa) },
        { label: `% Máx. Renda Bruta`, value: `${op4.percComp}%` },
        { label: "Parcela Sugerida", value: f(sug4) },
        { label: "Entrada Cliente", value: f(entrada) },
        { label: `Sinal (${op4.pSinal}%)`, value: f(vSinal4) },
        { label: "Total Intermediárias", value: f(op4.vInter) },
        { label: `Parcelas Intermediárias (${op4.qInter}x)`, value: f(op4.vInter / (op4.qInter || 1)) },
        { label: "Parcela Chaves", value: f(op4.vChaves) },
        { label: "Fluxo Saldo Entr Const", value: f(saldoObraEPas4) },
        { label: "Saldo Entrada Constr (Obras)", value: f(saldoObraEPas4 - vTotalPos4) },
        { label: `Parc. Construtora (${op4.qObras}x)`, value: f(mObras4) },
        { label: `Máx. Pós-Entrega (${op4.pPos}%)`, value: f(vTotalPos4) },
        { label: `Parc. Pós-Entrega (${op4.qPos}x)`, value: f(mPos4) },
      ],
      o4Status.text,
      o4Status.color,
    );

  // Envio para VPS (WhatsApp Luna) - apenas dispara, sem alterar cálculos
  const enviarPropostaWhatsApp = async (opcao: 1 | 2 | 3 | 4) => {
    if (isVisitor) {
      alert("Função disponível apenas para assinantes ativos.");
      return;
    }
    const payloads = {
      1: { titulo: "OPÇÃO 01 – Fluxo Durante Construtora", entrada, sinal: vSinal1, intermediarias: op1.vInter, qInter: op1.qInter, parcInter: pInter1, chaves: op1.vChaves, saldoObras: saldoObras1, qObras: op1.qObras, mensalObras: mensal1, status: "APROVADO", proSoluto: saldoObras1 },
      2: { titulo: "OPÇÃO 02 – Base Percentual Máximo", entrada, sinal: vSinal2, intermediarias: op2.vInter, qInter: op2.qInter, parcInter: o2PInter, chaves: op2.vChaves, saldoObras: o2SaldoObras, qObras: op2.qObras, mensalObras: o2MObras, posEntrega: o2VTotalPos, qPos: op2.qPos, mensalPos: o2MPos, status: o2Status.text, proSoluto: o2SaldoObras + o2VTotalPos },
      3: { titulo: "OPÇÃO 03 – Renda Máxima Construtora/Pós", entrada, renda: op3.renda, parcCaixa: op3.parcCaixa, sugerida: sug3, sinal: vSinal3, intermediarias: op3.vInter, qInter: op3.qInter, parcInter: pInter3, chaves: op3.vChaves, saldoObras: saldoSoObras3, qObras: op3.qObras, mensalObras: mObras3, posEntrega: vTotalPos3, qPos: op3.qPos, mensalPos: mPos3, status: o3Status.text, proSoluto: saldoObraPos3 },
      4: { titulo: "OPÇÃO 04 – Renda Máxima %", entrada, renda: op4.renda, parcCaixa: op4.parcCaixa, sugerida: sug4, sinal: vSinal4, intermediarias: op4.vInter, qInter: op4.qInter, chaves: op4.vChaves, saldoObras: saldoObraEPas4 - vTotalPos4, qObras: op4.qObras, mensalObras: mObras4, posEntrega: vTotalPos4, qPos: op4.qPos, mensalPos: mPos4, status: o4Status.text, proSoluto: saldoObraEPas4 },
    } as const;
    const data = {
      cadastro,
      base: { ...base, itbi, entrada, percImovel },
      opcao,
      detalhes: payloads[opcao],
      timestamp: new Date().toISOString(),
    };
    try {
      await fetch("http://68.168.218.190:8080/api/proposta-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        mode: "no-cors",
      });
      alert("Proposta enviada para o WhatsApp via Luna ✅");
    } catch (err) {
      console.error("Erro envio VPS:", err);
      alert("Não foi possível enviar a proposta. Tente novamente.");
    }
  };

  return (
    <div
      className={`space-y-6 animate-fade-in ${isVisitor ? "[&_input]:pointer-events-none [&_input]:opacity-70 [&_select]:pointer-events-none [&_select]:opacity-70" : ""}`}
    >
      {/* Cadastro do Imóvel/Cliente */}
      <Card title="CADASTRO">
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="EMPREENDIMENTO" value={cadastro.empreendimento} onChange={(v) => updateCadastro("empreendimento", v)} />
          <TextInput label="CLIENTE" value={cadastro.cliente} onChange={(v) => updateCadastro("cliente", v)} />
          <TextInput label="UNIDADE" value={cadastro.unidade} onChange={(v) => updateCadastro("unidade", v)} />
          <TextInput label="ANDAR" value={cadastro.andar} onChange={(v) => updateCadastro("andar", v)} />
          <TextInput label="APTO" value={cadastro.apto} onChange={(v) => updateCadastro("apto", v)} />
          <TextInput label="CONSULTOR" value={cadastro.consultor} onChange={(v) => updateCadastro("consultor", v)} />
          <TextInput label="CRECI" value={cadastro.creci} onChange={(v) => updateCadastro("creci", v)} />
        </div>
      </Card>

      {/* Base de Cálculo */}
      <Card title="A – Base de Cálculo Principal">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <NumInput label="(1) AVALIAÇÃO CAIXA" value={base.avalCaixa} onChange={(v) => updateBase("avalCaixa", v)} />
          <NumInput label="(2) VALOR LANÇAMENTO" value={base.valLanc} onChange={(v) => updateBase("valLanc", v)} />
          <NumInput
            label="(3.1) ITBI + REGISTRO"
            value={itbi}
            onChange={(v) => setBase((prev) => ({ ...prev, itbiRegistro: v, itbiManual: true }))}
          />
          <NumInput label="(4) DESC. CONSTRUTORA" value={base.descConst} onChange={(v) => updateBase("descConst", v)} />
          <NumInput label="(5) SUBSÍDIO" value={base.subsidio} onChange={(v) => updateBase("subsidio", v)} />
          <NumInput
            label="(6) Subsidio Estadual"
            value={base.casaPaulist}
            onChange={(v) => updateBase("casaPaulist", v)}
          />
          <NumInput
            label="(7) TOTAL FINANCIAMENTO."
            value={base.totalFin}
            onChange={(v) => updateBase("totalFin", v)}
          />
          <ReadonlyField label="(8) ENTRADA CLIENTE" value={f(entrada)} highlight />
          <ReadonlyField label="% DO IMÓVEL" value={`${percImovel}%`} />
        </div>
      </Card>

      {/* === Conteúdo das 4 Opções (renderizado dentro do overlay) === */}
      {(() => {
        const opt1Content = (
          <div className="space-y-1 text-sm">
            <InfoLine label="ENTRADA C/ CONSTRUTORA" value={f(entrada)} highlight />
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-xs font-semibold uppercase flex items-center gap-1">SINAL (<MiniInput value={op1.pSinal} onChange={(v) => setOp1((p) => ({ ...p, pSinal: v }))} />%)</span>
              <span className="font-bold text-primary">{f(vSinal1)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-xs font-semibold uppercase flex items-center gap-1">INTERMEDIÁRIAS: <MiniInput value={op1.vInter} onChange={(v) => setOp1((p) => ({ ...p, vInter: v }))} wide isCurrency /> Qtd: <MiniInput value={op1.qInter} onChange={(v) => setOp1((p) => ({ ...p, qInter: v }))} /></span>
              <span className="font-bold text-primary">{f(pInter1)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-xs font-semibold uppercase">PARCELA CHAVES</span>
              <MiniInput value={op1.vChaves} onChange={(v) => setOp1((p) => ({ ...p, vChaves: v }))} wide isCurrency />
            </div>
            <div className="rounded-md border-2 border-gold/70 bg-gold/5 p-2 my-2">
              <div className="text-[10px] font-bold text-gold uppercase mb-1">Pró-Soluto (Saldo Entr. Construtora)</div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Saldo Parcelas Construtora</span>
                  <span className="font-bold text-primary text-sm">{f(saldoObras1)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Plano Parcelas Construtoras (meses)</span>
                  <MiniInput value={op1.qObras} onChange={(v) => setOp1((p) => ({ ...p, qObras: v }))} />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Valor das Parcelas</span>
                  <span className="font-bold text-primary text-sm">{f(mensal1)}</span>
                </div>
              </div>
            </div>
            <div className="pt-3 mt-3 border-t-2 border-border">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold uppercase">TOTAL PARCELAS</span>
                <span className="text-lg font-bold text-foreground">{f(mensal1)}</span>
              </div>
            </div>
            <StatusBadge text="APROVADO" color="success" />
          </div>
        );

        const opt2Content = (
          <div className="space-y-1 text-sm">
            <InfoLine label="ENTRADA CLIENTE" value={f(entrada)} highlight />
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-xs font-semibold uppercase flex items-center gap-1">SINAL (<MiniInput value={op2.pSinal} onChange={(v) => setOp2((p) => ({ ...p, pSinal: v }))} />%)</span>
              <span className="font-bold text-primary">{f(vSinal2)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-xs font-semibold uppercase flex items-center gap-1">INTERMEDIÁRIAS: <MiniInput value={op2.vInter} onChange={(v) => setOp2((p) => ({ ...p, vInter: v }))} wide isCurrency /> Qtd: <MiniInput value={op2.qInter} onChange={(v) => setOp2((p) => ({ ...p, qInter: v }))} /></span>
              <span className="font-bold text-primary">{f(o2PInter)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-xs font-semibold uppercase">PARCELA CHAVES</span>
              <MiniInput value={op2.vChaves} onChange={(v) => setOp2((p) => ({ ...p, vChaves: v }))} wide isCurrency />
            </div>
            <div className="rounded-md border-2 border-gold/70 bg-gold/5 p-2 my-2">
              <div className="text-[10px] font-bold text-gold uppercase mb-1">Pró-Soluto (Saldo Entr. Construtora)</div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Saldo Parcelas Construtora</span>
                  <span className="font-bold text-primary text-sm">{f(o2SaldoObras + o2VTotalPos)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Plano Parcelas Construtoras (meses)</span>
                  <MiniInput value={op2.qObras} onChange={(v) => setOp2((p) => ({ ...p, qObras: v }))} />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Valor das Parcelas</span>
                  <span className="font-bold text-primary text-sm">{f(o2MObras)}</span>
                </div>
              </div>
            </div>
            <div className="rounded-md border border-border bg-muted/40 p-2 my-2">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Plano Parcelas Construtoras (meses)</span>
                  <span className="font-bold text-primary text-sm">{op2.qObras}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Total Parcelas</span>
                  <span className="font-bold text-primary text-sm">{f(o2SaldoObras)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Total Parcelamento</span>
                  <span className="font-bold text-primary text-sm">{f(o2SaldoObras)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-xs font-semibold uppercase flex items-center gap-1">% MÁX PÓS-ENTREGA: <MiniInput value={op2.pMaxPos} onChange={(v) => setOp2((p) => ({ ...p, pMaxPos: v }))} />%</span>
              <span className="font-bold text-primary">{f(o2VTotalPos)}</span>
            </div>
            <InfoLine label="SALDO PÓS-ENTREGA" value={f(o2VTotalPos)} />
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-xs font-semibold uppercase flex items-center gap-1">PARC. PÓS-ENTREGA (<MiniInput value={op2.qPos} onChange={(v) => setOp2((p) => ({ ...p, qPos: v }))} />x)</span>
              <span className="font-bold text-primary">{f(o2MPos)}</span>
            </div>
            <StatusBadge text={o2Status.text} color={o2Status.color} />
          </div>
        );

        const opt3Content = (
          <div className="space-y-1 text-sm">
            <div className="grid grid-cols-3 gap-2 bg-muted p-3 rounded-md mb-3">
              <NumInput label="RENDA CLIENTE" value={op3.renda} onChange={(v) => setOp3((p) => ({ ...p, renda: v }))} small />
              <NumInput label="PARCELAS CAIXA" value={op3.parcCaixa} onChange={(v) => setOp3((p) => ({ ...p, parcCaixa: v }))} small />
              <NumInput label="% MAX.RENDA BRUTA" value={op3.percComp} onChange={(v) => setOp3((p) => ({ ...p, percComp: v }))} small isPercent />
            </div>
            <InfoLine label="PARCELA SUGERIDA" value={f(sug3)} success={!o3RendaExcedida} danger={o3RendaExcedida} />
            <InfoLine label="ENTRADA CLIENTE" value={f(entrada)} highlight />
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-xs font-semibold uppercase flex items-center gap-1">SINAL (<MiniInput value={op3.pSinal} onChange={(v) => setOp3((p) => ({ ...p, pSinal: v }))} />%)</span>
              <span className="font-bold text-primary">{f(vSinal3)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-xs font-semibold uppercase flex items-center gap-1">INTERMEDIÁRIAS: <MiniInput value={op3.vInter} onChange={(v) => setOp3((p) => ({ ...p, vInter: v }))} wide isCurrency /> Qtd: <MiniInput value={op3.qInter} onChange={(v) => setOp3((p) => ({ ...p, qInter: v }))} /></span>
              <span className="font-bold text-primary">{f(pInter3)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-xs font-semibold uppercase">PARCELA CHAVES</span>
              <MiniInput value={op3.vChaves} onChange={(v) => setOp3((p) => ({ ...p, vChaves: v }))} wide isCurrency />
            </div>
            <div className="rounded-md border-2 border-gold/70 bg-gold/5 p-2 my-2">
              <div className="text-[10px] font-bold text-gold uppercase mb-1">Pró-Soluto</div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Saldo Parcelas Construtora</span>
                  <span className="font-bold text-primary text-sm">{f(saldoObraPos3 - vTotalPos3)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Plano Parcelas Construtoras (meses)</span>
                  <MiniInput value={op3.qObras} onChange={(v) => setOp3((p) => ({ ...p, qObras: v }))} />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Valor das Parcelas</span>
                  <span className="font-bold text-primary text-sm">{f(mObras3)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-xs font-semibold uppercase flex items-center gap-1">MAX. PÓS-ENTREGA (<MiniInput value={op3.pPos} onChange={(v) => setOp3((p) => ({ ...p, pPos: v }))} />%)</span>
              <span className="font-bold text-primary">{f(vTotalPos3)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-xs font-semibold uppercase flex items-center gap-1">PARC. PÓS-ENTREGA (<MiniInput value={op3.qPos} onChange={(v) => setOp3((p) => ({ ...p, qPos: v }))} />x)</span>
              <span className="font-bold text-primary">{f(mPos3)}</span>
            </div>
            <StatusBadge text={o3Status.text} color={o3Status.color} />
          </div>
        );

        const opt4Content = (
          <div className="space-y-1 text-sm">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-muted p-3 rounded-md mb-3">
              <NumInput label="RENDA CLIENTE" value={op4.renda} onChange={(v) => setOp4((p) => ({ ...p, renda: v }))} small />
              <NumInput label="PARCELAS CAIXA" value={op4.parcCaixa} onChange={(v) => setOp4((p) => ({ ...p, parcCaixa: v }))} small />
              <NumInput label="% MAX.RENDA BRUTA" value={op4.percComp} onChange={(v) => setOp4((p) => ({ ...p, percComp: v }))} small isPercent />
              <ReadonlyField label="PARC. SUGERIDA" value={f(sug4)} danger={o4RendaExcedida} />
            </div>
            <InfoLine label="ENTRADA CLIENTE" value={f(entrada)} highlight />
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-xs font-semibold uppercase flex items-center gap-1">SINAL (<MiniInput value={op4.pSinal} onChange={(v) => setOp4((p) => ({ ...p, pSinal: v }))} />%)</span>
              <span className="font-bold text-primary">{f(vSinal4)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-xs font-semibold uppercase flex items-center gap-1">INTERMEDIÁRIAS: <MiniInput value={op4.vInter} onChange={(v) => setOp4((p) => ({ ...p, vInter: v }))} wide isCurrency /> Qtd: <MiniInput value={op4.qInter} onChange={(v) => setOp4((p) => ({ ...p, qInter: v }))} /></span>
              <span className="font-bold text-primary">{f(op4.qInter > 0 ? op4.vInter / op4.qInter : 0)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-xs font-semibold uppercase">PARCELA CHAVES</span>
              <MiniInput value={op4.vChaves} onChange={(v) => setOp4((p) => ({ ...p, vChaves: v }))} wide isCurrency />
            </div>
            <div className="rounded-md border-2 border-gold/70 bg-gold/5 p-2 my-2">
              <div className="text-[10px] font-bold text-gold uppercase mb-1">Pró-Soluto</div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Saldo Parcelas Construtora</span>
                  <span className="font-bold text-primary text-sm">{f(saldoObraEPas4 - vTotalPos4)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Plano Parcelas Construtoras (meses)</span>
                  <MiniInput value={op4.qObras} onChange={(v) => setOp4((p) => ({ ...p, qObras: v }))} />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Valor das Parcelas</span>
                  <span className="font-bold text-primary text-sm">{f(mObras4)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-xs font-semibold uppercase flex items-center gap-1">MAX. PÓS-ENTREGA (<MiniInput value={op4.pPos} onChange={(v) => setOp4((p) => ({ ...p, pPos: v }))} />%)</span>
              <span className="font-bold text-primary">{f(vTotalPos4)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-xs font-semibold uppercase flex items-center gap-1">PARC. PÓS-ENTREGA (<MiniInput value={op4.qPos} onChange={(v) => setOp4((p) => ({ ...p, qPos: v }))} />x)</span>
              <span className="font-bold text-primary">{f(mPos4)}</span>
            </div>
            <StatusBadge text={o4Status.text} color={o4Status.color} />
          </div>
        );

        const options = [
          { n: 1 as const, title: "OPÇÃO 01 – Fluxo Durante Construtora", subtitle: "Sem parcelas pós-entrega", highlight: f(saldoObras1), highlightLabel: "Pró-Soluto", content: opt1Content, onPrint: printOp1, statusText: "APROVADO", statusColor: "success" as const },
          { n: 2 as const, title: "OPÇÃO 02 – Base Percentual Máximo", subtitle: "Pós-entrega controlado por %", highlight: f(o2SaldoObras + o2VTotalPos), highlightLabel: "Pró-Soluto", content: opt2Content, onPrint: printOp2, statusText: o2Status.text, statusColor: o2Status.color },
          { n: 3 as const, title: "OPÇÃO 03 – Renda Máxima Construtora/Pós", subtitle: "Validação por renda do cliente", highlight: f(saldoObraPos3), highlightLabel: "Pró-Soluto", content: opt3Content, onPrint: printOp3, statusText: o3Status.text, statusColor: o3Status.color },
          { n: 4 as const, title: "OPÇÃO 04 – Renda Máxima %", subtitle: "Construtora | Pós-Construtora", highlight: f(saldoObraEPas4), highlightLabel: "Pró-Soluto", content: opt4Content, onPrint: printOp4, statusText: o4Status.text, statusColor: o4Status.color },
        ];

        const current = options.find((o) => o.n === expandedOption);

        return (
          <>
            {/* Cards de Decisão */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {options.map((opt) => (
                <button
                  key={opt.n}
                  onClick={() => setExpandedOption(opt.n)}
                  className="group relative text-left bg-card rounded-lg border border-border hover:border-gold hover:shadow-lg transition-all overflow-hidden"
                >
                  <div className="bg-primary text-gold px-3 py-2 text-[11px] font-bold uppercase tracking-wider border-l-4 border-l-gold flex items-center justify-between">
                    <span className="truncate">Opção 0{opt.n}</span>
                    <ChevronRight className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="text-xs font-bold text-foreground leading-tight">{opt.title.replace(/^OPÇÃO \d+ – /, "")}</div>
                    <div className="text-[10px] text-muted-foreground">{opt.subtitle}</div>
                    <div className="mt-2 pt-2 border-t border-dashed border-gold/40">
                      <div className="text-[9px] font-bold text-gold uppercase tracking-wider">{opt.highlightLabel}</div>
                      <div className="text-base font-bold text-primary">{opt.highlight}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Overlay com card expandido */}
            {current && (
              <div
                className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-6 bg-primary/40 backdrop-blur-md animate-fade-in overflow-y-auto"
                onClick={() => setExpandedOption(null)}
              >
                <div
                  className="relative w-full sm:max-w-3xl bg-card rounded-none sm:rounded-lg border border-gold shadow-2xl my-0 sm:my-4 animate-scale-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header sticky */}
                  <div className="sticky top-0 z-10 bg-primary text-gold px-4 py-3 text-xs font-bold uppercase tracking-wider border-l-4 border-l-gold flex items-center justify-between rounded-none sm:rounded-t-lg">
                    <span className="pr-12 truncate">{current.title}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={current.onPrint}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase bg-gold/20 text-gold hover:bg-gold/40 transition-colors"
                        title="Imprimir esta opção"
                      >
                        <Printer className="w-3.5 h-3.5" /> Imprimir
                      </button>
                    </div>
                  </div>

                  {/* Botão X flutuante dourado */}
                  <button
                    onClick={() => setExpandedOption(null)}
                    aria-label="Fechar"
                    className="absolute top-2 right-2 z-20 w-9 h-9 rounded-full flex items-center justify-center bg-[#D4AF37] text-primary shadow-lg hover:scale-110 hover:bg-[#E5C158] transition-all"
                  >
                    <X className="w-5 h-5" strokeWidth={3} />
                  </button>

                  {/* Conteúdo */}
                  <div className="p-4 sm:p-5">{current.content}</div>

                  {/* Rodapé com botão Luna/WhatsApp */}
                  <div className="sticky bottom-0 bg-card border-t border-border p-3 rounded-none sm:rounded-b-lg flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => setExpandedOption(null)}
                      className="px-4 py-2.5 rounded-md text-xs font-bold uppercase border border-border bg-muted hover:bg-muted/70 transition-colors"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={() => enviarPropostaWhatsApp(current.n)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold uppercase bg-[#25D366] text-white hover:bg-[#1ebe57] transition-colors shadow-md"
                    >
                      <Send className="w-4 h-4" /> Enviar Proposta via WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* Gerar Vencimentos */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-primary uppercase">Digite a Opção:</label>
          <select
            value={vencimentosOpcao}
            onChange={(e) => setVencimentosOpcao(Number(e.target.value))}
            className="px-3 py-1.5 border border-border rounded text-sm font-bold bg-card focus:outline-none focus:ring-1 focus:ring-gold"
          >
            <option value={1}>Opção 1</option>
            <option value={2}>Opção 2</option>
            <option value={3}>Opção 3</option>
            <option value={4}>Opção 4</option>
          </select>
          <button
            onClick={() => {
              if (isVisitor) {
                alert("Função disponível apenas para assinantes ativos.");
                return;
              }
              setVencimentosOpen(true);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-xs font-bold uppercase bg-card text-primary border-2 border-gold hover:bg-gold/10 transition-colors"
          >
            <CalendarClock className="w-4 h-4" /> Gerar Vencimentos
          </button>
          <button
            onClick={() => {
              setCadastro({ empreendimento: "", cliente: "", unidade: "", andar: "", apto: "", consultor: "", creci: "" });
              setBase({ avalCaixa: 0, valLanc: 0, descConst: 0, subsidio: 0, casaPaulist: 0, totalFin: 0, itbiRegistro: 0, itbiManual: false });
              setOp1({ pSinal: 5, vInter: 0, qInter: 3, vChaves: 0, qObras: 36 });
              setOp2({ pSinal: 5, vInter: 0, qInter: 3, vChaves: 0, pMaxPos: 5, qObras: 36, qPos: 24 });
              setOp3({ renda: 0, parcCaixa: 0, percComp: 20, pSinal: 5, vInter: 0, qInter: 3, vChaves: 0, qObras: 36, pPos: 5, qPos: 24 });
              setOp4({ renda: 0, parcCaixa: 0, percComp: 20, pSinal: 5, vInter: 0, qInter: 3, vChaves: 0, qObras: 36, pPos: 5, qPos: 24 });
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold uppercase bg-destructive text-white hover:bg-destructive/90 transition-colors"
          >
            Limpar
          </button>
        </div>
      </div>

      <RelatorioVencimentos
        isOpen={vencimentosOpen}
        onClose={() => setVencimentosOpen(false)}
        mode="prosoluto"
        prosolutoData={(() => {
          switch (vencimentosOpcao) {
            case 1:
              return {
                opcao: 1,
                entrada,
                sinal: vSinal1,
                intermediarias: op1.vInter,
                qInter: op1.qInter,
                parcInter: pInter1,
                chaves: op1.vChaves,
                saldoObras: saldoObras1,
                qObras: op1.qObras,
                mensalObras: mensal1,
              };
            case 2:
              return {
                opcao: 2,
                entrada,
                sinal: vSinal2,
                intermediarias: op2.vInter,
                qInter: op2.qInter,
                parcInter: o2PInter,
                chaves: op2.vChaves,
                saldoObras: o2SaldoObras,
                qObras: op2.qObras,
                mensalObras: o2MObras,
              };
            case 3:
              return {
                opcao: 3,
                entrada,
                sinal: vSinal3,
                intermediarias: op3.vInter,
                qInter: op3.qInter,
                parcInter: pInter3,
                chaves: op3.vChaves,
                saldoObras: saldoSoObras3,
                qObras: op3.qObras,
                mensalObras: mObras3,
              };
            case 4:
            default:
              return {
                opcao: 4,
                entrada,
                sinal: vSinal4,
                intermediarias: op4.vInter,
                qInter: op4.qInter,
                parcInter: op4.vInter / (op4.qInter || 1),
                chaves: op4.vChaves,
                saldoObras: saldoObraEPas4 - vTotalPos4,
                qObras: op4.qObras,
                mensalObras: mObras4,
              };
          }
        })()}
      />
    </div>
  );
}

// Sub-components
function Card({ title, children, onPrint }: { title: string; children: React.ReactNode; onPrint?: () => void }) {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
      <div className="bg-primary text-gold px-4 py-3 text-xs font-bold uppercase tracking-wider border-l-4 border-l-gold flex items-center justify-between">
        <span>{title}</span>
        {onPrint && (
          <button
            onClick={onPrint}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase bg-gold/20 text-gold hover:bg-gold/40 transition-colors"
            title="Imprimir esta opção"
          >
            <Printer className="w-3.5 h-3.5" /> Imprimir
          </button>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function NumInput({
  label,
  value,
  onChange,
  small,
  isPercent,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  small?: boolean;
  isPercent?: boolean;
}) {
  const displayValue = isPercent ? String(value) : formatCurrencyInput(value);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isPercent) {
      onChange(parseFloat(e.target.value) || 0);
    } else {
      const raw = e.target.value.replace(/[^\d]/g, "");
      onChange(parseInt(raw, 10) / 100 || 0);
    }
  };
  return (
    <div>
      <label className={`block font-bold text-muted-foreground mb-1 uppercase ${small ? "text-[10px]" : "text-xs"}`}>
        {label}
      </label>
      <input
        type={isPercent ? "number" : "text"}
        inputMode={isPercent ? undefined : "numeric"}
        value={displayValue}
        onChange={handleChange}
        className="w-full px-2 py-2 border border-border rounded text-sm font-bold text-center focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold bg-card"
      />
    </div>
  );
}

function formatCurrencyInput(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ReadonlyField({ label, value, highlight, danger }: { label: string; value: string; highlight?: boolean; danger?: boolean }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase">{label}</label>
      <div
        className={`w-full px-2 py-2 rounded text-sm font-bold text-center border ${
          danger ? "bg-red-50 text-destructive border-red-200" : highlight ? "bg-green-50 text-success border-green-200" : "bg-muted text-primary border-border"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function MiniInput({
  value,
  onChange,
  wide,
  isCurrency,
}: {
  value: number;
  onChange: (v: number) => void;
  wide?: boolean;
  isCurrency?: boolean;
}) {
  if (isCurrency) {
    const displayValue = formatCurrencyInput(value);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^\d]/g, "");
      onChange(parseInt(raw, 10) / 100 || 0);
    };
    return (
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        className={`${wide ? "w-28" : "w-24"} px-1 py-0.5 border border-border rounded text-center text-sm font-bold focus:outline-none focus:ring-1 focus:ring-gold bg-card`}
      />
    );
  }
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className={`${wide ? "w-20" : "w-12"} px-1 py-0.5 border border-border rounded text-center text-sm font-bold focus:outline-none focus:ring-1 focus:ring-gold bg-card`}
    />
  );
}

function InfoLine({
  label,
  value,
  highlight,
  success,
  danger,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  success?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-border/40">
      <span className="text-xs font-semibold uppercase">{label}</span>
      <span className={`font-bold ${danger ? "text-destructive" : highlight ? "text-success" : success ? "text-success" : "text-primary"}`}>
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ text, color }: { text: string; color: "success" | "destructive" | "warning" }) {
  const styles = {
    success: "border-success text-success bg-green-50",
    destructive: "border-destructive text-destructive bg-red-50",
    warning: "border-warning text-warning bg-orange-50",
  };
  return (
    <div className={`mt-3 px-4 py-3 rounded border-2 font-bold text-xs uppercase text-center ${styles[color]}`}>
      {text}
    </div>
  );
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-2 border border-border rounded text-sm font-bold focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold bg-card"
        placeholder={label}
      />
    </div>
  );
}
