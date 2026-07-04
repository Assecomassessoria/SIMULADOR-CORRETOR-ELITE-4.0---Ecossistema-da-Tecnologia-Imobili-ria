import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, DollarSign, TrendingUp, MessageSquare, Printer } from "lucide-react";
import { formatCurrency, calculateSimulation } from "@/lib/simulatorCalc";
import PercentualAdjustmentPanel from "@/components/PercentualAdjustmentPanel";
import { jsPDF } from "jspdf";
import { getMcmvRules, getMcmvRateForRenda } from "@/lib/eliteUtils";

const formatIntegerToBr = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return parseInt(digits, 10).toLocaleString("pt-BR");
};

const formatFloatToBr = (value: string): string => {
  if (!value) return "";
  let cleanValue = value.replace(/\./g, "").replace(/[^0-9,]/g, "");
  const commaCount = (cleanValue.match(/,/g) || []).length;
  if (commaCount > 1) {
    const parts = cleanValue.split(",");
    cleanValue = parts[0] + "," + parts.slice(1).join("");
  }
  const parts = cleanValue.split(",");
  const integerPart = parts[0];
  let decimalPart = parts[1] !== undefined ? parts[1] : "";
  if (decimalPart.length > 2) {
    decimalPart = decimalPart.slice(0, 2);
  }
  let formattedInteger = "";
  if (integerPart) {
    const numInt = parseInt(integerPart, 10);
    if (!isNaN(numInt)) {
      formattedInteger = numInt.toLocaleString("pt-BR");
    } else {
      formattedInteger = "0";
    }
  } else {
    formattedInteger = "0";
  }
  if (parts.length > 1) {
    return `${formattedInteger},${decimalPart}`;
  } else {
    return formattedInteger;
  }
};

const formatNumberToBrWithDecimals = (num: number): string => {
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

interface SimulatorState {
  // Campos de entrada
  valorImovel: number;
  prazoParcela: number;
  valorAto: number;
  valorFinanciamento: number;
  valorFgts: number;
  valorVistoria: number;
  qtdPrimeirasMensais: number;

  // Faixas de parcelas
  faixa1Qtd: number;
  faixa1Valor: number;
  faixa2Qtd: number;
  faixa2Valor: number;
  faixa3Qtd: number;
  faixa3Valor: number;

  // Percentuais dinâmicos
  percentualAto: number;
  percentualPrimeiras: number;
}

interface CalculatedValues {
  sugestaoAto: number;
  sugestaoFinanciamento: number;
  sugestaoFgts: number;
  sugestaoVistoria: number;
  sugestaoParcelado: number;
  sugestaoTotal: number;

  saldoMensal: number;
  primeirasMensais: number;
  qtdDemaisMensais: number;
  demaisMensais: number;
  mensaisLineares: number;
  comissaoRepasse: number;

  faixa4Qtd: number;
  faixa4Valor: number;
  totalFluxoPersonalizado: number;
  validacaoEntrada: string;
}

const INITIAL_STATE: SimulatorState = {
  valorImovel: 300000,
  prazoParcela: 40,
  valorAto: 15000, // 5% de 300.000,00
  valorFinanciamento: 210000, // 70% de 300.000,00
  valorFgts: 0,
  valorVistoria: 3000, // 1% de 300.000,00
  qtdPrimeirasMensais: 6,
  faixa1Qtd: 10,
  faixa1Valor: 2000,
  faixa2Qtd: 10,
  faixa2Valor: 1800,
  faixa3Qtd: 10,
  faixa3Valor: 1300,
  percentualAto: 5,
  percentualPrimeiras: 3,
};

export default function SimulacaoCustom() {
  const [state, setState] = useState<SimulatorState>(INITIAL_STATE);
  const [calculated, setCalculated] = useState<CalculatedValues>({} as CalculatedValues);
  const [activeTab, setActiveTab] = useState("simulacao_rapida_inicial");

  // Estados do Simulador Customizável 4.0 Elite (Sincronizados e Formatados)
  const [inValorImovel, setInValorImovel] = useState("270.000,00");
  const [inRenda, setInRenda] = useState("5.000,00");
  const [inDataNascimento, setInDataNascimento] = useState("1996-06-09");
  const [inDataInicioFluxo, setInDataInicioFluxo] = useState(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    return `${today.getFullYear()}-${mm}-01`;
  });

  const getMêsAnoPorNúmero = (mesCount: number) => {
    if (!inDataInicioFluxo) return "";
    const parts = inDataInicioFluxo.split("-");
    const year = parseInt(parts[0]) || 2026;
    const month = parseInt(parts[1]) || 6;
    const baseDate = new Date(year, month - 1, 15);
    baseDate.setMonth(baseDate.getMonth() + (mesCount - 1));
    const monthsArr = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${monthsArr[baseDate.getMonth()]}/${baseDate.getFullYear()}`;
  };

  const [inFGTS, setInFGTS] = useState("10.000,00");
  const [inAtoVista, setInAtoVista] = useState("15.000,00");
  const [inPercentualAto, setInPercentualAto] = useState("5,56");
  const [inPrazoTotal, setInPrazoTotal] = useState(40);
  const [inQtdIntermediarias, setInQtdIntermediarias] = useState(3);

  const [intermediarias, setIntermediarias] = useState<Array<{ valor: string; mes: number; dataCustom?: string }>>([
    { valor: "5.000,00", mes: 12, dataCustom: "" },
    { valor: "3.000,00", mes: 24, dataCustom: "" },
    { valor: "3.000,00", mes: 36, dataCustom: "" },
  ]);

  const [taxasCustom, setTaxasCustom] = useState<
    Array<{ nome: string; percentual: string; prazo: string; dataCustom?: string }>
  >([
    { nome: "Entrada Personalizada de (Contrato 1)", percentual: "3", prazo: "6", dataCustom: "" },
    { nome: "", percentual: "0", prazo: "1", dataCustom: "" },
    { nome: "", percentual: "0", prazo: "1", dataCustom: "" },
    { nome: "", percentual: "0", prazo: "1", dataCustom: "" },
    { nome: "", percentual: "0", prazo: "1", dataCustom: "" },
    { nome: "", percentual: "0", prazo: "1", dataCustom: "" },
  ]);

  const inMesesIniciais = parseInt(taxasCustom[0]?.prazo) || 1;
  const inPercentualIniciais = parseFloat(taxasCustom[0]?.percentual) || 0;

  const [rendaBruta, setRendaBruta] = useState(5000);
  const [lastGeneratedInfo, setLastGeneratedInfo] = useState<string | null>(null);

  const handleInPercentualAtoChange = (valStr: string) => {
    const cleaned = valStr.replace(/[^0-9,.]/g, "");
    setInPercentualAto(cleaned);

    const pct = parseBrFloat(cleaned);
    const valorImovelCustom = parseBrFloat(inValorImovel);
    const calculatedAto = (valorImovelCustom * pct) / 100;
    setInAtoVista(formatNumberToBrWithDecimals(calculatedAto));
  };

  const handleInAtoVistaChange = (valStr: string) => {
    const formatted = formatFloatToBr(valStr);
    setInAtoVista(formatted);

    const valorAtoDigitado = parseBrFloat(formatted);
    const valorImovelCustom = parseBrFloat(inValorImovel);
    if (valorImovelCustom > 0) {
      const pct = (valorAtoDigitado / valorImovelCustom) * 100;
      setInPercentualAto(pct.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }));
    }
  };

  const handleInValorImovelChange = (valStr: string) => {
    const formatted = formatFloatToBr(valStr);
    setInValorImovel(formatted);
    const num = parseBrFloat(formatted);

    // Recalcular o Ato Inicial à vista com base no percentual do ato atual
    const pct = parseBrFloat(inPercentualAto);
    const calculatedAto = (num * pct) / 100;
    setInAtoVista(formatNumberToBrWithDecimals(calculatedAto));

    setState((prev) => ({
      ...prev,
      valorImovel: num,
      valorAto: (num * prev.percentualAto) / 100,
      valorFinanciamento: num * 0.7,
      valorVistoria: num * 0.01,
    }));
  };

  const handleInRendaChange = (valStr: string) => {
    const formatted = formatFloatToBr(valStr);
    setInRenda(formatted);
    const num = parseBrFloat(formatted);
    setRendaBruta(num);
  };

  const handleQtdIntermediariasChange = (newQtd: number) => {
    const clampedNewQtd = Math.min(10, Math.max(0, newQtd));
    setInQtdIntermediarias(clampedNewQtd);
    setIntermediarias((prev) => {
      const arr = [...prev];
      if (arr.length < clampedNewQtd) {
        for (let i = arr.length + 1; i <= clampedNewQtd; i++) {
          arr.push({
            valor: i === 1 ? "5.000,00" : "3.000,00",
            mes: i * 12,
            dataCustom: "",
          });
        }
      } else if (arr.length > clampedNewQtd) {
        return arr.slice(0, clampedNewQtd);
      }
      return arr;
    });
  };

  // Estados para Modal de Simulação Rápida (Sincronizados e limpos)
  const [isModalSimulacaoOpen, setIsModalSimulacaoOpen] = useState(false);
  const [simValorImovel, setSimValorImovel] = useState("270.000,00");
  const [simRenda, setSimRenda] = useState("5.000,00");
  const [simDataNascimento, setSimDataNascimento] = useState("09/06/1996");

  // Novos Estados Estritos para a Aba "⚡ Simulação Rápida"
  const [rapidaValorImovel, setRapidaValorImovel] = useState("240.000,00");
  const [rapidaRenda, setRapidaRenda] = useState("3.800,00");
  const [rapidaDataNascimento, setRapidaDataNascimento] = useState("2002-06-09");
  const [rapidaResultado, setRapidaResultado] = useState<{
    sucesso: boolean;
    idade?: number;
    prazoMeses?: number;
    prazoAnos?: number;
    parcelaMaxima?: string;
    parcelaPrice?: string;
    valorFinanciado?: string;
    valorImovel?: string;
    valorEntrada?: string;
    cotaFinanciamento?: string;
    taxaJurosNominal?: string;
    taxaJurosEfetiva?: string;
    modalidade?: string;
    sistemaAmortizacao?: string;
    ultimaParcelaSac?: string;
    totalPagoSac?: string;
    totalPagoPrice?: string;
    erro?: string;
  } | null>(null);

  const [showPriceSacComp, setShowPriceSacComp] = useState(false);

  const [simResultado, setSimResultado] = useState<{
    sucesso: boolean;
    idade: number;
    prazoMeses: number;
    prazoAnos: number;
    parcelaMaxima: number;
    valorFinanciado: number;
  } | null>(null);

  // 1. A FUNÇÃO DE CÁLCULO (Aproximação Comercial)
  const calcularFinanciamentoAproximado = (renda: number, dataNascimento: string, valorImovel: number) => {
    if (!dataNascimento) {
      return { erro: "Por favor, informe a Data de Nascimento." };
    }

    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    if (isNaN(nascimento.getTime())) {
      return { erro: "Data de nascimento inválida." };
    }

    // Calcula a idade atual
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }

    // Regra dos 80 anos (Idade + Prazo <= 80)
    let prazoAnos = 80 - idade;
    if (prazoAnos > 35) prazoAnos = 35; // Teto máximo do mercado imobiliário
    if (prazoAnos <= 0) return { erro: "Idade limite excedida para financiamento." };

    const prazoMeses = prazoAnos * 12;

    // Parcela máxima permitida (30% da renda bruta)
    const parcelaMaxima = renda * 0.3;

    // Seleção de Taxas (Minha Casa Minha Vida vs SBPE)
    const rules = getMcmvRules();
    const rateResult = getMcmvRateForRenda(renda, rules);
    
    let taxaAnualNominal = rateResult.taxaNominal;
    let taxaAnualEfetiva = Math.pow(1 + taxaAnualNominal / 12, 12) - 1;
    let modalidade = "";

    if (rateResult.faixa === "Faixa 1") {
      modalidade = "Minha Casa Minha Vida - Faixa 1 (FGTS)";
    } else if (rateResult.faixa === "Faixa 2") {
      modalidade = "Minha Casa Minha Vida - FGTS (Empreendimento Financiado pela Caixa)";
    } else if (rateResult.faixa === "Faixa 3") {
      modalidade = "Minha Casa Minha Vida - Faixa 3 (FGTS)";
    } else if (rateResult.faixa.includes("Faixa 4")) {
      modalidade = "Minha Casa Minha Vida - Faixa 4 (Classe Média)";
    } else {
      modalidade = "SBPE - Recursos SBPE";
      taxaAnualNominal = 0.105;
      taxaAnualEfetiva = 0.11;
    }

    // Regime SAC (Sistema de Amortização Constante):
    // Prestação Inicial = Amortização + Juros + Seguros.
    const taxaMensal = taxaAnualNominal / 12;
    const custoSeguroMIP_DFI = 69.95; // Seguro e encargos médios iniciais

    if (parcelaMaxima <= custoSeguroMIP_DFI) {
      return { erro: "Renda insuficiente para cobrir seguros e encargos básicos." };
    }

    // Financiamento Máximo suportado pelo comprometimento de renda (SAC)
    const divisorSAC = 1 / prazoMeses + taxaMensal;
    let valorFinanciadoCalculado = (parcelaMaxima - custoSeguroMIP_DFI) / divisorSAC;

    // A cota máxima do financiamento é de 80% do valor do imóvel
    const cotaMaxima = 0.8;
    const limiteCotaFinanciamento = valorImovel * cotaMaxima;

    if (valorFinanciadoCalculado > limiteCotaFinanciamento) {
      valorFinanciadoCalculado = limiteCotaFinanciamento;
    }

    if (valorFinanciadoCalculado < 0) {
      valorFinanciadoCalculado = 0;
    }

    // Entrada = Valor do Imóvel - Valor Financiado
    const valorEntrada = valorImovel - valorFinanciadoCalculado;

    // Prestação Real do Mês 1 (SAC)
    const prestacaoRealMes1 =
      valorFinanciadoCalculado / prazoMeses + valorFinanciadoCalculado * taxaMensal + custoSeguroMIP_DFI;

    // Prestação da Tabela Price
    const prestacaoPriceVal = valorFinanciadoCalculado > 0 
      ? valorFinanciadoCalculado * (taxaMensal / (1 - Math.pow(1 + taxaMensal, -prazoMeses))) + custoSeguroMIP_DFI
      : 0;

    const amortizacaoMensal = valorFinanciadoCalculado / prazoMeses;
    const ultimaParcelaSacVal = valorFinanciadoCalculado > 0 
      ? amortizacaoMensal + (amortizacaoMensal * taxaMensal) + custoSeguroMIP_DFI
      : 0;

    const totalJurosSac = ((prazoMeses + 1) * valorFinanciadoCalculado * taxaMensal) / 2;
    const totalSeguroSac = custoSeguroMIP_DFI * prazoMeses;
    const totalPagoSacVal = valorFinanciadoCalculado + totalJurosSac + totalSeguroSac;
    const totalPagoPriceVal = prestacaoPriceVal * prazoMeses;

    return {
      sucesso: true,
      idade: idade,
      prazoMeses: prazoMeses,
      prazoAnos: prazoAnos,
      parcelaMaxima: prestacaoRealMes1.toFixed(2),
      parcelaPrice: prestacaoPriceVal.toFixed(2),
      valorFinanciado: valorFinanciadoCalculado.toFixed(2),
      valorImovel: valorImovel.toFixed(2),
      valorEntrada: valorEntrada.toFixed(2),
      cotaFinanciamento: `${cotaMaxima * 100}%`,
      taxaJurosNominal: `${(taxaAnualNominal * 100).toFixed(2)}% a.a.`,
      taxaJurosEfetiva: `${(taxaAnualEfetiva * 100).toFixed(2)}% a.a.`,
      modalidade: modalidade,
      sistemaAmortizacao: "SAC / TR - Constante e PRICE / TR - Tabela Price",
      ultimaParcelaSac: ultimaParcelaSacVal.toFixed(2),
      totalPagoSac: totalPagoSacVal.toFixed(2),
      totalPagoPrice: totalPagoPriceVal.toFixed(2),
    };
  };

  // 2. FUNÇÃO ACIONADA EXCLUSIVAMENTE PELO BOTÃO "SIMULAÇÃO 4.0" (OU DISPARAR CLIQUE DO BOTÃO)
  const dispararCliqueDoBotao = () => {
    // Captura direta e limpa dos inputs da tela
    const valorImovelDigitado = parseBrFloat(rapidaValorImovel);
    const rendaDigitada = parseBrFloat(rapidaRenda);
    const dataDigitada = rapidaDataNascimento;

    if (isNaN(valorImovelDigitado) || !valorImovelDigitado || isNaN(rendaDigitada) || !rendaDigitada || !dataDigitada) {
      toast.error("Preencha o valor da unidade, renda e data de nascimento para calcular!");
      return;
    }

    const resultado = calcularFinanciamentoAproximado(rendaDigitada, dataDigitada, valorImovelDigitado);

    if (resultado.sucesso) {
      setRapidaResultado({
        sucesso: true,
        idade: resultado.idade,
        prazoMeses: resultado.prazoMeses,
        prazoAnos: resultado.prazoAnos,
        parcelaMaxima: resultado.parcelaMaxima,
        parcelaPrice: resultado.parcelaPrice,
        valorFinanciado: resultado.valorFinanciado,
        valorImovel: resultado.valorImovel,
        valorEntrada: resultado.valorEntrada,
        cotaFinanciamento: resultado.cotaFinanciamento,
        taxaJurosNominal: resultado.taxaJurosNominal,
        taxaJurosEfetiva: resultado.taxaJurosEfetiva,
        modalidade: resultado.modalidade,
        sistemaAmortizacao: resultado.sistemaAmortizacao,
        ultimaParcelaSac: resultado.ultimaParcelaSac,
        totalPagoSac: resultado.totalPagoSac,
        totalPagoPrice: resultado.totalPagoPrice,
      });
      toast.success("Simulação de aproximação comercial Caixa efetuada!");
    } else {
      toast.error(resultado.erro || "Erro inesperado.");
      setRapidaResultado({
        sucesso: false,
        erro: resultado.erro,
      });
    }
  };

  const handleExecutarSimulacaoElite = () => {
    setLastGeneratedInfo("Planilha de Elite gerada e atualizada com sucesso!");
    toast.success("Versão própria da planilha gerada!", {
      description: "Regras de negócio sob medida aplicadas para a tabela do imóvel.",
      duration: 4000,
    });
  };

  const handleAbrirModalSimulacao = () => {
    setSimValorImovel(inValorImovel);
    setSimRenda(inRenda);

    // Converte de yyyy-mm-dd para dd/mm/yyyy
    const nascimento = parseNascimento(inDataNascimento);
    if (nascimento) {
      const year = nascimento.getFullYear();
      const month = String(nascimento.getMonth() + 1).padStart(2, "0");
      const day = String(nascimento.getDate()).padStart(2, "0");
      setSimDataNascimento(`${day}/${month}/${year}`);
    } else {
      setSimDataNascimento("09/06/1996");
    }

    setSimResultado(null);
    setIsModalSimulacaoOpen(true);
  };

  const parseBrFloat = (valStr: string): number => {
    if (!valStr) return 0;
    let clean = valStr.trim();
    // Remover símbolos e espaços
    clean = clean.replace(/R\$\s?/i, "");

    // Tratar ponto e vírgula
    if (clean.includes(",") && clean.includes(".")) {
      // Ex: 3.800,00 -> 3800.00
      clean = clean.replace(/\./g, "").replace(",", ".");
    } else if (clean.includes(",")) {
      // Ex: 3800,00 -> 3800.00
      clean = clean.replace(",", ".");
    } else if (clean.includes(".")) {
      // Se tiver apenas ponto, checar se é separador de milhar (ex: 3.800) ou decimal (ex: 3.8)
      const parts = clean.split(".");
      if (parts[parts.length - 1].length === 3) {
        clean = clean.replace(/\./g, "");
      }
    }

    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleDataNascimentoChange = (val: string) => {
    // Manter apenas dígitos e barras
    const cleaned = val.replace(/[^0-9/]/g, "");

    // Formatar como DD/MM/AAAA conforme digita
    const digits = cleaned.replace(/\D/g, "").slice(0, 8);
    let formatted = "";
    if (digits.length <= 2) {
      formatted = digits;
    } else if (digits.length <= 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    }
    setSimDataNascimento(formatted);
  };

  const parseNascimento = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const clean = dateStr.trim();

    // Tentar fatiar por barras ou traços
    const parts = clean.split(/[-/]/);
    if (parts.length === 3) {
      const p0 = parts[0].trim();
      const p1 = parts[1].trim();
      const p2 = parts[2].trim();

      if (p0.length === 4) {
        // yyyy-mm-dd
        const y = parseInt(p0, 10);
        const m = parseInt(p1, 10) - 1;
        const d = parseInt(p2, 10);
        const dateObj = new Date(y, m, d);
        if (
          !isNaN(dateObj.getTime()) &&
          dateObj.getFullYear() === y &&
          dateObj.getMonth() === m &&
          dateObj.getDate() === d
        ) {
          return dateObj;
        }
      } else if (p2.length === 4) {
        // dd/mm/yyyy
        const d = parseInt(p0, 10);
        const m = parseInt(p1, 10) - 1;
        const y = parseInt(p2, 10);
        const dateObj = new Date(y, m, d);
        if (
          !isNaN(dateObj.getTime()) &&
          dateObj.getFullYear() === y &&
          dateObj.getMonth() === m &&
          dateObj.getDate() === d
        ) {
          return dateObj;
        }
      }
    }

    const fallbackDate = new Date(clean);
    if (!isNaN(fallbackDate.getTime())) return fallbackDate;

    return null;
  };

  const handleExecutarSimulacaoRapida = () => {
    const vImovel = parseBrFloat(simValorImovel);
    const renda = parseBrFloat(simRenda);

    if (!vImovel || !renda || !simDataNascimento) {
      toast.error("Preencha todos os dados (Valor do Imóvel, Renda e Data de Nascimento) para calcular!");
      return;
    }

    const nascimento = parseNascimento(simDataNascimento);
    if (!nascimento || isNaN(nascimento.getTime())) {
      toast.error("Data de nascimento inválida. Digite no formato correto DD/MM/AAAA.");
      return;
    }

    const year = nascimento.getFullYear();
    const month = String(nascimento.getMonth() + 1).padStart(2, "0");
    const day = String(nascimento.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;

    const res = calcularFinanciamentoAproximado(renda, formattedDate, vImovel);

    if (!res.sucesso || res.erro) {
      toast.error(res.erro || "Não foi possível calcular a simulação.");
      return;
    }

    setSimResultado({
      sucesso: true,
      idade: res.idade!,
      prazoMeses: res.prazoMeses!,
      prazoAnos: res.prazoAnos!,
      parcelaMaxima: parseFloat(res.parcelaMaxima!),
      valorFinanciado: parseFloat(res.valorFinanciado!),
    });

    toast.success("Resultados calculados! Veja abaixo.");
  };

  const handleAplicarSimulacaoRapida = () => {
    if (!simResultado) return;
    const vImovel = parseBrFloat(simValorImovel);
    const renda = parseBrFloat(simRenda);

    // Aplica os valores no formulário principal
    handleValorImovelCustomChange(vImovel);
    setRendaBruta(renda);

    // Atualiza os estados do Simulador Elite 4.0 Customizável
    setInValorImovel(formatNumberToBrWithDecimals(vImovel));
    setInRenda(formatNumberToBrWithDecimals(renda));

    // Recalcular o Ato Inicial à vista com base no percentual do ato atual
    const pct = parseBrFloat(inPercentualAto);
    const calculatedAto = (vImovel * pct) / 100;
    setInAtoVista(formatNumberToBrWithDecimals(calculatedAto));

    // Converte e atualiza a data de nascimento para o tipo date
    const birthDate = parseNascimento(simDataNascimento);
    if (birthDate) {
      const year = birthDate.getFullYear();
      const month = String(birthDate.getMonth() + 1).padStart(2, "0");
      const day = String(birthDate.getDate()).padStart(2, "0");
      setInDataNascimento(`${year}-${month}-${day}`);
    }

    toast.success("Dados da Simulação Rápida aplicados à planilha com sucesso!");
    setIsModalSimulacaoOpen(false);
    setSimResultado(null);
  };

  useEffect(() => {
    const res = calcularFinanciamentoAproximado(3800, "2002-06-09", 240000);
    if (res.sucesso) {
      setRapidaResultado({
        sucesso: true,
        idade: res.idade,
        prazoMeses: res.prazoMeses,
        prazoAnos: res.prazoAnos,
        parcelaMaxima: res.parcelaMaxima,
        valorFinanciado: res.valorFinanciado,
        valorImovel: res.valorImovel,
        valorEntrada: res.valorEntrada,
        cotaFinanciamento: res.cotaFinanciamento,
        taxaJurosNominal: res.taxaJurosNominal,
        taxaJurosEfetiva: res.taxaJurosEfetiva,
        modalidade: res.modalidade,
        sistemaAmortizacao: res.sistemaAmortizacao,
      });
    }
  }, []);

  useEffect(() => {
    const result = calculateSimulation(state);
    setCalculated(result);
  }, [state]);

  const handleInputChange = (field: keyof SimulatorState, value: string) => {
    const numValue = parseFloat(value) || 0;
    setState((prev) => ({
      ...prev,
      [field]: numValue,
    }));
  };

  const handleNumericStateChange = (field: keyof SimulatorState, val: number) => {
    setState((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handleValorImovelCustomChange = (val: number) => {
    setState((prev) => ({
      ...prev,
      valorImovel: val,
      valorAto: (val * prev.percentualAto) / 100,
      valorFinanciamento: val * 0.7, // Mantém o patamar de 70% para o fluxo geral
      valorVistoria: val * 0.01,
    }));
  };

  const handlePercentualSinalChange = (val: number) => {
    setState((prev) => ({
      ...prev,
      percentualAto: val,
      valorAto: (prev.valorImovel * val) / 100,
    }));
  };

  const handlePercentualAtoChange = (value: number) => {
    const valorCalculado = (state.valorImovel * value) / 100;
    setState((prev) => ({
      ...prev,
      percentualAto: value,
      valorAto: valorCalculado,
    }));
  };

  const handlePercentualPrimeirasChange = (value: number) => {
    setState((prev) => ({
      ...prev,
      percentualPrimeiras: value,
    }));
  };

  const isValidEntrada = calculated.validacaoEntrada === "OK ENTRADA";

  // ==========================================
  // CÁLCULOS DO SIMULADOR CUSTOMIZÁVEL 4.0 ELITE
  // ==========================================
  const valorImovelCustom = parseBrFloat(inValorImovel);
  const rendaCustom = parseBrFloat(inRenda);
  const valorFGTSCustom = parseBrFloat(inFGTS);
  const atoVistaCustom = parseBrFloat(inAtoVista);

  const resCaixaCustom = calcularFinanciamentoAproximado(rendaCustom, inDataNascimento, valorImovelCustom);
  const financiamentoCaixa = resCaixaCustom.sucesso ? parseFloat(resCaixaCustom.valorFinanciado || "0") : 0;
  const primeiraParcelaCaixa = resCaixaCustom.sucesso ? parseFloat(resCaixaCustom.parcelaMaxima || "0") : 0;

  // Soma total das intermediárias dinâmicas digitadas
  let totalIntermediarias = 0;
  intermediarias.forEach((b) => {
    totalIntermediarias += parseBrFloat(b.valor);
  });

  // SALDO RESTANTE PRÓ-SOLUTO INICIAL
  const saldoProSolutoInicial =
    valorImovelCustom - financiamentoCaixa - valorFGTSCustom - atoVistaCustom - totalIntermediarias;

  // *** REGRA 6: AS PRIMEIRAS PARCELAS SÃO CONFIGURÁVEIS E SUBTRAEM DO PRÓ-SOLUTO ***
  const mesesIniciais = inMesesIniciais;
  const parcelaIniciaisTaxaAtoTotal = valorImovelCustom * (inPercentualIniciais / 100);
  const parcelaIniciaisTaxaAtoMensal = mesesIniciais > 0 ? parcelaIniciaisTaxaAtoTotal / mesesIniciais : 0;
  const totalAmortizadoNosMesesIniciais = parcelaIniciaisTaxaAtoTotal;

  // Processamento das Linhas Customizáveis Extras (pulando a primeira linha que é a Entrada Personalizada)
  let totalTaxasCustomExtras = 0;
  const listTaxasCalculadas: Array<{
    nome: string;
    percentual: number;
    prazo: number;
    valorParcela: number;
    dataCustom: string;
  }> = [];

  taxasCustom.slice(1).forEach((taxa) => {
    const pct = parseFloat(taxa.percentual) || 0;
    const prazo = parseInt(taxa.prazo) || 1;
    if (taxa.nome && pct > 0) {
      const valorCalc = valorImovelCustom * (pct / 100);
      totalTaxasCustomExtras += valorCalc;
      listTaxasCalculadas.push({
        nome: taxa.nome,
        percentual: pct,
        prazo: prazo,
        valorParcela: valorCalc / prazo,
        dataCustom: taxa.dataCustom || "",
      });
    }
  });

  // Subtração de todas as taxas customizadas (tanto as iniciais quanto as extras) do Saldo Base devedor
  const saldoRestanteParaDividir = saldoProSolutoInicial - totalAmortizadoNosMesesIniciais - totalTaxasCustomExtras;
  const mesesRestantes = inPrazoTotal - mesesIniciais;

  // Parcela mensal normal do fluxo pós meses iniciais
  const parcelaMensalRestante = mesesRestantes > 0 ? saldoRestanteParaDividir / mesesRestantes : 0;

  // *** REGRA 7: COMPROMETIMENTO DE RENDA MENSAL REAL NO PRIMEIRO PERÍODO ***
  // Consideramos o valor pago ao mês (parcelaIniciaisTaxaAtoMensal) e não o total de entrada
  const estresseMensalSemestre1 = parcelaIniciaisTaxaAtoMensal;
  const rendaMinimaExigidaReal = estresseMensalSemestre1 / 0.3;

  let riscoCredito = "BAIXO RISCO";
  if (rendaCustom < rendaMinimaExigidaReal) {
    riscoCredito = "ALTO RISCO (RENDA INSUFICIENTE)";
  }
  const totalTaxasCalculado = totalAmortizadoNosMesesIniciais + totalTaxasCustomExtras;

  // Cálculo dos meses com parcelas adicionais (Balões / Taxas Extras Customizadas)
  const mesesComAdicionais: Array<{
    numMes: number;
    dataLabel: string;
    baseVal: number;
    balloonVal: number;
    customTaxesVal: number;
    totalVal: number;
    itensNomes: string[];
  }> = [];

  for (let m = 1; m <= inPrazoTotal; m++) {
    const baseVal =
      m <= inMesesIniciais ? parcelaIniciaisTaxaAtoMensal : parcelaMensalRestante > 0 ? parcelaMensalRestante : 0;

    let balloonVal = 0;
    const balloonItens: string[] = [];
    intermediarias.forEach((b, idx) => {
      if (b.mes === m) {
        const val = parseBrFloat(b.valor) || 0;
        if (val > 0) {
          balloonVal += val;
          balloonItens.push(`Balão #${idx + 1} (${b.dataCustom || getMêsAnoPorNúmero(m)})`);
        }
      }
    });

    let customTaxesVal = 0;
    const customTaxItens: string[] = [];
    taxasCustom.slice(1).forEach((taxa) => {
      const pct = parseFloat(taxa.percentual) || 0;
      const prazo = parseInt(taxa.prazo) || 1;
      if (taxa.nome && pct > 0 && m <= prazo) {
        const valorCalc = valorImovelCustom * (pct / 100);
        const valorParcela = valorCalc / prazo;
        customTaxesVal += valorParcela;
        customTaxItens.push(`${taxa.nome} (Até mês ${prazo})`);
      }
    });

    if (balloonVal > 0 || customTaxesVal > 0) {
      mesesComAdicionais.push({
        numMes: m,
        dataLabel: getMêsAnoPorNúmero(m),
        baseVal,
        balloonVal,
        customTaxesVal,
        totalVal: baseVal + balloonVal + customTaxesVal,
        itensNomes: [...balloonItens, ...customTaxItens],
      });
    }
  }

  const handleExportPDF = () => {
    // Determine which mode (standard or customizable) is selected
    const isCustom = activeTab === "customizado";
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Helper functions for PDF writing
    let currentY = 15;
    const addHeader = (title: string, subtitle: string) => {
      // Top elegant bar
      doc.setFillColor(31, 41, 61); // deep blue slate (#1f293d)
      doc.rect(0, 0, 210, 32, "F");

      doc.setFillColor(212, 175, 55); // gold accent (#d4af37)
      doc.rect(0, 32, 210, 1.5, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(title, 15, 16);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(212, 175, 55);
      doc.text(subtitle, 15, 24);

      currentY = 48;
    };

    const drawSectionHeader = (title: string) => {
      doc.setFillColor(240, 242, 245);
      doc.rect(10, currentY, 190, 8, "F");
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.5);
      doc.line(10, currentY, 10, currentY + 8);

      doc.setTextColor(31, 41, 61);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(title, 15, currentY + 5.5);
      currentY += 13;
    };

    const drawRow = (label: string, value: string, isHeader: boolean = false, bgColor: boolean = false) => {
      if (currentY > 275) {
        doc.addPage();
        currentY = 20;
      }

      if (bgColor) {
        doc.setFillColor(248, 249, 250);
        doc.rect(10, currentY - 4, 190, 7, "F");
      }

      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", isHeader ? "bold" : "normal");
      doc.setFontSize(9);
      doc.text(label, 15, currentY);

      doc.setTextColor(isHeader ? 31 : 80, isHeader ? 41 : 80, isHeader ? 61 : 80);
      doc.setFont("helvetica", "bold");
      doc.text(value, 195, currentY, { align: "right" });

      // Separator line
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.1);
      doc.line(10, currentY + 2.5, 200, currentY + 2.5);

      currentY += 7.5;
    };

    if (isCustom) {
      addHeader("SIMULACAO DE FINANCIAMENTO INTEGRADA", "IMOBSIMULADOR CORRETOR ELITE v4.0 - PROPOSTA COMERCIAL");

      drawSectionHeader("1. PARAMETROS DA UNIDADE E CREDITO CAIXA");
      drawRow("Valor do Lancamento / Imovel", formatCurrency(valorImovelCustom), true, true);
      drawRow(
        "Financiamento Estimado Caixa",
        `${formatCurrency(financiamentoCaixa)} (${((financiamentoCaixa / valorImovelCustom) * 100).toFixed(2)}%)`,
        false,
      );
      drawRow(
        "Primeira Prestacao Estimada do Financiamento (SAC)",
        `${formatCurrency(primeiraParcelaCaixa)} /mes`,
        false,
      );
      drawRow("Abatimento Especial via FGTS", formatCurrency(valorFGTSCustom), false, true);
      drawRow("Ato Inicial Solicitado a Vista", formatCurrency(atoVistaCustom), false);
      drawRow("Total Alocado em Baloes Intermediarios", formatCurrency(totalIntermediarias), false);

      currentY += 3;
      drawSectionHeader("2. FLUXO CONSTRUTORA E PARCELAMENTO");
      drawRow("Saldo Pro-Soluto Inicial", formatCurrency(saldoProSolutoInicial), true, true);

      // Amortization 1
      const p1Label = `Mes 1 ao ${inMesesIniciais} (${taxasCustom[0]?.dataCustom || `${getMêsAnoPorNúmero(1)} - ${getMêsAnoPorNúmero(inMesesIniciais || 1)}`})`;
      drawRow(
        `${p1Label}: ${taxasCustom[0]?.nome || "Parcelas Iniciais"}`,
        `${formatCurrency(parcelaIniciaisTaxaAtoMensal)} /mes`,
        false,
      );

      // Amortization 2: Restantes
      const pRestLabel = `Mes ${inMesesIniciais + 1} ao ${inPrazoTotal} (${getMêsAnoPorNúmero(inMesesIniciais + 1)} - ${getMêsAnoPorNúmero(inPrazoTotal)})`;
      drawRow(
        `${pRestLabel}: Parcelas Restantes Pro-Soluto`,
        `${formatCurrency(parcelaMensalRestante > 0 ? parcelaMensalRestante : 0)} /mes`,
        false,
        true,
      );

      // Custom Taxes list
      listTaxasCalculadas.forEach((taxa) => {
        const taxLabel = `${taxa.nome} (${taxa.dataCustom || `1 - ${taxa.prazo}x`})`;
        drawRow(taxLabel, `${formatCurrency(taxa.valorParcela)} /mes`, false);
      });

      // Balloons if any
      if (intermediarias.length > 0) {
        intermediarias.forEach((balao, index) => {
          const mLabel = balao.dataCustom || getMêsAnoPorNúmero(balao.mes);
          drawRow(
            `Balao Intermediario #${index + 1} (Mes ${balao.mes} / ${mLabel})`,
            formatCurrency(parseBrFloat(balao.valor) || 0),
            false,
            true,
          );
        });
      }

      currentY += 3;
      drawSectionHeader("3. ANALISE DE COMPROMETIMENTO E COMPATIBILIDADE");
      drawRow("Renda Familiar de Referencia Informada", formatCurrency(rendaCustom), false, true);
      drawRow("Renda Minima Exigida Recomendada", formatCurrency(rendaMinimaExigidaReal), true);
      drawRow(
        "Comprometimento Mensal Inicial (Fase Obras)",
        `${rendaCustom > 0 ? ((parcelaIniciaisTaxaAtoMensal / rendaCustom) * 100).toFixed(1) : 0}% da Renda`,
        false,
      );
      drawRow("Classificacao de Risco de Credito", riscoCredito, true, true);
      drawRow("Previsao Total de Entrada Amortizada", formatCurrency(totalTaxasCalculado), false);
      if (mesesComAdicionais.length > 0) {
        const peakMonth = mesesComAdicionais.reduce(
          (max, pr) => (pr.totalVal > max.totalVal ? pr : max),
          mesesComAdicionais[0],
        );
        drawRow(
          `Mes de Pico de Pagamento (Mes ${peakMonth.numMes} / ${peakMonth.dataLabel})`,
          `${formatCurrency(peakMonth.totalVal)} (${((peakMonth.totalVal / (rendaCustom || 1)) * 100).toFixed(1)}% Comp.)`,
          true,
          true,
        );
      }
    } else {
      // Standard / Resumo Executivo mode
      addHeader("RELATORIO DE RESUMO EXECUTIVO", "IMOBSIMULADOR CORRETOR ELITE v4.0 - SIMULACAO PADRAO");

      drawSectionHeader("1. VISAO GERAL DA SIMULACAO");
      drawRow("Valor Total do Imovel", formatCurrency(state.valorImovel), true, true);
      drawRow("Prazo Total de Parcelamento", `${state.prazoParcela} meses`, false);
      drawRow("Saldo Nominal a Parcelar", formatCurrency(calculated.saldoMensal || 0), false);
      drawRow("Comissao de Repasse Estimada (3%)", formatCurrency(calculated.comissaoRepasse || 0), false, true);

      currentY += 3;
      drawSectionHeader("2. DISTRIBUICAO DAS MENSALIDADES");
      drawRow(
        `Parcelas Iniciais (${state.qtdPrimeirasMensais} meses)`,
        `${formatCurrency(calculated.primeirasMensais || 0)} /mes`,
        false,
      );
      drawRow(
        `Destaque para Demais Mensais (${calculated.qtdDemaisMensais || 0} meses)`,
        `${formatCurrency(calculated.demaisMensais || 0)} /mes`,
        false,
        true,
      );
      drawRow(
        "Mensais Lineares Recomendadas (Sugestao)",
        `${formatCurrency(calculated.mensaisLineares || 0)} /mes`,
        false,
      );
      drawRow("Meses Restantes (Faixa 4 calculada)", `${calculated.faixa4Qtd || 0} meses`, false);

      currentY += 3;
      drawSectionHeader("3. RESUMO ANALITICO FINANCEIRO");
      drawRow("Ato Inicial", formatCurrency(state.valorAto), false, true);
      drawRow("Vistorias", formatCurrency(state.valorVistoria), false);
      drawRow("Financiamento Caixa", formatCurrency(state.valorFinanciamento), false);
      drawRow("Abatimento FGTS", formatCurrency(state.valorFgts), false, true);

      const totalParcelasF1_4 =
        state.faixa1Qtd * state.faixa1Valor +
        state.faixa2Qtd * state.faixa2Valor +
        state.faixa3Qtd * state.faixa3Valor +
        (calculated.faixa4Qtd || 0) * (calculated.faixa4Valor || 0);

      drawRow("Total Parcelado (Faixas 1 a 4)", formatCurrency(totalParcelasF1_4), false);
      drawRow(
        "VALOR TOTAL DO FLUXO PERSONALIZADO",
        formatCurrency(calculated.totalFluxoPersonalizado || 0),
        true,
        true,
      );
      drawRow("Validacao Final da Negociacao", calculated.validacaoEntrada || "Nao Calculado", true);
    }

    // Elegant Footer
    if (currentY > 265) {
      doc.addPage();
      currentY = 25;
    }

    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "italic");
    const todayStr = new Date().toLocaleDateString("pt-BR");
    doc.text(
      `Proposta gerada em ${todayStr} por Corretor Elite 4.0. Valores sujeitos a alteracao e analise cadastral construtora.`,
      10,
      283,
    );
    doc.text(
      "Este documento possui carater comercial estimativo e nao constitui proposta de credito vinculante.",
      10,
      287,
    );

    // Save PDF
    const filename = `Simulacao_Elite_${isCustom ? "Customizada" : "Padrao"}_${Date.now()}.pdf`;
    doc.save(filename);
    toast.success("PDF Exportado com sucesso!", {
      description: `O arquivo '${filename}' foi gerado e baixado no seu dispositivo.`,
    });
  };

  const handleEnviarWhatsApp = () => {
    const isCustom = activeTab === "customizado";
    let message = "";

    if (isCustom) {
      const p1Label = `Mês 1 ao ${inMesesIniciais} (${taxasCustom[0]?.dataCustom || `${getMêsAnoPorNúmero(1)} - ${getMêsAnoPorNúmero(inMesesIniciais || 1)}`})`;
      const pRestLabel = `Mês ${inMesesIniciais + 1} ao ${inPrazoTotal} (${getMêsAnoPorNúmero(inMesesIniciais + 1)} - ${getMêsAnoPorNúmero(inPrazoTotal)})`;

      message = `*IMOBSIMULADOR CORRETOR ELITE 4.0* 📊\n*PROPOSTA COMERCIAL SOB MEDIDA* 🌟\n\nOlá! Segue o detalhamento da simulação personalizada:\n\n*1. PARÂMETROS DA UNIDADE:*\n• *Valor do Imóvel:* ${formatCurrency(valorImovelCustom)}\n• *Ato Inicial à Vista:* ${formatCurrency(atoVistaCustom)}\n• *FGTS Alocado:* ${formatCurrency(valorFGTSCustom)}\n• *Financiamento Caixa (Estimado):* ${formatCurrency(financiamentoCaixa)} (1ª prestação SAC de ~${formatCurrency(primeiraParcelaCaixa)}/mês)\n\n*2. PLANO DE PARCELAMENTO CONSTRUTORA:*\n• *Saldo Inicial:* ${formatCurrency(saldoProSolutoInicial)}\n• *${p1Label}:* ${formatCurrency(parcelaIniciaisTaxaAtoMensal)} /mês\n• *${pRestLabel}:* ${formatCurrency(parcelaMensalRestante > 0 ? parcelaMensalRestante : 0)} /mês`;

      if (intermediarias.length > 0) {
        message += `\n\n*Balões Intermediários:*`;
        intermediarias.forEach((balao, index) => {
          const mLabel = balao.dataCustom || getMêsAnoPorNúmero(balao.mes);
          message += `\n - Balão #${index + 1} (Mês ${balao.mes} / ${mLabel}): ${formatCurrency(parseBrFloat(balao.valor))}`;
        });
      }

      if (listTaxasCalculadas.length > 0) {
        message += `\n\n*Taxas adicionais customizadas:*`;
        listTaxasCalculadas.forEach((taxa) => {
          message += `\n - ${taxa.nome}: ${formatCurrency(taxa.valorParcela)} /mês`;
        });
      }

      if (mesesComAdicionais.length > 0) {
        message += `\n\n*Meses de Pico (Parcelas Adicionais & Balões):*`;
        mesesComAdicionais.slice(0, 6).forEach((item) => {
          message += `\n • Mês ${item.numMes} (${item.dataLabel}): ${formatCurrency(item.totalVal)} (${((item.totalVal / (rendaCustom || 1)) * 100).toFixed(1)}% Comprometimento)`;
        });
        if (mesesComAdicionais.length > 6) {
          message += `\n • ... e outros ${mesesComAdicionais.length - 6} meses de pico.`;
        }
      }

      message += `\n\n*3. ANÁLISE E PERFIL DE RISCO:*\n• *Risco de Crédito:* ${riscoCredito}\n• *Renda Familiar Informada:* ${formatCurrency(rendaCustom)}\n• *Renda Mínima Recomendada:* ${formatCurrency(rendaMinimaExigidaReal)}\n• *Comprometimento da Renda Inicial:* ${rendaCustom > 0 ? ((parcelaIniciaisTaxaAtoMensal / rendaCustom) * 100).toFixed(1) : 0}%`;
    } else {
      const totalParcelasF1_4 =
        state.faixa1Qtd * state.faixa1Valor +
        state.faixa2Qtd * state.faixa2Valor +
        state.faixa3Qtd * state.faixa3Valor +
        (calculated.faixa4Qtd || 0) * (calculated.faixa4Valor || 0);

      message = `*IMOBSIMULADOR CORRETOR ELITE 4.0* 📊\n*RESUMO EXECUTIVO DE SIMULAÇÃO* 🌟\n\nOlá! Segue o plano padrão proposto de comercialização:\n\n*1. RESUMO FINANCEIRO:*\n• *Valor de Venda:* ${formatCurrency(state.valorImovel)}\n• *Ato Inicial:* ${formatCurrency(state.valorAto)}\n• *Vistoria:* ${formatCurrency(state.valorVistoria)}\n• *FGTS:* ${formatCurrency(state.valorFgts)}\n• *Financiamento Caixa:* ${formatCurrency(state.valorFinanciamento)}\n\n*2. PARCELAMENTO:*\n• *Quantidade de Parcelas:* ${state.prazoParcela} meses\n• *Parcelas Iniciais (${state.qtdPrimeirasMensais}x):* ${formatCurrency(calculated.primeirasMensais || 0)} /mês\n• *Demais Mensais (${calculated.qtdDemaisMensais || 0}x):* ${formatCurrency(calculated.demaisMensais || 0)} /mês\n• *Total Parcelamento Geral:* ${formatCurrency(totalParcelasF1_4)}\n\n*3. VALIDAÇÃO:*\n• *TOTAL GERAL FLUXO:* ${formatCurrency(calculated.totalFluxoPersonalizado || 0)}\n• *Status da Entrada:* ${calculated.validacaoEntrada || "Validado"}`;
    }

    message += `\n\n_Simulação gerada de forma automatizada pelo Corretor Elite 4.0. Valores de caráter comercial e aproximados._`;

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    toast.success("Redirecionando para o WhatsApp...");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2 flex-wrap">
            <img
              src="/logo-elite.jpg"
              alt="Logo Elite"
              referrerPolicy="no-referrer"
              className="h-16 md:h-20 object-contain rounded-lg border border-amber-500/20 shadow-md shadow-amber-500/5"
            />
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">Simulador Corretor Elite 4.0</h1>
              <p className="text-slate-400">Fechamento de Mesa | Negociação Avançada de Parcelas</p>
            </div>
          </div>
        </div>

        {/* Validation Alert */}
        {!isValidEntrada && (
          <Alert className="mb-6 border-red-500 bg-red-50 dark:bg-red-950">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              ⚠️ Entrada insuficiente. O Ato + {state.qtdPrimeirasMensais} primeiras parcelas devem atingir no mínimo{" "}
              {(state.percentualAto + state.percentualPrimeiras).toFixed(1)}% do valor do imóvel.
            </AlertDescription>
          </Alert>
        )}

        {isValidEntrada && (
          <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950 border-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200 font-bold text-lg">
              ✓ ENTRADA SUFICIENTE - APROVADO
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 lg:grid-cols-6 gap-2 mb-6 h-auto p-1 bg-slate-900/60 rounded-xl">
            <TabsTrigger
              className="py-2.5 px-3 h-auto text-xs font-semibold data-[state=active]:bg-amber-600 data-[state=active]:text-white text-slate-300"
              value="simulacao_rapida_inicial"
            >
              ⚡ Simulação Rápida
            </TabsTrigger>
            <TabsTrigger
              className="py-2.5 px-3 h-auto text-xs font-semibold data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300"
              value="customizado"
            >
              Simul. Custom.⭐
            </TabsTrigger>
            <TabsTrigger
              className="py-2.5 px-3 h-auto text-xs font-semibold data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300"
              value="percentuais"
            >
              Ajustes Percent.
            </TabsTrigger>
            <TabsTrigger
              className="py-2.5 px-3 h-auto text-xs font-semibold data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300"
              value="entrada"
            >
              Sugestão Entrada
            </TabsTrigger>
            <TabsTrigger
              className="py-2.5 px-3 h-auto text-xs font-semibold data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300"
              value="fluxo"
            >
              Fluxo Personal.
            </TabsTrigger>
            <TabsTrigger
              className="py-2.5 px-3 h-auto text-xs font-semibold data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300"
              value="resumo"
            >
              Resumo Executivo
            </TabsTrigger>
          </TabsList>

          {/* TAB 0: SIMULAÇÃO RÁPIDA INICIAL */}
          <TabsContent value="simulacao_rapida_inicial" className="space-y-6 focus-visible:outline-none">
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden shadow-2xl p-6">
              <div className="bg-[#1d2433] p-6 rounded-lg border-l-4 border-amber-500 mb-6 font-sans">
                <h3 className="text-amber-400 text-lg font-extrabold mb-4 flex items-center gap-2 tracking-wide">
                  <span>⚡</span> Aproximação Comercial Caixa (Simulação Rápida 4.0)
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed mb-5">
                  Preencha o valor da unidade, a renda bruta familiar e a data de nascimento do proponente para rodar a
                  simulação e aproximação comercial da Caixa Econômica Federal (com base no **Sistema de Amortização
                  Constante - SAC**, **Regra dos 80 anos** e limitador de **30% de comprometimento de renda**).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-[#8b949e] mb-2 uppercase tracking-wider">
                      Valor Lançamento/Imóvel (R$)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      id="campoValorImovel"
                      placeholder="Ex: 240.000 (R$ 240.000,00)"
                      className="w-full h-11 bg-[#0d1117] border border-[#30363d] text-white px-3 text-sm rounded focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30 transition-all font-mono"
                      value={rapidaValorImovel}
                      onChange={(e) => setRapidaValorImovel(formatFloatToBr(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#8b949e] mb-2 uppercase tracking-wider">
                      Renda Familiar (R$)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      id="campoRenda"
                      placeholder="Ex: 12.700 (R$ 12.700,00)"
                      className="w-full h-11 bg-[#0d1117] border border-[#30363d] text-white px-3 text-sm rounded focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30 transition-all font-mono"
                      value={rapidaRenda}
                      onChange={(e) => setRapidaRenda(formatFloatToBr(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#8b949e] mb-2 uppercase tracking-wider">
                      Data Nascimento
                    </label>
                    <input
                      type="date"
                      id="campoDataNascimento"
                      className="w-full h-11 bg-[#0d1117] border border-[#30363d] text-white px-3 text-sm rounded focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30 transition-all font-mono"
                      value={rapidaDataNascimento}
                      onChange={(e) => setRapidaDataNascimento(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <button
                    type="button"
                    id="botaoCalcularRapido"
                    onClick={dispararCliqueDoBotao}
                    className="w-full md:w-auto bg-gradient-to-b from-amber-400 to-[#b3921b] hover:from-amber-300 hover:to-[#cbb030] text-[#0d1117] font-extrabold px-6 py-3 rounded text-xs tracking-wider uppercase shadow-md transition-all duration-200 cursor-pointer"
                  >
                    Calcular Simulação 4.0
                  </button>
                </div>
              </div>

              {/* Bloco de Resposta da Caixa */}
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-6">
                <h4 className="text-white text-[13px] uppercase tracking-wider font-extrabold mb-5 flex items-center gap-2 font-sans text-slate-300 border-b border-[#21262d] pb-3">
                  <span>🏦</span> Demonstrativo Oficial de Aproximação - Caixa Econômica Federal
                </h4>

                {rapidaResultado && rapidaResultado.sucesso ? (
                  <div className="space-y-6 font-sans">
                    {/* Modalidade Encontrada */}
                    <div className="bg-[#1f242c] border border-blue-500/20 p-4 rounded-lg flex items-center justify-between">
                      <span className="text-xs text-[#8b949e] font-semibold uppercase tracking-wider">
                        Modalidade Proposta:
                      </span>
                      <span className="text-sm text-blue-400 font-bold uppercase tracking-wide">
                        {rapidaResultado.modalidade}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Card 1: Valor Imóvel */}
                      <div className="bg-[#21262d] border border-[#30363d] p-5 rounded-lg flex flex-col justify-center">
                        <span className="text-[11px] font-bold text-[#8b949e] uppercase tracking-wider mb-1">
                          Valor da Unidade / Imóvel
                        </span>
                        <div
                          id="resultadoValorImovel"
                          className="text-2xl text-white font-black font-mono tracking-tight"
                        >
                          {`R$ ${parseFloat(rapidaResultado.valorImovel || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1">Valor total de negociação da unidade</span>
                      </div>

                      {/* Card 2: Valor do Financiamento */}
                      <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-lg flex flex-col justify-center border-l-4 border-green-500/50">
                        <span className="text-[11px] font-bold text-green-400 uppercase tracking-wider mb-1">
                          Valor do Financiamento (Caixa)
                        </span>
                        <div
                          id="resultadoFinanciamento"
                          className="text-2xl text-green-400 font-black font-mono tracking-tight"
                        >
                          {`R$ ${parseFloat(rapidaResultado.valorFinanciado || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1">Capacidade real estimada via regime SAC</span>
                      </div>

                      {/* Card 3: Valor de Entrada */}
                      <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-lg flex flex-col justify-center border-l-4 border-amber-500/50">
                        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                          Valor de Entrada Necessária
                        </span>
                        <div
                          id="resultadoEntrada"
                          className="text-2xl text-amber-400 font-black font-mono tracking-tight"
                        >
                          {`R$ ${parseFloat(rapidaResultado.valorEntrada || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1">Necessidade de Recursos Próprios / FGTS</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Card 4: Parcelas SAC e PRICE */}
                      <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-lg flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider">
                              1ª Parcela (SAC)
                            </span>
                            <span className="text-[9px] bg-teal-950 text-teal-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                              Amort. Constante
                            </span>
                          </div>
                          <div className="text-lg text-teal-400 font-black font-mono tracking-tight">
                            {`R$ ${parseFloat(rapidaResultado.parcelaMaxima || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          </div>
                        </div>

                        <div className="border-t border-[#30363d] pt-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider">
                              Parcela Única (PRICE)
                            </span>
                            <span className="text-[9px] bg-amber-950 text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                              Tabela Price
                            </span>
                          </div>
                          <div className="text-lg text-amber-400 font-black font-mono tracking-tight">
                            {`R$ ${parseFloat(rapidaResultado.parcelaPrice || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          </div>
                        </div>

                        <span className="text-[10px] text-slate-400 border-t border-[#30363d]/50 pt-1.5 block">
                          Compromete no máx. 30% da renda informada
                        </span>
                      </div>

                      {/* Card 5: Prazo e Idade */}
                      <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-lg flex flex-col justify-center">
                        <span className="text-[11px] font-bold text-[#8b949e] uppercase tracking-wider mb-1">
                          Prazo Máximo Permitido
                        </span>
                        <div id="resultadoPrazo" className="text-lg text-white font-black font-mono tracking-tight">
                          {`${rapidaResultado.prazoMeses} meses (${rapidaResultado.prazoAnos} anos)`}
                        </div>
                        <span className="text-[10px] text-[#8b949e]">
                          Identificado proponente com{" "}
                          <strong className="text-white font-mono">{rapidaResultado.idade}</strong> anos
                        </span>
                      </div>

                      {/* Card 6: Detalhes do Financiamento */}
                      <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-lg flex flex-col justify-center text-xs text-slate-300 space-y-1">
                        <div>
                          <strong className="text-slate-400 uppercase text-[9px] block">
                            Indexador / Amortização:
                          </strong>
                          <span className="font-semibold text-white">{rapidaResultado.sistemaAmortizacao}</span>
                        </div>
                        <div className="flex gap-4 pt-1">
                          <div>
                            <strong className="text-slate-400 uppercase text-[9px] block">Juros Efetivos:</strong>
                            <strong className="text-green-400 font-mono">{rapidaResultado.taxaJurosEfetiva}</strong>
                          </div>
                          <div>
                            <strong className="text-slate-400 uppercase text-[9px] block">Juros Nominais:</strong>
                            <strong className="text-slate-200 font-mono">{rapidaResultado.taxaJurosNominal}</strong>
                          </div>
                        </div>
                        <div className="pt-1">
                          <strong className="text-slate-400 uppercase text-[9px] block">Cota Máxima:</strong>
                          <span className="font-semibold text-white">
                            {rapidaResultado.cotaFinanciamento} (Máximo Permitido)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* COMPARATIVO PRICE-TR | SAC-TR (JANELA ABRE E FECHA) */}
                    <div className="mt-6 border border-[#30363d] rounded-lg overflow-hidden bg-[#161b22]">
                      <button
                        type="button"
                        onClick={() => setShowPriceSacComp(!showPriceSacComp)}
                        className="w-full flex items-center justify-between p-4 bg-[#1f242c] hover:bg-[#282e38] transition-colors focus:outline-none"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-black text-amber-400 tracking-wider">PRICE-TR</span>
                          <span className="text-[#30363d] text-xs font-bold">|</span>
                          <span className="text-sm font-black text-teal-400 tracking-wider">SAC-TR</span>
                          <span className="ml-2 text-[10px] bg-blue-950/80 text-blue-300 px-2 py-0.5 rounded-full font-bold uppercase border border-blue-800/40">
                            Detalhamento Comparativo (Abre/Fecha)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 uppercase font-bold hidden sm:inline">
                            {showPriceSacComp ? "Clique para fechar" : "Clique para abrir"}
                          </span>
                          {showPriceSacComp ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </div>
                      </button>

                      {showPriceSacComp && (
                        <div className="p-5 border-t border-[#30363d] bg-[#0d1117] space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Column 1: PRICE-TR */}
                            <div className="bg-[#161b22] border-2 border-amber-500/20 rounded-lg p-5 relative overflow-hidden">
                              <div className="absolute top-0 right-0 bg-amber-500/10 text-amber-400 text-[9px] font-black tracking-widest px-3 py-1 rounded-bl uppercase">
                                Série Price
                              </div>
                              <h5 className="text-amber-400 text-sm font-extrabold tracking-wide uppercase mb-4 flex items-center gap-2">
                                <span>📈</span> PRICE - TR
                              </h5>
                              <div className="space-y-3 text-xs text-slate-300">
                                <div className="flex justify-between py-1.5 border-b border-[#30363d]/50">
                                  <span className="text-[#8b949e]">Parcela Única (Fixa):</span>
                                  <strong className="text-amber-400 font-mono text-sm">
                                    R$ {parseFloat(rapidaResultado.parcelaPrice || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </strong>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-[#30363d]/50">
                                  <span className="text-[#8b949e]">Primeira Parcela:</span>
                                  <span className="font-mono">
                                    R$ {parseFloat(rapidaResultado.parcelaPrice || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-[#30363d]/50">
                                  <span className="text-[#8b949e]">Última Parcela (Mês {rapidaResultado.prazoMeses}):</span>
                                  <span className="font-mono">
                                    R$ {parseFloat(rapidaResultado.parcelaPrice || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-[#30363d]/50">
                                  <span className="text-[#8b949e]">Valor Financiado:</span>
                                  <span className="font-mono">
                                    R$ {parseFloat(rapidaResultado.valorFinanciado || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-[#30363d]/50">
                                  <span className="text-[#8b949e]">Entrada Necessária:</span>
                                  <span className="font-mono">
                                    R$ {parseFloat(rapidaResultado.valorEntrada || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-[#30363d]/50">
                                  <span className="text-[#8b949e]">Total Geral Pago:</span>
                                  <strong className="font-mono text-slate-200">
                                    R$ {parseFloat(rapidaResultado.totalPagoPrice || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </strong>
                                </div>
                                <div className="pt-2">
                                  <p className="text-[10px] text-slate-400 italic">
                                    💡 A Tabela Price possui parcelas iniciais menores que a SAC, porém o saldo devedor amortiza de forma mais lenta, resultando em maior acúmulo de juros ao fim do prazo.
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Column 2: SAC-TR */}
                            <div className="bg-[#161b22] border-2 border-teal-500/20 rounded-lg p-5 relative overflow-hidden">
                              <div className="absolute top-0 right-0 bg-teal-500/10 text-teal-400 text-[9px] font-black tracking-widest px-3 py-1 rounded-bl uppercase">
                                Série Constante
                              </div>
                              <h5 className="text-teal-400 text-sm font-extrabold tracking-wide uppercase mb-4 flex items-center gap-2">
                                <span>📉</span> SAC - TR
                              </h5>
                              <div className="space-y-3 text-xs text-slate-300">
                                <div className="flex justify-between py-1.5 border-b border-[#30363d]/50">
                                  <span className="text-[#8b949e]">Primeira Parcela (SAC):</span>
                                  <strong className="text-teal-400 font-mono text-sm">
                                    R$ {parseFloat(rapidaResultado.parcelaMaxima || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </strong>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-[#30363d]/50">
                                  <span className="text-[#8b949e]">Última Parcela (Mês {rapidaResultado.prazoMeses}):</span>
                                  <span className="font-mono text-teal-300 font-semibold">
                                    R$ {parseFloat(rapidaResultado.ultimaParcelaSac || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-[#30363d]/50">
                                  <span className="text-[#8b949e]">Amortização Mensal Fixa:</span>
                                  <span className="font-mono">
                                    R$ {((parseFloat(rapidaResultado.valorFinanciado || "0")) / (rapidaResultado.prazoMeses || 1)).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-[#30363d]/50">
                                  <span className="text-[#8b949e]">Valor Financiado:</span>
                                  <span className="font-mono">
                                    R$ {parseFloat(rapidaResultado.valorFinanciado || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-[#30363d]/50">
                                  <span className="text-[#8b949e]">Entrada Necessária:</span>
                                  <span className="font-mono">
                                    R$ {parseFloat(rapidaResultado.valorEntrada || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-[#30363d]/50">
                                  <span className="text-[#8b949e]">Total Geral Pago:</span>
                                  <strong className="font-mono text-slate-200">
                                    R$ {parseFloat(rapidaResultado.totalPagoSac || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </strong>
                                </div>
                                <div className="pt-2">
                                  <p className="text-[10px] text-slate-400 italic">
                                    💡 No Sistema de Amortização Constante (SAC), o valor pago diminui mensalmente. Como a dívida cai mais rápido, você paga muito menos juros acumulados ao final do contrato.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Comparison Insights */}
                          {parseFloat(rapidaResultado.totalPagoPrice || "0") > parseFloat(rapidaResultado.totalPagoSac || "0") && (
                            <div className="bg-emerald-950/40 border border-emerald-500/20 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-200">
                              <div>
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-0.5">Diferença Financeira (Economia Real)</span>
                                <span className="text-xs">Ao optar pelo regime <strong className="text-teal-400">SAC-TR</strong> em vez do <strong className="text-amber-400">PRICE-TR</strong>, a economia total estimada em juros é de:</span>
                              </div>
                              <div className="text-xl text-emerald-400 font-black font-mono tracking-tight shrink-0">
                                R$ {(parseFloat(rapidaResultado.totalPagoPrice || "0") - parseFloat(rapidaResultado.totalPagoSac || "0")).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>
                          )}

                          {/* Full Parameters Table */}
                          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 text-xs text-slate-300">
                            <h6 className="text-[#8b949e] font-bold uppercase text-[10px] tracking-wider mb-3">Parâmetros Gerais Aplicados</h6>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <span className="text-slate-400 block text-[9px] uppercase font-bold">Imóvel</span>
                                <strong className="font-mono text-white text-xs">
                                  R$ {parseFloat(rapidaResultado.valorImovel || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[9px] uppercase font-bold">Prazo Máximo</span>
                                <strong className="text-white text-xs">
                                  {rapidaResultado.prazoMeses} meses ({rapidaResultado.prazoAnos} anos)
                                </strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[9px] uppercase font-bold">Taxa de Juros</span>
                                <strong className="font-mono text-green-400 text-xs">{rapidaResultado.taxaJurosEfetiva}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[9px] uppercase font-bold">Cota Máxima</span>
                                <strong className="text-white text-xs">{rapidaResultado.cotaFinanciamento} (Máximo)</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : rapidaResultado && !rapidaResultado.sucesso ? (
                  <div className="bg-red-950/40 border border-red-500/30 p-4 rounded-lg text-red-300 text-sm font-semibold flex items-center gap-3">
                    <span>⚠️</span> {rapidaResultado.erro || "Idade limite excedida para financiamento."}
                  </div>
                ) : (
                  <div className="text-slate-400 text-sm py-4 text-center">
                    Aguardando preenchimento dos dados e clique em calcular...
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* TAB: SIMULADOR CUSTOMIZÁVEL */}
          <TabsContent value="customizado" className="space-y-6 focus-visible:outline-none">
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden shadow-2xl">
              {/* Header Técnico */}
              <div className="bg-gradient-to-br from-[#1f293d] to-[#161b22] p-6 border-b-2 border-[#d4af37] text-center relative">
                <h2 className="text-white text-xl md:text-2xl font-bold tracking-wider mb-1 uppercase font-sans">
                  IMOBSIMULADOR CORRETOR ELITE 4.0
                </h2>
                <span className="text-[#d4af37] text-[11px] font-extrabold uppercase tracking-widest block font-sans">
                  Módulo Avançado: Personalização de Regras e Tabelas Construtora
                </span>
              </div>

              {/* Workspace Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 bg-[#161b22] font-sans">
                {/* Form Roteiro (Left Side) */}
                <div className="flex flex-col gap-6">
                  {/* Passo 1 */}
                  <div className="bg-[#21262d] p-5 rounded-lg border-l-4 border-amber-500 transition-all shadow-md relative">
                    <div className="flex justify-between items-center border-b border-[#30363d] pb-2 mb-4">
                      <div className="text-sm font-bold text-[#d4af37] flex items-center gap-2 uppercase tracking-wide">
                        <span>📍</span> Passo 1: Parâmetros Iniciais da Proposta
                      </div>
                      <button
                        type="button"
                        onClick={handleAbrirModalSimulacao}
                        className="bg-slate-700/60 hover:bg-slate-700 border border-slate-600 hover:border-[#d4af37] text-amber-400 text-[10px] font-bold px-3 py-1.5 rounded transition-all flex items-center gap-1 uppercase cursor-pointer"
                      >
                        <span>⚡</span> Simulação Rápida
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#8b949e] mb-1.5 uppercase tracking-wider">
                          Valor Lançamento / Imóvel (R$){" "}
                          <span className="text-slate-500 font-normal italic">(Ex: R$ 270.000,00)</span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/30 focus:outline-none rounded text-white p-3 text-sm font-mono transition-all"
                          placeholder="270.000"
                          value={inValorImovel}
                          onChange={(e) => handleInValorImovelChange(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#8b949e] mb-1.5 uppercase tracking-wider">
                            Renda Familiar (R$){" "}
                            <span className="text-slate-500 font-normal italic">(Ex: R$ 5.000,00)</span>
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/30 focus:outline-none rounded text-white p-3 text-sm font-mono transition-all"
                            placeholder="5.000"
                            value={inRenda}
                            onChange={(e) => handleInRendaChange(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[#8b949e] mb-1.5 uppercase tracking-wider">
                            Data Nascimento Proponente
                          </label>
                          <input
                            type="date"
                            className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/30 focus:outline-none rounded text-white p-3 text-sm transition-all"
                            value={inDataNascimento}
                            onChange={(e) => setInDataNascimento(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[#8b949e] mb-1.5 uppercase tracking-wider">
                            Início das Mensais (CONTRATO)
                          </label>
                          <input
                            type="date"
                            className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/30 focus:outline-none rounded text-white p-3 text-sm transition-all"
                            value={inDataInicioFluxo}
                            onChange={(e) => setInDataInicioFluxo(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Passo 2 */}
                  <div className="bg-[#21262d] p-5 rounded-lg border-l-4 border-blue-500 transition-all shadow-md">
                    <div className="text-sm font-bold text-[#d4af37] border-b border-[#30363d] pb-2 mb-4 flex items-center gap-2 uppercase tracking-wide">
                      <span>⚙️</span> Passo 2: Abatimentos / Parcelamento Construtora
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#8b949e] mb-1.5 uppercase tracking-wider">
                            Uso do FGTS (R$)
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/30 focus:outline-none rounded text-white p-3 text-sm font-mono transition-all"
                            placeholder="10.000"
                            value={inFGTS}
                            onChange={(e) => setInFGTS(formatFloatToBr(e.target.value))}
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[#8b949e] mb-1.5 uppercase tracking-wider">
                            Percentual Ato (%)
                          </label>
                          <input
                            type="text"
                            className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/30 focus:outline-none rounded text-white p-3 text-sm font-mono transition-all"
                            placeholder="5"
                            value={inPercentualAto}
                            onChange={(e) => handleInPercentualAtoChange(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[#8b949e] mb-1.5 uppercase tracking-wider">
                            Ato Inicial à Vista (R$)
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/30 focus:outline-none rounded text-white p-3 text-sm font-mono transition-all"
                            placeholder="15.000"
                            value={inAtoVista}
                            onChange={(e) => handleInAtoVistaChange(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#8b949e] mb-1.5 uppercase tracking-wider">
                            Prazo Pró-Soluto (Total meses)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="180"
                            className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/30 focus:outline-none rounded text-white p-3 text-sm font-mono transition-all"
                            value={inPrazoTotal}
                            onChange={(e) => setInPrazoTotal(parseInt(e.target.value) || 0)}
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[#8b949e] mb-1.5 uppercase tracking-wider">
                            Quantidade Intermediárias
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/30 focus:outline-none rounded text-white p-3 text-sm font-mono transition-all"
                            value={inQtdIntermediarias}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              handleQtdIntermediariasChange(val);
                            }}
                          />
                        </div>
                      </div>

                      {/* Configurações das Intermediárias Dinâmicas */}
                      {inQtdIntermediarias > 0 && (
                        <div className="bg-[#161b22] p-4 rounded border border-[#30363d] space-y-3 mt-2">
                          <span className="block text-[10px] font-extrabold text-[#d4af37] uppercase tracking-wider mb-2">
                            Ajuste Balões Individuais (Fluxo Construtora)
                          </span>

                          <div className="max-h-[260px] overflow-y-auto pr-1 space-y-2.5">
                            {intermediarias.map((balao, index) => {
                              const calcMês = getMêsAnoPorNúmero(balao.mes);
                              return (
                                <div
                                  key={index}
                                  className="grid grid-cols-1 md:grid-cols-12 gap-2 p-2.5 bg-[#21262d] rounded border border-[#30363d]/50 items-end"
                                >
                                  <div className="md:col-span-4">
                                    <label className="block text-[10px] font-semibold text-[#8b949e] mb-1">
                                      Valor Balão #{index + 1} (R$)
                                    </label>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#d4af37] focus:outline-none text-white px-2 py-1.5 text-xs rounded font-mono"
                                      value={balao.valor}
                                      onChange={(e) => {
                                        const val = formatFloatToBr(e.target.value);
                                        setIntermediarias((prev) =>
                                          prev.map((b, idx) => (idx === index ? { ...b, valor: val } : b)),
                                        );
                                      }}
                                    />
                                  </div>
                                  <div className="md:col-span-5">
                                    <label className="block text-[10px] font-semibold text-[#8b949e] mb-1">
                                      Mês Cobrança #{index + 1}
                                    </label>
                                    <input
                                      type="text"
                                      placeholder={calcMês}
                                      title="Digite o nome do mês (ex: Mai/2027) para personalizar"
                                      className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#a5d6ff] focus:outline-none text-[#a5d6ff] px-2 py-1.5 text-xs rounded font-mono font-bold"
                                      value={balao.dataCustom || ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setIntermediarias((prev) =>
                                          prev.map((b, idx) => (idx === index ? { ...b, dataCustom: val } : b)),
                                        );
                                      }}
                                    />
                                  </div>
                                  <div className="md:col-span-3">
                                    <label className="block text-[10px] font-semibold text-[#8b949e] mb-1 text-right">
                                      Nº Mês
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      max="180"
                                      className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#d4af37] focus:outline-none text-white px-2 py-1.5 text-xs rounded font-mono text-center"
                                      value={balao.mes}
                                      onChange={(e) => {
                                        const m = parseInt(e.target.value) || 0;
                                        setIntermediarias((prev) =>
                                          prev.map((b, idx) => (idx === index ? { ...b, mes: m } : b)),
                                        );
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Passo 3 */}
                  <div className="bg-[#21262d] p-5 rounded-lg border-l-4 border-purple-500 transition-all shadow-md">
                    <div className="text-sm font-bold text-[#d4af37] border-b border-[#30363d] pb-2 mb-4 flex items-center gap-2 uppercase tracking-wide">
                      <span>⚡</span> Passo 3: Taxas Personalizadas (Até 6 Linhas)
                    </div>

                    <div className="space-y-2.5">
                      <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-[#8b949e] uppercase tracking-wider px-1">
                        <div className="col-span-5">Nome da Taxa / Fase</div>
                        <div className="col-span-2 text-center">% s/ Lançamento</div>
                        <div className="col-span-2 text-center">Período (x)</div>
                        <div className="col-span-3 text-right">Previsão (Data)</div>
                      </div>

                      {taxasCustom.map((taxa, index) => {
                        const numPrazo = parseInt(taxa.prazo) || 1;
                        const dataString =
                          numPrazo <= 1
                            ? getMêsAnoPorNúmero(1)
                            : `${getMêsAnoPorNúmero(1)} - ${getMêsAnoPorNúmero(numPrazo)}`;
                        return (
                          <div key={index} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-5">
                              <input
                                type="text"
                                placeholder={
                                  index === 0
                                    ? "Ex: Entrada Personalizada de (Contrato 1)"
                                    : `Ex: Taxa de Contrato ${index + 1}`
                                }
                                className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#d4af37] focus:outline-none text-white p-2 text-xs rounded"
                                value={taxa.nome}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setTaxasCustom((prev) => prev.map((t, i) => (i === index ? { ...t, nome: val } : t)));
                                }}
                              />
                            </div>
                            <div className="col-span-2 relative">
                              <input
                                type="text"
                                placeholder="0"
                                className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#d4af37] focus:outline-none text-white py-2 pl-2 pr-4 text-xs rounded font-mono text-center"
                                value={taxa.percentual}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9.]/g, "");
                                  setTaxasCustom((prev) =>
                                    prev.map((t, i) => (i === index ? { ...t, percentual: val } : t)),
                                  );
                                }}
                              />
                              <div className="absolute right-1 top-2.5 text-[9px] text-slate-500 font-bold select-none">
                                %
                              </div>
                            </div>
                            <div className="col-span-2 relative">
                              <input
                                type="number"
                                min="1"
                                max="180"
                                placeholder="1"
                                className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#d4af37] focus:outline-none text-white py-2 pl-2 pr-4 text-xs rounded font-mono text-center"
                                value={taxa.prazo}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setTaxasCustom((prev) =>
                                    prev.map((t, i) => (i === index ? { ...t, prazo: val } : t)),
                                  );
                                }}
                              />
                              <div className="absolute right-1 top-2.5 text-[9px] text-slate-500 font-bold select-none">
                                x
                              </div>
                            </div>
                            <div className="col-span-3 text-right">
                              <input
                                type="text"
                                placeholder={dataString}
                                title="Digite o vencimento/previsão customizado (ex: Jun/2026 - Nov/2026)"
                                className="w-full text-right bg-[#0d1117] border border-[#30363d] focus:border-[#d4af37] focus:outline-none text-amber-400 font-bold font-mono text-[10.5px] rounded p-2 placeholder-amber-500/40"
                                value={taxa.dataCustom || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setTaxasCustom((prev) =>
                                    prev.map((t, i) => (i === index ? { ...t, dataCustom: val } : t)),
                                  );
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Botão de Processamento Principal */}
                  <button
                    type="button"
                    onClick={() => {
                      setLastGeneratedInfo("OK");
                      toast.success("Simulação Customizada Gerada!", {
                        description: "As regras de negócio avançadas foram processadas e estruturadas com sucesso.",
                        duration: 4000,
                      });
                    }}
                    className="w-full bg-gradient-to-b from-[#e6c143] to-[#b3921b] text-[#0d1117] border border-amber-600 font-bold py-4 px-6 rounded text-md uppercase hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-[0_4px_12px_rgba(212,175,55,0.2)] flex items-center justify-center gap-2 cursor-pointer font-sans"
                  >
                    <span>📊</span> Gerar Simulação Customizada
                  </button>

                  {/* Aviso de Seguro */}
                  <div className="text-center bg-slate-900/40 p-4 rounded-lg border border-[#30363d]/50">
                    <small className="text-[#8b949e] text-xs leading-relaxed block">
                      ⚠️ <strong className="text-slate-300 font-semibold">Recomendação Técnica:</strong> Os valores
                      habitacionais calculados acima são estimativas aproximadas. Sugerimos realizar a simulação oficial
                      direta no{" "}
                      <a
                        href="https://simuladorhabitacao.caixa.gov.br/simulacao"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#d4af37] font-bold hover:text-amber-300 transition-colors underline decoration-dotted"
                      >
                        Simulador Habitacional Caixa
                      </a>
                      .
                    </small>
                  </div>
                </div>

                {/* Painel de Resultados (Right Side) */}
                <div className="bg-[#1f242c] border border-[#38444d] rounded-lg p-6 flex flex-col justify-between h-full gap-5">
                  <div>
                    <div className="font-bold text-[#d4af37] border-b border-[#30363d] pb-2 mb-4 flex items-center justify-between gap-2 text-md">
                      <div className="flex items-center gap-2">
                        <span>📊</span> Proposta Estruturada sob Medida
                      </div>
                      <div className="text-[10px] text-green-400 font-bold bg-green-950/80 border border-green-800 px-2 py-0.5 rounded uppercase select-none">
                        ✓ Processamento Ativo
                      </div>
                    </div>

                    <div className="text-xs text-[#d4af37] mb-4 bg-slate-900/60 p-3 rounded-md border border-[#30363d] font-mono flex items-center justify-between">
                      <span>MESA DE NEGOCIAÇÃO:</span>
                      <span className="text-white font-bold tracking-wider">IMOBSIMULADOR ELITE 4.0</span>
                    </div>

                    {!resCaixaCustom.sucesso ? (
                      <div className="bg-red-950/60 border border-red-700/50 p-4 rounded text-red-300 text-xs font-semibold leading-relaxed">
                        ⚠️ <strong>Erro no Cálculo de Aproximação Caixa:</strong>
                        <br />
                        {resCaixaCustom.erro || "Verifique se a data de nascimento e renda bruta estão adequadas."}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-[#30363d]">
                              <th className="pb-3 text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                                Parâmetro de Fluxo Técnico
                              </th>
                              <th className="pb-3 text-right text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                                Valores Calculados
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#30363d]">
                            <tr>
                              <td className="py-3 text-slate-300 font-medium text-xs">Valor Lançamento / Imóvel</td>
                              <td className="py-3 text-right font-mono font-bold text-white text-xs">
                                {formatCurrency(valorImovelCustom)}
                              </td>
                            </tr>

                            <tr>
                              <td className="py-3 text-slate-300 font-medium text-xs">
                                Financiamento Estimado Caixa (
                                {((financiamentoCaixa / valorImovelCustom) * 100).toFixed(2)}%)
                              </td>
                              <td className="py-3 text-right font-mono font-bold text-white text-xs">
                                {formatCurrency(financiamentoCaixa)}
                              </td>
                            </tr>

                            <tr>
                              <td className="py-3 text-slate-300 font-medium text-xs">
                                Primeira Prestação de Financiamento Caixa (SAC / TR)
                              </td>
                              <td className="py-3 text-right font-mono font-bold text-green-400 text-xs">
                                {formatCurrency(primeiraParcelaCaixa)}{" "}
                                <span className="text-[10px] font-sans font-normal text-slate-400">/mês</span>
                              </td>
                            </tr>

                            <tr>
                              <td className="py-3 text-slate-300 font-medium text-xs">Abatimento por Uso de FGTS</td>
                              <td className="py-3 text-right font-mono font-bold text-white text-xs">
                                {formatCurrency(valorFGTSCustom)}
                              </td>
                            </tr>

                            <tr>
                              <td className="py-3 text-slate-300 font-medium text-xs">Ato Inicial à Vista Real</td>
                              <td className="py-3 text-right font-mono font-bold text-white text-xs">
                                {formatCurrency(atoVistaCustom)}
                              </td>
                            </tr>

                            <tr>
                              <td className="py-3 text-slate-300 font-medium text-xs">
                                Total Alocado em Intermediárias ({inQtdIntermediarias} Balões)
                              </td>
                              <td className="py-3 text-right font-mono font-bold text-white text-xs">
                                {formatCurrency(totalIntermediarias)}
                              </td>
                            </tr>

                            {/* SALDO BASE RESTANTE PRÓ SOLUTO INICIAL - DESTAQUE OURO */}
                            <tr className="bg-amber-950/20 border-y border-amber-900/50">
                              <td className="py-3.5 pl-2 text-[#d4af37] font-bold text-xs uppercase tracking-wide">
                                Saldo Base Restante Pró-Soluto Inicial
                              </td>
                              <td className="py-3.5 pr-2 text-right font-mono font-black text-[#d4af37] text-sm">
                                {formatCurrency(saldoProSolutoInicial)}
                              </td>
                            </tr>

                            {/* MÊS 1 AO PARCELAS INICIAIS: CONFIGURÁVEL - DESTAQUE ATENÇÃO CONDICIONAL */}
                            <tr
                              className={
                                parcelaIniciaisTaxaAtoMensal === 0
                                  ? "border-b border-[#30363d]"
                                  : "bg-neutral-900/60 border-b border-[#30363d]"
                              }
                            >
                              <td
                                className={`py-3.5 pl-2 text-xs ${parcelaIniciaisTaxaAtoMensal === 0 ? "text-slate-400 font-medium" : "text-white font-semibold"}`}
                              >
                                Mês 1 ao {inMesesIniciais}{" "}
                                <span className="text-amber-400 font-mono text-[10px]">
                                  (
                                  {taxasCustom[0]?.dataCustom ||
                                    `${getMêsAnoPorNúmero(1)} - ${getMêsAnoPorNúmero(inMesesIniciais || 1)}`}
                                  )
                                </span>
                                : {taxasCustom[0]?.nome || "Parcelas Iniciais"} ({inPercentualIniciais}% do Lançamento)
                              </td>
                              <td
                                className={`py-3.5 pr-2 text-right text-xs font-mono  ${parcelaIniciaisTaxaAtoMensal === 0 ? "text-slate-300 font-bold" : "text-white font-bold"}`}
                              >
                                {formatCurrency(parcelaIniciaisTaxaAtoMensal)}{" "}
                                <span className="text-[10px] font-sans font-normal text-slate-400">/mês</span>
                              </td>
                            </tr>

                            {/* MÊS SEGUINTE AO PRAZO TOTAL: PARCELAS RESTANTES PRÓ-SOLUTO - DESTAQUE AZUL */}
                            <tr className="bg-blue-950/10 border-b border-blue-950/40">
                              <td className="py-3.5 pl-2 text-blue-400 font-semibold text-xs">
                                Mês {inMesesIniciais + 1} ao {inPrazoTotal}{" "}
                                <span className="text-blue-300 font-mono text-[10px]">
                                  ({getMêsAnoPorNúmero(inMesesIniciais + 1)} - {getMêsAnoPorNúmero(inPrazoTotal)})
                                </span>
                                : Parcelas Restantes Pró-Soluto
                              </td>
                              <td className="py-3.5 pr-2 text-right font-mono font-black text-blue-400 text-xs text-shining">
                                {formatCurrency(parcelaMensalRestante > 0 ? parcelaMensalRestante : 0)}{" "}
                                <span className="text-[10px] font-sans font-normal text-slate-400">/mês</span>
                              </td>
                            </tr>

                            {/* Loop de Taxas Customizadas calculadas dinamicamente */}
                            {listTaxasCalculadas.map((taxa, key) => {
                              const numP = taxa.prazo;
                              const taxDateString =
                                taxa.dataCustom ||
                                (numP <= 1
                                  ? getMêsAnoPorNúmero(1)
                                  : `${getMêsAnoPorNúmero(1)} - ${getMêsAnoPorNúmero(numP)}`);
                              return (
                                <tr key={key} className="bg-red-950/10 border-b border-red-900/30">
                                  <td className="py-3.5 pl-2 text-red-300 font-medium text-xs">
                                    {taxa.nome}{" "}
                                    <span className="text-red-400 font-mono text-[10px]">({taxDateString})</span> (
                                    {taxa.percentual}% em {taxa.prazo}x)
                                  </td>
                                  <td className="py-3.5 pr-2 text-right font-mono font-bold text-red-300 text-xs">
                                    {formatCurrency(taxa.valorParcela)}{" "}
                                    <span className="text-[10px] font-sans font-normal text-slate-400">/mês</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Linha de Renda Mínima Exigida */}
                    <div className="bg-[#1f293d]/50 border border-[#30363d] p-4 rounded-lg flex justify-between items-center transition-all hover:bg-[#1f293d]/70">
                      <div className="text-left">
                        <span className="block text-xs font-bold text-[#388bfd] uppercase tracking-wide">
                          Renda Mínima Exigida (30% Max)
                        </span>
                        <span className="text-[10px] text-slate-400 italic">
                          Comprometimento Mensal Construtora (1º Período)
                        </span>
                      </div>
                      <h3 className="text-[#d4af37] text-xl font-bold font-mono">
                        {formatCurrency(rendaMinimaExigidaReal)}
                      </h3>
                    </div>

                    {/* Detalhamento do Comprometimento por Período */}
                    <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-lg space-y-3">
                      <span className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
                        Análise de Comprometimento Mensal (Fase de Obras)
                      </span>

                      <div className="space-y-3.5">
                        {/* Período Inicial */}
                        <div className="bg-[#0d1117] p-3 rounded border border-[#30363d]/60">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-slate-300 font-medium">
                              Mês 1 ao {inMesesIniciais}{" "}
                              <span className="text-amber-400 font-mono text-[10px]">
                                (
                                {taxasCustom[0]?.dataCustom ||
                                  `${getMêsAnoPorNúmero(1)} - ${getMêsAnoPorNúmero(inMesesIniciais || 1)}`}
                                )
                              </span>
                              : {taxasCustom[0]?.nome || "Parcelas Iniciais"}
                            </span>
                            <span className="text-xs font-mono font-bold text-white">
                              {formatCurrency(parcelaIniciaisTaxaAtoMensal)} /mês
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-400 font-sans">Comprometimento da Renda</span>
                            <span
                              className={`text-xs font-mono font-bold ${
                                rendaCustom > 0 && parcelaIniciaisTaxaAtoMensal / rendaCustom > 0.3
                                  ? "text-red-400"
                                  : "text-green-400"
                              }`}
                            >
                              {rendaCustom > 0 ? ((parcelaIniciaisTaxaAtoMensal / rendaCustom) * 100).toFixed(1) : 0}%{" "}
                              <span className="text-[10px] font-sans font-normal text-slate-500">
                                de {formatCurrency(rendaCustom)}
                              </span>
                            </span>
                          </div>
                          {/* Progress bar visually representing the commitment */}
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                rendaCustom > 0 && parcelaIniciaisTaxaAtoMensal / rendaCustom > 0.3
                                  ? "bg-red-500"
                                  : "bg-green-500"
                              }`}
                              style={{
                                width: `${Math.min(100, rendaCustom > 0 ? (parcelaIniciaisTaxaAtoMensal / rendaCustom) * 100 : 0)}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Período Restante */}
                        <div className="bg-[#0d1117] p-3 rounded border border-[#30363d]/60">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-slate-300 font-medium">
                              Mês {inMesesIniciais + 1} ao {inPrazoTotal}{" "}
                              <span className="text-[#388bfd] font-mono text-[10px]">
                                ({getMêsAnoPorNúmero(inMesesIniciais + 1)} - {getMêsAnoPorNúmero(inPrazoTotal)})
                              </span>
                              : Parcelas Restantes Pró-Soluto
                            </span>
                            <span className="text-xs font-mono font-bold text-white">
                              {formatCurrency(parcelaMensalRestante > 0 ? parcelaMensalRestante : 0)} /mês
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-400 font-sans">Comprometimento da Renda</span>
                            <span
                              className={`text-xs font-mono font-bold ${
                                rendaCustom > 0 && parcelaMensalRestante / rendaCustom > 0.3
                                  ? "text-red-400"
                                  : "text-green-400"
                              }`}
                            >
                              {rendaCustom > 0 ? ((parcelaMensalRestante / rendaCustom) * 100).toFixed(1) : 0}%{" "}
                              <span className="text-[10px] font-sans font-normal text-slate-500">
                                de {formatCurrency(rendaCustom)}
                              </span>
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                rendaCustom > 0 && parcelaMensalRestante / rendaCustom > 0.3
                                  ? "bg-red-500"
                                  : "bg-green-500"
                              }`}
                              style={{
                                width: `${Math.min(100, rendaCustom > 0 ? (parcelaMensalRestante / rendaCustom) * 100 : 0)}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* 3ª Análise: Parcelas Adicionais e Balões nos meses de pico */}
                        {mesesComAdicionais.length > 0 && (
                          <div className="bg-[#1b1510] p-3 rounded border border-amber-600/30 space-y-2">
                            <span className="block text-xs font-bold text-amber-400 uppercase tracking-wide flex justify-between items-center">
                              <span>⚠️ Parcelas Intermediárias & Adicionais</span>
                              <span className="text-[9px] font-normal text-slate-400 capitalize">
                                ({mesesComAdicionais.length} meses de pico)
                              </span>
                            </span>

                            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                              {mesesComAdicionais.map((item, idx) => {
                                const pctComprometimento = rendaCustom > 0 ? item.totalVal / rendaCustom : 0;
                                const isRendaExcedida = pctComprometimento > 0.3;
                                return (
                                  <div
                                    key={idx}
                                    className="bg-[#0d1117] p-2 rounded border border-amber-500/10 hover:border-amber-500/30 transition-all text-left"
                                  >
                                    <div className="flex justify-between items-start mb-1 gap-2">
                                      <div className="text-left">
                                        <span className="text-xs font-bold text-white block">
                                          Mês {item.numMes}{" "}
                                          <span className="text-amber-400 font-mono text-[10px]">
                                            ({item.dataLabel})
                                          </span>
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-sans block leading-tight mt-0.5">
                                          Componentes: {item.itensNomes.join(", ")}
                                        </span>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-xs font-mono font-black text-amber-300 block">
                                          {formatCurrency(item.totalVal)}
                                        </span>
                                        <span className="text-[9px] text-slate-500 font-sans block">
                                          (Mensal: {formatCurrency(item.baseVal)})
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex justify-between items-center mt-1 text-[9px]">
                                      <span className="text-slate-400 font-sans">Comprometimento da Renda:</span>
                                      <span
                                        className={`font-mono font-bold ${isRendaExcedida ? "text-red-400" : "text-green-400"}`}
                                      >
                                        {(pctComprometimento * 100).toFixed(1)}%{" "}
                                        <span className="text-slate-500 font-normal">
                                          de {formatCurrency(rendaCustom)}
                                        </span>
                                      </span>
                                    </div>

                                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-1.5">
                                      <div
                                        className={`h-full rounded-full transition-all duration-300 ${isRendaExcedida ? "bg-red-500" : "bg-green-500"}`}
                                        style={{ width: `${Math.min(100, pctComprometimento * 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Teto máximo do cliente */}
                        <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-[#30363d]/50">
                          <span>30% Máximo Indicado s/ Renda (Margem Segura):</span>
                          <span className="font-mono text-[#d4af37] font-bold">
                            {formatCurrency(rendaCustom * 0.3)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Perfil de Risco */}
                    <div className="bg-[#121102]/60 border border-[#8b6d11]/40 p-4 rounded-lg flex justify-between items-center">
                      <span className="text-xs font-bold text-[#d4af37] uppercase tracking-wide">
                        Classificação de Risco de Crédito
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border transition-all duration-200 ${
                          riscoCredito === "BAIXO RISCO"
                            ? "bg-green-950/80 border-green-700 text-green-400"
                            : "bg-red-950/80 border-red-700 text-red-500"
                        }`}
                      >
                        {riscoCredito}
                      </span>
                    </div>

                    {/* Caixa Geral de Extras (Original HTML styles updated to BLUE theme) */}
                    <div className="bg-[#0c1626] border border-[#388bfd]/50 p-4 rounded-lg flex justify-between items-center transition-all hover:bg-[#111e33]">
                      <span className="text-xs text-[#388bfd] font-semibold leading-tight uppercase tracking-wider">
                        Total Entrada Personalizadas:
                        <br />
                        <span className="text-[10px] font-normal text-[#388bfd]/80 lowercase italic">
                          (amortizado {inMesesIniciais}m + entradas personalizadas)
                        </span>
                      </span>
                      <h3 className="text-[#388bfd] text-xl font-bold font-mono">
                        {formatCurrency(totalTaxasCalculado)}
                      </h3>
                    </div>

                    {/* Botões de Exportação do Customizado */}
                    <div className="grid grid-cols-2 gap-3 pt-3 no-print">
                      <Button
                        type="button"
                        onClick={handleExportPDF}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 text-xs uppercase"
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Exportar PDF
                      </Button>
                      <Button
                        type="button"
                        onClick={handleEnviarWhatsApp}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 text-xs uppercase"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 0: AJUSTE DE PERCENTUAIS */}
          <TabsContent value="percentuais" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Dados Básicos */}
              <Card className="bg-slate-800 border-slate-700 lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-white">Dados Básicos</CardTitle>
                  <CardDescription>Informações do imóvel</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Valor do Imóvel</Label>
                    <CurrencyInput
                      value={state.valorImovel}
                      onChange={(val) => handleNumericStateChange("valorImovel", val)}
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Prazo (meses)</Label>
                    <Input
                      type="number"
                      value={state.prazoParcela}
                      onChange={(e) => handleInputChange("prazoParcela", e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Qtd. Primeiras Mensais</Label>
                    <Input
                      type="number"
                      value={state.qtdPrimeirasMensais}
                      onChange={(e) => handleInputChange("qtdPrimeirasMensais", e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Painel de Percentuais */}
              <div className="lg:col-span-2">
                <PercentualAdjustmentPanel
                  valorImovel={state.valorImovel}
                  percentualAto={state.percentualAto}
                  percentualPrimeiras={state.percentualPrimeiras}
                  onAtoChange={handlePercentualAtoChange}
                  onPrimeirasChange={handlePercentualPrimeirasChange}
                />
              </div>
            </div>
          </TabsContent>

          {/* TAB 1: SUGESTÃO DE ENTRADA */}
          <TabsContent value="entrada" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dados Básicos */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Dados Básicos do Imóvel</CardTitle>
                  <CardDescription>Informações principais da negociação</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Valor do Imóvel</Label>
                    <CurrencyInput
                      value={state.valorImovel}
                      onChange={(val) => handleNumericStateChange("valorImovel", val)}
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Prazo de Parcelamento (meses)</Label>
                    <Input
                      type="number"
                      value={state.prazoParcela}
                      onChange={(e) => handleInputChange("prazoParcela", e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Sugestão de Pagamento */}
              <Card className="bg-gradient-to-br from-amber-900 to-amber-950 border-amber-700">
                <CardHeader>
                  <CardTitle className="text-amber-100">Sugestão de Pagamento</CardTitle>
                  <CardDescription className="text-amber-200">
                    Estrutura recomendada ({state.percentualAto.toFixed(1)}% ATO + 70% FIN + 1% VIST)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-amber-800 rounded-lg">
                    <span className="text-amber-100">Ato ({state.percentualAto.toFixed(1)}%)</span>
                    <span className="text-lg font-bold text-amber-300">
                      {formatCurrency(calculated.sugestaoAto || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-amber-800 rounded-lg">
                    <span className="text-amber-100">Financiamento (70%)</span>
                    <span className="text-lg font-bold text-amber-300">
                      {formatCurrency(calculated.sugestaoFinanciamento || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-amber-800 rounded-lg">
                    <span className="text-amber-100">Vistoria (1%)</span>
                    <span className="text-lg font-bold text-amber-300">
                      {formatCurrency(calculated.sugestaoVistoria || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-amber-700 rounded-lg border border-amber-600">
                    <span className="text-amber-100">Parcelado em {state.prazoParcela}x</span>
                    <span className="text-lg font-bold text-amber-200">
                      {formatCurrency(calculated.sugestaoParcelado || 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Entrada Editável */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Entrada Editável</CardTitle>
                <CardDescription>Customize os valores da entrada conforme negociação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-slate-300">Ato</Label>
                    <CurrencyInput
                      value={state.valorAto}
                      onChange={(val) => handleNumericStateChange("valorAto", val)}
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Financiamento</Label>
                    <CurrencyInput
                      value={state.valorFinanciamento}
                      onChange={(val) => handleNumericStateChange("valorFinanciamento", val)}
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">FGTS</Label>
                    <CurrencyInput
                      value={state.valorFgts}
                      onChange={(val) => handleNumericStateChange("valorFgts", val)}
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Vistoria</Label>
                    <CurrencyInput
                      value={state.valorVistoria}
                      onChange={(val) => handleNumericStateChange("valorVistoria", val)}
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resumo da Entrada */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Resumo da Entrada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-slate-700 rounded">
                    <span className="text-slate-300">Total da Entrada</span>
                    <span className="text-white font-bold">
                      {formatCurrency(state.valorAto + state.valorFinanciamento + state.valorVistoria)}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-700 rounded">
                    <span className="text-slate-300">Percentual do Imóvel</span>
                    <span className="text-white font-bold">
                      {(
                        ((state.valorAto + state.valorFinanciamento + state.valorVistoria) / state.valorImovel) *
                        100
                      ).toFixed(2)}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-700 rounded">
                    <span className="text-slate-300">Saldo a Parcelar</span>
                    <span className="text-white font-bold">{formatCurrency(calculated.saldoMensal || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: FLUXO PERSONALIZADO */}
          <TabsContent value="fluxo" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Primeiras Parcelas</CardTitle>
                <CardDescription>Defina a quantidade e valor das primeiras parcelas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-slate-300">Quantidade de Primeiras Mensais</Label>
                    <Input
                      type="number"
                      value={state.qtdPrimeirasMensais}
                      onChange={(e) => handleInputChange("qtdPrimeirasMensais", e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Valor Calculado</Label>
                    <div className="mt-2 p-3 bg-slate-700 rounded text-white font-bold">
                      {formatCurrency(calculated.primeirasMensais || 0)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300">Total (Ato + Primeiras)</Label>
                    <div className="mt-2 p-3 bg-amber-700 rounded text-amber-100 font-bold">
                      {formatCurrency(state.valorAto + state.qtdPrimeirasMensais * (calculated.primeirasMensais || 0))}
                    </div>
                  </div>
                </div>

                {/* Demonstrativo Detalhado do Cálculo */}
                <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-700 mt-4 space-y-4">
                  <div className="flex border-b border-slate-800 pb-2">
                    <h4 className="text-amber-400 font-bold text-sm tracking-wide uppercase">
                      Demonstrativo de Fechamento (Matemática da Entrada)
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-3">
                      <div className="flex justify-between border-b border-slate-800 pb-1">
                        <span className="text-slate-400">Ato (Valor pago à Vista):</span>
                        <span className="text-white font-bold">{formatCurrency(state.valorAto)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-1">
                        <span className="text-slate-400">
                          Parcelamento sugerido em {state.qtdPrimeirasMensais}x ({state.percentualPrimeiras}% do
                          imóvel):
                        </span>
                        <span className="text-white font-bold">
                          {formatCurrency(state.qtdPrimeirasMensais * (calculated.primeirasMensais || 0))}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 font-bold text-base">
                        <span className="text-amber-200">
                          Total Entrada ({(state.percentualAto + state.percentualPrimeiras).toFixed(2)}%):
                        </span>
                        <span className="text-amber-300">
                          {formatCurrency(
                            state.valorAto + state.qtdPrimeirasMensais * (calculated.primeirasMensais || 0),
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700 space-y-2.5">
                      <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                        COMO O VALOR DA PARCELA É CALCULADO:
                      </p>

                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Base de Parcelamento ({state.percentualPrimeiras}% do Imóvel):</span>
                        <span>{formatCurrency(state.valorImovel * (state.percentualPrimeiras / 100))}</span>
                      </div>

                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Quantidade de Parcelas de Entrada:</span>
                        <span>{state.qtdPrimeirasMensais}x meses</span>
                      </div>

                      <div className="border-t border-slate-700 my-1.5"></div>

                      <div className="flex justify-between text-xs font-extrabold text-green-300">
                        <span>Valor Final da Parcela ({state.qtdPrimeirasMensais}x):</span>
                        <span className="text-sm">{formatCurrency(calculated.primeirasMensais || 0)} por mês</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Faixas de Parcelas */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Faixas de Parcelas Mensais</CardTitle>
                <CardDescription>Customize o fluxo de pagamento em até 4 faixas diferentes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Faixa 1 */}
                <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                  <h4 className="text-white font-semibold mb-3">Faixa 1</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300">Quantidade de Meses</Label>
                      <Input
                        type="number"
                        value={state.faixa1Qtd}
                        onChange={(e) => handleInputChange("faixa1Qtd", e.target.value)}
                        className="bg-slate-600 border-slate-500 text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Valor da Parcela</Label>
                      <CurrencyInput
                        value={state.faixa1Valor}
                        onChange={(val) => handleNumericStateChange("faixa1Valor", val)}
                        className="bg-slate-600 border-slate-500 text-white mt-2"
                      />
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-slate-600 rounded text-slate-200 text-sm">
                    Total: {formatCurrency(state.faixa1Qtd * state.faixa1Valor)}
                  </div>
                </div>

                {/* Faixa 2 */}
                <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                  <h4 className="text-white font-semibold mb-3">Faixa 2</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300">Quantidade de Meses</Label>
                      <Input
                        type="number"
                        value={state.faixa2Qtd}
                        onChange={(e) => handleInputChange("faixa2Qtd", e.target.value)}
                        className="bg-slate-600 border-slate-500 text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Valor da Parcela</Label>
                      <CurrencyInput
                        value={state.faixa2Valor}
                        onChange={(val) => handleNumericStateChange("faixa2Valor", val)}
                        className="bg-slate-600 border-slate-500 text-white mt-2"
                      />
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-slate-600 rounded text-slate-200 text-sm">
                    Total: {formatCurrency(state.faixa2Qtd * state.faixa2Valor)}
                  </div>
                </div>

                {/* Faixa 3 */}
                <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                  <h4 className="text-white font-semibold mb-3">Faixa 3</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300">Quantidade de Meses</Label>
                      <Input
                        type="number"
                        value={state.faixa3Qtd}
                        onChange={(e) => handleInputChange("faixa3Qtd", e.target.value)}
                        className="bg-slate-600 border-slate-500 text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Valor da Parcela</Label>
                      <CurrencyInput
                        value={state.faixa3Valor}
                        onChange={(val) => handleNumericStateChange("faixa3Valor", val)}
                        className="bg-slate-600 border-slate-500 text-white mt-2"
                      />
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-slate-600 rounded text-slate-200 text-sm">
                    Total: {formatCurrency(state.faixa3Qtd * state.faixa3Valor)}
                  </div>
                </div>

                {/* Faixa 4 (Calculada) */}
                <div className="p-4 bg-gradient-to-br from-green-900 to-green-950 rounded-lg border border-green-700">
                  <h4 className="text-green-100 font-semibold mb-3">Faixa 4 (Calculada Automaticamente)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-green-200">Quantidade de Meses</Label>
                      <div className="mt-2 p-3 bg-green-800 rounded text-green-100 font-bold">
                        {calculated.faixa4Qtd || 0}
                      </div>
                    </div>
                    <div>
                      <Label className="text-green-200">Valor da Parcela (R$)</Label>
                      <div className="mt-2 p-3 bg-green-800 rounded text-green-100 font-bold">
                        {formatCurrency(calculated.faixa4Valor || 0)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-green-800 rounded text-green-200 text-sm">
                    Total: {formatCurrency((calculated.faixa4Qtd || 0) * (calculated.faixa4Valor || 0))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total do Fluxo */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Total do Fluxo Personalizado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-slate-700 rounded-lg">
                    <span className="text-slate-300">Ato</span>
                    <span className="text-white font-bold">{formatCurrency(state.valorAto)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-700 rounded-lg">
                    <span className="text-slate-300">Financiamento</span>
                    <span className="text-white font-bold">{formatCurrency(state.valorFinanciamento)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-700 rounded-lg">
                    <span className="text-slate-300">FGTS</span>
                    <span className="text-white font-bold">{formatCurrency(state.valorFgts)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-700 rounded-lg">
                    <span className="text-slate-300">Vistoria</span>
                    <span className="text-white font-bold">{formatCurrency(state.valorVistoria)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-700 rounded-lg">
                    <span className="text-slate-300">Parcelas (Faixa 1-4)</span>
                    <span className="text-white font-bold">
                      {formatCurrency(
                        state.faixa1Qtd * state.faixa1Valor +
                          state.faixa2Qtd * state.faixa2Valor +
                          state.faixa3Qtd * state.faixa3Valor +
                          (calculated.faixa4Qtd || 0) * (calculated.faixa4Valor || 0),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-amber-700 rounded-lg border border-amber-600 text-lg">
                    <span className="text-amber-100 font-semibold">TOTAL GERAL</span>
                    <span className="text-amber-200 font-bold">
                      {formatCurrency(calculated.totalFluxoPersonalizado || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: RESUMO EXECUTIVO */}
          <TabsContent value="resumo" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Indicadores Principais */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Indicadores Principais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-slate-700 rounded-lg">
                    <p className="text-slate-400 text-sm">Valor do Imóvel</p>
                    <p className="text-white text-xl font-bold">{formatCurrency(state.valorImovel)}</p>
                  </div>
                  <div className="p-3 bg-slate-700 rounded-lg">
                    <p className="text-slate-400 text-sm">Prazo Total</p>
                    <p className="text-white text-xl font-bold">{state.prazoParcela} meses</p>
                  </div>
                  <div className="p-3 bg-slate-700 rounded-lg">
                    <p className="text-slate-400 text-sm">Saldo a Parcelar</p>
                    <p className="text-white text-xl font-bold">{formatCurrency(calculated.saldoMensal || 0)}</p>
                  </div>
                  <div className="p-3 bg-slate-700 rounded-lg">
                    <p className="text-slate-400 text-sm">Comissão de Repasse (3%)</p>
                    <p className="text-white text-xl font-bold">{formatCurrency(calculated.comissaoRepasse || 0)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Análise de Parcelas */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Análise de Parcelas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-slate-700 rounded-lg">
                    <p className="text-slate-400 text-sm">Primeiras Mensais (Valor)</p>
                    <p className="text-white text-xl font-bold">{formatCurrency(calculated.primeirasMensais || 0)}</p>

                    {/* Demonstração rápida detalhada solicitada pelo usuário */}
                    <div className="mt-2.5 pt-2 border-t border-slate-700/40 text-xs text-slate-300 space-y-1 bg-slate-900/40 p-2.5 rounded">
                      <p className="font-bold text-amber-400/90 uppercase tracking-wide text-[10px] mb-1">
                        Como este valor é composto:
                      </p>
                      <p>
                        • Ato (À Vista):{" "}
                        <span className="text-white font-medium">{formatCurrency(state.valorAto)}</span>
                      </p>
                      <p>
                        • {state.qtdPrimeirasMensais}x Parcelas de:{" "}
                        <span className="text-white font-medium">
                          {formatCurrency(calculated.primeirasMensais || 0)}
                        </span>{" "}
                        <span className="text-slate-400">
                          (Soma: {formatCurrency(state.qtdPrimeirasMensais * (calculated.primeirasMensais || 0))})
                        </span>
                      </p>
                      <p className="font-semibold text-green-300">
                        Total Entrada (Ato + {state.qtdPrimeirasMensais} Parcelas):{" "}
                        {formatCurrency(
                          state.valorAto + state.qtdPrimeirasMensais * (calculated.primeirasMensais || 0),
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400 italic pt-1">
                        Fórmula: Parcelamento de {state.percentualPrimeiras}% do imóvel (
                        {formatCurrency(state.valorImovel * (state.percentualPrimeiras / 100))}) dividido por{" "}
                        {state.qtdPrimeirasMensais} meses. O Ato ({state.percentualAto}%) é pago integralmente à vista.
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-700 rounded-lg">
                    <p className="text-slate-400 text-sm">Demais Mensais (Valor)</p>
                    <p className="text-white text-xl font-bold">{formatCurrency(calculated.demaisMensais || 0)}</p>
                  </div>
                  <div className="p-3 bg-slate-700 rounded-lg">
                    <p className="text-slate-400 text-sm">Mensais Lineares (Sugestão)</p>
                    <p className="text-white text-xl font-bold">{formatCurrency(calculated.mensaisLineares || 0)}</p>
                  </div>
                  <div className="p-3 bg-slate-700 rounded-lg">
                    <p className="text-slate-400 text-sm">Meses Restantes (Faixa 4)</p>
                    <p className="text-white text-xl font-bold">{calculated.faixa4Qtd || 0}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Validação Final */}
            <Card
              className={`border-2 ${isValidEntrada ? "bg-green-950 border-green-700" : "bg-red-950 border-red-700"}`}
            >
              <CardHeader>
                <CardTitle className={isValidEntrada ? "text-green-100" : "text-red-100"}>
                  {isValidEntrada ? "✓ Negociação Validada" : "✗ Negociação Inválida"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div
                    className={`p-3 rounded-lg ${isValidEntrada ? "bg-green-900 text-green-100" : "bg-red-900 text-red-100"}`}
                  >
                    <p className="font-semibold">Status da Entrada</p>
                    <p className="text-sm mt-1">{calculated.validacaoEntrada}</p>
                  </div>
                  <div
                    className={`p-3 rounded-lg ${isValidEntrada ? "bg-green-900 text-green-100" : "bg-red-900 text-red-100"}`}
                  >
                    <p className="font-semibold">Entrada + {state.qtdPrimeirasMensais} Primeiras Parcelas</p>
                    <p className="text-sm mt-1">
                      {formatCurrency(state.valorAto + state.qtdPrimeirasMensais * (calculated.primeirasMensais || 0))}{" "}
                      (
                      {(
                        ((state.valorAto + state.qtdPrimeirasMensais * (calculated.primeirasMensais || 0)) /
                          state.valorImovel) *
                        100
                      ).toFixed(2)}
                      % do imóvel)
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-lg ${isValidEntrada ? "bg-green-900 text-green-100" : "bg-red-900 text-red-100"}`}
                  >
                    <p className="font-semibold">
                      Mínimo Exigido ({(state.percentualAto + state.percentualPrimeiras).toFixed(1)}%)
                    </p>
                    <p className="text-sm mt-1">
                      {formatCurrency(state.valorImovel * ((state.percentualAto + state.percentualPrimeiras) / 100))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-4 no-print">
              <Button
                onClick={handleExportPDF}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 shadow-lg transition-transform active:scale-95"
              >
                <Printer className="w-4 h-4 mr-2" />
                Exportar para PDF
              </Button>
              <Button
                onClick={handleEnviarWhatsApp}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 shadow-lg transition-transform active:scale-95"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Enviar para WhatsApp
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => setState(INITIAL_STATE)}
              >
                Resetar Valores
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {isModalSimulacaoOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-[1000] p-4 animate-fade-in">
          <div className="bg-[#161b22] border border-[#30363d] border-t-4 border-t-[#d4af37] p-6 w-full max-w-md rounded-lg shadow-2xl relative flex flex-col">
            <div className="flex justify-between items-center border-b border-[#30363d] pb-3 mb-4">
              <h3 className="text-white text-md font-bold flex items-center gap-2">
                <span>⚡</span> Preencher Dados da Simulação Rápida
              </h3>
              <button
                type="button"
                onClick={() => setIsModalSimulacaoOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-[#8b949e] mb-1.5 uppercase tracking-wider">
                  Valor Lançamento / Imóvel (R$)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ex: 270.000 (R$ 270.000,00)"
                  className="w-full h-11 bg-[#0d1117] border border-[#30363d] text-white px-3 text-sm rounded focus:border-[#d4af37] focus:outline-none focus:ring-1 focus:ring-[#d4af37]/30 transition-all font-mono"
                  value={simValorImovel}
                  onChange={(e) => setSimValorImovel(formatFloatToBr(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8b949e] mb-1.5 uppercase tracking-wider">
                  Renda Familiar (R$)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ex: 12.700 (R$ 12.700,00)"
                  className="w-full h-11 bg-[#0d1117] border border-[#30363d] text-white px-3 text-sm rounded focus:border-[#d4af37] focus:outline-none focus:ring-1 focus:ring-[#d4af37]/30 transition-all font-mono"
                  value={simRenda}
                  onChange={(e) => setSimRenda(formatFloatToBr(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8b949e] mb-1.5 uppercase tracking-wider">
                  Data de Nascimento (DD/MM/AAAA)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                  className="w-full h-11 bg-[#0d1117] border border-[#30363d] text-white px-3 text-sm rounded focus:border-[#d4af37] focus:outline-none focus:ring-1 focus:ring-[#d4af37]/30 transition-all font-mono"
                  value={simDataNascimento}
                  onChange={(e) => handleDataNascimentoChange(e.target.value)}
                />
              </div>
            </div>

            {/* Seções de Resultados da Simulação Rápida */}
            {simResultado && (
              <div className="bg-[#0d1117] border border-[#d4af37]/30 rounded-lg p-4 mb-5 animate-fade-in space-y-3">
                <div className="text-xs font-bold text-[#d4af37] border-b border-[#30363d] pb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📊</span> Resultados da Simulação Habitacional
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-[#8b949e]">
                  <div>
                    Idade: <span className="text-white font-bold">{simResultado.idade} anos</span>
                  </div>
                  <div>
                    Prazo Máximo:{" "}
                    <span className="text-white font-bold">
                      {simResultado.prazoMeses} meses ({simResultado.prazoAnos} anos)
                    </span>
                  </div>
                </div>

                <div className="bg-[#161b22] border border-[#30363d] p-3 rounded-md divide-y divide-[#30363d]/50 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#8b949e]">Parcela Máxima (30% renda):</span>
                    <span className="text-amber-400 font-mono font-bold text-sm">
                      {simResultado.parcelaMaxima.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mês
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-2">
                    <span className="text-[#8b949e]">Financiamento Caixa:</span>
                    <span className="text-green-400 font-mono font-bold text-sm">
                      {simResultado.valorFinanciado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-amber-500/90 leading-relaxed font-semibold text-center pt-1">
                  ⚠️ Deseja aplicar estes valores para ajustar as travas e taxas da construtora na planilha agora?
                </div>

                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setSimResultado(null)}
                    className="bg-[#21262d] border border-[#30363d] text-slate-300 px-3.5 py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Refazer
                  </button>
                  <button
                    type="button"
                    onClick={handleAplicarSimulacaoRapida}
                    className="bg-gradient-to-r from-amber-500 to-[#b3921b] text-[#0d1117] px-4 py-2 rounded text-xs font-bold uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Sim, aplicar!
                  </button>
                </div>
              </div>
            )}

            {/* Elementos ocultos com IDs exatos para compatibilidade com os scripts externos fornecidos */}
            <div style={{ display: "none" }}>
              <div id="resultadoFinanciamento">
                {simResultado
                  ? `R$ ${parseFloat(simResultado.valorFinanciado.toFixed(2)).toLocaleString("pt-BR")}`
                  : ""}
              </div>
              <div id="resultadoParcela">
                {simResultado ? `R$ ${parseFloat(simResultado.parcelaMaxima.toFixed(2)).toLocaleString("pt-BR")}` : ""}
              </div>
              <div id="resultadoPrazo">
                {simResultado ? `${simResultado.prazoMeses} meses (${simResultado.prazoAnos} anos)` : ""}
              </div>
            </div>

            <div className="flex gap-3 justify-end border-t border-[#30363d]/50 pt-4">
              <button
                type="button"
                onClick={() => setIsModalSimulacaoOpen(false)}
                className="bg-[#21262d] border border-[#30363d] text-[#c9d1d9] px-4 py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-[#30363d] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              {!simResultado && (
                <button
                  type="button"
                  onClick={handleExecutarSimulacaoRapida}
                  className="bg-gradient-to-r from-amber-500 to-[#b3921b] text-[#0d1117] px-5 py-2 rounded text-xs font-bold uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Calcular
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
