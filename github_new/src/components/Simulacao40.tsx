import { useState } from "react";
import { Settings, Loader2 } from "lucide-react";
import { validatePassword } from "@/lib/eliteUtils";

function formatarMoeda(valor: string): string {
  let num = valor.replace(/\D/g, "");
  const parsed = (parseInt(num) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return parsed === "NaN" || parsed === "0,00" ? "" : parsed;
}

function parseMoeda(v: string): number {
  return parseFloat(v.replace(/\./g, "").replace(",", ".")) || 0;
}

interface ResultadoData {
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

function calcularTaxa(
  renda: number,
  f1 = 4.25,
  f2 = 4.75,
  f3 = 7.66,
  f4 = 10.0,
  sbpe = 11.19,
): { t: number; f: string } {
  if (renda <= 3200) return { t: f1, f: "Faixa 1" };
  if (renda <= 5000) {
    const d = [
      { r: 3200.01, t: 4.5 },
      { r: 3400, t: f2 },
      { r: 3600, t: 5.0 },
      { r: 3900, t: 5.25 },
      { r: 4200, t: 5.5 },
      { r: 4300, t: 5.75 },
      { r: 4500, t: 6.0 },
      { r: 4600, t: 6.5 },
      { r: 4700, t: 7.0 },
      { r: 4800, t: 7.25 },
      { r: 4900, t: 7.5 },
      { r: 5000, t: f3 },
    ];
    let tx = f1;
    d.forEach((i) => {
      if (renda >= i.r) tx = i.t;
    });
    return { t: tx, f: "Faixa 2" };
  }
  if (renda <= 9600) {
    const saltos = Math.floor((renda - 5000.01) / 780);
    return { t: Math.min(8.16, f3 + saltos * 0.1), f: "Faixa 3" };
  }
  if (renda <= 13000.0) {
    const saltos = Math.floor((renda - 9600.01) / 680);
    return { t: Math.min(10.5, f4 + saltos * 0.1), f: "Faixa 4" };
  }
  return { t: sbpe, f: "SBPE" };
}

export default function Simulacao40() {
  const [vImovel, setVImovel] = useState("");
  const [vRenda, setVRenda] = useState("");
  const [vNasc, setVNasc] = useState("");
  const [vDep, setVDep] = useState("sim");
  const [vPrazo, setVPrazo] = useState(420);
  const [vSist, setVSist] = useState("PRICE");
  const [resultado, setResultado] = useState<ResultadoData | null>(null);
  const [msgPrazo, setMsgPrazo] = useState("");
  const [admOpen, setAdmOpen] = useState(false);
  const [admSenha, setAdmSenha] = useState("");
  const [admLogado, setAdmLogado] = useState(false);
  const [admLoading, setAdmLoading] = useState(false);
  const [admF1, setAdmF1] = useState(4.25);
  const [admF2, setAdmF2] = useState(4.75);
  const [admF3, setAdmF3] = useState(7.66);
  const [admF4, setAdmF4] = useState(10.0);
  const [admSBPE, setAdmSBPE] = useState(11.19);
  const [admSeguro, setAdmSeguro] = useState(25);

  const atualizarPrazoAutomatico = (nascInput: string) => {
    if (!nascInput) return;
    const nasc = new Date(nascInput);
    const hoje = new Date();
    let idadeMeses = (hoje.getFullYear() - nasc.getFullYear()) * 12 + (hoje.getMonth() - nasc.getMonth());
    if (hoje.getDate() < nasc.getDate()) idadeMeses--;
    const nMax = Math.min(420, 966 - idadeMeses - 1);
    setVPrazo(Math.max(0, nMax));
    setMsgPrazo(nMax < 420 ? `*Limite por idade: ${nMax} meses` : "");
  };

  const handleNascChange = (val: string) => {
    setVNasc(val);
    atualizarPrazoAutomatico(val);
  };

  const calcular = () => {
    const imovel = parseMoeda(vImovel);
    const renda = parseMoeda(vRenda);
    const dep = vDep === "sim";

    if (!vNasc) {
      alert("Informe a data de nascimento.");
      return;
    }

    const nasc = new Date(vNasc);
    const hoje = new Date();
    let idadeMeses = (hoje.getFullYear() - nasc.getFullYear()) * 12 + (hoje.getMonth() - nasc.getMonth());
    if (hoje.getDate() < nasc.getDate()) idadeMeses--;
    const n = Math.min(vPrazo, 966 - idadeMeses - 1, 420);

    const dt = calcularTaxa(renda, admF1, admF2, admF3, admF4, admSBPE);

    // 1. SUBSÍDIO POR FAIXA COM REDUTOR DE IMÓVEL (Calibrado Caixa)
    const redutorImovel = Math.max(0, (imovel - 170000) * 0.383);
    let subsidio = 0;

    if (renda <= 2850) {
      subsidio = 55000 - (renda - 1412) * 14.5 - redutorImovel;
    } else if (renda <= 4700) {
      subsidio = 35000 - (renda - 2850) * 19.0 - redutorImovel;
    } else if (renda <= 8600) {
      subsidio = 20000 - (renda - 4700) * 5.5 - redutorImovel;
    }

    if (renda > 4400 && imovel > 240000) subsidio = 0;
    if (!dep) subsidio *= 0.7;
    subsidio = Math.max(0, subsidio);

    // 2. TAXA E ENCARGOS (Calibrados para o Seguro Real da Caixa)
    const i = Math.pow(1 + dt.t / 100, 1 / 12) - 1;

    // O seguro da Caixa não é fixo. 0.00022 é o que faz os 230k gerarem a parcela de 960
    const taxaAdmCaixa = 25.0;
    const seguroMIP_DFI = imovel * 0.00022;
    const encargos = taxaAdmCaixa + seguroMIP_DFI;

    // 3. CAPACIDADE DE PAGAMENTO (A parcela de 30% manda no valor)
    const pDispTotal = renda * 0.3;
    const pDispPura = pDispTotal - encargos;

    let vMaxRenda;
    if (vSist === "PRICE") {
      vMaxRenda = pDispPura * ((Math.pow(1 + i, n) - 1) / (i * Math.pow(1 + i, n)));
    } else {
      // SAC: vMax = Parcela_Pura / (1/n + i)
      vMaxRenda = pDispPura / (1 / n + i);
    }

    // 4. APLICAÇÃO DE COTA E TRAVA
    const cotaMaxima = renda > 12000 && vSist === "PRICE" ? 0.7 : 0.8;
    let vFinan = Math.min(imovel * cotaMaxima, vMaxRenda);

    // 5. RESULTADOS FINAIS
    const cotaFinan = (vFinan / imovel) * 100;
    const pPura = vSist === "PRICE" ? (vFinan * i) / (1 - Math.pow(1 + i, -n)) : vFinan / n + vFinan * i;

    setResultado({
      faixa: dt.f,
      meses: n,
      taxa: dt.t,
      subsidio,
      cotaFinan,
      vFinan,
      entrada: Math.max(0, imovel - vFinan - subsidio),
      prestacao: pPura + encargos,
      maxPermitido: 420,
    });
  };

  const br = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleMoedaBlur = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(formatarMoeda(value));
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-primary text-secondary py-4 px-5 flex items-center justify-between">
          <button
            onClick={() => setAdmOpen(!admOpen)}
            className="p-1.5 rounded hover:bg-secondary/20 transition-colors"
            title="Manutenção"
          >
            <Settings className="w-4 h-4 text-secondary" />
          </button>
          <h2 className="text-sm font-bold uppercase tracking-wider flex-1 text-center">Simulador Habitacional 2026</h2>
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
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && !admLoading) {
                      setAdmLoading(true);
                      try {
                        const result = await validatePassword(admSenha, "admin");
                        if (result.valid) setAdmLogado(true);
                        else alert("Senha incorreta!");
                      } catch {
                        alert("Erro ao validar. Tente novamente.");
                      } finally {
                        setAdmLoading(false);
                      }
                    }
                  }}
                  placeholder="Senha de administrador"
                  disabled={admLoading}
                  className="flex-1 px-3 py-2 border border-border rounded text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
                <button
                  onClick={async () => {
                    if (admLoading) return;
                    setAdmLoading(true);
                    try {
                      const result = await validatePassword(admSenha, "admin");
                      if (result.valid) setAdmLogado(true);
                      else alert("Senha incorreta!");
                    } catch {
                      alert("Erro ao validar. Tente novamente.");
                    } finally {
                      setAdmLoading(false);
                    }
                  }}
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
              <>
                <h4 className="text-xs font-bold text-primary uppercase">Configurações Mestras</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "F1 Mín (%)", value: admF1, set: setAdmF1 },
                    { label: "F2 Mín (%)", value: admF2, set: setAdmF2 },
                    { label: "F3 Mín (%)", value: admF3, set: setAdmF3 },
                    { label: "F4 Mín (%)", value: admF4, set: setAdmF4 },
                    { label: "SBPE (%)", value: admSBPE, set: setAdmSBPE },
                    { label: "Seguro + Adm (R$)", value: admSeguro, set: setAdmSeguro },
                  ].map((item) => (
                    <div key={item.label}>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1">{item.label}</label>
                      <input
                        type="number"
                        value={item.value}
                        step={0.01}
                        onChange={(e) => item.set(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 border border-border rounded text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setAdmOpen(false);
                    setAdmLogado(false);
                    setAdmSenha("");
                  }}
                  className="text-xs text-destructive hover:underline"
                >
                  Fechar Painel
                </button>
              </>
            )}
          </div>
        )}

        {/* Form */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">Valor do Imóvel (R$)</label>
              <div className="flex items-center border border-border rounded-md bg-card focus-within:ring-1 focus-within:ring-gold focus-within:border-gold">
                <span className="pl-3 text-sm text-muted-foreground font-bold">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={vImovel}
                  placeholder="0,00"
                  onChange={(e) => setVImovel(formatarMoeda(e.target.value))}
                  className="flex-1 px-2 py-2.5 text-sm bg-transparent focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">Renda Bruta (R$)</label>
              <div className="flex items-center border border-border rounded-md bg-card focus-within:ring-1 focus-within:ring-gold focus-within:border-gold">
                <span className="pl-3 text-sm text-muted-foreground font-bold">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={vRenda}
                  placeholder="0,00"
                  onChange={(e) => setVRenda(formatarMoeda(e.target.value))}
                  className="flex-1 px-2 py-2.5 text-sm bg-transparent focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">Data de Nascimento</label>
              <input
                type="date"
                value={vNasc}
                onChange={(e) => handleNascChange(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold bg-card"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">Dependentes / 2º Comprador?</label>
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
              <label className="block text-xs font-bold text-muted-foreground mb-1">Prazo Amortização (Meses)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={vPrazo}
                  onChange={(e) => setVPrazo(parseInt(e.target.value) || 0)}
                  className="flex-1 px-3 py-2.5 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold bg-card"
                />
                <span className="text-xs font-bold text-primary whitespace-nowrap">Meses</span>
              </div>
              {msgPrazo && <span className="text-destructive text-[11px] font-bold mt-1 block">{msgPrazo}</span>}
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">Sistema</label>
              <select
                value={vSist}
                onChange={(e) => setVSist(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold bg-card"
              >
                <option value="PRICE">PRICE (Tabela Price)</option>
                <option value="SAC">SAC (Decrescente)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={calcular}
              className="flex-1 py-4 rounded-md font-bold text-sm uppercase tracking-wider gold-gradient text-primary hover:opacity-90 transition-opacity"
            >
              Calcular Simulação
            </button>
            <button
              onClick={() => {
                setVImovel("");
                setVRenda("");
                setVNasc("");
                setVDep("sim");
                setVPrazo(420);
                setVSist("PRICE");
                setResultado(null);
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
              <ResultRow label="Subsídio (Desconto)" value={br(resultado.subsidio)} valueClassName="text-success" />
              <ResultRow label="Cota de Financiamento" value={`${resultado.cotaFinan.toFixed(2)}%`} />
              <ResultRow label="Valor Financiado" value={br(resultado.vFinan)} />
              <ResultRow label="Valor de Entrada" value={br(resultado.entrada)} />

              <div className="flex items-center justify-between pt-4 border-t border-primary/10 mt-2">
                <span className="text-sm font-bold text-foreground">Primeira Prestação:</span>
                <span className="text-2xl font-bold text-primary">{br(resultado.prestacao)}</span>
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

function ResultRow({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-primary/10 last:border-0">
      <span className="text-xs text-foreground">{label}:</span>
      <strong className={`text-xs ${valueClassName || "text-foreground"}`}>{value}</strong>
    </div>
  );
}
