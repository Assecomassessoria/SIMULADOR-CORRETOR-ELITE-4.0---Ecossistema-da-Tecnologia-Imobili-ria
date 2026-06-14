import React, { useState, useEffect } from "react";
import { Users, Plus, Eye, EyeOff, FileText, X, Loader2, Building2 } from "lucide-react";
import { validatePassword } from "@/lib/eliteUtils";
import { supabase } from "@/integrations/supabase/client";

interface Corretor {
  id: string;
  nome: string;
  cpf: string;
  creci: string;
  whatsapp: string;
  email: string;
  pin: string;
  status: "ativo" | "inativo";
  dataCadastro: string;
}

interface CadastroComercialData {
  id?: string;
  razaoSocial: string;
  cpfCnpj: string;
  cidade: string;
  estado: string;
  plano: string;
  planoLabel: string;
  maxUsuarios: number;
  validade: number;
  senha: string;
  dataEnvio: string;
  dataExpiracao: string;
  whatsapp: string;
  email: string;
}

interface PainelComercialProps {
  isOpen: boolean;
  onClose: () => void;
}

function MasterGate({ onAuthenticated }: { onAuthenticated: (senha: string) => void }) {
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleValidate = async () => {
    if (!pass.trim()) {
      setError("Digite a senha do Painel Comercial.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await validatePassword(pass.trim(), "painel_comercial");
      if (result.valid) {
        onAuthenticated(pass.trim());
      } else {
        setError("Senha incorreta.");
        setPass("");
      }
    } catch {
      setError("Erro ao validar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-card rounded-xl border-2 border-gold/50 p-6 w-full max-w-xs text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-gold/10 flex items-center justify-center">
          <Users className="w-6 h-6 text-gold" />
        </div>
        <h3 className="text-primary font-bold uppercase text-sm">Painel Comercial</h3>
        <p className="text-muted-foreground text-xs">Digite a senha ELITE do contrato para acessar</p>
        <div className="relative">
          <input
            type={showPass ? "text" : "password"}
            value={pass}
            onChange={(e) => {
              setPass(e.target.value);
              setError("");
            }}
            placeholder="ELITE-XXXXXXXX"
            maxLength={20}
            onKeyDown={(e) => e.key === "Enter" && handleValidate()}
            className="w-full px-4 py-3 pr-10 text-lg font-bold tracking-widest text-center border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold bg-card"
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
            tabIndex={-1}
          >
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {error && <p className="text-destructive text-xs">{error}</p>}
        <button
          onClick={handleValidate}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-primary text-gold font-bold uppercase hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Verificando...
            </>
          ) : (
            "Acessar Painel"
          )}
        </button>
      </div>
    </div>
  );
}

export default function PainelComercial({ isOpen, onClose }: PainelComercialProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [senhaAcesso, setSenhaAcesso] = useState("");
  const [cadastro, setCadastro] = useState<CadastroComercialData | null>(null);
  const [corretores, setCorretores] = useState<Corretor[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: "", cpf: "", creci: "", whatsapp: "", email: "", pin: "" });
  const [formError, setFormError] = useState("");
  const [savingCorretor, setSavingCorretor] = useState(false);
  const [expandedCorretor, setExpandedCorretor] = useState<string | null>(null);

  // Load data from DB when authenticated
  useEffect(() => {
    if (!authenticated || !isOpen || !senhaAcesso) return;

    const loadData = async () => {
      setLoadingData(true);
      try {
        // Load cadastro comercial from DB via edge function
        const { data: cadastroResult } = await supabase.functions.invoke("register-elite", {
          body: {
            admin_password: "__load_comercial__",
            tipo_cadastro: "load_comercial",
            senha_acesso: senhaAcesso,
          },
        });

        // If DB returns data, use it; otherwise try localStorage fallback
        if (cadastroResult?.cadastro) {
          const c = cadastroResult.cadastro;
          const cadastroData: CadastroComercialData = {
            id: c.id,
            razaoSocial: c.razao_social,
            cpfCnpj: c.cpf_cnpj || "",
            cidade: c.cidade || "",
            estado: c.estado || "",
            plano: c.plano,
            planoLabel: c.plano_label || "",
            maxUsuarios: c.max_usuarios,
            validade: c.validade_dias,
            senha: c.senha,
            dataEnvio: c.data_envio || "",
            dataExpiracao: c.data_expiracao || "",
            whatsapp: c.whatsapp || "",
            email: c.email || "",
          };
          setCadastro(cadastroData);

          // Load corretores for this cadastro
          if (cadastroResult.corretores) {
            const mapped = cadastroResult.corretores.map((cr: any) => ({
              id: cr.id,
              nome: cr.nome,
              cpf: cr.cpf,
              creci: cr.creci || "",
              whatsapp: cr.whatsapp || "",
              email: cr.email || "",
              pin: "••••••",
              status: cr.status as "ativo" | "inativo",
              dataCadastro: cr.data_cadastro || "",
            }));
            setCorretores(mapped);
          }
        } else {
          // Fallback to localStorage
          try {
            const data = localStorage.getItem("elite_cadastro_comercial");
            if (data) setCadastro(JSON.parse(data));
          } catch {
            /* ignore */
          }
          try {
            const data = localStorage.getItem("elite_corretores");
            if (data) setCorretores(JSON.parse(data));
          } catch {
            /* ignore */
          }
        }
      } catch {
        // Fallback to localStorage
        try {
          const data = localStorage.getItem("elite_cadastro_comercial");
          if (data) setCadastro(JSON.parse(data));
        } catch {
          /* ignore */
        }
        try {
          const data = localStorage.getItem("elite_corretores");
          if (data) setCorretores(JSON.parse(data));
        } catch {
          /* ignore */
        }
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [authenticated, isOpen, senhaAcesso]);

  if (!isOpen) return null;

  // Derive plan limits from cadastro or fallback
  const limiteUsuarios = cadastro?.maxUsuarios || 10;
  const planoLabel = cadastro?.planoLabel || "Sem plano vinculado";
  const ativos = corretores.filter((c) => c.status === "ativo").length;
  const disponiveis = limiteUsuarios - ativos;
  const isMasterAccess = senhaAcesso === "472370";
  const empresaPreenchida = !!(cadastro?.razaoSocial?.trim() && cadastro?.cpfCnpj?.trim());
  const podeCadastrarCorretor = empresaPreenchida || isMasterAccess;

  const handleAddCorretor = async () => {
    setFormError("");
    if (!form.nome.trim() || !form.cpf.trim()) {
      setFormError("Nome e CPF são obrigatórios.");
      return;
    }
    if (!/^\d{6}$/.test(form.pin)) {
      setFormError("A senha deve ter exatamente 6 dígitos.");
      return;
    }
    if (ativos >= limiteUsuarios) {
      setFormError("Limite de licenças atingido para este plano.");
      return;
    }

    setSavingCorretor(true);
    try {
      const dataCadastro = new Date().toLocaleDateString("pt-BR");

      // Get admin password from localStorage cadastro
      const localCadastro = localStorage.getItem("elite_cadastro_comercial");
      const adminPass = localCadastro ? JSON.parse(localCadastro) : null;

      const { data, error } = await supabase.functions.invoke("register-elite", {
        body: {
          admin_password: "__corretor_register__",
          tipo_cadastro: "corretor",
          cadastro_comercial_id: cadastro?.id || null,
          nome: form.nome.trim(),
          cpf: form.cpf.trim(),
          creci: form.creci.trim(),
          whatsapp: form.whatsapp.trim(),
          email: form.email.trim(),
          pin: form.pin,
          data_cadastro: dataCadastro,
        },
      });

      if (error) {
        setFormError("Erro ao salvar corretor. Tente novamente.");
        setSavingCorretor(false);
        return;
      }

      const novo: Corretor = {
        id: data?.corretor_id || crypto.randomUUID(),
        nome: form.nome.trim(),
        cpf: form.cpf.trim(),
        creci: form.creci.trim(),
        whatsapp: form.whatsapp.trim(),
        email: form.email.trim(),
        pin: "••••••",
        status: "ativo",
        dataCadastro,
      };

      const updated = [...corretores, novo];
      setCorretores(updated);
      // Also save to localStorage as fallback
      localStorage.setItem("elite_corretores", JSON.stringify(updated));
      setForm({ nome: "", cpf: "", creci: "", whatsapp: "", email: "", pin: "" });
      setShowForm(false);
    } catch {
      setFormError("Erro ao cadastrar corretor.");
    } finally {
      setSavingCorretor(false);
    }
  };

  const toggleStatus = async (id: string) => {
    const corretor = corretores.find((c) => c.id === id);
    if (!corretor) return;

    const newStatus = corretor.status === "ativo" ? "inativo" : "ativo";

    // Update in DB
    try {
      await supabase.functions.invoke("register-elite", {
        body: {
          admin_password: "__corretor_status__",
          tipo_cadastro: "corretor_status",
          corretor_id: id,
          status: newStatus,
        },
      });
    } catch {
      console.error("Failed to update status in DB");
    }

    const updated = corretores.map((c) => (c.id === id ? { ...c, status: newStatus as "ativo" | "inativo" } : c));
    setCorretores(updated);
    localStorage.setItem("elite_corretores", JSON.stringify(updated));
  };

  const gerarDoc = (corretor: Corretor) => {
    const dataAtual = new Date().toLocaleDateString("pt-BR");
    alert(
      `Gerando Autorização CAIXA...\n\nCorretor: ${corretor.nome}\nCPF: ${corretor.cpf}\nCRECI: ${corretor.creci}\nData: ${dataAtual}\n\nDocumento em conformidade com Res. BACEN 5.037/22.`,
    );
  };

  if (!authenticated) {
    return (
      <div
        className="fixed inset-0 z-[2000] flex items-center justify-center"
        style={{ background: "rgba(0, 31, 63, 0.95)" }}
      >
        <div className="relative w-[90%] max-w-xl">
          <button
            onClick={onClose}
            className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-sm font-bold hover:opacity-80"
          >
            <X className="w-4 h-4" />
          </button>
          <MasterGate
            onAuthenticated={(senha) => {
              setSenhaAcesso(senha);
              setAuthenticated(true);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center overflow-y-auto"
      style={{ background: "rgba(0, 31, 63, 0.95)" }}
    >
      <div className="bg-card w-[95%] max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-gold/30 sticky top-0 bg-card z-10">
          <div>
            <h2 className="text-sm font-bold text-gold uppercase tracking-wider">Painel Comercial</h2>
            <p className="text-[10px] text-muted-foreground">Gestão de Equipes e Documentação</p>
            <div className="mt-1 text-[11px] text-foreground space-y-0.5">
              <p>
                <strong className="text-gold/80">EMPRESA:</strong> {cadastro?.razaoSocial || ""}
              </p>
              <p>
                <strong className="text-gold/80">CNPJ:</strong> {cadastro?.cpfCnpj || ""}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setAuthenticated(false);
              onClose();
            }}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <X className="w-5 h-5 text-destructive" />
          </button>
        </div>

        {/* Loading */}
        {loadingData && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gold" />
            <span className="ml-2 text-sm text-muted-foreground">Carregando dados...</span>
          </div>
        )}

        {/* Cadastro Comercial Info - below title */}
        {!loadingData && cadastro ? (
          <div className="mx-4 mt-4 p-3 bg-primary/10 border border-gold/30 rounded-lg space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-gold" />
              <span className="text-xs font-bold text-gold uppercase">Dados do Contrato</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-[11px]">
              <p className="text-foreground">
                <strong className="text-gold/80">Empresa:</strong> {cadastro.razaoSocial}
              </p>
              <p className="text-foreground">
                <strong className="text-gold/80">CPF/CNPJ:</strong> {cadastro.cpfCnpj}
              </p>
              <p className="text-foreground">
                <strong className="text-gold/80">Cidade/UF:</strong> {cadastro.cidade}/{cadastro.estado}
              </p>
              <p className="text-foreground">
                <strong className="text-gold/80">Plano:</strong> {cadastro.planoLabel}
              </p>
              <p className="text-foreground">
                <strong className="text-gold/80">Máx. Usuários:</strong> {cadastro.maxUsuarios}
              </p>
              <p className="text-foreground">
                <strong className="text-gold/80">Validade:</strong> {cadastro.validade} dias
              </p>
              <p className="text-foreground">
                <strong className="text-gold/80">Ativação:</strong> {cadastro.dataEnvio}
              </p>
              <p className="text-foreground">
                <strong className="text-gold/80">Expiração:</strong> {cadastro.dataExpiracao}
              </p>
              <p className="text-foreground">
                <strong className="text-gold/80">Senha:</strong> {cadastro.senha}
              </p>
            </div>
          </div>
        ) : !loadingData ? (
          <div className="mx-4 mt-4 p-3 bg-muted/50 border border-gold/20 rounded-lg text-center">
            <p className="text-muted-foreground text-xs">
              Nenhum cadastro comercial vinculado. Registre pelo painel administrativo.
            </p>
          </div>
        ) : null}

        {!loadingData && (
          <div className="p-4 space-y-5">
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gold/10 border border-gold/30 rounded-lg p-3 text-center">
                <p className="text-[10px] text-gold/70 uppercase font-bold">Plano</p>
                <p className="text-sm font-bold text-gold">{planoLabel}</p>
              </div>
              <div className="bg-gold/10 border border-gold/30 rounded-lg p-3 text-center">
                <p className="text-[10px] text-gold/70 uppercase font-bold">Licenças Ativas</p>
                <p className="text-lg font-bold text-gold">{ativos}</p>
              </div>
              <div className="bg-gold/10 border border-gold/30 rounded-lg p-3 text-center">
                <p className="text-[10px] text-gold/70 uppercase font-bold">Vagas</p>
                <p className="text-lg font-bold text-gold">{disponiveis < 0 ? 0 : disponiveis}</p>
              </div>
            </div>

            {/* Add Button */}
            {!showForm && !podeCadastrarCorretor && (
              <div className="w-full py-3 px-4 rounded-lg bg-destructive/10 border border-destructive/30 text-center">
                <p className="text-destructive text-xs font-bold">⚠ Cadastro de corretores bloqueado</p>
                <p className="text-muted-foreground text-[10px] mt-1">
                  Os dados da empresa (Razão Social e CNPJ) precisam estar preenchidos no cadastro comercial antes de
                  cadastrar corretores.
                </p>
              </div>
            )}
            {!showForm && podeCadastrarCorretor && (
              <button
                onClick={() => setShowForm(true)}
                disabled={ativos >= limiteUsuarios}
                className="w-full py-3 rounded-lg bg-primary text-gold font-bold uppercase text-xs tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Cadastrar Novo Corretor
              </button>
            )}

            {/* Form */}
            {showForm && (
              <div className="bg-muted/50 border border-gold/20 rounded-lg p-4 space-y-3">
                <h3 className="text-xs font-bold text-primary uppercase">Cadastrar Novo Corretor</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Nome do Corretor"
                    maxLength={100}
                    className="px-3 py-2 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-gold bg-card"
                  />
                  <input
                    value={form.cpf}
                    onChange={(e) => setForm({ ...form, cpf: e.target.value.replace(/\D/g, "").slice(0, 11) })}
                    placeholder="CPF (apenas números)"
                    maxLength={11}
                    className="px-3 py-2 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-gold bg-card"
                  />
                  <input
                    value={form.creci}
                    onChange={(e) => setForm({ ...form, creci: e.target.value })}
                    placeholder="CRECI"
                    maxLength={20}
                    className="px-3 py-2 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-gold bg-card"
                  />
                  <input
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="WhatsApp (DDD + Número)"
                    maxLength={20}
                    className="px-3 py-2 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-gold bg-card"
                  />
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Email"
                    type="email"
                    maxLength={100}
                    className="px-3 py-2 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-gold bg-card"
                  />
                  <div>
                    <input
                      type="password"
                      value={form.pin}
                      onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                      placeholder="Senha 6 dígitos"
                      maxLength={6}
                      className="px-3 py-2 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-gold bg-card w-full"
                    />
                    <span className="text-[10px] text-muted-foreground">O corretor usará esta senha para logar.</span>
                  </div>
                </div>
                {formError && <p className="text-destructive text-xs">{formError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleAddCorretor}
                    disabled={savingCorretor}
                    className="flex-1 py-2.5 rounded-lg bg-primary text-gold font-bold text-xs uppercase hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingCorretor ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                      </>
                    ) : (
                      "Ativar Acesso e Liberar Simulador"
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setFormError("");
                    }}
                    className="px-4 py-2.5 rounded-lg bg-muted text-muted-foreground text-xs uppercase hover:opacity-80"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Corretores Table */}
            {corretores.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gold/20 text-primary">
                      <th className="px-3 py-2 text-left font-bold uppercase">Corretor</th>
                      <th className="px-3 py-2 text-center font-bold uppercase hidden sm:table-cell">WhatsApp</th>
                      <th className="px-3 py-2 text-center font-bold uppercase hidden sm:table-cell">Data Cadastro</th>
                      <th className="px-3 py-2 text-center font-bold uppercase">PIN</th>
                      <th className="px-3 py-2 text-center font-bold uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {corretores.map((c) => (
                      <React.Fragment key={c.id}>
                        <tr
                          className="border-b border-border hover:bg-muted/30 cursor-pointer"
                          onClick={() => setExpandedCorretor(expandedCorretor === c.id ? null : c.id)}
                        >
                          <td className="px-3 py-2">
                            <strong className="text-foreground">{c.nome}</strong>
                            <br />
                            <span className="text-muted-foreground text-[10px]">CRECI: {c.creci || "-"}</span>
                          </td>
                          <td className="px-3 py-2 text-center hidden sm:table-cell text-muted-foreground">
                            {c.whatsapp || "-"}
                          </td>
                          <td className="px-3 py-2 text-center hidden sm:table-cell text-muted-foreground">
                            {c.dataCadastro || "-"}
                          </td>
                          <td className="px-3 py-2 text-center text-muted-foreground">••••••</td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStatus(c.id);
                              }}
                              className={`px-2 py-1 rounded text-[10px] font-bold ${
                                c.status === "ativo"
                                  ? "bg-green-600/20 text-green-600 border border-green-600/30"
                                  : "bg-destructive/20 text-destructive border border-destructive/30"
                              }`}
                            >
                              {c.status === "ativo" ? "Ativo" : "Inativo"}
                            </button>
                          </td>
                        </tr>
                        {expandedCorretor === c.id && (
                          <tr>
                            <td colSpan={5} className="px-4 py-3 bg-muted/40 border-b border-gold/20">
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-[11px]">
                                <p>
                                  <strong className="text-gold/80">Nome:</strong>{" "}
                                  <span className="text-foreground">{c.nome}</span>
                                </p>
                                <p>
                                  <strong className="text-gold/80">CPF:</strong>{" "}
                                  <span className="text-foreground">{c.cpf}</span>
                                </p>
                                <p>
                                  <strong className="text-gold/80">CRECI:</strong>{" "}
                                  <span className="text-foreground">{c.creci || "-"}</span>
                                </p>
                                <p>
                                  <strong className="text-gold/80">WhatsApp:</strong>{" "}
                                  <span className="text-foreground">{c.whatsapp || "-"}</span>
                                </p>
                                <p>
                                  <strong className="text-gold/80">Email:</strong>{" "}
                                  <span className="text-foreground">{c.email || "-"}</span>
                                </p>
                                <p>
                                  <strong className="text-gold/80">PIN:</strong>{" "}
                                  <span className="text-foreground font-mono">••••••</span>
                                </p>
                                <p>
                                  <strong className="text-gold/80">Data Cadastro:</strong>{" "}
                                  <span className="text-foreground">{c.dataCadastro || "-"}</span>
                                </p>
                                <p>
                                  <strong className="text-gold/80">Status:</strong>{" "}
                                  <span
                                    className={
                                      c.status === "ativo" ? "text-green-500 font-bold" : "text-destructive font-bold"
                                    }
                                  >
                                    {c.status === "ativo" ? "Ativo" : "Inativo"}
                                  </span>
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {corretores.length === 0 && !showForm && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Nenhum corretor cadastrado ainda.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
