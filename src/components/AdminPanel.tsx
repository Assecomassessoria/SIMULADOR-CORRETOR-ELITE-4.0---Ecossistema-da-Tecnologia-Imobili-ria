import { useState, useEffect, useRef } from "react";
import { Settings, X, Upload, Trash2, Eye, EyeOff, KeyRound, Users, MessageCircle, RefreshCw, Webhook, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAdminData, saveAdminData, AdminData, validatePassword, formatCRECI, resetSystem, changeAdminPassword, getMcmvRules, saveMcmvRules, DEFAULT_MCMV_RULES, type McmvRule } from "@/lib/eliteUtils";
import TabelaVendasManager from "./admin/TabelaVendasManager";
import {
  getCrmWebhooks,
  saveCrmWebhooks,
  testCrmWebhook,
  PROVIDER_META,
  type CrmProvider,
  type CrmWebhooksConfig,
} from "@/lib/crmWebhooks";
import { getStoredTenants, saveCustomTenant, applyTenantTheme, type TenantConfig } from "@/lib/tenant";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onDataUpdate: (data: AdminData) => void;
  isVisitor?: boolean;
}

export default function AdminPanel({ isOpen, onClose, onDataUpdate, isVisitor = false }: AdminPanelProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AdminData>(getAdminData());
  const empInputRef = useRef<HTMLInputElement>(null);
  const brokerInputRef = useRef<HTMLInputElement>(null);

  // Change admin password state
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [curAdminPwd, setCurAdminPwd] = useState("");
  const [newAdminPwd, setNewAdminPwd] = useState("");
  const [confirmAdminPwd, setConfirmAdminPwd] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  // CRM Webhooks
  const [showCrm, setShowCrm] = useState(false);
  const [crmCfg, setCrmCfg] = useState<CrmWebhooksConfig>(() => getCrmWebhooks());
  const [crmTestResult, setCrmTestResult] = useState<Record<string, { ok: boolean; msg: string } | undefined>>({});
  const [crmTesting, setCrmTesting] = useState<CrmProvider | null>(null);

  // MCMV Dynamic motor state
  const [mcmvRules, setMcmvRules] = useState<McmvRule[]>([]);
  const [showMcmvConfig, setShowMcmvConfig] = useState(false);

  // Tenant states
  const [showTenantConfig, setShowTenantConfig] = useState(false);
  const [tenants, setTenants] = useState<TenantConfig[]>([]);
  const [activePreviewSlug, setActivePreviewSlug] = useState<string>(() => localStorage.getItem("tenant_preview_slug") || "");
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantSlug, setNewTenantSlug] = useState("");
  const [newTenantPrimary, setNewTenantPrimary] = useState("#000000");
  const [newTenantSecondary, setNewTenantSecondary] = useState("#ffffff");
  const [newTenantCreci, setNewTenantCreci] = useState("");
  const [newTenantPhone, setNewTenantPhone] = useState("");

  const updateCrm = (p: CrmProvider, patch: Partial<CrmWebhooksConfig[CrmProvider]>) => {
    setCrmCfg((prev) => {
      const next = { ...prev, [p]: { ...prev[p], ...patch } };
      saveCrmWebhooks(next);
      return next;
    });
  };

  const handleTestCrm = async (p: CrmProvider) => {
    setCrmTesting(p);
    setCrmTestResult((r) => ({ ...r, [p]: undefined }));
    const res = await testCrmWebhook(p, crmCfg[p]);
    setCrmTestResult((r) => ({
      ...r,
      [p]: res.ok
        ? { ok: true, msg: `OK (HTTP ${res.status})` }
        : { ok: false, msg: res.error || `HTTP ${res.status || "?"}` },
    }));
    setCrmTesting(null);
  };

  // Métricas (corretores ativos + tentativas WhatsApp)
  const [stats, setStats] = useState<{
    corretoresAtivos: number;
    pinsAtivos: number;
    whatsappTentativas: number;
    whatsappCorretoresUnicos: number;
    ultimasTentativas: Array<{ identifier: string; created_at: string; result_state: string | null }>;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-stats", { body: {} });
      if (!error && data) setStats(data);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && !isVisitor) void loadStats();
  }, [isLoggedIn, isVisitor]);

  const handleChangeAdminPwd = async () => {
    if (newAdminPwd.length < 6) {
      alert("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newAdminPwd !== confirmAdminPwd) {
      alert("Confirmação não confere com a nova senha.");
      return;
    }
    setChangingPwd(true);
    try {
      const r = await changeAdminPassword(curAdminPwd, newAdminPwd);
      if (r.valid) {
        alert("Senha administrativa alterada com sucesso!");
        setCurAdminPwd("");
        setNewAdminPwd("");
        setConfirmAdminPwd("");
        setShowChangePwd(false);
      } else {
        alert(r.error || "Falha ao alterar senha.");
      }
    } finally {
      setChangingPwd(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setData(getAdminData());
      setMcmvRules(getMcmvRules());
      setTenants(getStoredTenants());
      setAdminPass("");
      setShowAdminPass(false);
      // Visitors skip password, go directly to read-only view
      setIsLoggedIn(isVisitor ? true : false);
    }
  }, [isOpen, isVisitor]);

  const handleAdminLogin = async () => {
    setLoading(true);
    try {
      const result = await validatePassword(adminPass, "admin");
      if (result.valid) {
        setIsLoggedIn(true);
      } else {
        alert("Senha administrativa incorreta!");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key: keyof AdminData, value: string) => {
    // Input length limits
    const maxLengths: Partial<Record<keyof AdminData, number>> = {
      empName: 100,
      brokerName: 100,
      creci: 15,
      whatsapp: 20,
    };
    const max = maxLengths[key];
    if (max && value.length > max) return;

    const updated = { ...data, [key]: value };
    setData(updated);
    saveAdminData({ [key]: value });
    onDataUpdate(updated);
  };

  const handleImageUpload = (type: "imgEmp" | "imgBroker", file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Imagem muito grande. Máximo 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const updated = { ...data, [type]: base64 };
      setData(updated);
      saveAdminData({ [type]: base64 });
      onDataUpdate(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async (type: "imgEmp" | "imgBroker") => {
    const pass = prompt("Digite a senha para remover a foto:");
    if (pass === null) return;
    const result = await validatePassword(pass, "remove_photo");
    if (result.valid) {
      const updated = { ...data, [type]: null };
      setData(updated);
      saveAdminData({ [type]: null });
      onDataUpdate(updated);
      alert("Foto removida com sucesso!");
    } else {
      alert("Senha incorreta!");
    }
  };

  const handleReset = async () => {
    const pass = prompt("ATENÇÃO: Isso apagará TODOS os dados.\nDigite a SENHA DE RESET para confirmar:");
    if (pass === null) return;
    const result = await validatePassword(pass, "reset");
    if (result.valid) {
      if (confirm("Tem certeza absoluta? Todos os dados serão deletados.")) {
        resetSystem();
        alert("Sistema resetado com sucesso!");
        location.reload();
      }
    } else {
      alert("Senha de reset incorreta!");
    }
  };

  const handleDrop = (type: "imgEmp" | "imgBroker") => (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(type, file);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center"
      style={{ background: "rgba(0, 31, 63, 0.95)" }}
    >
      <div className="bg-card w-[90%] max-w-xl max-h-[85vh] overflow-y-auto rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-sm font-bold text-primary uppercase">Manutenção de Dados Empreendimento e Corretores</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-colors">
            <X className="w-5 h-5 text-destructive" />
          </button>
        </div>

        {!isLoggedIn ? (
          /* Admin Login */
          <div className="p-6 space-y-4 text-center">
            <p className="text-muted-foreground text-sm">Acesso Protegido</p>
            <div className="relative">
              <input
                type={showAdminPass ? "text" : "password"}
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                placeholder="Senha Admin"
                maxLength={50}
                onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                className="w-full px-4 py-3 pr-10 border border-border rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-gold"
              />
              <button
                type="button"
                onClick={() => setShowAdminPass(!showAdminPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                tabIndex={-1}
              >
                {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={handleAdminLogin}
              disabled={loading}
              className="w-full py-3 rounded-lg bg-primary text-gold font-bold uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Acessar Painel"}
            </button>
          </div>
        ) : (
          /* Admin Panel */
          <div
            className={`p-4 space-y-5 ${isVisitor ? "[&_input]:pointer-events-none [&_input]:opacity-70 [&_button]:pointer-events-none [&_button]:opacity-70" : ""}`}
          >
            {!isVisitor && (
              <div className="rounded-lg border border-gold/30 bg-primary/5 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-primary uppercase">Métricas da Plataforma</h3>
                  <button
                    onClick={loadStats}
                    disabled={statsLoading}
                    className="p-1 text-primary/70 hover:text-primary transition-colors"
                    title="Atualizar"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${statsLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <StatBox
                    icon={<Users className="w-4 h-4" />}
                    label="Corretores ativos"
                    value={stats?.corretoresAtivos ?? 0}
                    subtitle={`${stats?.pinsAtivos ?? 0} PINs ativos`}
                  />
                  <StatBox
                    icon={<MessageCircle className="w-4 h-4 text-emerald-600" />}
                    label="Tentativas WhatsApp"
                    value={stats?.whatsappTentativas ?? 0}
                    subtitle={`${stats?.whatsappCorretoresUnicos ?? 0} corretores únicos`}
                  />
                </div>
                {stats?.ultimasTentativas && stats.ultimasTentativas.length > 0 && (
                  <details className="text-[10px] text-muted-foreground">
                    <summary className="cursor-pointer hover:text-primary">Últimas tentativas</summary>
                    <ul className="mt-1 space-y-0.5 font-mono">
                      {stats.ultimasTentativas.map((t, i) => (
                        <li key={i} className="truncate">
                          {new Date(t.created_at).toLocaleString("pt-BR")} · {t.identifier}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}

            <h3 className="text-xs font-bold text-primary uppercase border-b border-gold/30 pb-2">
              Dados do Corretor & Empreendimento
              {isVisitor && <span className="ml-2 text-amber-500 text-[9px]">(SOMENTE VISUALIZAÇÃO)</span>}
            </h3>

            <div className="space-y-3">
              <AdminInput
                label="Nome do Empreendimento"
                value={data.empName}
                onChange={(v) => !isVisitor && updateField("empName", v)}
              />
              <AdminInput
                label="Nome do Corretor"
                value={data.brokerName}
                onChange={(v) => !isVisitor && updateField("brokerName", v)}
              />
              <AdminInput
                label="CRECI/SP"
                value={data.creci}
                onChange={(v) => !isVisitor && updateField("creci", formatCRECI(v))}
              />
              <AdminInput
                label="WhatsApp"
                value={data.whatsapp}
                onChange={(v) => !isVisitor && updateField("whatsapp", v)}
                placeholder="(00) 00000-0000"
              />
            </div>

            {!isVisitor && (
              <>
                <h3 className="text-xs font-bold text-primary uppercase border-b border-gold/30 pb-2 mt-6">
                  Gestão de Imagens (Upload)
                </h3>

                {/* Emp Image */}
                <DropZone
                  label="Foto do Empreendimento"
                  image={data.imgEmp}
                  onDrop={handleDrop("imgEmp")}
                  onFileSelect={(f) => handleImageUpload("imgEmp", f)}
                  onRemove={() => handleRemovePhoto("imgEmp")}
                  inputRef={empInputRef}
                />

                {/* Broker Image */}
                <DropZone
                  label="Foto do Corretor"
                  image={data.imgBroker}
                  onDrop={handleDrop("imgBroker")}
                  onFileSelect={(f) => handleImageUpload("imgBroker", f)}
                  onRemove={() => handleRemovePhoto("imgBroker")}
                  inputRef={brokerInputRef}
                />

                <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground">
                  <strong>Nota:</strong> As imagens são salvas localmente nesta sessão.
                </div>

                <div className="mt-6">
                  <TabelaVendasManager adminPassword={adminPass} />
                </div>



                {/* Reset */}
                {/* Change Admin Password */}
                <div className="border-2 border-gold/40 rounded-lg p-4 space-y-3 mt-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-primary font-bold text-xs uppercase flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-gold" />
                      Alterar Senha Administrativa
                    </h4>
                    <button
                      onClick={() => setShowChangePwd((v) => !v)}
                      className="text-[10px] text-primary underline hover:text-gold"
                    >
                      {showChangePwd ? "Fechar" : "Abrir"}
                    </button>
                  </div>
                  {showChangePwd && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-muted-foreground">
                        Define uma nova senha master que substitui a senha administrativa atual em todo o sistema.
                      </p>
                      <div className="relative">
                        <input
                          type={showCur ? "text" : "password"}
                          value={curAdminPwd}
                          onChange={(e) => setCurAdminPwd(e.target.value)}
                          placeholder="Senha atual"
                          maxLength={50}
                          className="w-full px-3 py-2 pr-9 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-gold bg-card"
                        />
                        <button type="button" onClick={() => setShowCur(!showCur)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" tabIndex={-1}>
                          {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showNew ? "text" : "password"}
                          value={newAdminPwd}
                          onChange={(e) => setNewAdminPwd(e.target.value)}
                          placeholder="Nova senha (mín. 6 caracteres)"
                          maxLength={50}
                          className="w-full px-3 py-2 pr-9 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-gold bg-card"
                        />
                        <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" tabIndex={-1}>
                          {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <input
                        type={showNew ? "text" : "password"}
                        value={confirmAdminPwd}
                        onChange={(e) => setConfirmAdminPwd(e.target.value)}
                        placeholder="Confirmar nova senha"
                        maxLength={50}
                        className="w-full px-3 py-2 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-gold bg-card"
                      />
                      <button
                        onClick={handleChangeAdminPwd}
                        disabled={changingPwd || !curAdminPwd || !newAdminPwd}
                        className="w-full py-2 rounded bg-primary text-gold font-bold text-xs uppercase hover:opacity-90 disabled:opacity-50"
                      >
                        {changingPwd ? "Alterando..." : "Confirmar Alteração"}
                      </button>
                    </div>
                  )}
                </div>

                {/* CRM Webhooks */}
                <div className="border-2 border-gold/40 rounded-lg p-4 space-y-3 mt-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-primary font-bold text-xs uppercase flex items-center gap-2">
                      <Webhook className="w-4 h-4 text-gold" />
                      Integração CRM (Webhooks)
                    </h4>
                    <button
                      onClick={() => setShowCrm((v) => !v)}
                      className="text-[10px] text-primary underline hover:text-gold"
                    >
                      {showCrm ? "Fechar" : "Abrir"}
                    </button>
                  </div>
                  {showCrm && (
                    <div className="space-y-4">
                      <p className="text-[10px] text-muted-foreground">
                        Quando ativado, cada lead cadastrado/atualizado no CRM Elite é enviado automaticamente
                        para o(s) sistema(s) externo(s). Configurações ficam salvas neste dispositivo.
                      </p>
                      {(["cvcrm", "anapro", "custom"] as CrmProvider[]).map((p) => {
                        const c = crmCfg[p];
                        const meta = PROVIDER_META[p];
                        const result = crmTestResult[p];
                        return (
                          <div key={p} className="border border-border rounded-lg p-3 space-y-2 bg-card">
                            <div className="flex items-center justify-between gap-2">
                              <label className="flex items-center gap-2 text-xs font-bold text-primary cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={c.enabled}
                                  onChange={(e) => updateCrm(p, { enabled: e.target.checked })}
                                  className="accent-gold"
                                />
                                {meta.name}
                              </label>
                              {c.enabled && (
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/40">
                                  ATIVO
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground">{meta.hint}</p>
                            {p === "custom" && (
                              <input
                                type="text"
                                placeholder="Nome do CRM (opcional)"
                                value={c.label || ""}
                                onChange={(e) => updateCrm(p, { label: e.target.value })}
                                className="w-full px-2 py-1.5 border border-border rounded text-xs bg-background"
                              />
                            )}
                            <input
                              type="url"
                              placeholder="https://seu-crm.com/webhook/leads"
                              value={c.url}
                              onChange={(e) => updateCrm(p, { url: e.target.value })}
                              className="w-full px-2 py-1.5 border border-border rounded text-xs bg-background font-mono"
                            />
                            <input
                              type="text"
                              placeholder="Token / API Key (opcional — enviado como Bearer)"
                              value={c.token || ""}
                              onChange={(e) => updateCrm(p, { token: e.target.value })}
                              className="w-full px-2 py-1.5 border border-border rounded text-xs bg-background font-mono"
                            />
                            <div className="flex items-center justify-between gap-2">
                              <button
                                onClick={() => handleTestCrm(p)}
                                disabled={!c.url || crmTesting === p}
                                className="px-3 py-1.5 rounded bg-primary text-gold font-bold text-[10px] uppercase hover:opacity-90 disabled:opacity-40"
                              >
                                {crmTesting === p ? "Enviando..." : "Testar Webhook"}
                              </button>
                              {result && (
                                <span
                                  className={`text-[10px] flex items-center gap-1 font-semibold ${
                                    result.ok ? "text-emerald-600" : "text-destructive"
                                  }`}
                                >
                                  {result.ok ? (
                                    <CheckCircle2 className="w-3 h-3" />
                                  ) : (
                                    <AlertCircle className="w-3 h-3" />
                                  )}
                                  {result.msg}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Tabela de Juros Efetivos e Regras do MCMV */}
                <div className="border-2 border-gold/40 rounded-lg p-4 space-y-3 mt-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-primary font-bold text-xs uppercase flex items-center gap-2">
                      <Settings className="w-4 h-4 text-gold" />
                      Motor de Cálculo e Regras do MCMV
                    </h4>
                    <button
                      onClick={() => setShowMcmvConfig((v) => !v)}
                      className="text-[10px] text-primary underline hover:text-gold"
                    >
                      {showMcmvConfig ? "Fechar" : "Abrir"}
                    </button>
                  </div>
                  {showMcmvConfig && (
                    <div className="space-y-4">
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Ajuste os limites de renda familiar, as taxas de juros (nominais) mínimas/máximas ao ano, limite máximo do imóvel e subsídio para cada Faixa do MCMV. O motor de cálculo utilizará estes dados para simulações automáticas e proporcionais.
                      </p>
                      
                      <div className="space-y-4">
                        {mcmvRules.map((rule, idx) => (
                          <div key={idx} className="bg-card border border-border/60 rounded-lg p-3 space-y-3 shadow-inner">
                            <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                              <span className="text-xs font-black text-gold uppercase tracking-wide">
                                {rule.faixa}
                              </span>
                              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                                MCMV Regime
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                              {/* Renda Familiar Limite */}
                              <div>
                                <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-0.5">
                                  Renda Limite (R$)
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={rule.rendaMax}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    const next = [...mcmvRules];
                                    next[idx].rendaMax = val;
                                    // Cascade next faixa's rendaMin
                                    if (idx < next.length - 1) {
                                      next[idx + 1].rendaMin = +(val + 0.01).toFixed(2);
                                    }
                                    setMcmvRules(next);
                                  }}
                                  className="w-full px-2 py-1 border border-border rounded text-xs bg-background font-mono text-white focus:outline-none focus:ring-1 focus:ring-gold"
                                />
                              </div>

                              {/* Taxa Nominal Mínima */}
                              <div>
                                <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-0.5">
                                  Taxa Nominal Mín (% a.a.)
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={rule.taxaMin}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    const next = [...mcmvRules];
                                    next[idx].taxaMin = val;
                                    setMcmvRules(next);
                                  }}
                                  className="w-full px-2 py-1 border border-border rounded text-xs bg-background font-mono text-white focus:outline-none focus:ring-1 focus:ring-gold"
                                />
                              </div>

                              {/* Taxa Nominal Máxima */}
                              <div>
                                <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-0.5">
                                  Taxa Nominal Máx (% a.a.)
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={rule.taxaMax}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    const next = [...mcmvRules];
                                    next[idx].taxaMax = val;
                                    setMcmvRules(next);
                                  }}
                                  className="w-full px-2 py-1 border border-border rounded text-xs bg-background font-mono text-white focus:outline-none focus:ring-1 focus:ring-gold"
                                />
                              </div>

                              {/* Limite do Imóvel */}
                              <div>
                                <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-0.5">
                                  Teto do Imóvel (R$)
                                </label>
                                <input
                                  type="number"
                                  step="1000"
                                  value={rule.limiteImovelMax}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    const next = [...mcmvRules];
                                    next[idx].limiteImovelMax = val;
                                    setMcmvRules(next);
                                  }}
                                  className="w-full px-2 py-1 border border-border rounded text-xs bg-background font-mono text-white focus:outline-none focus:ring-1 focus:ring-gold"
                                />
                              </div>

                              {/* Subsídio Máximo */}
                              <div className="col-span-2 sm:col-span-1">
                                <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-0.5">
                                  Subsídio Máximo (R$)
                                </label>
                                <input
                                  type="number"
                                  step="1000"
                                  value={rule.subsidioMax}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    const next = [...mcmvRules];
                                    next[idx].subsidioMax = val;
                                    setMcmvRules(next);
                                  }}
                                  className="w-full px-2 py-1 border border-border rounded text-xs bg-background font-mono text-white focus:outline-none focus:ring-1 focus:ring-gold"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            saveMcmvRules(mcmvRules);
                            alert("Parâmetros do motor de cálculo MCMV salvos com sucesso! As alterações já estão ativas nos simuladores.");
                          }}
                          className="flex-1 py-2 bg-primary text-gold font-bold text-xs uppercase rounded hover:opacity-90 transition-opacity"
                        >
                          Salvar Parâmetros
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Deseja restaurar as taxas e regras padrão do MCMV (conforme tabela legal original)?")) {
                              setMcmvRules(DEFAULT_MCMV_RULES);
                              saveMcmvRules(DEFAULT_MCMV_RULES);
                              alert("Parâmetros originais restaurados com sucesso!");
                            }
                          }}
                          className="px-3 py-2 bg-[#2d3139] text-slate-300 font-bold text-xs uppercase rounded hover:bg-[#3d434f] transition-colors border border-border"
                        >
                          Restaurar Padrão
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Customização de Imobiliárias / Multi-Tenant */}
                <div className="border-2 border-gold/40 rounded-lg p-4 space-y-3 mt-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-primary font-bold text-xs uppercase flex items-center gap-2">
                      <Users className="w-4 h-4 text-gold" />
                      Multi-Tenant / Customização de Imobiliárias
                    </h4>
                    <button
                      onClick={() => setShowTenantConfig((v) => !v)}
                      className="text-[10px] text-primary underline hover:text-gold"
                    >
                      {showTenantConfig ? "Fechar" : "Abrir"}
                    </button>
                  </div>
                  {showTenantConfig && (
                    <div className="space-y-4">
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Customize a ferramenta com as cores e a marca da Imobiliária parceira. O sistema aplicará dinamicamente as identidades visuais de forma isolada ao acessar o subdomínio correspondente ou selecionando um simulador de preview abaixo.
                      </p>

                      {/* Simulador de Subdomínio / Preview Ativo */}
                      <div className="bg-muted border border-border/60 rounded-lg p-3 space-y-2">
                        <label className="block text-[10px] font-bold text-primary uppercase">
                          Simulador de Subdomínio (Ambiente de Demonstração / Preview)
                        </label>
                        <select
                          value={activePreviewSlug}
                          onChange={(e) => {
                            const slug = e.target.value;
                            setActivePreviewSlug(slug);
                            if (slug) {
                              localStorage.setItem("tenant_preview_slug", slug);
                              const match = tenants.find(t => t.slug === slug);
                              applyTenantTheme(match || null);
                            } else {
                              localStorage.removeItem("tenant_preview_slug");
                              applyTenantTheme(null);
                            }
                            // Refresh layout colors instantly
                            alert(`Subdomínio simulado alterado para: ${slug ? slug + ".simuladorcorretorelite.com.br" : "Tema Padrão"}. Toda a interface se adaptará agora!`);
                          }}
                          className="w-full px-2 py-1.5 border border-border rounded text-xs bg-background text-white focus:outline-none focus:ring-1 focus:ring-gold"
                        >
                          <option value="">Sem subdomínio (Usar tema padrão do sistema)</option>
                          {tenants.map(t => (
                            <option key={t.slug} value={t.slug}>
                              {t.name} ({t.slug}.simuladorcorretorelite.com.br)
                            </option>
                          ))}
                        </select>
                        <p className="text-[9px] text-muted-foreground italic">
                          No servidor de produção, este layout carrega automaticamente de forma 100% transparente com base no subdomínio acessado (Wildcard Tenant routing).
                        </p>
                      </div>

                      {/* Lista de Imobiliárias (Tenants) Cadastradas */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-primary uppercase">
                          Imobiliárias Customizadas Ativas
                        </label>
                        <div className="max-h-40 overflow-y-auto space-y-1 bg-muted border border-border/40 rounded p-2">
                          {tenants.map(t => (
                            <div key={t.slug} className="flex items-center justify-between text-xs p-1.5 hover:bg-muted/30 rounded border-b border-border/10">
                              <div>
                                <span className="font-bold text-white">{t.name}</span>
                                <span className="text-[10px] text-muted-foreground block font-mono">
                                  {t.slug}.simuladorcorretorelite.com.br
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded border border-white/20" style={{ backgroundColor: t.primaryColor }} title="Cor Primária" />
                                <span className="w-4 h-4 rounded border border-white/20" style={{ backgroundColor: t.secondaryColor }} title="Cor Secundária" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Formulário para adicionar nova imobiliária */}
                      <div className="bg-muted border border-border/60 rounded-lg p-3 space-y-3">
                        <span className="text-[10px] font-black text-gold uppercase tracking-wide block">
                          Cadastrar Nova Imobiliária Parceira (Tenant)
                        </span>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-0.5">Nome Fantasia</label>
                            <input
                              type="text"
                              placeholder="Ex: Direcional Vendas"
                              value={newTenantName}
                              onChange={(e) => setNewTenantName(e.target.value)}
                              className="w-full px-2 py-1 border border-border rounded text-xs bg-background text-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-0.5">Subdomínio (Slug)</label>
                            <input
                              type="text"
                              placeholder="Ex: direcional"
                              value={newTenantSlug}
                              onChange={(e) => setNewTenantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                              className="w-full px-2 py-1 border border-border rounded text-xs bg-background text-white font-mono focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-0.5">Cor Primária (Hex)</label>
                            <div className="flex gap-1.5 items-center">
                              <input
                                type="color"
                                value={newTenantPrimary}
                                onChange={(e) => setNewTenantPrimary(e.target.value)}
                                className="w-6 h-6 border-0 bg-transparent rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={newTenantPrimary}
                                onChange={(e) => setNewTenantPrimary(e.target.value)}
                                className="w-full px-2 py-0.5 border border-border rounded text-[11px] bg-background text-white font-mono"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-0.5">Cor Secundária (Hex)</label>
                            <div className="flex gap-1.5 items-center">
                              <input
                                type="color"
                                value={newTenantSecondary}
                                onChange={(e) => setNewTenantSecondary(e.target.value)}
                                className="w-6 h-6 border-0 bg-transparent rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={newTenantSecondary}
                                onChange={(e) => setNewTenantSecondary(e.target.value)}
                                className="w-full px-2 py-0.5 border border-border rounded text-[11px] bg-background text-white font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-0.5">CRECI (opcional)</label>
                            <input
                              type="text"
                              placeholder="Ex: CRECI 12345-J"
                              value={newTenantCreci}
                              onChange={(e) => setNewTenantCreci(e.target.value)}
                              className="w-full px-2 py-1 border border-border rounded text-xs bg-background text-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-0.5">Telefone / Whats (opcional)</label>
                            <input
                              type="text"
                              placeholder="Ex: (11) 99999-8888"
                              value={newTenantPhone}
                              onChange={(e) => setNewTenantPhone(e.target.value)}
                              className="w-full px-2 py-1 border border-border rounded text-xs bg-background text-white focus:outline-none"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (!newTenantName || !newTenantSlug) {
                              alert("Nome e subdomínio são obrigatórios.");
                              return;
                            }
                            const match = tenants.find(t => t.slug === newTenantSlug);
                            if (match && !confirm("Já existe uma imobiliária com este subdomínio. Deseja sobrescrever as cores e dados?")) {
                              return;
                            }
                            const added: TenantConfig = {
                              name: newTenantName,
                              slug: newTenantSlug,
                              primaryColor: newTenantPrimary,
                              secondaryColor: newTenantSecondary,
                              creci: newTenantCreci || undefined,
                              phone: newTenantPhone || undefined,
                            };
                            saveCustomTenant(added);
                            const updatedList = getStoredTenants();
                            setTenants(updatedList);
                            // Clear form
                            setNewTenantName("");
                            setNewTenantSlug("");
                            setNewTenantCreci("");
                            setNewTenantPhone("");
                            alert(`Imobiliária '${newTenantName}' cadastrada com sucesso! Ative-a no Simulador de Subdomínio para testar o visual.`);
                          }}
                          className="w-full py-1.5 bg-gold text-primary font-bold text-xs uppercase rounded hover:opacity-90"
                        >
                          Adicionar / Atualizar Imobiliária
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Reset */}
                <div className="border-2 border-destructive rounded-lg p-4 text-center space-y-3 mt-6">
                  <h4 className="text-destructive font-bold text-xs uppercase">
                    Apagar Sistema / Cadastrar Novo Usuário
                  </h4>
                  <p className="text-[10px] text-muted-foreground">
                    <b>
                      Use apenas para cadastrar novos usuários (Corretores, Imobiliárias). Uma nova senha MASTER deverá
                      ser solicitada. WhatsApp (11)94677-0625 - Email: contatoapps@simuladorcorretorelite.com.br
                    </b>
                  </p>
                  <button
                    onClick={handleReset}
                    className="w-full py-2.5 rounded-lg bg-destructive text-destructive-foreground font-bold text-xs uppercase hover:opacity-90 transition-opacity"
                  >
                    Resetar para Novo Usuário
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-primary uppercase mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={100}
        className="w-full px-3 py-2 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-gold bg-card"
      />
    </div>
  );
}

function DropZone({
  label,
  image,
  onDrop,
  onFileSelect,
  onRemove,
  inputRef,
}: {
  label: string;
  image: string | null;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (f: File) => void;
  onRemove: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-bold text-primary uppercase">{label}</label>
      <div
        className="border-2 border-dashed border-gold/40 rounded-lg p-4 text-center cursor-pointer hover:bg-gold/5 transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="w-5 h-5 mx-auto text-gold/50 mb-1" />
        <p className="text-xs text-muted-foreground">Clique ou arraste a foto</p>
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
        />
      </div>
      {image && (
        <div className="relative inline-block">
          <img src={image} alt={label} className="w-20 h-20 object-cover rounded border border-border" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

function StatBox({ icon, label, value, subtitle }: { icon: React.ReactNode; label: string; value: number; subtitle?: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase text-muted-foreground font-semibold">
        {icon}
        {label}
      </div>
      <div className="text-xl font-bold text-primary mt-1">{value.toLocaleString("pt-BR")}</div>
      {subtitle && <div className="text-[10px] text-muted-foreground">{subtitle}</div>}
    </div>
  );
}
