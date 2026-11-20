import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Eye,
  EyeOff,
  X,
  Loader2,
  Building2,
  KeyRound,
  Trash2,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { useFirebaseAuth } from "@/contexts/FirebaseContext";
import { signInWithGooglePopup } from "@/lib/firebase";
import {
  verifyAgencyPortalCredentials,
  listAgenciesForAdmin,
  subscribeAgencyBrokers,
  registerAgencyBroker,
  toggleAgencyBrokerStatus,
  deleteCorretorElite,
  getPlanoImobiliariaInfo,
  LIMITS,
  type AdministrativoRecord,
  type CorretorEliteRecord,
} from "@/lib/accessDatabase";

interface PainelComercialProps {
  isOpen: boolean;
  onClose: () => void;
}

function AgencyGate({
  onAuthenticated,
}: {
  onAuthenticated: (agency: AdministrativoRecord) => void;
}) {
  const { user, isGoogleMaster } = useFirebaseAuth();
  const [codigoCadastro, setCodigoCadastro] = useState("");
  const [senha, setSenha] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminAgencies, setAdminAgencies] = useState<AdministrativoRecord[]>([]);
  const [loadingAgencies, setLoadingAgencies] = useState(false);

  useEffect(() => {
    if (!isGoogleMaster || !user) return;
    let active = true;
    setLoadingAgencies(true);
    listAgenciesForAdmin()
      .then((list) => {
        if (active) setAdminAgencies(list);
      })
      .catch(() => {
        /* ignore list error for quick selector */
      })
      .finally(() => {
        if (active) setLoadingAgencies(false);
      });
    return () => {
      active = false;
    };
  }, [isGoogleMaster, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanCode = codigoCadastro.trim().toUpperCase();
    const cleanSenha = senha.trim();

    if (!cleanCode || !cleanSenha) {
      setError("Informe o ID do Cadastro e a Senha da Imobiliária.");
      return;
    }

    setLoading(true);
    try {
      // Ensure verified Google session is active before Firestore lookup
      if (!user) {
        await signInWithGooglePopup();
      }
      const result = await verifyAgencyPortalCredentials(cleanCode, cleanSenha);
      if (result.ok && result.agency) {
        onAuthenticated(result.agency);
      } else {
        setError(result.error || "ID do Cadastro ou Senha da Imobiliária incorretos.");
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        setError("Autenticação Google cancelada.");
      } else if (code === "auth/popup-blocked") {
        setError("Pop-up bloqueado pelo navegador. Libere pop-ups para continuar.");
      } else {
        setError(err instanceof Error ? err.message : "Erro ao validar credenciais da imobiliária.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-6 px-4">
      <div className="bg-[#07182e] text-slate-100 rounded-2xl border-2 border-gold/50 p-6 w-full max-w-md space-y-5 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-gold" />
          </div>
          <h3 className="text-gold font-extrabold uppercase tracking-wider text-sm">
            Painel da Imobiliária — Cadastro de Corretores
          </h3>
          <p className="text-slate-300 text-xs leading-relaxed">
            Entre com o <strong className="text-gold">ID do Cadastro</strong> e a{" "}
            <strong className="text-gold">Senha da Imobiliária</strong> para cadastrar e gerenciar corretores
            vinculados ao seu plano.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gold/80 mb-1">
              ID do Cadastro da Imobiliária *
            </label>
            <input
              type="text"
              value={codigoCadastro}
              onChange={(e) => {
                setCodigoCadastro(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""));
                setError("");
              }}
              placeholder="Ex: IMOB-1234"
              maxLength={LIMITS.codigoCadastro}
              className="w-full px-3.5 py-2.5 text-sm font-mono font-bold tracking-wider uppercase rounded-lg bg-[#0b213d] border border-gold/35 text-gold placeholder:text-gold/35 focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gold/80 mb-1">
              Senha da Imobiliária *
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={senha}
                onChange={(e) => {
                  setSenha(e.target.value);
                  setError("");
                }}
                placeholder="ELITE-XXXXXXXX"
                maxLength={LIMITS.senhaAcesso}
                className="w-full px-3.5 py-2.5 pr-10 text-sm font-mono font-bold tracking-wider rounded-lg bg-[#0b213d] border border-gold/35 text-gold placeholder:text-gold/35 focus:outline-none focus:border-gold"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gold/60 hover:text-gold transition-colors"
                tabIndex={-1}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {user?.email && (
            <div className="flex items-center gap-2 text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="truncate">Conta Google conectada: {user.email}</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl gold-gradient text-primary font-extrabold uppercase text-xs tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Validando Acesso...
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                {user ? "Acessar Painel da Imobiliária" : "Conectar Google & Acessar Painel"}
              </>
            )}
          </button>
        </form>

        {/* Master Quick Access selector */}
        {isGoogleMaster && (
          <div className="pt-3 border-t border-gold/25 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gold/75">
              Acesso Rápido Master — Imobiliárias Cadastradas
            </p>
            {loadingAgencies ? (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando imobiliárias...
              </div>
            ) : adminAgencies.length === 0 ? (
              <p className="text-[11px] text-slate-400">
                Nenhuma imobiliária cadastrada no Banco Administrativo ainda.
              </p>
            ) : (
              <select
                defaultValue=""
                onChange={(e) => {
                  const chosen = adminAgencies.find((a) => a.id === e.target.value);
                  if (chosen) onAuthenticated(chosen);
                }}
                className="w-full px-3 py-2 text-xs rounded-lg bg-[#0b213d] border border-gold/30 text-gold focus:outline-none focus:border-gold"
              >
                <option value="">Selecionar imobiliária diretamente...</option>
                {adminAgencies.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    [{ag.codigoCadastro || "SEM-ID"}] {ag.nome} —{" "}
                    {ag.planoLabel || getPlanoImobiliariaInfo(ag.plano).label}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PainelComercial({ isOpen, onClose }: PainelComercialProps) {
  const { user, isAuthReady } = useFirebaseAuth();
  const [agency, setAgency] = useState<AdministrativoRecord | null>(null);
  const [corretores, setCorretores] = useState<CorretorEliteRecord[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dbError, setDbError] = useState("");
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: "", cpf: "", creci: "", whatsapp: "", email: "", pin: "" });
  const [formError, setFormError] = useState("");
  const [savingCorretor, setSavingCorretor] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedCorretor, setExpandedCorretor] = useState<string | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  // Subscribe live to this agency's linked brokers in Firestore /corretor_elite
  useEffect(() => {
    if (!isOpen || !isAuthReady || !user || !agency) return;
    setLoadingData(true);
    setDbError("");

    const unsub = subscribeAgencyBrokers(
      agency,
      (list) => {
        setCorretores(list);
        setLoadingData(false);
      },
      (err) => {
        setDbError(err.message);
        setLoadingData(false);
      },
    );

    return () => {
      unsub();
    };
  }, [isOpen, isAuthReady, user, agency]);

  useEffect(() => {
    if (!isOpen) {
      setFeedback(null);
      setFormError("");
      setConfirmDeleteId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCloseModal = () => {
    setAgency(null);
    setCorretores([]);
    setShowForm(false);
    setFeedback(null);
    onClose();
  };

  if (!agency) {
    return (
      <div
        className="fixed inset-0 z-[2000] flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm overflow-y-auto"
        onClick={handleCloseModal}
      >
        <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={handleCloseModal}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-lg bg-[#0b213d] border border-gold/30 text-gold/70 hover:text-gold flex items-center justify-center"
            aria-label="Fechar painel comercial"
          >
            <X className="w-4 h-4" />
          </button>
          <AgencyGate
            onAuthenticated={(matchedAgency) => {
              setAgency(matchedAgency);
              setFeedback(null);
            }}
          />
        </div>
      </div>
    );
  }

  const planInfo = getPlanoImobiliariaInfo(agency.plano);
  const limiteUsuarios = agency.limiteCorretores ?? planInfo.max;
  const planoLabel = agency.planoLabel || planInfo.label;
  const ativos = corretores.filter((c) => c.status === "ativo" && c.autorizado).length;
  const disponiveis = Math.max(0, limiteUsuarios - ativos);

  const handleCopyCredentials = async () => {
    try {
      await navigator.clipboard.writeText(
        `Imobiliária: ${agency.nome}\nID do Cadastro: ${agency.codigoCadastro || "—"}\nSenha: ${agency.senhaAcesso || "—"}\nPlano: ${planoLabel}`,
      );
      setCopiedCreds(true);
      setTimeout(() => setCopiedCreds(false), 2000);
    } catch {
      setFeedback({ type: "err", text: "Não foi possível copiar os dados." });
    }
  };

  const handleAddCorretor = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFeedback(null);

    if (!form.nome.trim()) {
      setFormError("Informe o nome completo do corretor.");
      return;
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      setFormError("Informe o e-mail Google do corretor para liberar o acesso ao simulador.");
      return;
    }
    if (form.pin.trim() && !/^\d{6}$/.test(form.pin.trim())) {
      setFormError("Se informado, o PIN de acesso deve ter exatamente 6 dígitos.");
      return;
    }
    if (ativos >= limiteUsuarios) {
      setFormError(`Limite de ${limiteUsuarios} licenças ativas atingido para o plano ${planoLabel}.`);
      return;
    }

    setSavingCorretor(true);
    try {
      const created = await registerAgencyBroker(agency, {
        nome: form.nome.trim(),
        email: form.email.trim(),
        cpfCnpj: form.cpf.trim(),
        creci: form.creci.trim(),
        telefone: form.whatsapp.trim(),
        pin: form.pin.trim() || undefined,
      });

      setForm({ nome: "", cpf: "", creci: "", whatsapp: "", email: "", pin: "" });
      setShowForm(false);
      setFeedback({
        type: "ok",
        text: `Corretor [${created.codigoCorretor}] vinculado à imobiliária! O corretor já pode criar sua Senha Pessoal ou entrar com Google usando o e-mail cadastrado.`,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao cadastrar corretor.");
    } finally {
      setSavingCorretor(false);
    }
  };

  const handleToggleStatus = async (corretor: CorretorEliteRecord) => {
    const isCurrentlyActive = corretor.status === "ativo" && corretor.autorizado;
    if (!isCurrentlyActive && ativos >= limiteUsuarios) {
      setFeedback({
        type: "err",
        text: `Limite de ${limiteUsuarios} corretores ativos atingido. Bloqueie outro corretor ou amplie o plano.`,
      });
      return;
    }

    setBusyId(corretor.id);
    setFeedback(null);
    try {
      await toggleAgencyBrokerStatus(corretor.id, isCurrentlyActive);
      setFeedback({
        type: "ok",
        text: isCurrentlyActive
          ? `Acesso bloqueado para ${corretor.nome}.`
          : `Acesso reativado para ${corretor.nome}.`,
      });
    } catch (err) {
      setFeedback({ type: "err", text: err instanceof Error ? err.message : "Erro ao alterar status." });
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteBroker = async (recordId: string) => {
    setBusyId(recordId);
    setFeedback(null);
    try {
      await deleteCorretorElite(recordId);
      setConfirmDeleteId(null);
      setFeedback({ type: "ok", text: "Corretor removido da equipe da imobiliária." });
    } catch (err) {
      setFeedback({ type: "err", text: err instanceof Error ? err.message : "Erro ao excluir corretor." });
    } finally {
      setBusyId(null);
    }
  };

  const fieldCls =
    "w-full px-3 py-2 text-xs rounded-lg bg-[#07182e] border border-gold/30 text-gold placeholder:text-gold/40 focus:outline-none focus:border-gold";
  const labelCls = "block text-[10px] font-bold uppercase tracking-wider text-gold/80 mb-1";

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={handleCloseModal}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border-2 border-gold/40 bg-[#07182e] text-slate-100 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gold/30 bg-[#041022]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-gold uppercase tracking-wider">
                Painel da Imobiliária — Corretores Vinculados
              </h2>
              {agency.codigoCadastro && (
                <span className="px-2 py-0.5 text-[10px] font-mono font-extrabold rounded border border-gold/50 bg-gold/15 text-gold">
                  ID: {agency.codigoCadastro}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5 truncate">
              <strong className="text-gold/90">{agency.nome}</strong>
              {agency.cpfCnpj ? ` • CNPJ: ${agency.cpfCnpj}` : ""}
              {agency.creciJuridico ? ` • CRECI-J: ${agency.creciJuridico}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setAgency(null);
                setCorretores([]);
                setShowForm(false);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-gold/30 text-gold/80 hover:text-gold hover:bg-gold/10 text-[11px] font-bold flex items-center gap-1"
              title="Trocar Imobiliária"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Trocar ID</span>
            </button>
            <button
              type="button"
              onClick={handleCloseModal}
              className="p-2 rounded-lg text-gold/70 hover:text-gold hover:bg-gold/10 transition-colors"
              aria-label="Fechar painel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Feedback / Error banners */}
          {feedback && (
            <div
              className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between border ${
                feedback.type === "ok"
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                  : "bg-red-500/15 border-red-500/40 text-red-300"
              }`}
            >
              <span>{feedback.text}</span>
              <button type="button" onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {dbError && (
            <div className="p-3 rounded-lg text-xs bg-red-500/15 border border-red-500/40 text-red-300">
              Erro ao sincronizar equipe no Firestore: {dbError}
            </div>
          )}

          {/* Dados do Contrato da Imobiliária */}
          <div className="p-4 rounded-xl bg-[#0b213d] border border-gold/30 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gold" />
                <span className="text-xs font-extrabold text-gold uppercase tracking-wider">
                  Dados do Contrato &amp; Plano Adquirido
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="px-2.5 py-1 rounded-lg border border-gold/35 text-gold text-[11px] font-bold hover:bg-gold/10 flex items-center gap-1"
              >
                {copiedCreds ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar ID + Senha</span>
                  </>
                )}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-[11px]">
              <p className="text-slate-300">
                <strong className="text-gold/80">ID do Cadastro:</strong>{" "}
                <span className="font-mono font-bold text-white">{agency.codigoCadastro || "—"}</span>
              </p>
              <p className="text-slate-300">
                <strong className="text-gold/80">Plano Escolhido:</strong>{" "}
                <span className="text-amber-200 font-semibold">{planoLabel}</span>
              </p>
              <p className="text-slate-300">
                <strong className="text-gold/80">Máx. Usuários:</strong>{" "}
                <span className="text-white font-bold">{limiteUsuarios}</span>
              </p>
              <p className="text-slate-300">
                <strong className="text-gold/80">E-mail Google:</strong> {agency.email}
              </p>
              <p className="text-slate-300">
                <strong className="text-gold/80">Cidade/UF:</strong> {agency.cidade || "—"}
              </p>
              <p className="text-slate-300">
                <strong className="text-gold/80">Validade:</strong> {agency.validadeAte || "Sem expiração"}
              </p>
              {agency.senhaAcesso && (
                <p className="text-slate-300">
                  <strong className="text-gold/80">Senha:</strong>{" "}
                  <span className="font-mono text-gold font-bold">{agency.senhaAcesso}</span>
                </p>
              )}
              {agency.responsavel && (
                <p className="text-slate-300">
                  <strong className="text-gold/80">Responsável:</strong> {agency.responsavel}
                </p>
              )}
            </div>
          </div>

          {/* KPI Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#0b213d] border border-gold/30 rounded-xl p-3 text-center">
              <p className="text-[10px] text-gold/75 uppercase font-bold">Plano</p>
              <p className="text-xs sm:text-sm font-extrabold text-gold mt-1">{planoLabel}</p>
            </div>
            <div className="bg-[#0b213d] border border-emerald-500/30 rounded-xl p-3 text-center">
              <p className="text-[10px] text-emerald-300/80 uppercase font-bold">Licenças Ativas</p>
              <p className="text-lg font-extrabold text-emerald-400 mt-1">
                {ativos} / {limiteUsuarios}
              </p>
            </div>
            <div className="bg-[#0b213d] border border-sky-500/30 rounded-xl p-3 text-center">
              <p className="text-[10px] text-sky-300/80 uppercase font-bold">Vagas Disponíveis</p>
              <p className="text-lg font-extrabold text-sky-300 mt-1">{disponiveis}</p>
            </div>
          </div>

          {/* Add Corretor CTA */}
          {!showForm && (
            <button
              type="button"
              onClick={() => {
                setShowForm(true);
                setFormError("");
              }}
              disabled={ativos >= limiteUsuarios}
              className="w-full py-3 rounded-xl gold-gradient text-primary font-extrabold uppercase text-xs tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {ativos >= limiteUsuarios
                ? `Limite do Plano Atingido (${ativos}/${limiteUsuarios})`
                : "Cadastrar Novo Corretor Vinculado à Imobiliária"}
            </button>
          )}

          {/* New Broker Form */}
          {showForm && (
            <form
              onSubmit={handleAddCorretor}
              className="bg-[#0b213d] border-2 border-gold/45 rounded-xl p-4 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gold/20 pb-2">
                <h3 className="text-xs font-extrabold text-gold uppercase tracking-wider">
                  Novo Corretor — Vinculado a {agency.nome} ({agency.codigoCadastro})
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormError("");
                  }}
                  className="text-gold/60 hover:text-gold"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Nome Completo do Corretor *</label>
                  <input
                    required
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Nome do Corretor"
                    maxLength={LIMITS.nome}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>E-mail Google do Corretor *</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="corretor@gmail.com"
                    maxLength={LIMITS.email}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>CPF</label>
                  <input
                    value={form.cpf}
                    onChange={(e) => setForm({ ...form, cpf: e.target.value.replace(/\D/g, "").slice(0, 11) })}
                    placeholder="CPF (apenas números)"
                    maxLength={11}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>CRECI</label>
                  <input
                    value={form.creci}
                    onChange={(e) => setForm({ ...form, creci: e.target.value })}
                    placeholder="Ex: 123456-F"
                    maxLength={LIMITS.creci}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>WhatsApp (DDD + Número)</label>
                  <input
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="(11) 99999-9999"
                    maxLength={LIMITS.telefone}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>PIN 6 Dígitos (Opcional)</label>
                  <input
                    type="password"
                    value={form.pin}
                    onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                    placeholder="6 dígitos numéricos"
                    maxLength={6}
                    className={fieldCls}
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                O corretor será salvo diretamente no banco <strong className="text-gold">Corretor Elite</strong> como{" "}
                <strong className="text-amber-300">Vinculado à Imobiliária</strong> e poderá entrar no simulador usando
                o e-mail Google informado acima.
              </p>

              {formError && (
                <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-xs">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormError("");
                  }}
                  className="px-4 py-2 rounded-lg border border-gold/30 text-gold/80 text-xs font-bold uppercase hover:bg-gold/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCorretor}
                  className="px-5 py-2 rounded-lg gold-gradient text-primary font-extrabold text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  {savingCorretor ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Ativar Acesso e Liberar Simulador
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Corretores Table */}
          {loadingData ? (
            <div className="flex items-center justify-center py-10 text-gold/75 text-xs gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Carregando corretores vinculados...</span>
            </div>
          ) : corretores.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-gold/25">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#041022] text-gold border-b border-gold/25">
                    <th className="px-3 py-2.5 text-left font-extrabold uppercase">Corretor</th>
                    <th className="px-3 py-2.5 text-left font-extrabold uppercase hidden sm:table-cell">
                      E-mail Google
                    </th>
                    <th className="px-3 py-2.5 text-center font-extrabold uppercase hidden md:table-cell">WhatsApp</th>
                    <th className="px-3 py-2.5 text-center font-extrabold uppercase">Status</th>
                    <th className="px-3 py-2.5 text-center font-extrabold uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {corretores.map((c) => {
                    const isActive = c.status === "ativo" && c.autorizado;
                    return (
                      <React.Fragment key={c.id}>
                        <tr
                          className="border-b border-gold/15 hover:bg-[#0b213d]/80 cursor-pointer transition-colors"
                          onClick={() => setExpandedCorretor(expandedCorretor === c.id ? null : c.id)}
                        >
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <strong className="text-white">{c.nome}</strong>
                              {c.codigoCorretor && (
                                <span className="px-1.5 py-0.5 rounded bg-gold/15 border border-gold/40 text-gold font-mono text-[9px] font-extrabold">
                                  {c.codigoCorretor}
                                </span>
                              )}
                            </div>
                            <span className="text-slate-400 text-[10px]">CRECI: {c.creci || "—"}</span>
                          </td>
                          <td className="px-3 py-2.5 hidden sm:table-cell text-gold/85">{c.email}</td>
                          <td className="px-3 py-2.5 text-center hidden md:table-cell text-slate-300">
                            {c.telefone || "—"}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <button
                              type="button"
                              disabled={busyId === c.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(c);
                              }}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase border transition-colors ${
                                isActive
                                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25"
                                  : "bg-red-500/15 text-red-300 border-red-500/40 hover:bg-red-500/25"
                              }`}
                            >
                              {busyId === c.id ? "..." : isActive ? "Ativo" : "Bloqueado"}
                            </button>
                          </td>
                          <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                            {confirmDeleteId === c.id ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={busyId === c.id}
                                  onClick={() => handleDeleteBroker(c.id)}
                                  className="px-2 py-1 rounded bg-red-600 text-white text-[10px] font-bold uppercase"
                                >
                                  Excluir
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1 rounded bg-slate-700 text-slate-200 text-[10px]"
                                >
                                  Não
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(c.id)}
                                className="p-1.5 rounded-lg border border-red-500/35 text-red-400 hover:bg-red-500/15"
                                title="Remover corretor"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                        {expandedCorretor === c.id && (
                          <tr>
                            <td colSpan={5} className="px-4 py-3 bg-[#0b213d] border-b border-gold/20">
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-[11px]">
                                <p>
                                  <strong className="text-gold/80">ID do Corretor:</strong>{" "}
                                  <span className="font-mono font-bold text-gold">{c.codigoCorretor || "—"}</span>
                                </p>
                                <p>
                                  <strong className="text-gold/80">Nome:</strong>{" "}
                                  <span className="text-white">{c.nome}</span>
                                </p>
                                <p>
                                  <strong className="text-gold/80">E-mail Google:</strong>{" "}
                                  <span className="text-gold/90">{c.email}</span>
                                </p>
                                <p>
                                  <strong className="text-gold/80">CPF:</strong>{" "}
                                  <span className="text-slate-200">{c.cpfCnpj || "—"}</span>
                                </p>
                                <p>
                                  <strong className="text-gold/80">CRECI:</strong>{" "}
                                  <span className="text-slate-200">{c.creci || "—"}</span>
                                </p>
                                <p>
                                  <strong className="text-gold/80">WhatsApp:</strong>{" "}
                                  <span className="text-slate-200">{c.telefone || "—"}</span>
                                </p>
                                <p>
                                  <strong className="text-gold/80">Vínculo:</strong>{" "}
                                  <span className="text-amber-300 font-semibold">
                                    Imobiliária {c.imobiliariaCodigo ? `[${c.imobiliariaCodigo}]` : ""}
                                  </span>
                                </p>
                                <p>
                                  <strong className="text-gold/80">Validade:</strong>{" "}
                                  <span className="text-slate-200">{c.validadeAte || agency.validadeAte || "—"}</span>
                                </p>
                                <p>
                                  <strong className="text-gold/80">Status:</strong>{" "}
                                  <span className={isActive ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                                    {isActive ? "Ativo e Liberado" : "Bloqueado"}
                                  </span>
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            !showForm && (
              <div className="text-center py-10 rounded-xl border border-dashed border-gold/25 bg-[#091c34] space-y-2">
                <Users className="w-8 h-8 mx-auto text-gold/40" />
                <p className="text-sm font-bold text-gold/80">Nenhum corretor vinculado cadastrado ainda</p>
                <p className="text-xs text-slate-400">
                  Clique no botão acima para cadastrar os corretores da sua imobiliária (até {limiteUsuarios}{" "}
                  licenças).
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
