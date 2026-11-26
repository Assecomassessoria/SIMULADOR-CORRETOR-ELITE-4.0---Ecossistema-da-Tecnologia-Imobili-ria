import { useState, useEffect } from "react";
import { Settings, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  validatePassword,
  getMcmvRules,
  getMcmvRateForRenda,
  saveMcmvRules,
  DEFAULT_MCMV_RULES,
  type McmvRule,
} from "@/lib/eliteUtils";

export function formatarMoedaSimulacao40(valor: string): string {
  const num = valor.replace(/\D/g, "").slice(0, 12);
  if (!num) return "";
  const cents = parseInt(num, 10);
  if (!Number.isFinite(cents) || cents === 0) return "";
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseMoedaSimulacao40(v: string): number {
  if (!v) return 0;
  return parseFloat(v.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
}

export function parseLocalIsoDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.trim().split("-");
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const dt = new Date(y, m, d);
  if (
    Number.isNaN(dt.getTime()) ||
    dt.getFullYear() !== y ||
    dt.getMonth() !== m ||
    dt.getDate() !== d
  ) {
    return null;
  }
  return dt;
}

export function calcularPrazoMaxPorIdade(nascInput: string, hoje: Date = new Date()): number | null {
  const nasc = parseLocalIsoDate(nascInput);
  if (!nasc) return null;
  let idadeMeses =
    (hoje.getFullYear() - nasc.getFullYear()) * 12 + (hoje.getMonth() - nasc.getMonth());
  if (hoje.getDate() < nasc.getDate()) idadeMeses--;
  return Math.max(0, Math.min(420, 966 - idadeMeses - 1));
}

export interface ResultadoData {
  faixa: string;
  meses: number;
  taxa: number;
  subsidio: number;
  cotaFinan: number;
  vFinan: number;
  entrada: number;
  prestacao: number;
  maxPermitido: number;
}

export interface Simulacao40Outcome {
  ok: boolean;
  error?: string;
  data?: ResultadoData;
}

export function calcularSimulacaoRapida40(params: {
  imovel: number;
  renda: number;
  dataNascimento: string;
  dependentes: boolean;
  prazoInformado: number;
  sistema: "PRICE" | "SAC";
  rules?: McmvRule[];
  hoje?: Date;
}): Simulacao40Outcome {
  const {
    imovel,
    renda,
    dataNascimento,
    dependentes,
    prazoInformado,
    sistema,
    rules = getMcmvRules(),
    hoje = new Date(),
  } = params;

  if (!Number.isFinite(imovel) || imovel <= 0) {
    return { ok: false, error: "Informe o valor do imóvel para calcular." };
  }
  if (!Number.isFinite(renda) || renda <= 0) {
    return { ok: false, error: "Informe a renda bruta familiar para calcular." };
  }
  if (!dataNascimento) {
    return { ok: false, error: "Informe a data de nascimento." };
  }

  const maxPorIdade = calcularPrazoMaxPorIdade(dataNascimento, hoje);
  if (maxPorIdade === null) {
    return { ok: false, error: "Data de nascimento inválida." };
  }
  if (maxPorIdade < 1) {
    return {
      ok: false,
      error: "Idade acima do limite permitido para financiamento habitacional (80 anos e 6 meses).",
    };
  }

  const prazoValido = prazoInformado > 0 ? prazoInformado : maxPorIdade;
  const n = Math.max(1, Math.min(prazoValido, maxPorIdade, 420));

  const rateResult = getMcmvRateForRenda(renda, rules);
  const rule = rateResult.rule;

  // 1. SUBSÍDIO POR FAIXA COM REDUTOR DE IMÓVEL (Calibrado Caixa)
  const redutorImovel = Math.max(0, (imovel - 170000) * 0.383);
  let subsidio = 0;

  if (rule && rule.subsidioMax > 0) {
    if (rule.faixa === "Faixa 1") {
      if (renda <= 1412) {
        subsidio = rule.subsidioMax - redutorImovel;
      } else {
        const denom = Math.max(1, rule.rendaMax - 1412);
        const factor = (renda - 1412) / denom;
        subsidio = rule.subsidioMax - factor * (rule.subsidioMax - 35000) - redutorImovel;
      }
    } else if (rule.faixa === "Faixa 2") {
      const f1Rule = rules.find((r) => r.faixa === "Faixa 1");
      const f1Max = f1Rule ? f1Rule.rendaMax : 3200;
      const denom = Math.max(1, rule.rendaMax - f1Max);
      const factor = (renda - f1Max) / denom;
      subsidio = 35000 - factor * (35000 - 20000) - redutorImovel;
    } else {
      subsidio = rule.subsidioMax - redutorImovel;
    }
  }

  if (renda > 4400 && imovel > 240000) subsidio = 0;
  if (!dependentes) subsidio *= 0.7;
  subsidio = Math.max(0, subsidio);

  // 2. TAXA E ENCARGOS (Calibrados Caixa)
  const taxaAnualNominal = rateResult.taxaNominal;
  const taxaMensal = taxaAnualNominal / 12;
  const encargos = 69.95; // Taxa de administração + Seguros MIP/DFI médios

  // 3. CAPACIDADE DE PAGAMENTO (30% da renda bruta máxima permitida)
  const parcelaMaxima = renda * 0.3;
  const parcelaPura = Math.max(0, parcelaMaxima - encargos);

  let vFinanCalculado = 0;
  if (sistema === "PRICE") {
    vFinanCalculado =
      taxaMensal > 0
        ? parcelaPura * ((1 - Math.pow(1 + taxaMensal, -n)) / taxaMensal)
        : parcelaPura * n;
  } else {
    // SAC: PV = ParcelaPura / (TaxaMensal + (1 / n))
    vFinanCalculado = parcelaPura / (taxaMensal + 1 / n);
  }

  // 4. APLICAÇÃO DE COTA (Máximo 80% do Imóvel)
  const cotaMaxima = 0.8;
  const limiteCota = imovel * cotaMaxima;
  const vFinan = Math.max(0, Math.min(limiteCota, vFinanCalculado));

  // 5. RESULTADOS FINAIS
  const cotaFinan = imovel > 0 ? (vFinan / imovel) * 100 : 0;

  let prestacao = 0;
  if (vFinan > 0) {
    if (sistema === "PRICE") {
      const pmtPura =
        taxaMensal > 0
          ? vFinan * (taxaMensal / (1 - Math.pow(1 + taxaMensal, -n)))
          : vFinan / n;
      prestacao = pmtPura + encargos;
    } else {
      prestacao = vFinan / n + vFinan * taxaMensal + encargos;
    }
  }

  return {
    ok: true,
    data: {
      faixa: rateResult.faixa,
      meses: n,
      taxa: rateResult.taxaNominal * 100,
      subsidio,
      cotaFinan,
      vFinan,
      entrada: Math.max(0, imovel - vFinan - subsidio),
      prestacao,
      maxPermitido: 420,
    },
  };
}

export default function Simulacao40() {
  const [vImovel, setVImovel] = useState("");
  const [vRenda, setVRenda] = useState("");
  const [vNasc, setVNasc] = useState("");
  const [vDep, setVDep] = useState("sim");
  const [vPrazo, setVPrazo] = useState(420);
  const [vSist, setVSist] = useState<"PRICE" | "SAC">("PRICE");
  const [resultado, setResultado] = useState<ResultadoData | null>(null);
  const [erroCalculo, setErroCalculo] = useState<string | null>(null);
  const [msgPrazo, setMsgPrazo] = useState("");
  const [admOpen, setAdmOpen] = useState(false);
  const [admSenha, setAdmSenha] = useState("");
  const [admLogado, setAdmLogado] = useState(false);
  const [admLoading, setAdmLoading] = useState(false);
  const [mcmvRules, setMcmvRules] = useState<McmvRule[]>([]);

  useEffect(() => {
    setMcmvRules(getMcmvRules());
  }, [admLogado]);

  const atualizarPrazoAutomatico = (nascInput: string) => {
    const nMax = calcularPrazoMaxPorIdade(nascInput);
    if (nMax === null) {
      setMsgPrazo("");
      return;
    }
    setVPrazo(nMax);
    setMsgPrazo(nMax < 420 ? `*Limite por idade: ${nMax} meses` : "");
  };

  const handleNascChange = (val: string) => {
    setVNasc(val);
    setErroCalculo(null);
    atualizarPrazoAutomatico(val);
  };

  const calcular = () => {
    const imovel = parseMoedaSimulacao40(vImovel);
    const renda = parseMoedaSimulacao40(vRenda);

    const outcome = calcularSimulacaoRapida40({
      imovel,
      renda,
      dataNascimento: vNasc,
      dependentes: vDep === "sim",
      prazoInformado: vPrazo,
      sistema: vSist,
    });

    if (!outcome.ok || !outcome.data) {
      const message = outcome.error || "Não foi possível calcular a simulação.";
      setErroCalculo(message);
      setResultado(null);
      toast.error(message);
      return;
    }

    setErroCalculo(null);
    setResultado(outcome.data);
    toast.success("Simulação calculada com sucesso.");
  };

  const br = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleAdminLogin = async () => {
    if (admLoading) return;
    setAdmLoading(true);
    try {
      const result = await validatePassword(admSenha, "admin");
      if (result.valid) {
        setAdmLogado(true);
        toast.success("Painel de regras liberado.");
      } else {
        toast.error("Senha de administrador incorreta.");
      }
    } catch {
      toast.error("Erro ao validar senha. Tente novamente.");
    } finally {
      setAdmLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-primary text-secondary py-4 px-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setAdmOpen(!admOpen)}
            className="p-1.5 rounded hover:bg-secondary/20 transition-colors"
            title="Manutenção"
          >
            <Settings className="w-4 h-4 text-secondary" />
          </button>
          <h2 className="text-sm font-bold uppercase tracking-wider flex-1 text-center">
            Simulador Habitacional 2026
          </h2>
          <div className="w-7" />
        </div>

        {/* Painel Admin */}
        {admOpen && (
          <div className="bg-muted border-b border-border p-4 space-y-3">
            {!admLogado ? (
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={admSenha}
                  onChange={(e) => setAdmSenha(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      void handleAdminLogin();
                    }
                  }}
                  placeholder="Senha de administrador"
                  disabled={admLoading}
                  className="flex-1 px-3 py-2 border border-border rounded text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => void handleAdminLogin()}
                  disabled={admLoading}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded text-xs font-bold uppercase disabled:opacity-50 flex items-center gap-1"
                >
                  {admLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" /> Verificando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-primary uppercase tracking-wide">
                    Regras do Motor de Cálculo MCMV
                  </h4>
                  <span className="text-[10px] font-bold text-primary uppercase">
                    Configurações Ativas
                  </span>
                </div>

                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Ajuste os limites de renda familiar, as taxas de juros nominais mínimas/máximas ao ano, limite máximo do imóvel e subsídio para cada Faixa do MCMV.
                </p>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {mcmvRules.map((rule, idx) => (
                    <div key={idx} className="bg-card border border-border/60 rounded-lg p-2.5 space-y-2.5 shadow-inner">
                      <div className="flex items-center justify-between border-b border-border/40 pb-1">
                        <span className="text-[10px] font-black text-gold uppercase tracking-wide">
                          {rule.faixa}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <label className="block text-[8px] font-bold text-muted-foreground uppercase mb-0.5">
                            Renda Máxima (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={rule.rendaMax}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              const next = [...mcmvRules];
                              next[idx] = { ...next[idx], rendaMax: val };
                              if (idx < next.length - 1) {
                                next[idx + 1] = {
                                  ...next[idx + 1],
                                  rendaMin: +(val + 0.01).toFixed(2),
                                };
                              }
                              setMcmvRules(next);
                            }}
                            className="w-full px-2 py-1 border border-border rounded text-[11px] bg-background font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-[8px] font-bold text-muted-foreground uppercase mb-0.5">
                            Taxa Mín (% a.a.)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={rule.taxaMin}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              const next = [...mcmvRules];
                              next[idx] = { ...next[idx], taxaMin: val };
                              setMcmvRules(next);
                            }}
                            className="w-full px-2 py-1 border border-border rounded text-[11px] bg-background font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-[8px] font-bold text-muted-foreground uppercase mb-0.5">
                            Taxa Máx (% a.a.)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={rule.taxaMax}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              const next = [...mcmvRules];
                              next[idx] = { ...next[idx], taxaMax: val };
                              setMcmvRules(next);
                            }}
                            className="w-full px-2 py-1 border border-border rounded text-[11px] bg-background font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-[8px] font-bold text-muted-foreground uppercase mb-0.5">
                            Teto Imóvel (R$)
                          </label>
                          <input
                            type="number"
                            step="1000"
                            value={rule.limiteImovelMax}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 0;
                              const next = [...mcmvRules];
                              next[idx] = { ...next[idx], limiteImovelMax: val };
                              setMcmvRules(next);
                            }}
                            className="w-full px-2 py-1 border border-border rounded text-[11px] bg-background font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-[8px] font-bold text-muted-foreground uppercase mb-0.5">
                            Subsídio Máximo (R$)
                          </label>
                          <input
                            type="number"
                            step="1000"
                            value={rule.subsidioMax}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              const next = [...mcmvRules];
                              next[idx] = { ...next[idx], subsidioMax: val };
                              setMcmvRules(next);
                            }}
                            className="w-full px-2 py-1 border border-border rounded text-[11px] bg-background font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      saveMcmvRules(mcmvRules);
                      toast.success("Parâmetros do motor de cálculo salvos com sucesso!");
                    }}
                    className="flex-1 py-1.5 bg-primary text-secondary font-bold text-[11px] uppercase rounded hover:opacity-95 transition-opacity"
                  >
                    Salvar Regras
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMcmvRules(DEFAULT_MCMV_RULES);
                      saveMcmvRules(DEFAULT_MCMV_RULES);
                      toast.success("Parâmetros originais restaurados com sucesso!");
                    }}
                    className="px-2.5 py-1.5 bg-muted text-muted-foreground font-bold text-[11px] uppercase rounded hover:bg-border transition-colors border border-border"
                  >
                    Padrão
                  </button>
                </div>

                <div className="flex justify-between items-center border-t border-border/40 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdmOpen(false);
                      setAdmLogado(false);
                      setAdmSenha("");
                    }}
                    className="text-[10px] text-destructive hover:underline"
                  >
                    Sair do Painel
                  </button>
                  <span className="text-[8px] text-muted-foreground font-mono">
                    ELITE V4.0 MOTOR
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                Valor do Imóvel (R$)
              </label>
              <div className="flex items-center border border-border rounded-md bg-card focus-within:ring-1 focus-within:ring-gold focus-within:border-gold">
                <span className="pl-3 text-sm text-muted-foreground font-bold">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={vImovel}
                  placeholder="0,00"
                  onChange={(e) => {
                    setVImovel(formatarMoedaSimulacao40(e.target.value));
                    setErroCalculo(null);
                  }}
                  className="flex-1 px-2 py-2.5 text-sm bg-transparent tabular-nums focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                Renda Bruta (R$)
              </label>
              <div className="flex items-center border border-border rounded-md bg-card focus-within:ring-1 focus-within:ring-gold focus-within:border-gold">
                <span className="pl-3 text-sm text-muted-foreground font-bold">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={vRenda}
                  placeholder="0,00"
                  onChange={(e) => {
                    setVRenda(formatarMoedaSimulacao40(e.target.value));
                    setErroCalculo(null);
                  }}
                  className="flex-1 px-2 py-2.5 text-sm bg-transparent tabular-nums focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                Data de Nascimento
              </label>
              <input
                type="date"
                value={vNasc}
                onChange={(e) => handleNascChange(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold bg-card"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                Dependentes / 2º Comprador?
              </label>
              <select
                value={vDep}
                onChange={(e) => setVDep(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold bg-card"
              >
                <option value="sim">Sim</option>
                <option value="nao">Não (Individual)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                Prazo Amortização (Meses)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={420}
                  value={vPrazo}
                  onChange={(e) => setVPrazo(parseInt(e.target.value, 10) || 0)}
                  className="flex-1 px-3 py-2.5 border border-border rounded-md text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold bg-card"
                />
                <span className="text-xs font-bold text-primary whitespace-nowrap">Meses</span>
              </div>
              {msgPrazo && (
                <span className="text-destructive text-[11px] font-bold mt-1 block">{msgPrazo}</span>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">Sistema</label>
              <select
                value={vSist}
                onChange={(e) => setVSist(e.target.value === "SAC" ? "SAC" : "PRICE")}
                className="w-full px-3 py-2.5 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold bg-card"
              >
                <option value="PRICE">PRICE (Tabela Price)</option>
                <option value="SAC">SAC (Decrescente)</option>
              </select>
            </div>
          </div>

          {erroCalculo && (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs font-semibold text-destructive"
            >
              {erroCalculo}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={calcular}
              className="flex-1 py-4 rounded-md font-bold text-sm uppercase tracking-wider gold-gradient text-primary hover:opacity-90 transition-opacity"
            >
              Calcular Simulação
            </button>
            <button
              type="button"
              onClick={() => {
                setVImovel("");
                setVRenda("");
                setVNasc("");
                setVDep("sim");
                setVPrazo(420);
                setVSist("PRICE");
                setResultado(null);
                setErroCalculo(null);
                setMsgPrazo("");
              }}
              className="px-6 py-4 rounded-md font-bold text-sm uppercase tracking-wider border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              Limpar
            </button>
          </div>

          {/* Resultado */}
          {resultado && (
            <div className="mt-5 p-5 rounded-lg bg-primary/5 border border-primary/20 space-y-0">
              <ResultRow label="Modalidade" value={resultado.faixa} />
              <ResultRow label="Prazo Disponível" value={`${resultado.meses} meses`} />
              <div className="py-1.5 border-b border-primary/10">
                <span className="text-[11px] text-muted-foreground leading-relaxed">
                  Limite de parcelas disponível para você <strong>{resultado.meses}</strong> meses, conforme o mês de
                  nascimento - <strong>{resultado.maxPermitido}</strong> máximo permitido.
                </span>
              </div>
              <ResultRow label="Taxa Nominal Aplicada" value={`${resultado.taxa.toFixed(2)}% a.a.`} />
              <ResultRow
                label="Subsídio (Desconto)"
                value={br(resultado.subsidio)}
                valueClassName="text-success"
              />
              <ResultRow label="Cota de Financiamento" value={`${resultado.cotaFinan.toFixed(2)}%`} />
              <ResultRow label="Valor Financiado" value={br(resultado.vFinan)} />
              <ResultRow label="Valor de Entrada" value={br(resultado.entrada)} />

              <div className="flex items-center justify-between pt-4 border-t border-primary/10 mt-2">
                <span className="text-sm font-bold text-foreground">Primeira Prestação:</span>
                <span className="text-2xl font-bold text-primary tabular-nums">
                  {br(resultado.prestacao)}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-[10px] text-muted-foreground leading-relaxed text-justify">
                  <span className="text-destructive font-bold text-[11px]">
                    Os resultados obtidos representam apenas uma simulação APROXIMADA e não valem como proposta.
                  </span>{" "}
                  Todos os valores de seguros, parcelas e taxas apresentados estão sujeitos a alterações de acordo com a
                  apuração da capacidade de pagamento e a aprovação da análise de crédito a ser efetuada pela CAIXA.
                  Mesmo após a emissão do contrato, valores serão ajustados de acordo com a correção monetária
                  contratada. Poderá haver alterações das taxas, dos prazos máximos e das demais condições, sem aviso
                  prévio. A contratação está condicionada à disponibilidade de recursos para sua região e ao atendimento
                  das exigências do programa.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-primary/10 last:border-0">
      <span className="text-xs text-foreground">{label}:</span>
      <strong className={`text-xs tabular-nums ${valueClassName || "text-foreground"}`}>{value}</strong>
    </div>
  );
}
