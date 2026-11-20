import { useEffect, useMemo, useState } from "react";
import {
  X,
  ShieldCheck,
  Users,
  Building2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Pencil,
  Trash2,
  Loader2,
  Lock,
  BadgeCheck,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  KeyRound,
  UserCheck,
} from "lucide-react";
import { useFirebaseAuth } from "@/contexts/FirebaseContext";
import { MASTER_PASSWORD, isMasterAccess } from "@/lib/eliteUtils";
import {
  subscribeCorretorElite,
  subscribeAdministrativo,
  createCorretorElite,
  updateCorretorElite,
  updateCorretorEliteAccessStatus,
  deleteCorretorElite,
  createAdministrativo,
  updateAdministrativo,
  updateAdministrativoAccessStatus,
  deleteAdministrativo,
  PLANOS_IMOBILIARIA,
  getPlanoImobiliariaInfo,
  generateAgencyCodigoCadastro,
  generateCorretorCodigo,
  generateAgencySenhaAcesso,
  addDaysToIsoDate,
  DEFAULT_PAYMENT_ORIGIN,
  LIMITS,
  type CorretorEliteRecord,
  type AdministrativoRecord,
  type CorretorTipo,
  type ModalidadeCorretor,
  type PlanoTipo,
  type PlanoImobiliariaTipo,
  type AccessStatus,
  type AdministrativoTipo,
} from "@/lib/accessDatabase";

interface AccessDatabasePanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "corretor_elite" | "administrativo";
}

type ActiveTab = "corretor_elite" | "administrativo";

const STATUS_META: Record<AccessStatus, { label: string; cls: string }> = {
  ativo: {
    label: "Autorizado",
    cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
  },
  pendente_pagamento: {
    label: "Pendente Pgto",
    cls: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  },
  bloqueado: {
    label: "Bloqueado",
    cls: "bg-red-500/15 text-red-400 border-red-500/40",
  },
  expirado: {
    label: "Expirado",
    cls: "bg-slate-500/20 text-slate-300 border-slate-500/40",
  },
};

const PLANO_LABEL: Record<PlanoTipo, string> = {
  mensal: "Mensal",
  semestral: "Semestral",
  anual: "Anual",
  anual_completo: "Anual Completo",
  imobiliaria: "Plano Imobiliária",
};

interface CorretorFormState {
  codigoCorretor: string;
  nome: string;
  email: string;
  tipo: CorretorTipo;
  modalidade: ModalidadeCorretor;
  cpfCnpj: string;
  creci: string;
  telefone: string;
  imobiliariaId: string;
  plano: PlanoTipo;
  pagamentoConfirmado: boolean;
  origemPagamento: string;
  comprovanteRef: string;
  autorizado: boolean;
  status: AccessStatus;
  validadeAte: string;
  observacoes: string;
}

interface AdminFormState {
  codigoCadastro: string;
  tipo: AdministrativoTipo;
  nome: string;
  email: string;
  plano: PlanoImobiliariaTipo;
  senhaAcesso: string;
  cpfCnpj: string;
  creciJuridico: string;
  responsavel: string;
  telefone: string;
  cidade: string;
  limiteCorretores: string;
  pagamentoConfirmado: boolean;
  autorizado: boolean;
  status: AccessStatus;
  validadeAte: string;
  observacoes: string;
}

function createEmptyCorretorForm(): CorretorFormState {
  return {
    codigoCorretor: generateCorretorCodigo(),
    nome: "",
    email: "",
    tipo: "corretor",
    modalidade: "individual",
    cpfCnpj: "",
    creci: "",
    telefone: "",
    imobiliariaId: "",
    plano: "anual",
    pagamentoConfirmado: true,
    origemPagamento: DEFAULT_PAYMENT_ORIGIN,
    comprovanteRef: "",
    autorizado: true,
    status: "ativo",
    validadeAte: addDaysToIsoDate(365),
    observacoes: "",
  };
}

function createEmptyAdminForm(tipo: AdministrativoTipo = "imobiliaria"): AdminFormState {
  const defaultPlan = getPlanoImobiliariaInfo("plano02");
  return {
    codigoCadastro: tipo === "imobiliaria" ? generateAgencyCodigoCadastro() : "",
    tipo,
    nome: "",
    email: "",
    plano: defaultPlan.value,
    senhaAcesso: tipo === "imobiliaria" ? generateAgencySenhaAcesso() : "",
    cpfCnpj: "",
    creciJuridico: "",
    responsavel: "",
    telefone: "",
    cidade: "",
    limiteCorretores: tipo === "imobiliaria" ? String(defaultPlan.max) : "",
    pagamentoConfirmado: true,
    autorizado: true,
    status: "ativo",
    validadeAte: tipo === "imobiliaria" ? addDaysToIsoDate(365) : "",
    observacoes: "",
  };
}

function resolveModalidade(rec: CorretorEliteRecord): ModalidadeCorretor {
  if (rec.modalidade === "imobiliaria" || rec.modalidade === "individual") {
    return rec.modalidade;
  }
  return rec.imobiliariaId ? "imobiliaria" : "individual";
}

export default function AccessDatabasePanel({
  isOpen,
  onClose,
  initialTab = "corretor_elite",
}: AccessDatabasePanelProps) {
  const { user, isAuthReady, isGoogleMaster, signInAsAdminOnly } = useFirebaseAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
  const [masterPassInput, setMasterPassInput] = useState("");
  const [masterUnlockedLocally, setMasterUnlockedLocally] = useState(() => isMasterAccess());
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Firestore data state
  const [corretores, setCorretores] = useState<CorretorEliteRecord[]>([]);
  const [administrativos, setAdministrativos] = useState<AdministrativoRecord[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dbError, setDbError] = useState("");
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Filters
  const [searchCorretor, setSearchCorretor] = useState("");
  const [statusFilterCorretor, setStatusFilterCorretor] = useState<string>("todos");
  const [modalidadeFilterCorretor, setModalidadeFilterCorretor] = useState<string>("todas");
  const [searchAdm, setSearchAdm] = useState("");
  const [tipoFilterAdm, setTipoFilterAdm] = useState<string>("todos");

  // Form modals (inline panels)
  const [showCorretorForm, setShowCorretorForm] = useState(false);
  const [editingCorretorId, setEditingCorretorId] = useState<string | null>(null);
  const [corretorForm, setCorretorForm] = useState<CorretorFormState>(() => createEmptyCorretorForm());

  const [showAdmForm, setShowAdmForm] = useState(false);
  const [editingAdmId, setEditingAdmId] = useState<string | null>(null);
  const [admForm, setAdmForm] = useState<AdminFormState>(() => createEmptyAdminForm("imobiliaria"));

  const [saving, setSaving] = useState(false);
  const [busyRecordId, setBusyRecordId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setFeedback(null);
      setDbError("");
      setAuthError("");
    }
  }, [isOpen, initialTab]);

  // Attach live Firestore subscriptions ONLY when open, auth is ready, and verified Google Master/Admin is signed in
  const canQueryFirestore = Boolean(isOpen && isAuthReady && user && isGoogleMaster);

  useEffect(() => {
    if (!canQueryFirestore) return;
    setLoadingData(true);
    setDbError("");

    let loadedCorretores = false;
    let loadedAdm = false;
    const markLoaded = () => {
      if (loadedCorretores && loadedAdm) setLoadingData(false);
    };

    const unsubCorretores = subscribeCorretorElite(
      (list) => {
        setCorretores(list);
        loadedCorretores = true;
        markLoaded();
      },
      (err) => {
        setDbError(err.message);
        setLoadingData(false);
      },
    );

    const unsubAdm = subscribeAdministrativo(
      (list) => {
        setAdministrativos(list);
        loadedAdm = true;
        markLoaded();
      },
      (err) => {
        setDbError(err.message);
        setLoadingData(false);
      },
    );

    return () => {
      unsubCorretores();
      unsubAdm();
    };
  }, [canQueryFirestore]);

  const imobiliariasAtivas = useMemo(
    () => administrativos.filter((a) => a.tipo === "imobiliaria"),
    [administrativos],
  );

  // Count active linked brokers per agency ID
  const activeBrokersByAgency = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of corretores) {
      if (c.imobiliariaId && c.status === "ativo" && c.autorizado) {
        counts.set(c.imobiliariaId, (counts.get(c.imobiliariaId) || 0) + 1);
      }
    }
    return counts;
  }, [corretores]);

  const filteredCorretores = useMemo(() => {
    const q = searchCorretor.trim().toLowerCase();
    return corretores.filter((item) => {
      if (statusFilterCorretor !== "todos" && item.status !== statusFilterCorretor) return false;
      const itemModalidade = resolveModalidade(item);
      if (modalidadeFilterCorretor !== "todas" && itemModalidade !== modalidadeFilterCorretor) return false;
      if (!q) return true;
      return (
        item.nome.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        (item.codigoCorretor || "").toLowerCase().includes(q) ||
        (item.creci || "").toLowerCase().includes(q) ||
        (item.cpfCnpj || "").toLowerCase().includes(q) ||
        (item.imobiliariaNome || "").toLowerCase().includes(q) ||
        (item.imobiliariaCodigo || "").toLowerCase().includes(q)
      );
    });
  }, [corretores, searchCorretor, statusFilterCorretor, modalidadeFilterCorretor]);

  const filteredAdministrativos = useMemo(() => {
    const q = searchAdm.trim().toLowerCase();
    return administrativos.filter((item) => {
      if (tipoFilterAdm !== "todos" && item.tipo !== tipoFilterAdm) return false;
      if (!q) return true;
      return (
        item.nome.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        (item.codigoCadastro || "").toLowerCase().includes(q) ||
        (item.planoLabel || "").toLowerCase().includes(q) ||
        (item.cpfCnpj || "").toLowerCase().includes(q) ||
        (item.creciJuridico || "").toLowerCase().includes(q) ||
        (item.cidade || "").toLowerCase().includes(q)
      );
    });
  }, [administrativos, searchAdm, tipoFilterAdm]);

  const statsCorretor = useMemo(() => {
    const total = corretores.length;
    const ativos = corretores.filter((c) => c.status === "ativo" && c.autorizado && c.pagamentoConfirmado).length;
    const individuais = corretores.filter((c) => resolveModalidade(c) === "individual").length;
    const deImobiliaria = corretores.filter((c) => resolveModalidade(c) === "imobiliaria").length;
    return { total, ativos, individuais, deImobiliaria };
  }, [corretores]);

  const statsAdm = useMemo(() => {
    const totalAdm = administrativos.filter((a) => a.tipo === "adm").length;
    const totalImob = administrativos.filter((a) => a.tipo === "imobiliaria").length;
    const ativos = administrativos.filter((a) => a.status === "ativo" && a.autorizado).length;
    const pendentes = administrativos.filter((a) => !a.pagamentoConfirmado || a.status === "pendente_pagamento").length;
    return { totalAdm, totalImob, ativos, pendentes };
  }, [administrativos]);

  if (!isOpen) return null;

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2000);
    } catch {
      setFeedback({ type: "err", text: "Não foi possível copiar para a área de transferência." });
    }
  };

  const handleGoogleAdminConnect = async () => {
    setAuthError("");
    setAuthLoading(true);
    try {
      const outcome = await signInAsAdminOnly();
      if (!outcome.authorization.authorized) {
        setAuthError(outcome.authorization.message);
      } else {
        setMasterUnlockedLocally(true);
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        setAuthError("Autenticação cancelada.");
      } else if (code === "auth/popup-blocked") {
        setAuthError("Pop-up bloqueado pelo navegador. Libere pop-ups para continuar.");
      } else {
        setAuthError("Não foi possível autenticar com o Google. Tente novamente.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleMasterPasswordCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterPassInput.trim() === MASTER_PASSWORD) {
      setMasterUnlockedLocally(true);
      setAuthError("");
      setMasterPassInput("");
    } else {
      setAuthError("Senha Master incorreta.");
    }
  };

  // === CORRETOR ELITE FORM HANDLERS ===
  const openNewCorretorForm = (defaultModalidade: ModalidadeCorretor = "individual") => {
    setEditingCorretorId(null);
    const base = createEmptyCorretorForm();
    base.modalidade = defaultModalidade;
    if (defaultModalidade === "imobiliaria") {
      base.plano = "imobiliaria";
    }
    setCorretorForm(base);
    setShowCorretorForm(true);
    setFeedback(null);
  };

  const openEditCorretorForm = (rec: CorretorEliteRecord) => {
    const modalidade = resolveModalidade(rec);
    setEditingCorretorId(rec.id);
    setCorretorForm({
      codigoCorretor: rec.codigoCorretor || generateCorretorCodigo(),
      nome: rec.nome,
      email: rec.email,
      tipo: rec.tipo,
      modalidade,
      cpfCnpj: rec.cpfCnpj || "",
      creci: rec.creci || "",
      telefone: rec.telefone || "",
      imobiliariaId: rec.imobiliariaId || "",
      plano: modalidade === "imobiliaria" ? "imobiliaria" : rec.plano,
      pagamentoConfirmado: rec.pagamentoConfirmado,
      origemPagamento: rec.origemPagamento || DEFAULT_PAYMENT_ORIGIN,
      comprovanteRef: rec.comprovanteRef || "",
      autorizado: rec.autorizado,
      status: rec.status,
      validadeAte: rec.validadeAte || "",
      observacoes: rec.observacoes || "",
    });
    setShowCorretorForm(true);
    setFeedback(null);
  };

  const handleCorretorModalidadeChange = (modalidade: ModalidadeCorretor) => {
    if (modalidade === "individual") {
      setCorretorForm((prev) => ({
        ...prev,
        modalidade: "individual",
        imobiliariaId: "",
        plano: prev.plano === "imobiliaria" ? "anual" : prev.plano,
      }));
    } else {
      const firstImob = imobiliariasAtivas[0];
      setCorretorForm((prev) => ({
        ...prev,
        modalidade: "imobiliaria",
        tipo: "corretor",
        plano: "imobiliaria",
        imobiliariaId: prev.imobiliariaId || firstImob?.id || "",
        validadeAte: prev.validadeAte || firstImob?.validadeAte || "",
      }));
    }
  };

  const handleSaveCorretor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const isAgency = corretorForm.modalidade === "imobiliaria";
      const linkedImob = isAgency
        ? imobiliariasAtivas.find((im) => im.id === corretorForm.imobiliariaId)
        : undefined;

      if (isAgency && !linkedImob) {
        throw new Error("Selecione a imobiliária vinculada no cadastro de Corretor de Imobiliária.");
      }

      const effectiveStatus: AccessStatus = !corretorForm.pagamentoConfirmado
        ? "pendente_pagamento"
        : !corretorForm.autorizado
          ? "bloqueado"
          : corretorForm.status;

      const commonPayload = {
        codigoCorretor: corretorForm.codigoCorretor.trim().toUpperCase() || generateCorretorCodigo(),
        nome: corretorForm.nome,
        tipo: corretorForm.tipo,
        modalidade: corretorForm.modalidade,
        cpfCnpj: corretorForm.cpfCnpj,
        creci: corretorForm.creci,
        telefone: corretorForm.telefone,
        imobiliariaId: linkedImob?.id || "",
        imobiliariaCodigo: linkedImob?.codigoCadastro || "",
        imobiliariaNome: linkedImob?.nome || "",
        imobiliariaEmail: linkedImob?.email || "",
        plano: (isAgency ? "imobiliaria" : corretorForm.plano) as PlanoTipo,
        pagamentoConfirmado: corretorForm.pagamentoConfirmado,
        origemPagamento: corretorForm.origemPagamento,
        comprovanteRef: corretorForm.comprovanteRef,
        autorizado: corretorForm.autorizado,
        status: effectiveStatus,
        validadeAte: corretorForm.validadeAte || linkedImob?.validadeAte || "",
        observacoes: corretorForm.observacoes,
      };

      if (editingCorretorId) {
        await updateCorretorElite(editingCorretorId, commonPayload);
        setFeedback({ type: "ok", text: "Cadastro Corretor Elite atualizado com sucesso." });
      } else {
        const created = await createCorretorElite({
          ...commonPayload,
          email: corretorForm.email,
        });
        setFeedback({
          type: "ok",
          text: isAgency
            ? `Corretor [${created.codigoCorretor}] vinculado à imobiliária ${linkedImob?.nome} salvo no Banco Corretor Elite.`
            : `Cadastro individual [${created.codigoCorretor}] salvo no Banco Corretor Elite (Tenant próprio).`,
        });
      }
      setShowCorretorForm(false);
      setEditingCorretorId(null);
      setCorretorForm(createEmptyCorretorForm());
    } catch (err) {
      setFeedback({
        type: "err",
        text: err instanceof Error ? err.message : "Erro ao salvar cadastro.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAuthorizeCorretor = async (rec: CorretorEliteRecord) => {
    setBusyRecordId(rec.id);
    setFeedback(null);
    try {
      const willActivate = !(rec.status === "ativo" && rec.autorizado && rec.pagamentoConfirmado);
      await updateCorretorEliteAccessStatus(rec.id, {
        pagamentoConfirmado: willActivate ? true : rec.pagamentoConfirmado,
        autorizado: willActivate,
        status: willActivate ? "ativo" : "bloqueado",
      });
      setFeedback({
        type: "ok",
        text: willActivate
          ? `Pagamento confirmado e acesso liberado para ${rec.nome}.`
          : `Acesso bloqueado para ${rec.nome}.`,
      });
    } catch (err) {
      setFeedback({ type: "err", text: err instanceof Error ? err.message : "Erro ao atualizar status." });
    } finally {
      setBusyRecordId(null);
    }
  };

  const handleDeleteCorretor = async (recordId: string) => {
    setBusyRecordId(recordId);
    setFeedback(null);
    try {
      await deleteCorretorElite(recordId);
      setConfirmDeleteId(null);
      setFeedback({ type: "ok", text: "Registro removido do Banco Corretor Elite." });
    } catch (err) {
      setFeedback({ type: "err", text: err instanceof Error ? err.message : "Erro ao excluir registro." });
    } finally {
      setBusyRecordId(null);
    }
  };

  // === ADMINISTRATIVO FORM HANDLERS ===
  const openNewAdmForm = (defaultTipo: AdministrativoTipo = "imobiliaria") => {
    setEditingAdmId(null);
    setAdmForm(createEmptyAdminForm(defaultTipo));
    setShowAdmForm(true);
    setFeedback(null);
  };

  const openEditAdmForm = (rec: AdministrativoRecord) => {
    const planInfo = getPlanoImobiliariaInfo(rec.plano);
    setEditingAdmId(rec.id);
    setAdmForm({
      codigoCadastro: rec.codigoCadastro || (rec.tipo === "imobiliaria" ? generateAgencyCodigoCadastro() : ""),
      tipo: rec.tipo,
      nome: rec.nome,
      email: rec.email,
      plano: rec.plano || planInfo.value,
      senhaAcesso: rec.senhaAcesso || (rec.tipo === "imobiliaria" ? generateAgencySenhaAcesso() : ""),
      cpfCnpj: rec.cpfCnpj || "",
      creciJuridico: rec.creciJuridico || "",
      responsavel: rec.responsavel || "",
      telefone: rec.telefone || "",
      cidade: rec.cidade || "",
      limiteCorretores:
        rec.limiteCorretores !== undefined
          ? String(rec.limiteCorretores)
          : rec.tipo === "imobiliaria"
            ? String(planInfo.max)
            : "",
      pagamentoConfirmado: rec.pagamentoConfirmado,
      autorizado: rec.autorizado,
      status: rec.status,
      validadeAte: rec.validadeAte || "",
      observacoes: rec.observacoes || "",
    });
    setShowAdmForm(true);
    setFeedback(null);
  };

  const handleAdmTipoChange = (tipo: AdministrativoTipo) => {
    setAdmForm((prev) => {
      if (tipo === "imobiliaria") {
        const planInfo = getPlanoImobiliariaInfo(prev.plano);
        return {
          ...prev,
          tipo,
          codigoCadastro: prev.codigoCadastro || generateAgencyCodigoCadastro(),
          senhaAcesso: prev.senhaAcesso || generateAgencySenhaAcesso(),
          limiteCorretores: prev.limiteCorretores || String(planInfo.max),
          validadeAte: prev.validadeAte || addDaysToIsoDate(365),
        };
      }
      return { ...prev, tipo };
    });
  };

  const handleAdmPlanoChange = (planoValue: PlanoImobiliariaTipo) => {
    const planInfo = getPlanoImobiliariaInfo(planoValue);
    setAdmForm((prev) => ({
      ...prev,
      plano: planoValue,
      limiteCorretores:
        planoValue === "master"
          ? String(Math.max(31, Number(prev.limiteCorretores) || planInfo.max))
          : String(planInfo.max),
    }));
  };

  const handleSaveAdm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const isImob = admForm.tipo === "imobiliaria";
      const planInfo = getPlanoImobiliariaInfo(admForm.plano);

      if (isImob && admForm.plano === "master") {
        const masterCount = Number(admForm.limiteCorretores);
        if (!Number.isFinite(masterCount) || masterCount < 31) {
          throw new Error("Para o Plano Master, informe um limite de no mínimo 31 usuários.");
        }
      }

      const effectiveStatus: AccessStatus =
        isImob && !admForm.pagamentoConfirmado
          ? "pendente_pagamento"
          : !admForm.autorizado
            ? "bloqueado"
            : admForm.status;

      const parsedLimite =
        admForm.limiteCorretores.trim() === ""
          ? isImob
            ? planInfo.max
            : ""
          : Number(admForm.limiteCorretores);

      const codigoFinal = isImob
        ? admForm.codigoCadastro.trim().toUpperCase() || generateAgencyCodigoCadastro()
        : admForm.codigoCadastro.trim().toUpperCase();
      const senhaFinal = isImob
        ? admForm.senhaAcesso.trim() || generateAgencySenhaAcesso()
        : "";

      const commonAdm = {
        codigoCadastro: codigoFinal,
        tipo: admForm.tipo,
        nome: admForm.nome,
        plano: isImob ? planInfo.value : undefined,
        planoLabel: isImob ? planInfo.label : undefined,
        senhaAcesso: isImob ? senhaFinal : undefined,
        cpfCnpj: admForm.cpfCnpj,
        creciJuridico: admForm.creciJuridico,
        responsavel: admForm.responsavel,
        telefone: admForm.telefone,
        cidade: admForm.cidade,
        limiteCorretores: parsedLimite,
        pagamentoConfirmado: admForm.pagamentoConfirmado,
        autorizado: admForm.autorizado,
        status: effectiveStatus,
        validadeAte: admForm.validadeAte,
        observacoes: admForm.observacoes,
      };

      if (editingAdmId) {
        await updateAdministrativo(editingAdmId, commonAdm);
        setFeedback({ type: "ok", text: "Cadastro Administrativo atualizado com sucesso." });
      } else {
        await createAdministrativo({
          ...commonAdm,
          email: admForm.email,
        });
        setFeedback({
          type: "ok",
          text: isImob
            ? `Imobiliária cadastrada! ID: ${codigoFinal} | Senha: ${senhaFinal} (${planInfo.label}).`
            : "Administrador (ADM) salvo no Banco Administrativo.",
        });
      }
      setShowAdmForm(false);
      setEditingAdmId(null);
      setAdmForm(createEmptyAdminForm("imobiliaria"));
    } catch (err) {
      setFeedback({ type: "err", text: err instanceof Error ? err.message : "Erro ao salvar cadastro." });
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAuthorizeAdm = async (rec: AdministrativoRecord) => {
    setBusyRecordId(rec.id);
    setFeedback(null);
    try {
      const willActivate = !(rec.status === "ativo" && rec.autorizado && (rec.tipo === "adm" || rec.pagamentoConfirmado));
      await updateAdministrativoAccessStatus(rec.id, {
        pagamentoConfirmado: willActivate ? true : rec.pagamentoConfirmado,
        autorizado: willActivate,
        status: willActivate ? "ativo" : "bloqueado",
      });
      setFeedback({
        type: "ok",
        text: willActivate
          ? `Acesso autorizado para ${rec.nome}.`
          : `Acesso bloqueado para ${rec.nome}.`,
      });
    } catch (err) {
      setFeedback({ type: "err", text: err instanceof Error ? err.message : "Erro ao atualizar status." });
    } finally {
      setBusyRecordId(null);
    }
  };

  const handleDeleteAdm = async (recordId: string) => {
    setBusyRecordId(recordId);
    setFeedback(null);
    try {
      await deleteAdministrativo(recordId);
      setConfirmDeleteId(null);
      setFeedback({ type: "ok", text: "Registro removido do Banco Administrativo." });
    } catch (err) {
      setFeedback({ type: "err", text: err instanceof Error ? err.message : "Erro ao excluir registro." });
    } finally {
      setBusyRecordId(null);
    }
  };

  const selectedAgencyForCorretor =
    corretorForm.modalidade === "imobiliaria"
      ? imobiliariasAtivas.find((im) => im.id === corretorForm.imobiliariaId)
      : undefined;
  const selectedAgencyUsed = selectedAgencyForCorretor
    ? activeBrokersByAgency.get(selectedAgencyForCorretor.id) || 0
    : 0;
  const selectedAgencyLimit =
    selectedAgencyForCorretor?.limiteCorretores ??
    getPlanoImobiliariaInfo(selectedAgencyForCorretor?.plano).max;

  const fieldCls =
    "w-full px-3 py-2 text-xs rounded-lg bg-primary/40 border border-gold/30 text-gold placeholder:text-gold/40 focus:outline-none focus:border-gold";
  const labelCls = "block text-[10px] font-bold uppercase tracking-wider text-gold/80 mb-1";

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border-2 border-gold/40 bg-[#07182e] text-slate-100 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gold/30 bg-[#041022]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-gold">
                Gestão de Acessos &amp; Bancos de Dados
              </h2>
              <p className="text-[11px] text-gold/65">
                Corretor Elite (Individual &amp; Imobiliária) &amp; Administrativo (ADM e Imobiliárias com ID + Plano)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gold/70 hover:text-gold hover:bg-gold/10 transition-colors"
            aria-label="Fechar painel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Gate when verified Google Admin session is not yet active */}
        {!canQueryFirestore ? (
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 flex items-center justify-center">
            <div className="w-full max-w-md bg-[#0b213d] border border-gold/35 rounded-2xl p-6 space-y-5 text-center shadow-xl">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gold/15 border border-gold/40 flex items-center justify-center">
                <Lock className="w-7 h-7 text-gold" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-gold">
                  Acesso Restrito — Administrativo / Master
                </h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Para gerenciar os bancos de dados <strong>Corretor Elite</strong> e{" "}
                  <strong>Administrativo</strong> com segurança no Firestore, autentique-se com sua conta Google
                  Master/ADM autorizada.
                </p>
              </div>

              {!masterUnlockedLocally && (
                <form onSubmit={handleMasterPasswordCheck} className="space-y-2.5 text-left">
                  <label className={labelCls}>Validar Senha Master (Opcional)</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={masterPassInput}
                      onChange={(e) => {
                        setMasterPassInput(e.target.value);
                        setAuthError("");
                      }}
                      placeholder="Senha Master"
                      className={fieldCls}
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg border border-gold/50 text-gold text-xs font-bold uppercase hover:bg-gold/10 transition-colors"
                    >
                      Validar
                    </button>
                  </div>
                </form>
              )}

              {masterUnlockedLocally && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                  Chave Master confirmada. Conecte agora com a conta Google Master/ADM para abrir gravação e leitura
                  em tempo real no banco Firestore.
                </div>
              )}

              {authError && (
                <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-xs">
                  {authError}
                </div>
              )}

              <button
                type="button"
                onClick={handleGoogleAdminConnect}
                disabled={authLoading}
                className="w-full py-3 rounded-xl bg-white text-slate-900 font-extrabold text-xs uppercase tracking-wider hover:bg-slate-100 transition-colors shadow-lg disabled:opacity-60 flex items-center justify-center gap-2.5"
              >
                {authLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                    />
                    <path
                      fill="#34A853"
                      d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                    />
                  </svg>
                )}
                {authLoading ? "Verificando conta..." : "Conectar Google Master / ADM"}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="flex border-b border-gold/25 bg-[#051326] px-4 sm:px-6 overflow-x-auto">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("corretor_elite");
                  setShowAdmForm(false);
                  setFeedback(null);
                }}
                className={`px-4 py-3 text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "corretor_elite"
                    ? "border-gold text-gold bg-gold/10"
                    : "border-transparent text-gold/55 hover:text-gold"
                }`}
              >
                <Users className="w-4 h-4" />
                Corretor Elite ({corretores.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("administrativo");
                  setShowCorretorForm(false);
                  setFeedback(null);
                }}
                className={`px-4 py-3 text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "administrativo"
                    ? "border-gold text-gold bg-gold/10"
                    : "border-transparent text-gold/55 hover:text-gold"
                }`}
              >
                <Building2 className="w-4 h-4" />
                Administrativo — ADM &amp; Imobiliárias ({administrativos.length})
              </button>
              <div className="ml-auto hidden md:flex items-center gap-2 text-[11px] text-emerald-400 pl-3">
                <BadgeCheck className="w-4 h-4" />
                <span>{user?.email}</span>
              </div>
            </div>

            {/* Feedback & Error alerts */}
            {(feedback || dbError) && (
              <div className="px-4 sm:px-6 pt-3">
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
                  <div className="p-3 rounded-lg text-xs bg-red-500/15 border border-red-500/40 text-red-300 mt-2">
                    Erro ao sincronizar Firestore: {dbError}
                  </div>
                )}
              </div>
            )}

            {/* Main Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* ═══ TAB 1: CORRETOR ELITE (AUTORIZADOS — INDIVIDUAL OU IMOBILIÁRIA) ═══ */}
              {activeTab === "corretor_elite" && (
                <>
                  {/* KPI Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl bg-[#0b213d] border border-gold/25 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-gold/65 font-bold">Total Cadastrados</p>
                      <p className="text-xl font-extrabold text-gold mt-1">{statsCorretor.total}</p>
                    </div>
                    <div className="rounded-xl bg-[#0b213d] border border-emerald-500/30 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-emerald-300/80 font-bold">
                        Autorizados &amp; Pagos
                      </p>
                      <p className="text-xl font-extrabold text-emerald-400 mt-1">{statsCorretor.ativos}</p>
                    </div>
                    <div className="rounded-xl bg-[#0b213d] border border-sky-500/30 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-sky-300/80 font-bold">Individual</p>
                      <p className="text-xl font-extrabold text-sky-300 mt-1">{statsCorretor.individuais}</p>
                    </div>
                    <div className="rounded-xl bg-[#0b213d] border border-amber-500/30 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-amber-300/80 font-bold">
                        De Imobiliária
                      </p>
                      <p className="text-xl font-extrabold text-amber-300 mt-1">{statsCorretor.deImobiliaria}</p>
                    </div>
                  </div>

                  {/* Toolbar */}
                  <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center justify-between">
                    <div className="flex flex-col sm:flex-row flex-1 gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-gold/50 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchCorretor}
                          onChange={(e) => setSearchCorretor(e.target.value)}
                          placeholder="Buscar por nome, e-mail, CRECI, CPF, ID ou imobiliária..."
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[#0b213d] border border-gold/30 text-gold placeholder:text-gold/40 focus:outline-none focus:border-gold"
                        />
                      </div>
                      <select
                        value={modalidadeFilterCorretor}
                        onChange={(e) => setModalidadeFilterCorretor(e.target.value)}
                        className="px-3 py-2 text-xs rounded-lg bg-[#0b213d] border border-gold/30 text-gold focus:outline-none focus:border-gold"
                      >
                        <option value="todas">Individual e Imobiliária</option>
                        <option value="individual">Somente Individual</option>
                        <option value="imobiliaria">Somente de Imobiliária</option>
                      </select>
                      <select
                        value={statusFilterCorretor}
                        onChange={(e) => setStatusFilterCorretor(e.target.value)}
                        className="px-3 py-2 text-xs rounded-lg bg-[#0b213d] border border-gold/30 text-gold focus:outline-none focus:border-gold"
                      >
                        <option value="todos">Todos os Status</option>
                        <option value="ativo">Autorizados</option>
                        <option value="pendente_pagamento">Pendente Pgto</option>
                        <option value="bloqueado">Bloqueados</option>
                        <option value="expirado">Expirados</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openNewCorretorForm("individual")}
                        className="px-3.5 py-2 rounded-lg gold-gradient text-primary text-xs font-extrabold uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        Novo Individual
                      </button>
                      <button
                        type="button"
                        onClick={() => openNewCorretorForm("imobiliaria")}
                        className="px-3.5 py-2 rounded-lg border border-gold/50 text-gold text-xs font-extrabold uppercase tracking-wider hover:bg-gold/10 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Building2 className="w-4 h-4" />
                        Corretor de Imobiliária
                      </button>
                    </div>
                  </div>

                  {/* Create / Edit Corretor Form */}
                  {showCorretorForm && (
                    <form
                      onSubmit={handleSaveCorretor}
                      className="rounded-xl bg-[#0b213d] border-2 border-gold/45 p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-gold/20 pb-2.5">
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-gold">
                          {editingCorretorId
                            ? "Editar Cadastro — Banco Corretor Elite"
                            : "Cadastrar Corretor ou Cliente — Banco Corretor Elite"}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setShowCorretorForm(false)}
                          className="text-gold/60 hover:text-gold"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Modalidade Selector: Individual vs Vinculado a Imobiliária */}
                      <div className="space-y-2">
                        <label className={labelCls}>Tipo de Vínculo (Modalidade) *</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleCorretorModalidadeChange("individual")}
                            className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                              corretorForm.modalidade === "individual"
                                ? "bg-gold/15 border-gold text-gold shadow-sm"
                                : "bg-[#07182e] border-gold/25 text-slate-300 hover:border-gold/50"
                            }`}
                          >
                            <div className="w-9 h-9 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center shrink-0">
                              <UserCheck className="w-4 h-4 text-gold" />
                            </div>
                            <div>
                              <p className="text-xs font-extrabold uppercase">Corretor / Cliente Individual</p>
                              <p className="text-[11px] opacity-75">
                                Assinatura própria (Mensal, Semestral, Anual) sem vínculo a imobiliária
                              </p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCorretorModalidadeChange("imobiliaria")}
                            className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                              corretorForm.modalidade === "imobiliaria"
                                ? "bg-gold/15 border-gold text-gold shadow-sm"
                                : "bg-[#07182e] border-gold/25 text-slate-300 hover:border-gold/50"
                            }`}
                          >
                            <div className="w-9 h-9 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center shrink-0">
                              <Building2 className="w-4 h-4 text-gold" />
                            </div>
                            <div>
                              <p className="text-xs font-extrabold uppercase">Cadastrado de uma Imobiliária</p>
                              <p className="text-[11px] opacity-75">
                                Vinculado ao ID e plano adquirido por uma Imobiliária do Banco Administrativo
                              </p>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Agency link block when modalidade === "imobiliaria" */}
                      {corretorForm.modalidade === "imobiliaria" && (
                        <div className="p-3.5 rounded-xl bg-[#07182e] border border-gold/35 space-y-2.5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                            <div>
                              <label className={labelCls}>Imobiliária Vinculada (ID + Plano) *</label>
                              <select
                                required
                                value={corretorForm.imobiliariaId}
                                onChange={(e) => {
                                  const chosen = imobiliariasAtivas.find((im) => im.id === e.target.value);
                                  setCorretorForm({
                                    ...corretorForm,
                                    imobiliariaId: e.target.value,
                                    plano: "imobiliaria",
                                    validadeAte: chosen?.validadeAte || corretorForm.validadeAte,
                                  });
                                }}
                                className={fieldCls}
                              >
                                <option value="">Selecione a Imobiliária...</option>
                                {imobiliariasAtivas.map((im) => {
                                  const used = activeBrokersByAgency.get(im.id) || 0;
                                  const max = im.limiteCorretores ?? getPlanoImobiliariaInfo(im.plano).max;
                                  const codeTag = im.codigoCadastro ? `[${im.codigoCadastro}] ` : "";
                                  const planTag = im.planoLabel || getPlanoImobiliariaInfo(im.plano).label;
                                  return (
                                    <option key={im.id} value={im.id}>
                                      {codeTag}
                                      {im.nome} — {planTag} ({used}/{max})
                                    </option>
                                  );
                                })}
                              </select>
                            </div>

                            {selectedAgencyForCorretor && (
                              <div className="rounded-lg bg-gold/10 border border-gold/30 px-3 py-2 text-[11px] space-y-0.5">
                                <p className="text-gold font-bold">
                                  ID: {selectedAgencyForCorretor.codigoCadastro || "—"} •{" "}
                                  {selectedAgencyForCorretor.planoLabel ||
                                    getPlanoImobiliariaInfo(selectedAgencyForCorretor.plano).label}
                                </p>
                                <p className="text-slate-300">
                                  Licenças ativas:{" "}
                                  <strong
                                    className={
                                      selectedAgencyUsed >= selectedAgencyLimit ? "text-red-400" : "text-emerald-400"
                                    }
                                  >
                                    {selectedAgencyUsed} / {selectedAgencyLimit}
                                  </strong>
                                  {selectedAgencyForCorretor.validadeAte &&
                                    ` • Contrato até ${selectedAgencyForCorretor.validadeAte}`}
                                </p>
                              </div>
                            )}
                          </div>

                          {imobiliariasAtivas.length === 0 && (
                            <p className="text-[11px] text-amber-300">
                              Nenhuma imobiliária cadastrada ainda. Cadastre primeiro na aba{" "}
                              <strong>Administrativo — ADM &amp; Imobiliárias</strong>.
                            </p>
                          )}
                          {selectedAgencyForCorretor &&
                            !editingCorretorId &&
                            selectedAgencyUsed >= selectedAgencyLimit && (
                              <p className="text-[11px] text-amber-300">
                                Atenção: esta imobiliária já atingiu o limite de {selectedAgencyLimit} corretores
                                ativos do plano escolhido.
                              </p>
                            )}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className={labelCls}>ID Único do Corretor *</label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              required
                              maxLength={LIMITS.codigoCorretor}
                              value={corretorForm.codigoCorretor}
                              onChange={(e) =>
                                setCorretorForm({
                                  ...corretorForm,
                                  codigoCorretor: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
                                })
                              }
                              placeholder="CORR-1234"
                              className={`${fieldCls} font-mono font-bold tracking-wider`}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setCorretorForm({ ...corretorForm, codigoCorretor: generateCorretorCodigo() })
                              }
                              className="px-2.5 rounded-lg border border-gold/35 text-gold hover:bg-gold/10"
                              title="Gerar novo ID de corretor"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className={labelCls}>Nome Completo *</label>
                          <input
                            type="text"
                            required
                            maxLength={LIMITS.nome}
                            value={corretorForm.nome}
                            onChange={(e) => setCorretorForm({ ...corretorForm, nome: e.target.value })}
                            placeholder="Ex: João Silva"
                            className={fieldCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>E-mail do Contrato (Senha Pessoal / Google) *</label>
                          <input
                            type="email"
                            required
                            disabled={Boolean(editingCorretorId)}
                            maxLength={LIMITS.email}
                            value={corretorForm.email}
                            onChange={(e) => setCorretorForm({ ...corretorForm, email: e.target.value })}
                            placeholder="corretor@gmail.com"
                            className={`${fieldCls} ${editingCorretorId ? "opacity-60 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Perfil *</label>
                          <select
                            value={corretorForm.tipo}
                            onChange={(e) =>
                              setCorretorForm({ ...corretorForm, tipo: e.target.value as CorretorTipo })
                            }
                            className={fieldCls}
                          >
                            <option value="corretor">Corretor Elite</option>
                            <option value="cliente">Cliente Cadastrado</option>
                          </select>
                        </div>

                        <div>
                          <label className={labelCls}>CPF / CNPJ</label>
                          <input
                            type="text"
                            maxLength={LIMITS.cpfCnpj}
                            value={corretorForm.cpfCnpj}
                            onChange={(e) => setCorretorForm({ ...corretorForm, cpfCnpj: e.target.value })}
                            placeholder="000.000.000-00"
                            className={fieldCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>CRECI</label>
                          <input
                            type="text"
                            maxLength={LIMITS.creci}
                            value={corretorForm.creci}
                            onChange={(e) => setCorretorForm({ ...corretorForm, creci: e.target.value })}
                            placeholder="123456-F"
                            className={fieldCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>WhatsApp / Telefone</label>
                          <input
                            type="text"
                            maxLength={LIMITS.telefone}
                            value={corretorForm.telefone}
                            onChange={(e) => setCorretorForm({ ...corretorForm, telefone: e.target.value })}
                            placeholder="(11) 99999-9999"
                            className={fieldCls}
                          />
                        </div>

                        <div>
                          <label className={labelCls}>Plano Contratado *</label>
                          {corretorForm.modalidade === "imobiliaria" ? (
                            <input
                              type="text"
                              readOnly
                              value={
                                selectedAgencyForCorretor?.planoLabel ||
                                "Plano Imobiliária (vinculado à empresa)"
                              }
                              className={`${fieldCls} opacity-80 cursor-not-allowed`}
                            />
                          ) : (
                            <select
                              value={corretorForm.plano}
                              onChange={(e) =>
                                setCorretorForm({ ...corretorForm, plano: e.target.value as PlanoTipo })
                              }
                              className={fieldCls}
                            >
                              <option value="mensal">Mensal</option>
                              <option value="semestral">Semestral</option>
                              <option value="anual">Anual</option>
                              <option value="anual_completo">Anual Completo</option>
                            </select>
                          )}
                        </div>
                        <div>
                          <label className={labelCls}>Validade Até</label>
                          <input
                            type="date"
                            value={corretorForm.validadeAte}
                            onChange={(e) => setCorretorForm({ ...corretorForm, validadeAte: e.target.value })}
                            className={fieldCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Status do Acesso *</label>
                          <select
                            value={corretorForm.status}
                            onChange={(e) =>
                              setCorretorForm({ ...corretorForm, status: e.target.value as AccessStatus })
                            }
                            className={fieldCls}
                          >
                            <option value="ativo">Ativo (Liberado)</option>
                            <option value="pendente_pagamento">Pendente de Pagamento</option>
                            <option value="bloqueado">Bloqueado</option>
                            <option value="expirado">Expirado</option>
                          </select>
                        </div>

                        <div>
                          <label className={labelCls}>Origem do Pagamento *</label>
                          <input
                            type="text"
                            required
                            maxLength={LIMITS.origemPagamento}
                            value={corretorForm.origemPagamento}
                            onChange={(e) => setCorretorForm({ ...corretorForm, origemPagamento: e.target.value })}
                            placeholder={DEFAULT_PAYMENT_ORIGIN}
                            className={fieldCls}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelCls}>Ref. Pedido / PIX / Comprovante</label>
                          <input
                            type="text"
                            maxLength={LIMITS.comprovanteRef}
                            value={corretorForm.comprovanteRef}
                            onChange={(e) => setCorretorForm({ ...corretorForm, comprovanteRef: e.target.value })}
                            placeholder="Ex: MP-984312 / PIX / Contrato Imobiliária"
                            className={fieldCls}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 pt-1">
                        <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={corretorForm.pagamentoConfirmado}
                            onChange={(e) =>
                              setCorretorForm({
                                ...corretorForm,
                                pagamentoConfirmado: e.target.checked,
                                status: e.target.checked
                                  ? corretorForm.autorizado
                                    ? "ativo"
                                    : "bloqueado"
                                  : "pendente_pagamento",
                              })
                            }
                            className="rounded border-gold/50 accent-amber-500"
                          />
                          <span>Pagamento confirmado em simuladorcorretorelite.com.br</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={corretorForm.autorizado}
                            onChange={(e) =>
                              setCorretorForm({
                                ...corretorForm,
                                autorizado: e.target.checked,
                                status: !e.target.checked
                                  ? "bloqueado"
                                  : corretorForm.pagamentoConfirmado
                                    ? "ativo"
                                    : "pendente_pagamento",
                              })
                            }
                            className="rounded border-gold/50 accent-amber-500"
                          />
                          <span>Acesso autorizado</span>
                        </label>
                      </div>

                      <div>
                        <label className={labelCls}>Observações Internas</label>
                        <textarea
                          rows={2}
                          maxLength={LIMITS.observacoes}
                          value={corretorForm.observacoes}
                          onChange={(e) => setCorretorForm({ ...corretorForm, observacoes: e.target.value })}
                          placeholder="Informações adicionais sobre pagamento ou licença..."
                          className={`${fieldCls} resize-none`}
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowCorretorForm(false)}
                          className="px-4 py-2 rounded-lg border border-gold/30 text-gold/80 text-xs font-bold uppercase hover:bg-gold/10"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-5 py-2 rounded-lg gold-gradient text-primary text-xs font-extrabold uppercase tracking-wider hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                        >
                          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          {editingCorretorId ? "Salvar Alterações" : "Gravar no Banco Corretor Elite"}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* List */}
                  {loadingData ? (
                    <div className="py-12 flex items-center justify-center gap-2 text-gold/70 text-xs">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Carregando Banco Corretor Elite...
                    </div>
                  ) : filteredCorretores.length === 0 ? (
                    <div className="py-12 text-center rounded-xl border border-dashed border-gold/25 bg-[#091c34] space-y-2">
                      <Users className="w-8 h-8 text-gold/40 mx-auto" />
                      <p className="text-sm font-bold text-gold/80">Nenhum Corretor ou Cliente encontrado</p>
                      <p className="text-xs text-slate-400">
                        Cadastre corretores individuais ou vinculados a uma imobiliária para liberar o acesso ao
                        simulador.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {filteredCorretores.map((rec) => {
                        const statusMeta = STATUS_META[rec.status] || STATUS_META.bloqueado;
                        const isFullyActive = rec.status === "ativo" && rec.autorizado && rec.pagamentoConfirmado;
                        const modalidade = resolveModalidade(rec);
                        return (
                          <div
                            key={rec.id}
                            className="rounded-xl bg-[#0b213d] border border-gold/25 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-bold text-white truncate">{rec.nome}</span>
                                {rec.codigoCorretor && (
                                  <span className="px-2 py-0.5 text-[10px] font-mono font-extrabold uppercase rounded border border-gold/50 bg-gold/15 text-gold">
                                    ID: {rec.codigoCorretor}
                                  </span>
                                )}
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                                    modalidade === "imobiliaria"
                                      ? "border-amber-400/40 bg-amber-500/15 text-amber-300"
                                      : "border-sky-400/40 bg-sky-500/15 text-sky-300"
                                  }`}
                                >
                                  {modalidade === "imobiliaria"
                                    ? `Imobiliária${rec.imobiliariaCodigo ? ` (${rec.imobiliariaCodigo})` : ""}`
                                    : "Individual (Autônomo)"}
                                </span>
                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded border border-gold/30 bg-gold/10 text-gold">
                                  {rec.tipo === "corretor" ? "Corretor Elite" : "Cliente"}
                                </span>
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${statusMeta.cls}`}
                                >
                                  {statusMeta.label}
                                </span>
                                <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700">
                                  {PLANO_LABEL[rec.plano] || rec.plano}
                                </span>
                                {rec.senhaPessoalConfigurada && (
                                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/35">
                                    Senha Pessoal
                                  </span>
                                )}
                                {rec.googleSubId && (
                                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-sky-500/15 text-sky-300 border border-sky-500/35">
                                    Vinculado
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gold/80 truncate">{rec.email}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
                                {rec.imobiliariaNome && (
                                  <span className="text-amber-200/90 font-medium">
                                    Imobiliária: {rec.imobiliariaNome}
                                    {rec.imobiliariaCodigo ? ` [${rec.imobiliariaCodigo}]` : ""}
                                  </span>
                                )}
                                {rec.creci && <span>CRECI: {rec.creci}</span>}
                                {rec.cpfCnpj && <span>Doc: {rec.cpfCnpj}</span>}
                                {rec.telefone && <span>Tel: {rec.telefone}</span>}
                                {rec.comprovanteRef && <span>Ref: {rec.comprovanteRef}</span>}
                                {rec.validadeAte && <span>Validade: {rec.validadeAte}</span>}
                                <span className={rec.pagamentoConfirmado ? "text-emerald-400" : "text-amber-300"}>
                                  {rec.pagamentoConfirmado ? "✔ Pgto Confirmado" : "⏳ Pgto Pendente"}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                              <button
                                type="button"
                                disabled={busyRecordId === rec.id}
                                onClick={() => handleQuickAuthorizeCorretor(rec)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-colors flex items-center gap-1.5 ${
                                  isFullyActive
                                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25"
                                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                                }`}
                              >
                                {busyRecordId === rec.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : isFullyActive ? (
                                  <XCircle className="w-3.5 h-3.5" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                {isFullyActive ? "Bloquear" : "Confirmar Pgto & Liberar"}
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditCorretorForm(rec)}
                                className="p-2 rounded-lg border border-gold/30 text-gold hover:bg-gold/10"
                                title="Editar"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              {confirmDeleteId === rec.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={busyRecordId === rec.id}
                                    onClick={() => handleDeleteCorretor(rec.id)}
                                    className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-[10px] font-bold uppercase"
                                  >
                                    Confirmar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="px-2 py-1.5 rounded-lg bg-slate-700 text-slate-200 text-[10px]"
                                  >
                                    Não
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(rec.id)}
                                  className="p-2 rounded-lg border border-red-500/35 text-red-400 hover:bg-red-500/15"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* ═══ TAB 2: ADMINISTRATIVO (ADM E IMOBILIÁRIAS) ═══ */}
              {activeTab === "administrativo" && (
                <>
                  {/* KPI Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl bg-[#0b213d] border border-gold/25 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-gold/65 font-bold">Imobiliárias</p>
                      <p className="text-xl font-extrabold text-gold mt-1">{statsAdm.totalImob}</p>
                    </div>
                    <div className="rounded-xl bg-[#0b213d] border border-sky-500/30 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-sky-300/80 font-bold">
                        Administradores (ADM)
                      </p>
                      <p className="text-xl font-extrabold text-sky-300 mt-1">{statsAdm.totalAdm}</p>
                    </div>
                    <div className="rounded-xl bg-[#0b213d] border border-emerald-500/30 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-emerald-300/80 font-bold">Ativos</p>
                      <p className="text-xl font-extrabold text-emerald-400 mt-1">{statsAdm.ativos}</p>
                    </div>
                    <div className="rounded-xl bg-[#0b213d] border border-amber-500/30 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-amber-300/80 font-bold">
                        Pendente Pgto
                      </p>
                      <p className="text-xl font-extrabold text-amber-300 mt-1">{statsAdm.pendentes}</p>
                    </div>
                  </div>

                  {/* Toolbar */}
                  <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                    <div className="flex flex-1 gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-gold/50 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchAdm}
                          onChange={(e) => setSearchAdm(e.target.value)}
                          placeholder="Buscar por ID (IMOB-...), nome, plano, e-mail, CNPJ ou cidade..."
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[#0b213d] border border-gold/30 text-gold placeholder:text-gold/40 focus:outline-none focus:border-gold"
                        />
                      </div>
                      <select
                        value={tipoFilterAdm}
                        onChange={(e) => setTipoFilterAdm(e.target.value)}
                        className="px-3 py-2 text-xs rounded-lg bg-[#0b213d] border border-gold/30 text-gold focus:outline-none focus:border-gold"
                      >
                        <option value="todos">ADM e Imobiliárias</option>
                        <option value="imobiliaria">Somente Imobiliárias</option>
                        <option value="adm">Somente ADM</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openNewAdmForm("imobiliaria")}
                        className="px-3.5 py-2 rounded-lg gold-gradient text-primary text-xs font-extrabold uppercase tracking-wider hover:opacity-90 flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        Nova Imobiliária
                      </button>
                      <button
                        type="button"
                        onClick={() => openNewAdmForm("adm")}
                        className="px-3.5 py-2 rounded-lg border border-gold/50 text-gold text-xs font-extrabold uppercase tracking-wider hover:bg-gold/10 flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        Novo ADM
                      </button>
                    </div>
                  </div>

                  {/* Create / Edit Administrativo Form */}
                  {showAdmForm && (
                    <form
                      onSubmit={handleSaveAdm}
                      className="rounded-xl bg-[#0b213d] border-2 border-gold/45 p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-gold/20 pb-2.5">
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-gold">
                          {editingAdmId
                            ? "Editar Registro — Banco Administrativo"
                            : "Novo Cadastro — Banco Administrativo (ADM / Imobiliária)"}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setShowAdmForm(false)}
                          className="text-gold/60 hover:text-gold"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Highlighted Agency Credentials & Plan block */}
                      {admForm.tipo === "imobiliaria" && (
                        <div className="p-3.5 rounded-xl bg-[#07182e] border border-gold/40 space-y-3">
                          <div className="flex items-center gap-2 text-gold text-[11px] font-extrabold uppercase tracking-wider">
                            <KeyRound className="w-4 h-4" />
                            <span>Cadastro da Imobiliária — ID do Cadastro, Plano Adquirido &amp; Senha de Acesso</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className={labelCls}>ID do Cadastro *</label>
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  required
                                  maxLength={LIMITS.codigoCadastro}
                                  value={admForm.codigoCadastro}
                                  onChange={(e) =>
                                    setAdmForm({
                                      ...admForm,
                                      codigoCadastro: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
                                    })
                                  }
                                  placeholder="IMOB-1234"
                                  className={`${fieldCls} font-mono font-bold tracking-wider`}
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAdmForm({ ...admForm, codigoCadastro: generateAgencyCodigoCadastro() })
                                  }
                                  className="px-2.5 rounded-lg border border-gold/35 text-gold hover:bg-gold/10"
                                  title="Gerar novo ID"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className={labelCls}>Plano Adquirido *</label>
                              <select
                                required
                                value={admForm.plano}
                                onChange={(e) => handleAdmPlanoChange(e.target.value as PlanoImobiliariaTipo)}
                                className={fieldCls}
                              >
                                {PLANOS_IMOBILIARIA.map((p) => (
                                  <option key={p.value} value={p.value}>
                                    {p.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className={labelCls}>Senha da Imobiliária (Painel Corretores) *</label>
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  required
                                  maxLength={LIMITS.senhaAcesso}
                                  value={admForm.senhaAcesso}
                                  onChange={(e) => setAdmForm({ ...admForm, senhaAcesso: e.target.value })}
                                  placeholder="ELITE-XXXXXXXX"
                                  className={`${fieldCls} font-mono font-bold tracking-wider`}
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAdmForm({ ...admForm, senhaAcesso: generateAgencySenhaAcesso() })
                                  }
                                  className="px-2.5 rounded-lg border border-gold/35 text-gold hover:bg-gold/10"
                                  title="Gerar nova senha"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            A Imobiliária usará o <strong className="text-gold">ID do Cadastro</strong> +{" "}
                            <strong className="text-gold">Senha da Imobiliária</strong> no Painel Comercial para
                            cadastrar seus corretores vinculados até o limite do plano adquirido.
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className={labelCls}>Categoria *</label>
                          <select
                            value={admForm.tipo}
                            onChange={(e) => handleAdmTipoChange(e.target.value as AdministrativoTipo)}
                            className={fieldCls}
                          >
                            <option value="imobiliaria">Imobiliária</option>
                            <option value="adm">Administrador (ADM)</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>
                            {admForm.tipo === "imobiliaria" ? "Nome da Imobiliária *" : "Nome do Administrador *"}
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={LIMITS.nome}
                            value={admForm.nome}
                            onChange={(e) => setAdmForm({ ...admForm, nome: e.target.value })}
                            placeholder={admForm.tipo === "imobiliaria" ? "Imobiliária Exemplo Ltda" : "Nome Completo"}
                            className={fieldCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>E-mail Autorizado (Google) *</label>
                          <input
                            type="email"
                            required
                            disabled={Boolean(editingAdmId)}
                            maxLength={LIMITS.email}
                            value={admForm.email}
                            onChange={(e) => setAdmForm({ ...admForm, email: e.target.value })}
                            placeholder="contato@imobiliaria.com.br"
                            className={`${fieldCls} ${editingAdmId ? "opacity-60 cursor-not-allowed" : ""}`}
                          />
                        </div>

                        <div>
                          <label className={labelCls}>CPF / CNPJ</label>
                          <input
                            type="text"
                            maxLength={LIMITS.cpfCnpj}
                            value={admForm.cpfCnpj}
                            onChange={(e) => setAdmForm({ ...admForm, cpfCnpj: e.target.value })}
                            placeholder="00.000.000/0001-00"
                            className={fieldCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>CRECI-J</label>
                          <input
                            type="text"
                            maxLength={LIMITS.creciJuridico}
                            value={admForm.creciJuridico}
                            onChange={(e) => setAdmForm({ ...admForm, creciJuridico: e.target.value })}
                            placeholder="00000-J"
                            className={fieldCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Responsável Legal / Diretor</label>
                          <input
                            type="text"
                            maxLength={LIMITS.responsavel}
                            value={admForm.responsavel}
                            onChange={(e) => setAdmForm({ ...admForm, responsavel: e.target.value })}
                            placeholder="Nome do responsável"
                            className={fieldCls}
                          />
                        </div>

                        <div>
                          <label className={labelCls}>WhatsApp / Telefone</label>
                          <input
                            type="text"
                            maxLength={LIMITS.telefone}
                            value={admForm.telefone}
                            onChange={(e) => setAdmForm({ ...admForm, telefone: e.target.value })}
                            placeholder="(11) 99999-9999"
                            className={fieldCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Cidade / UF</label>
                          <input
                            type="text"
                            maxLength={LIMITS.cidade}
                            value={admForm.cidade}
                            onChange={(e) => setAdmForm({ ...admForm, cidade: e.target.value })}
                            placeholder="São Paulo / SP"
                            className={fieldCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>
                            {admForm.tipo === "imobiliaria" && admForm.plano === "master"
                              ? "Qtd. Usuários Plano Master (mín. 31) *"
                              : "Limite de Corretores"}
                          </label>
                          <input
                            type="number"
                            min={admForm.tipo === "imobiliaria" && admForm.plano === "master" ? 31 : 0}
                            max={LIMITS.limiteCorretoresMax}
                            value={admForm.limiteCorretores}
                            onChange={(e) => setAdmForm({ ...admForm, limiteCorretores: e.target.value })}
                            placeholder="Ex: 10"
                            className={fieldCls}
                          />
                        </div>

                        <div>
                          <label className={labelCls}>Validade do Contrato</label>
                          <input
                            type="date"
                            value={admForm.validadeAte}
                            onChange={(e) => setAdmForm({ ...admForm, validadeAte: e.target.value })}
                            className={fieldCls}
                          />
                          {admForm.tipo === "imobiliaria" && (
                            <div className="flex gap-1.5 mt-1.5">
                              {[90, 180, 365].map((days) => (
                                <button
                                  key={days}
                                  type="button"
                                  onClick={() => setAdmForm({ ...admForm, validadeAte: addDaysToIsoDate(days) })}
                                  className="px-2 py-0.5 rounded border border-gold/30 text-[10px] font-bold text-gold/80 hover:bg-gold/15"
                                >
                                  +{days}d
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className={labelCls}>Status *</label>
                          <select
                            value={admForm.status}
                            onChange={(e) => setAdmForm({ ...admForm, status: e.target.value as AccessStatus })}
                            className={fieldCls}
                          >
                            <option value="ativo">Ativo (Liberado)</option>
                            <option value="pendente_pagamento">Pendente de Pagamento</option>
                            <option value="bloqueado">Bloqueado</option>
                            <option value="expirado">Expirado</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 pt-1">
                        <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={admForm.pagamentoConfirmado}
                            onChange={(e) =>
                              setAdmForm({
                                ...admForm,
                                pagamentoConfirmado: e.target.checked,
                                status: e.target.checked
                                  ? admForm.autorizado
                                    ? "ativo"
                                    : "bloqueado"
                                  : admForm.tipo === "imobiliaria"
                                    ? "pendente_pagamento"
                                    : admForm.status,
                              })
                            }
                            className="rounded border-gold/50 accent-amber-500"
                          />
                          <span>Pagamento confirmado em simuladorcorretorelite.com.br</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={admForm.autorizado}
                            onChange={(e) =>
                              setAdmForm({
                                ...admForm,
                                autorizado: e.target.checked,
                                status: !e.target.checked ? "bloqueado" : "ativo",
                              })
                            }
                            className="rounded border-gold/50 accent-amber-500"
                          />
                          <span>Cadastro autorizado</span>
                        </label>
                      </div>

                      <div>
                        <label className={labelCls}>Observações Internas</label>
                        <textarea
                          rows={2}
                          maxLength={LIMITS.observacoes}
                          value={admForm.observacoes}
                          onChange={(e) => setAdmForm({ ...admForm, observacoes: e.target.value })}
                          placeholder="Contrato, observações comerciais..."
                          className={`${fieldCls} resize-none`}
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAdmForm(false)}
                          className="px-4 py-2 rounded-lg border border-gold/30 text-gold/80 text-xs font-bold uppercase hover:bg-gold/10"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-5 py-2 rounded-lg gold-gradient text-primary text-xs font-extrabold uppercase tracking-wider hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                        >
                          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          {editingAdmId ? "Salvar Alterações" : "Gravar no Banco Administrativo"}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* List */}
                  {loadingData ? (
                    <div className="py-12 flex items-center justify-center gap-2 text-gold/70 text-xs">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Carregando Banco Administrativo...
                    </div>
                  ) : filteredAdministrativos.length === 0 ? (
                    <div className="py-12 text-center rounded-xl border border-dashed border-gold/25 bg-[#091c34] space-y-2">
                      <Building2 className="w-8 h-8 text-gold/40 mx-auto" />
                      <p className="text-sm font-bold text-gold/80">Nenhuma Imobiliária ou ADM cadastrado</p>
                      <p className="text-xs text-slate-400">
                        Utilize os botões acima para cadastrar Administradores e Imobiliárias com ID, Plano e Senha.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {filteredAdministrativos.map((rec) => {
                        const statusMeta = STATUS_META[rec.status] || STATUS_META.bloqueado;
                        const isFullyActive =
                          rec.status === "ativo" && rec.autorizado && (rec.tipo === "adm" || rec.pagamentoConfirmado);
                        const linkedCount = activeBrokersByAgency.get(rec.id) || 0;
                        const planText =
                          rec.planoLabel || (rec.plano ? getPlanoImobiliariaInfo(rec.plano).label : undefined);
                        const copyId = `cred-${rec.id}`;
                        return (
                          <div
                            key={rec.id}
                            className="rounded-xl bg-[#0b213d] border border-gold/25 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3"
                          >
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-bold text-white truncate">{rec.nome}</span>
                                {rec.codigoCadastro && (
                                  <span className="px-2 py-0.5 text-[10px] font-mono font-extrabold uppercase rounded border border-gold/50 bg-gold/15 text-gold">
                                    ID: {rec.codigoCadastro}
                                  </span>
                                )}
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                                    rec.tipo === "adm"
                                      ? "border-sky-400/40 bg-sky-500/15 text-sky-300"
                                      : "border-gold/40 bg-gold/10 text-gold"
                                  }`}
                                >
                                  {rec.tipo === "adm" ? "Administrador (ADM)" : "Imobiliária"}
                                </span>
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${statusMeta.cls}`}
                                >
                                  {statusMeta.label}
                                </span>
                                {rec.tipo === "imobiliaria" && planText && (
                                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-800 text-amber-200 border border-gold/30">
                                    {planText}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gold/80 truncate">{rec.email}</p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                                {rec.tipo === "imobiliaria" && rec.senhaAcesso && (
                                  <span className="text-slate-200 font-mono">
                                    Senha: <strong className="text-gold">{rec.senhaAcesso}</strong>
                                  </span>
                                )}
                                {rec.tipo === "imobiliaria" && rec.limiteCorretores !== undefined && (
                                  <span className="text-emerald-300 font-semibold">
                                    Corretores: {linkedCount} / {rec.limiteCorretores}
                                  </span>
                                )}
                                {rec.cpfCnpj && <span>Doc: {rec.cpfCnpj}</span>}
                                {rec.creciJuridico && <span>CRECI-J: {rec.creciJuridico}</span>}
                                {rec.responsavel && <span>Resp: {rec.responsavel}</span>}
                                {rec.cidade && <span>Cidade: {rec.cidade}</span>}
                                {rec.validadeAte && <span>Validade: {rec.validadeAte}</span>}
                                {rec.tipo === "imobiliaria" && (
                                  <span className={rec.pagamentoConfirmado ? "text-emerald-400" : "text-amber-300"}>
                                    {rec.pagamentoConfirmado ? "✔ Pgto Confirmado" : "⏳ Pgto Pendente"}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                              {rec.tipo === "imobiliaria" && rec.codigoCadastro && rec.senhaAcesso && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    copyText(
                                      `Imobiliária: ${rec.nome}\nID do Cadastro: ${rec.codigoCadastro}\nSenha: ${rec.senhaAcesso}\nPlano: ${planText || ""}\nE-mail Google: ${rec.email}`,
                                      copyId,
                                    )
                                  }
                                  className="px-2.5 py-1.5 rounded-lg border border-gold/35 text-gold text-[11px] font-bold hover:bg-gold/10 flex items-center gap-1"
                                  title="Copiar ID e Senha da Imobiliária"
                                >
                                  {copiedKey === copyId ? (
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
                              )}
                              <button
                                type="button"
                                disabled={busyRecordId === rec.id}
                                onClick={() => handleQuickAuthorizeAdm(rec)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-colors flex items-center gap-1.5 ${
                                  isFullyActive
                                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25"
                                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                                }`}
                              >
                                {busyRecordId === rec.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : isFullyActive ? (
                                  <XCircle className="w-3.5 h-3.5" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                {isFullyActive ? "Bloquear" : "Autorizar"}
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditAdmForm(rec)}
                                className="p-2 rounded-lg border border-gold/30 text-gold hover:bg-gold/10"
                                title="Editar"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              {confirmDeleteId === rec.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={busyRecordId === rec.id}
                                    onClick={() => handleDeleteAdm(rec.id)}
                                    className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-[10px] font-bold uppercase"
                                  >
                                    Confirmar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="px-2 py-1.5 rounded-lg bg-slate-700 text-slate-200 text-[10px]"
                                  >
                                    Não
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(rec.id)}
                                  className="p-2 rounded-lg border border-red-500/35 text-red-400 hover:bg-red-500/15"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-3 border-t border-gold/20 bg-[#041022] flex flex-wrap items-center justify-between gap-2 text-[11px] text-gold/60">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Somente usuários com cadastro ativo e pagamento confirmado acessam o simulador.</span>
              </div>
              <a
                href="https://simuladorcorretorelite.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline flex items-center gap-1 font-semibold"
              >
                simuladorcorretorelite.com.br
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
