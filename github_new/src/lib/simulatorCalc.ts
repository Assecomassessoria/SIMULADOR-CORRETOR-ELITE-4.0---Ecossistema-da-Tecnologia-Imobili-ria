/**
 * SIMULADOR CORRETOR ELITE 4.0
 * Biblioteca de Cálculos Financeiros
 * 
 * Fórmulas baseadas no modelo de fechamento de mesa para mercado imobiliário de alto padrão.
 * Não utiliza amortização SAC ou Price - fluxo baseado em percentuais e valores diretos.
 */

interface SimulatorState {
  valorImovel: number;
  prazoParcela: number;
  valorAto: number;
  valorFinanciamento: number;
  valorFgts: number;
  valorVistoria: number;
  qtdPrimeirasMensais: number;
  faixa1Qtd: number;
  faixa1Valor: number;
  faixa2Qtd: number;
  faixa2Valor: number;
  faixa3Qtd: number;
  faixa3Valor: number;
  percentualAto?: number; // Novo: percentual dinâmico do Ato
  percentualPrimeiras?: number; // Novo: percentual dinâmico das Primeiras Parcelas
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

/**
 * Formata um número para formato de moeda brasileira
 * @param value Valor numérico
 * @returns String formatada em R$
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Calcula todas as fórmulas do simulador com suporte a percentuais dinâmicos
 * 
 * FÓRMULAS IMPLEMENTADAS:
 * - D11: Sugestão Ato = C8 * percentualAto (padrão 5%)
 * - D12: Sugestão Financiamento = 70% * C8
 * - D13: Sugestão FGTS = 0
 * - D14: Sugestão Vistoria = 1% * C8
 * - D16: Sugestão Parcelado = (C8 - D11 - D12 - D13 - D14) / C16
 * - D17: Sugestão Total = D11 + D12 + D13 + D14 + (C16 * D16)
 * - D31: Saldo Mensal = C8 - D22 - D25 - D30
 * - D32: Primeiras Mensais = ((C8 * percentualPrimeiras) - D22) / C32
 * - C34: Qtd Demais Mensais = C16 - C32
 * - D34: Demais Mensais = (C8 - D22 - D25 - D26 - D30 - (C32 * D32)) / C34
 * - D36: Mensais Lineares = (C8 - D22 - D25 - D26 - D30) / C16
 * - D37: Comissão Repasse = (C8 * 3%) / 7
 * - C42: Qtd Meses Faixa 4 = C16 - C39 - C40 - C41
 * - D42: Valor Mensal Faixa 4 = (D31 - D26 - (C39*D39) - (C40*D40) - (C41*D41)) / C42
 * - D44: Total Fluxo Personalizado = D22 + D25 + D26 + D30 + (C39*D39) + (C40*D40) + (C41*D41) + (C42*D42)
 * - F11: Validação OK Entrada = SE((D11 + (C32*D32)) >= (C8*8%); "OK ENTRADA"; "VERIFICAR")
 */
export function calculateSimulation(state: SimulatorState): CalculatedValues {
  // Usar percentuais dinâmicos ou padrões
  const percentualAto = state.percentualAto ?? 5;
  const percentualPrimeiras = state.percentualPrimeiras ?? 3;
  
  // ===== SUGESTÕES INICIAIS =====
  // D11: Sugestão Ato = percentualAto do valor do imóvel
  const sugestaoAto = state.valorImovel * (percentualAto / 100);
  
  // D12: Sugestão Financiamento = 70% do valor do imóvel
  const sugestaoFinanciamento = state.valorImovel * 0.70;
  
  // D13: Sugestão FGTS = 0 (padrão)
  const sugestaoFgts = 0;
  
  // D14: Sugestão Vistoria = 1% do valor do imóvel
  const sugestaoVistoria = state.valorImovel * 0.01;
  
  // D16: Sugestão Parcelado = (Valor Imóvel - Ato - Financiamento - FGTS - Vistoria) / Prazo
  const sugestaoParcelado = (state.valorImovel - sugestaoAto - sugestaoFinanciamento - sugestaoFgts - sugestaoVistoria) / state.prazoParcela;
  
  // D17: Sugestão Total = Ato + Financiamento + FGTS + Vistoria + (Prazo * Parcelado)
  const sugestaoTotal = sugestaoAto + sugestaoFinanciamento + sugestaoFgts + sugestaoVistoria + (state.prazoParcela * sugestaoParcelado);
  
  // ===== SALDO E PARCELAS =====
  // D31: Saldo Mensal = Valor Imóvel - Ato - Financiamento - Vistoria
  const saldoMensal = state.valorImovel - state.valorAto - state.valorFinanciamento - state.valorVistoria;
  
  // D32: Primeiras Mensais = (percentualPrimeiras% do Imóvel) / Qtd Primeiras Mensais
  // Nota: Primeiras Parcelas são calculadas sobre o percentual de parcelamento de entrada (padrão 3%)
  const primeirasMensais = (state.valorImovel * (percentualPrimeiras / 100)) / state.qtdPrimeirasMensais;
  
  // C34: Qtd Demais Mensais = Prazo Total - Primeiras Mensais
  const qtdDemaisMensais = state.prazoParcela - state.qtdPrimeirasMensais;
  
  // D34: Demais Mensais = (Saldo - FGTS - (Primeiras Mensais * Qtd Primeiras)) / Qtd Demais Mensais
  const demaisMensais = (saldoMensal - state.valorFgts - (state.qtdPrimeirasMensais * primeirasMensais)) / qtdDemaisMensais;
  
  // D36: Mensais Lineares = (Valor Imóvel - Ato - Financiamento - FGTS - Vistoria) / Prazo
  const mensaisLineares = (state.valorImovel - state.valorAto - state.valorFinanciamento - state.valorFgts - state.valorVistoria) / state.prazoParcela;
  
  // D37: Comissão Repasse = (3% do Imóvel) / 7
  const comissaoRepasse = (state.valorImovel * 0.03) / 7;
  
  // ===== FAIXAS PERSONALIZADAS =====
  // C42: Qtd Meses Faixa 4 = Prazo Total - Faixa1 - Faixa2 - Faixa3
  const faixa4Qtd = state.prazoParcela - state.faixa1Qtd - state.faixa2Qtd - state.faixa3Qtd;
  
  // D42: Valor Mensal Faixa 4 = (Saldo - FGTS - (Faixa1*Valor1) - (Faixa2*Valor2) - (Faixa3*Valor3)) / Faixa4Qtd
  const totalFaixas = (state.faixa1Qtd * state.faixa1Valor) + 
                      (state.faixa2Qtd * state.faixa2Valor) + 
                      (state.faixa3Qtd * state.faixa3Valor);
  
  const faixa4Valor = faixa4Qtd > 0 
    ? (saldoMensal - state.valorFgts - totalFaixas) / faixa4Qtd 
    : 0;
  
  // D44: Total Fluxo Personalizado = Ato + Financiamento + FGTS + Vistoria + (Faixa1+Faixa2+Faixa3+Faixa4)
  const totalFluxoPersonalizado = state.valorAto + 
                                  state.valorFinanciamento + 
                                  state.valorFgts + 
                                  state.valorVistoria + 
                                  totalFaixas + 
                                  (faixa4Qtd * faixa4Valor);
  
  // ===== VALIDAÇÃO =====
  // F11: Validação OK Entrada = SE((Ato + (Primeiras Mensais * Qtd Primeiras)) >= (C8 * targetPercentual); "OK ENTRADA"; "VERIFICAR")
  const targetPercentual = (percentualAto + percentualPrimeiras) / 100;
  const entradaTotal = state.valorAto + (state.qtdPrimeirasMensais * primeirasMensais);
  const minimoExigido = state.valorImovel * targetPercentual;
  const validacaoEntrada = entradaTotal >= (minimoExigido - 0.01) ? "OK ENTRADA" : "VERIFICAR";
  
  return {
    sugestaoAto,
    sugestaoFinanciamento,
    sugestaoFgts,
    sugestaoVistoria,
    sugestaoParcelado,
    sugestaoTotal,
    
    saldoMensal,
    primeirasMensais,
    qtdDemaisMensais,
    demaisMensais,
    mensaisLineares,
    comissaoRepasse,
    
    faixa4Qtd,
    faixa4Valor,
    totalFluxoPersonalizado,
    validacaoEntrada,
  };
}
