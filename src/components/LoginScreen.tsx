import { useState, useEffect } from "react";
import {
  Shield,
  Eye,
  EyeOff,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Send,
  MessageCircle,
  X,
  Home,
  Settings,
  Lock,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import DemoAdminPanel from "@/components/DemoAdminPanel";
import AccessDatabasePanel from "@/components/AccessDatabasePanel";
import SystemLogo from "@/components/SystemLogo";
import { useFirebaseAuth } from "@/contexts/FirebaseContext";
import { formatFirebaseAuthError, validatePersonalPasswordStrength } from "@/lib/firebase";
import type { AccessAuthorizationResult } from "@/lib/accessDatabase";
import PainelComercial from "@/components/PainelComercial"; // Painel Comercial modal
import LgpdPanel from "@/components/LgpdPanel";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";
import ClienteSiteLogin from "@/components/ClienteSiteLogin";
import BiometriaLoginPanel from "@/components/BiometriaLoginPanel";
import {
  getExpirationInfo,
  isFullVersion,
  setFullVersion,
  getSenhaUsuario,
  setSenhaUsuario,
  verifySenhaUsuario,
  getSenhaLiberacao,
  setSenhaLiberacao,
  getPixValue,
  checkDeviceLicense,
  lockDeviceFingerprint,
  resetSystem,
  formatMasterPass,
  validatePassword,
  getUserEmail,
  setUserEmail,
  createSession,
  getSessionToken,
  registerLiberationPassword,
  VISITOR_PASSWORD,
  setVisitorMode,
  setMasterAccess,
  MASTER_EMAIL,
  MASTER_PASSWORD,
  setAuthProvider,
} from "@/lib/eliteUtils";

interface LoginScreenProps {
  onLogin: () => void;
  sessionKicked?: boolean;
  onSessionKickedAck?: () => void;
}

type Screen =
  | "login"
  | "blocked"
  | "master-modal"
  | "liberacao"
  | "confirm-lib"
  | "new-user"
  | "lib-saved"
  | "elite-welcome"
  | "change-pin"
  | "email-register"
  | "email-pin-register";

// Reusable password input with eye toggle
function PasswordInput({
  value,
  onChange,
  placeholder,
  maxLength = 50,
  className = "",
  onKeyDown,
  centerText = true,
  numericOnly = false,
  id,
  name = "password",
  autoComplete = "current-password",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  centerText?: boolean;
  numericOnly?: boolean;
  id?: string;
  name?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => {
          let val = e.target.value;
          if (numericOnly) val = val.replace(/\D/g, "").slice(0, maxLength);
          onChange(val);
        }}
        id={id}
        name={name}
        autoComplete={autoComplete}
        placeholder={placeholder}
        maxLength={maxLength}
        onKeyDown={onKeyDown}
        className={`w-full pr-12 ${className} ${centerText ? "text-center" : ""}`}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gold/60 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function FaleConoscoModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ nome: "", whatsapp: "", email: "", creci: "", cidade: "", mensagem: "" });
  const [sending, setSending] = useState(false);

  const handleSend = () => {
    if (!form.nome || !form.whatsapp || !form.email) {
      alert("Preencha pelo menos Nome, WhatsApp e Email.");
      return;
    }
    setSending(true);
    const subject = encodeURIComponent("Contato via Simulador Corretor de Elite 4.0");
    const body = encodeURIComponent(
      `Nome: ${form.nome}\nWhatsApp: ${form.whatsapp}\nEmail: ${form.email}\nCRECI: ${form.creci || "-"}\nCidade: ${form.cidade || "-"}\nMensagem: ${form.mensagem || "-"}`,
    );
    window.open(`mailto:lourencojunior.corretor@creci.org.br?subject=${subject}&body=${body}`, "_self");
    setTimeout(() => {
      setSending(false);
      onClose();
    }, 1000);
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md max-h-[90dvh] overflow-y-auto bg-card border-t-2 sm:border-2 border-gold/40 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-6 shadow-2xl space-y-3 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-border mx-auto mb-1 sm:hidden" aria-hidden="true" />
        <div className="flex items-center justify-between">
          <h4 className="text-base font-bold text-primary">Fale Conosco</h4>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <input
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          placeholder="Nome"
          className="w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-gold"
        />
        <input
          value={form.whatsapp}
          onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
          placeholder="WhatsApp"
          className="w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-gold"
        />
        <input
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Email"
          type="email"
          className="w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-gold"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            value={form.creci}
            onChange={(e) => setForm({ ...form, creci: e.target.value })}
            placeholder="CRECI"
            className="w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-gold"
          />
          <input
            value={form.cidade}
            onChange={(e) => setForm({ ...form, cidade: e.target.value })}
            placeholder="Cidade"
            className="w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
        <textarea
          value={form.mensagem}
          onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
          placeholder="Mensagem"
          rows={3}
          className="w-full px-3.5 py-2.5 text-base sm:text-sm rounded-xl border border-border bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-gold"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending}
          className="w-full min-h-[46px] py-2.5 rounded-xl gold-gradient text-primary font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" /> Enviar mensagem
        </button>
      </div>
    </div>
  );
}

export default function LoginScreen({ onLogin, sessionKicked, onSessionKickedAck }: LoginScreenProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [screen, setScreen] = useState<Screen>("login");
  const [demoAdminOpen, setDemoAdminOpen] = useState(false);
  const [accessDbOpen, setAccessDbOpen] = useState(false);
  const [accessDbInitialTab, setAccessDbInitialTab] = useState<"corretor_elite" | "administrativo">("administrativo");
  const [corretorModalOpen, setCorretorModalOpen] = useState(false);
  const [accessDeniedNotice, setAccessDeniedNotice] = useState<AccessAuthorizationResult | null>(null);
  const [painelComercialLoginOpen, setPainelComercialLoginOpen] = useState(false);
  const [masterInput, setMasterInput] = useState("");
  const [liberacaoInput, setLiberacaoInput] = useState("");
  const [confirmLibInput, setConfirmLibInput] = useState("");
  const [newPassInput, setNewPassInput] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [senhaLiberacaoTemp, setSenhaLiberacaoTemp] = useState("");
  const [dataEnvioTemp, setDataEnvioTemp] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const {
    signInWithGoogle,
    signInWithPassword,
    registerWithPassword,
    reloadAndVerifyEmail,
    resendEmailVerificationLink,
    sendPasswordReset,
  } = useFirebaseAuth();
  const [authTab, setAuthTab] = useState<"login" | "create_password">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState("");
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [eliteDiasRestantes, setEliteDiasRestantes] = useState(0);
  const [currentPinInput, setCurrentPinInput] = useState("");
  const [newPinInput, setNewPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [emailRegInput, setEmailRegInput] = useState("");
  const [emailConfirmPassInput, setEmailConfirmPassInput] = useState("");
  const [emailRegError, setEmailRegError] = useState("");
  const [emailRegLoading, setEmailRegLoading] = useState(false);
  const [pendingLoginPassword, setPendingLoginPassword] = useState("");
  const [pendingAccessLevel, setPendingAccessLevel] = useState("");
  const isFull = isFullVersion();
  const { diasRestantes, isExpired } = getExpirationInfo();
  const [pixValue, setPixValue] = useState("...");
  const [gravandoValidacao, setGravandoValidacao] = useState(false);
  const [validacaoGravada, setValidacaoGravada] = useState(false);
  const [emailPinRegInput, setEmailPinRegInput] = useState("");
  const [pinRegInput, setPinRegInput] = useState("");
  const [emailPinError, setEmailPinError] = useState("");
  const [emailPinLoading, setEmailPinLoading] = useState(false);
  const [lgpdOpen, setLgpdOpen] = useState(false);
  const [faleConoscoOpen, setFaleConoscoOpen] = useState(false);
  const [showLicenseBanner, setShowLicenseBanner] = useState(true);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [clienteSiteOpen, setClienteSiteOpen] = useState(false);
  const [subPlan, setSubPlan] = useState<"mensal" | "semestral" | "anual" | "anual_dev">("mensal");
  const [subEmail, setSubEmail] = useState("");
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState("");

  const handleMercadoPagoSubscription = async () => {
    if (!subEmail || !subEmail.includes("@")) {
      setSubError("Por favor, insira um e-mail válido.");
      return;
    }
    setSubError("");
    setSubLoading(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error: fnErr } = await supabase.functions.invoke("mercadopago-checkout", {
        body: {
          userEmail: subEmail.trim().toLowerCase(),
          isSubscription: true,
          planType: subPlan
        }
      });
      if (fnErr) throw new Error(fnErr.message);
      if (data?.init_point) {
        window.open(data.init_point, "_blank");
      } else {
        throw new Error("Link de pagamento não gerado.");
      }
    } catch (err: unknown) {
      setSubError(err instanceof Error ? err.message : "Erro ao gerar link de assinatura.");
    } finally {
      setSubLoading(false);
    }
  };
  useEffect(() => {
    if (isFull) return;
    // Primeiro acesso: visível 30s, depois ciclo: 90s ausente, 30s visível
    const hideTimeout = setTimeout(() => setShowLicenseBanner(false), 30000);
    const interval = setInterval(() => {
      setShowLicenseBanner(true);
      setTimeout(() => setShowLicenseBanner(false), 30000);
    }, 120000); // 30s visível + 90s ausente = 120s ciclo
    return () => {
      clearTimeout(hideTimeout);
      clearInterval(interval);
    };
  }, [isFull]);
  useEffect(() => {
    getPixValue().then(setPixValue);
  }, []);

  useEffect(() => {
    const init = async () => {
      const deviceStatus = await checkDeviceLicense();
      if (deviceStatus === "mismatch") {
        setStatusMsg("Dispositivo diferente detectado — versão DEMO ativada");
        setScreen("login");
        return;
      }
      if (isExpired && !isFull) {
        resetSystem();
        setScreen("blocked");
      } else if (isFull) {
        setStatusMsg("SISTEMA LIBERADO - ACESSO AUTORIZADO");
      } else {
        setStatusMsg("Acesso exclusivo para Corretores e Clientes cadastrados após confirmação de pagamento em simuladorcorretorelite.com.br");
      }
    };
    init();
  }, []);

  // Lock body scroll while login screen is mounted
  useEffect(() => {
    document.body.classList.add("login-no-scroll");
    return () => document.body.classList.remove("login-no-scroll");
  }, []);

  const sleepMs = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const checkLiberationWithRetry = async (code: string, attempts = 3, delayMs = 900) => {
    let lastResult: Awaited<ReturnType<typeof validatePassword>> = { valid: false, accessLevel: "" };

    for (let i = 0; i < attempts; i++) {
      lastResult = await validatePassword(code, "check_liberation");

      if (lastResult.valid || lastResult.accessLevel === "already_used") {
        return lastResult;
      }

      // Retry only for propagation delay cases
      if (lastResult.accessLevel !== "not_registered") {
        return lastResult;
      }

      if (i < attempts - 1) {
        await sleepMs(delayMs);
      }
    }

    return lastResult;
  };

  const handleGoogleLogin = async () => {
    setError("");
    setAccessDeniedNotice(null);
    setGoogleLoading(true);
    try {
      const { user, authorization } = await signInWithGoogle();
      if (!authorization.authorized) {
        setAccessDeniedNotice(authorization);
        return;
      }

      const email = (user.email || "").trim().toLowerCase();
      if (email) {
        try {
          await createSession(email);
        } catch {
          // Firebase Google session remains valid even if edge session is unreachable
        }
      }
      setCorretorModalOpen(false);
      onLogin();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        setError("Login com Google cancelado.");
      } else if (code === "auth/popup-blocked") {
        setError("Pop-up bloqueado pelo navegador. Permita pop-ups para entrar com o Google.");
      } else {
        console.error("[GoogleAuth] Error:", err);
        setError("Não foi possível autenticar com o Google. Tente novamente.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleCreatePersonalPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfoNotice("");
    setAccessDeniedNotice(null);

    const cleanEmail = regEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Informe o e-mail vinculado ao seu contrato ou cadastrado pela sua imobiliária.");
      return;
    }
    const strengthErr = validatePersonalPasswordStrength(regPassword);
    if (strengthErr) {
      setError(strengthErr);
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError("A confirmação de senha não confere. Digite a mesma senha nos dois campos.");
      return;
    }

    setLoading(true);
    try {
      const outcome = await registerWithPassword(cleanEmail, regPassword);
      if (outcome.needsEmailVerification) {
        setPendingVerifyEmail(cleanEmail);
        setInfoNotice(outcome.authorization.message);
        setRegPassword("");
        setRegConfirmPassword("");
      }
    } catch (err) {
      setError(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckEmailVerification = async () => {
    setError("");
    setInfoNotice("");
    setAccessDeniedNotice(null);
    setVerifyingEmail(true);
    try {
      const outcome = await reloadAndVerifyEmail();
      if (!outcome) {
        setError("Sessão expirada. Faça login novamente com seu e-mail e senha pessoal.");
        setPendingVerifyEmail(null);
        return;
      }
      if (outcome.needsEmailVerification) {
        setInfoNotice(outcome.authorization.message);
        return;
      }
      if (!outcome.authorization.authorized) {
        setPendingVerifyEmail(null);
        setAccessDeniedNotice(outcome.authorization);
        return;
      }
      const email = (outcome.user.email || "").trim().toLowerCase();
      if (email) {
        try {
          await createSession(email);
        } catch {
          // Firebase verified session remains active
        }
      }
      setPendingVerifyEmail(null);
      onLogin();
    } catch (err) {
      setError(formatFirebaseAuthError(err));
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleResendVerification = async () => {
    setError("");
    setResendingEmail(true);
    try {
      await resendEmailVerificationLink();
      setInfoNotice("Novo e-mail de confirmação enviado! Verifique sua caixa de entrada e spam.");
    } catch (err) {
      setError(formatFirebaseAuthError(err));
    } finally {
      setResendingEmail(false);
    }
  };

  const handleResetPersonalPassword = async () => {
    const targetEmail = (loginEmail || regEmail).trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes("@")) {
      setForgotOpen(true);
      return;
    }
    setError("");
    setInfoNotice("");
    setLoading(true);
    try {
      await sendPasswordReset(targetEmail);
      setInfoNotice(`Link de redefinição de senha pessoal enviado para ${targetEmail}.`);
    } catch (err) {
      setError(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // DEFAULT LOGIN
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccessDeniedNotice(null);
    setInfoNotice("");
    setError("");
    if (isExpired && !isFull) {
      resetSystem();
      setScreen("blocked");
      return;
    }

    const cleanPassword = password.trim();
    const cleanEmail = loginEmail.trim().toLowerCase();

    // MASTER PASSWORD - Immediate unlimited access bypass (lourenco.consultorimob@gmail.com)
    if (cleanPassword === MASTER_PASSWORD) {
      setMasterAccess(true);
      setFullVersion(true);
      setVisitorMode(false);
      setUserEmail(MASTER_EMAIL);
      setAuthProvider("master");
      sessionStorage.setItem("luiza_elite_auth", "true");
      await createSession(MASTER_EMAIL);
      onLogin();
      return;
    }

    // HYBRID PERSONAL PASSWORD LOGIN (Email + Personal Password via Firebase Auth + Firestore Contract Gate)
    if (cleanEmail && cleanEmail.includes("@")) {
      if (!cleanPassword) {
        setError("Digite sua senha pessoal.");
        return;
      }
      setLoading(true);
      try {
        const outcome = await signInWithPassword(cleanEmail, cleanPassword);
        if (outcome.needsEmailVerification) {
          setPendingVerifyEmail(cleanEmail);
          setInfoNotice(outcome.authorization.message);
          return;
        }
        if (!outcome.authorization.authorized) {
          setAccessDeniedNotice(outcome.authorization);
          return;
        }
        try {
          await createSession(cleanEmail);
        } catch {
          // Firebase session remains active
        }
        setPendingVerifyEmail(null);
        onLogin();
      } catch (err) {
        setError(formatFirebaseAuthError(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    // Block unregistered visitor access — service requires confirmed payment & registration
    if (cleanPassword === VISITOR_PASSWORD) {
      setAccessDeniedNotice({
        authorized: false,
        role: "none",
        code: "not_registered",
        message:
          "Acesso de visitante desativado. Somente Corretores e Clientes cadastrados após confirmação de pagamento em simuladorcorretorelite.com.br podem acessar o serviço.",
      });
      setPassword("");
      return;
    }

    const localPin = getSenhaUsuario();
    const localLiberacao = getSenhaLiberacao();

    // Fluxo para PIN de 6 dígitos (local + fallback server-side)
    if (/^\d{6}$/.test(cleanPassword)) {
      const normalizedPin = cleanPassword;

      if (isFull && localPin) {
        const pinMatch = await verifySenhaUsuario(normalizedPin);
        if (pinMatch) {
          const email = getUserEmail();
          if (!email) {
            setPendingLoginPassword(normalizedPin);
            setPendingAccessLevel("user");
            setScreen("email-register");
            return;
          }

          await createSession(email);
          onLogin();
          return;
        }
      }

      const storedEmail = getUserEmail();
      if (storedEmail) {
        // Tem email salvo, tenta login direto
        setLoading(true);
        try {
          const serverPinResult = await validatePassword(normalizedPin, "pin_login", storedEmail);
          if (serverPinResult.valid) {
            setFullVersion(true);
            setUserEmail(storedEmail);
            await setSenhaUsuario(normalizedPin);
            await lockDeviceFingerprint();
            await createSession(storedEmail);
            onLogin();
            return;
          }
        } finally {
          setLoading(false);
        }
      }

      // Sem email salvo ou falhou com email salvo — pedir email na tela
      setPendingLoginPassword(normalizedPin);
      setPendingAccessLevel("pin_corretor");
      setScreen("email-register");
      return;
    }

    // Senha de liberação local — verifica se já foi usada no servidor
    if (localLiberacao && cleanPassword === localLiberacao) {
      if (!isFull) {
        setError("Acesso bloqueado: fluxo de liberação inválido.");
        setPassword("");
        return;
      }

      // Check server-side if this liberation password was already used
      setLoading(true);
      try {
        const checkResult = await checkLiberationWithRetry(localLiberacao);
        if (!checkResult.valid && checkResult.accessLevel === "already_used") {
          setError("Esta senha de liberação já foi utilizada por outro usuário.");
          setPassword("");
          return;
        }
      } finally {
        setLoading(false);
      }

      setPassword("");
      setPendingLoginPassword(localLiberacao);
      setPendingAccessLevel("master");
      setScreen("email-pin-register");
      return;
    }

    setLoading(true);
    try {
      // Check if it's the general access password — requires email confirmation
      const generalPassCheck = await validatePassword(cleanPassword, "painel_comercial");
      if (
        generalPassCheck.valid &&
        generalPassCheck.accessLevel === "painel_comercial" &&
        cleanPassword === cleanPassword.replace(/\D/g, "") &&
        cleanPassword.length === 8
      ) {
        // Could be the general password — route to email confirmation
        setPendingLoginPassword(cleanPassword);
        setPendingAccessLevel("general_access");
        setScreen("email-register");
        setLoading(false);
        return;
      }

      const result = await validatePassword(cleanPassword, "login");
      if (result.valid) {
        if (result.accessLevel === "master") {
          setFullVersion(true);
          setScreen("liberacao");
        } else if (result.accessLevel === "elite_demo") {
          setPendingLoginPassword(cleanPassword);
          setPendingAccessLevel("elite_demo");
          setEliteDiasRestantes(result.diasRestantes || 0);
          if (!getUserEmail()) {
            setScreen("email-register");
          } else {
            await createSession(getUserEmail()!);
            setScreen("elite-welcome");
          }
        } else {
          // Login DEMO (#Lou@472370)
          await createSession("demo@elite4.local");
          onLogin();
        }
        return;
      }

      // Se login falhou, verificar se é uma senha de liberação válida (não usada)
      const libCheck = await checkLiberationWithRetry(cleanPassword);
      if (libCheck.valid && libCheck.accessLevel === "liberation_available") {
        // É uma senha de liberação válida — salvar localmente e ir para registro
        setSenhaLiberacao(cleanPassword);
        setFullVersion(true);
        setDataEnvioTemp(new Date().toLocaleDateString("pt-BR"));
        setPendingLoginPassword(cleanPassword);
        setPendingAccessLevel("master");
        setScreen("email-pin-register");
        return;
      }

      if (!libCheck.valid && libCheck.accessLevel === "already_used") {
        setError("Esta senha de liberação já foi utilizada por outro usuário.");
        setPassword("");
        return;
      }
    } finally {
      setLoading(false);
    }

    setError("Senha incorreta!");
    setPassword("");
  };

  const handleMasterValidate = async () => {
    setLoading(true);
    try {
      const input = masterInput.trim();

      // Primeiro tenta validar como senha master
      const result = await validatePassword(input, "master_validate");
      if (result.valid) {
        setScreen("liberacao");
        setMasterInput("");
        return;
      }

      // Fallback: permite usar a senha de envio direto neste modal
      const libResult = await checkLiberationWithRetry(input);
      if (libResult.valid && libResult.accessLevel === "liberation_available") {
        setSenhaLiberacao(input);
        setFullVersion(true);
        setDataEnvioTemp(new Date().toLocaleDateString("pt-BR"));
        setPendingLoginPassword(input);
        setPendingAccessLevel("master");
        setMasterInput("");
        setScreen("email-pin-register");
        return;
      }

      if (!libResult.valid && libResult.accessLevel === "already_used") {
        alert("Esta senha de validação já foi utilizada.");
        return;
      }

      alert("SENHA MASTER INCORRETA");
    } finally {
      setLoading(false);
    }
  };

  const persistLiberationValidation = async (rawCode: string): Promise<{ ok: boolean; message?: string }> => {
    const code = rawCode.trim();
    if (!code) {
      return { ok: false, message: "Insira a senha de liberação." };
    }

    setSenhaLiberacaoTemp(code);
    setSenhaLiberacao(code);
    setFullVersion(true);
    setDataEnvioTemp(new Date().toLocaleDateString("pt-BR"));

    // Register always creates a new entry now
    const regResult = await registerLiberationPassword(code);
    console.log("[Liberacao] registerResult:", JSON.stringify(regResult));

    if (!regResult.valid) {
      return { ok: false, message: "Erro ao gravar validação no servidor. Tente novamente." };
    }

    // Sheets tracking is complementary - failure here doesn't invalidate the registration
    try {
      const masterEmail = getUserEmail() || "master@elite4.local";
      const sessionToken = await createSession(masterEmail);

      if (sessionToken) {
        const now = new Date();
        const { supabase } = await import("@/integrations/supabase/client");
        await supabase.functions.invoke("send-to-sheets", {
          body: {
            session_token: sessionToken,
            aba: "SENHA DEFINITIVA",
            senha_envio: code,
            data_envio: dataEnvioTemp || now.toLocaleDateString("pt-BR"),
            email: "",
            senha: "",
            nome: "",
            data_ativacao: "",
            tipo: "ENVIO",
            status: "Aguardando Ativação",
          },
        });
      }
    } catch (err) {
      console.error("[Liberacao] Sheets exception:", err);
    }

    return { ok: true };
  };

  const handleLiberacaoSave = async () => {
    if (!liberacaoInput.trim()) {
      alert("Insira a senha de liberação.");
      return;
    }

    setGravandoValidacao(true);
    try {
      const persistResult = await persistLiberationValidation(liberacaoInput);
      if (!persistResult.ok) {
        alert(persistResult.message || "Erro ao gravar validação.");
        return;
      }

      setValidacaoGravada(true);
      setLiberacaoInput("");
      setConfirmLibInput("");
      setScreen("lib-saved");

      alert(
        persistResult.message
          ? `✅ Senha de validação gravada com sucesso!\n\n${persistResult.message}`
          : "✅ Senha de validação gravada com sucesso!\nAgora você pode fechar o sistema e enviar esta senha ao cliente.",
      );
    } finally {
      setGravandoValidacao(false);
    }
  };

  const handleConfirmLiberacao = async () => {
    if (confirmLibInput !== senhaLiberacaoTemp) {
      alert("Senha de liberação não confere. Tente novamente.");
      setConfirmLibInput("");
      return;
    }

    setGravandoValidacao(true);
    try {
      const persistResult = await persistLiberationValidation(confirmLibInput);
      if (!persistResult.ok) {
        alert(persistResult.message || "Erro ao gravar validação.");
        return;
      }

      setValidacaoGravada(true);
      setConfirmLibInput("");
      setScreen("lib-saved");
      if (persistResult.message) alert(persistResult.message);
    } finally {
      setGravandoValidacao(false);
    }
  };

  const handleNewPass = async () => {
    if (newPassInput.length === 6) {
      await setSenhaUsuario(newPassInput);
      await lockDeviceFingerprint();
      alert("Nova senha de 6 dígitos configurada com sucesso!\nLicença vinculada a este dispositivo.");

      const savedEmail = getUserEmail();
      if (savedEmail) {
        const pinSync = await validatePassword(newPassInput, "register_pin", savedEmail);
        if (!pinSync.valid) {
          alert("Senha salva localmente, mas houve falha ao sincronizar no servidor. Tente novamente.");
          return;
        }
      }

      // Redirect to email registration if no email is set
      if (!savedEmail) {
        setPendingLoginPassword(newPassInput);
        setPendingAccessLevel("master");
        setScreen("email-register");
        return;
      }

      await createSession(savedEmail);
      onLogin();
    } else {
      alert("A senha deve ter exatamente 6 dígitos.");
    }
  };

  const handleChangePin = async () => {
    if (!/^\d{6}$/.test(currentPinInput)) {
      setPinError("A senha atual deve ter exatamente 6 dígitos.");
      return;
    }
    if (!/^\d{6}$/.test(newPinInput)) {
      setPinError("A nova senha deve ter exatamente 6 dígitos.");
      return;
    }

    const savedPin = getSenhaUsuario();
    if (!savedPin) {
      setPinError("Senha atual incorreta!");
      return;
    }

    const pinMatch = await verifySenhaUsuario(currentPinInput);
    if (!pinMatch) {
      setPinError("Senha atual incorreta!");
      return;
    }

    await setSenhaUsuario(newPinInput);

    const savedEmail = getUserEmail();
    if (savedEmail) {
      const pinSync = await validatePassword(newPinInput, "register_pin", savedEmail);
      if (!pinSync.valid) {
        setPinError("Senha alterada localmente, mas falhou a sincronização no servidor.");
        return;
      }
    }

    setPinError("");
    setCurrentPinInput("");
    setNewPinInput("");
    alert("Senha de 6 dígitos alterada com sucesso!");
    setScreen("login");
  };

  // Google Sheets integration now uses edge function

  const handleEmailRegister = async () => {
    if (!emailRegInput.trim()) {
      setEmailRegError("Informe seu email.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailRegInput.trim())) {
      setEmailRegError("Email inválido.");
      return;
    }
    if (pendingAccessLevel !== "pin_corretor" && pendingAccessLevel !== "general_access") {
      if (!emailConfirmPassInput.trim()) {
        setEmailRegError("Confirme sua senha de acesso.");
        return;
      }
      if (emailConfirmPassInput !== pendingLoginPassword) {
        setEmailRegError("Senha não confere com a utilizada no login.");
        return;
      }
    }

    setEmailRegLoading(true);
    setEmailRegError("");
    try {
      const email = emailRegInput.trim().toLowerCase();

      // Fluxo corretor: validar PIN no servidor antes de registrar
      if (pendingAccessLevel === "pin_corretor") {
        const serverPinResult = await validatePassword(pendingLoginPassword, "pin_login", email);
        if (!serverPinResult.valid) {
          const level = serverPinResult.accessLevel;
          if (level === "empresa_inativa") {
            setEmailRegError("A empresa vinculada está inativa. Contate o administrador.");
          } else if (level === "empresa_expirada") {
            setEmailRegError("O contrato da empresa vinculada expirou. Contate o administrador.");
          } else if (level === "sem_empresa") {
            setEmailRegError("Seu cadastro não está vinculado a nenhuma empresa ativa.");
          } else {
            setEmailRegError("Email ou senha inválidos. Verifique o email cadastrado no Painel Comercial.");
          }
          return;
        }
        setFullVersion(true);
        setUserEmail(email);
        await setSenhaUsuario(pendingLoginPassword);
        await lockDeviceFingerprint();
        await createSession(email);
        onLogin();
        return;
      }

      // Fluxo acesso geral: validar senha + email no servidor
      if (pendingAccessLevel === "general_access") {
        const generalResult = await validatePassword(pendingLoginPassword, "general_access", email);
        if (!generalResult.valid) {
          setEmailRegError("Email não autorizado para esta senha de acesso.");
          return;
        }
        setFullVersion(true);
        setUserEmail(email);
        await createSession(email);
        onLogin();
        return;
      }

      setUserEmail(email);

      if (/^\d{6}$/.test(pendingLoginPassword)) {
        const pinSync = await validatePassword(pendingLoginPassword, "register_pin", email);
        if (!pinSync.valid) {
          throw new Error("Falha ao sincronizar senha no servidor.");
        }
      }

      // Create session first so send-to-sheets has a valid token
      await createSession(email);

      // Send to Google Sheets "SENHA DEFINITIVA" tab via edge function
      const now = new Date();
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: sheetResult, error: sheetError } = await supabase.functions.invoke("send-to-sheets", {
        body: {
          session_token: getSessionToken(),
          aba: "SENHA DEFINITIVA",
          senha_envio: getSenhaLiberacao() || pendingLoginPassword || "",
          data_envio: dataEnvioTemp || now.toLocaleDateString("pt-BR"),
          email: email,
          senha: pendingLoginPassword,
          nome: email,
          data_ativacao: now.toLocaleDateString("pt-BR"),
          tipo:
            pendingAccessLevel === "elite_demo" ? "DEMO ELITE" : pendingAccessLevel === "demo" ? "DEMO" : "DEFINITIVA",
          status: "Ativo",
        },
      });
      console.log("Senha Definitiva sheets result:", sheetResult, sheetError);

      // Continue to appropriate screen
      if (pendingAccessLevel === "elite_demo") {
        setScreen("elite-welcome");
      } else {
        onLogin();
      }
    } catch {
      setEmailRegError("Erro ao registrar. Tente novamente.");
    } finally {
      setEmailRegLoading(false);
    }
  };

  // Combined email + PIN registration handler
  const handleEmailPinRegister = async () => {
    if (!emailPinRegInput.trim()) {
      setEmailPinError("Informe seu email.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailPinRegInput.trim())) {
      setEmailPinError("Email inválido.");
      return;
    }
    if (!/^\d{6}$/.test(pinRegInput)) {
      setEmailPinError("A senha deve ter exatamente 6 dígitos numéricos.");
      return;
    }

    setEmailPinLoading(true);
    setEmailPinError("");
    try {
      await setSenhaUsuario(pinRegInput);
      await lockDeviceFingerprint();

      const email = emailPinRegInput.trim().toLowerCase();
      setUserEmail(email);

      const pinSync = await validatePassword(pinRegInput, "register_pin", email);
      if (!pinSync.valid) {
        throw new Error("Não foi possível registrar a senha no servidor.");
      }

      const sessionToken = await createSession(email);
      console.log("[EmailPinRegister] Session created:", !!sessionToken, "email:", email);

      const now = new Date();
      const senhaEnvio = getSenhaLiberacao() || pendingLoginPassword || "";
      console.log("[EmailPinRegister] senhaEnvio:", senhaEnvio, "PIN:", pinRegInput);

      const { supabase } = await import("@/integrations/supabase/client");
      const { data: sheetResult, error: sheetError } = await supabase.functions.invoke("send-to-sheets", {
        body: {
          session_token: sessionToken || getSessionToken(),
          aba: "SENHA DEFINITIVA",
          senha_envio: senhaEnvio,
          data_envio: dataEnvioTemp || now.toLocaleDateString("pt-BR"),
          email: email,
          senha: pinRegInput,
          nome: email,
          data_ativacao: now.toLocaleDateString("pt-BR"),
          tipo: pendingAccessLevel === "elite_demo" ? "DEMO ELITE" : "DEFINITIVA",
          status: "Ativo",
        },
      });
      console.log("[EmailPinRegister] Sheets result:", sheetResult, "error:", sheetError);

      // Mark liberation password as used server-side to prevent reuse
      const liberacaoUsada = getSenhaLiberacao() || pendingLoginPassword;
      console.log("[EmailPinRegister] Marking as used:", liberacaoUsada);
      if (liberacaoUsada) {
        const useResult = await validatePassword(liberacaoUsada, "use_liberation", email);
        console.log("[EmailPinRegister] use_liberation result:", JSON.stringify(useResult));
      }

      alert(
        "Cadastro realizado com sucesso!\nEmail e senha de 6 dígitos configurados.\nLicença vinculada a este dispositivo.",
      );

      if (pendingAccessLevel === "elite_demo") {
        setScreen("elite-welcome");
      } else {
        onLogin();
      }
    } catch (err: unknown) {
      console.error("[EmailPinRegister] Exception:", err);
      setEmailPinError("Erro ao registrar: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setEmailPinLoading(false);
    }
  };

  const inputStyle =
    "min-h-[46px] px-4 py-3 text-base sm:text-sm rounded-xl bg-primary/60 border border-gold/30 text-gold placeholder:text-gold/45 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/40 transition-all";
  const inputStyleCard =
    "min-h-[46px] px-4 py-3 text-base sm:text-lg font-bold tracking-widest border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold";

  // ═══ BLOCKED SCREEN ═══
  if (screen === "blocked") {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain elite-gradient geometric-pattern p-4 sm:p-6">
        <div className="min-h-full flex items-center justify-center py-6">
          <div className="flex flex-col items-center gap-4 w-full max-w-md sm:max-w-lg bg-[#07162b]/90 backdrop-blur-md border border-gold/25 rounded-2xl p-5 sm:p-7 shadow-2xl">
            <h1 className="text-lg sm:text-xl font-bold text-destructive">Sistema Bloqueado</h1>
            <p className="text-gold/80 text-sm text-center">
              O prazo de 03, 07, 21 e 364 dias expirou e o sistema foi resetado.
            </p>
            <div className="bg-primary/40 border border-gold/25 rounded-xl p-4 text-center text-sm space-y-2 w-full">
              <p className="text-gold/80">Para liberação e fornecimento de nova senha definitiva:</p>
              <p className="text-gold font-bold tabular-nums">Chave PIX: 00921557000165</p>
              <p className="text-gold-bright font-bold text-lg tabular-nums">R$ {pixValue}</p>
              <div className="text-gold/65 text-xs space-y-1.5 mt-3 text-left sm:text-center tabular-nums">
                <p>R$ 69,90 — Assinatura Mensal (WEB + APP + C.R.M.) — 31/12/2026</p>
                <p>R$ 299,90 — Assinatura Semestral (WEB + Bônus C.R.M.) até 31/12/2026</p>
                <p>R$ 479,90 — Assinatura Anual (APP + Web) — 31/12/2026</p>
                <p className="text-gold-bright font-semibold">
                  R$ 1.900,00 — Assinatura Anual Completa (WEB + APP + CRM + MKT + LUIZA IA) — 12 meses
                </p>
              </div>
              <p className="text-gold/45 text-[11px] mt-3">
                INFORMETEC - Tecnologia em Informações Mercantis · CNPJ 00.921.557/0001-95
              </p>
            </div>

            {/* Mercado Pago Subscription Checkout */}
            <div className="bg-primary/40 border border-gold/25 rounded-xl p-4 text-center text-sm space-y-3 w-full">
              <h2 className="text-sm font-bold text-gold">Assinatura Online Mercado Pago</h2>
              <p className="text-gold/80 text-xs">
                Se preferir, assine agora mesmo via cartão ou boleto e libere o sistema imediatamente.
              </p>

              <div className="space-y-3 text-left">
                <div>
                  <label className="block text-xs font-medium text-gold/85 mb-1">E-mail de Cadastro/Faturamento</label>
                  <input
                    type="email"
                    value={subEmail}
                    onChange={(e) => setSubEmail(e.target.value)}
                    placeholder="Seu melhor e-mail"
                    className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm rounded-xl bg-primary/60 border border-gold/30 text-gold focus:outline-none focus:border-gold placeholder:text-gold/35"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gold/85 mb-1">Plano de Assinatura</label>
                  <select
                    value={subPlan}
                    onChange={(e) => setSubPlan(e.target.value as "mensal" | "semestral" | "anual" | "anual_dev")}
                    className="w-full min-h-[44px] px-3 py-2 text-base sm:text-sm rounded-xl bg-primary/60 border border-gold/30 text-gold focus:outline-none focus:border-gold"
                  >
                    <option value="mensal">Mensal — R$ 69,90/mês</option>
                    <option value="semestral">Semestral — R$ 299,90/semestre</option>
                    <option value="anual">Anual — R$ 479,90/ano</option>
                    <option value="anual_dev">Anual Completa — R$ 1.900,00/ano</option>
                  </select>
                </div>
              </div>

              {subError && <p className="text-destructive text-xs font-semibold">{subError}</p>}

              <button
                onClick={handleMercadoPagoSubscription}
                disabled={subLoading}
                className="w-full min-h-[46px] py-2.5 rounded-xl gold-gradient text-primary font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                {subLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                    Processando...
                  </>
                ) : (
                  "Contratar Assinatura"
                )}
              </button>
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => setScreen("master-modal")}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-gold/35 text-gold text-xs font-bold hover:bg-gold/10 transition-colors"
              >
                Inserir Senha Master
              </button>
              <button
                onClick={() => {
                  const code = prompt("Digite a senha de validação recebida:");
                  if (!code) return;
                  const cleanCode = code.trim();
                  if (!cleanCode) return;
                  setLoading(true);
                  checkLiberationWithRetry(cleanCode).then((res) => {
                    setLoading(false);
                    if (res.valid && res.accessLevel === "liberation_available") {
                      setSenhaLiberacao(cleanCode);
                      setFullVersion(true);
                      setDataEnvioTemp(new Date().toLocaleDateString("pt-BR"));
                      setPendingLoginPassword(cleanCode);
                      setPendingAccessLevel("master");
                      setScreen("email-pin-register");
                    } else if (!res.valid && res.accessLevel === "already_used") {
                      alert("Esta senha de validação já foi utilizada.");
                    } else {
                      alert("Senha de validação inválida ou não registrada.");
                    }
                  });
                }}
                disabled={loading}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-gold/35 text-gold text-xs font-bold hover:bg-gold/10 transition-colors"
              >
                {loading ? "Verificando..." : "Senha de Validação"}
              </button>
            </div>

            <button
              onClick={() => location.reload()}
              className="w-full min-h-[46px] py-2.5 rounded-xl gold-gradient text-primary font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Atualizar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ STEP 1: MASTER MODAL ═══
  if (screen === "master-modal") {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain elite-gradient geometric-pattern p-4 sm:p-6">
        <div className="min-h-full flex items-center justify-center py-4">
          <div className="bg-card rounded-2xl border-2 border-gold/50 p-5 sm:p-7 w-full max-w-sm sm:max-w-md text-center space-y-4 shadow-2xl">
            <h3 className="text-primary font-bold text-base">Digite a Senha Master</h3>
            <PasswordInput
              value={masterInput}
              onChange={(v) => setMasterInput(formatMasterPass(v))}
              placeholder="xxx.xxx.xxx.xxx"
              maxLength={15}
              className={inputStyleCard}
            />
            <button
              onClick={handleMasterValidate}
              disabled={loading}
              className="w-full min-h-[46px] py-3 rounded-xl bg-primary text-gold font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Validando..." : "Validar Acesso"}
            </button>
            <button
              onClick={() => {
                const code = prompt("Digite a senha de validação recebida:");
                if (!code) return;
                const cleanCode = code.trim();
                if (!cleanCode) return;
                setLoading(true);
                checkLiberationWithRetry(cleanCode).then((res) => {
                  setLoading(false);
                  if (res.valid && res.accessLevel === "liberation_available") {
                    setSenhaLiberacao(cleanCode);
                    setFullVersion(true);
                    setDataEnvioTemp(new Date().toLocaleDateString("pt-BR"));
                    setPendingLoginPassword(cleanCode);
                    setPendingAccessLevel("master");
                    setScreen("email-pin-register");
                  } else if (!res.valid && res.accessLevel === "already_used") {
                    alert("Esta senha de validação já foi utilizada.");
                  } else {
                    alert("Senha de validação inválida ou não registrada.");
                  }
                });
              }}
              disabled={loading}
              className="w-full min-h-[44px] py-2.5 rounded-xl border border-gold/40 text-primary text-xs font-bold hover:bg-gold/10 transition-colors"
            >
              {loading ? "Verificando..." : "Senha de Validação"}
            </button>
            <button
              onClick={() => {
                setScreen("login");
                setMasterInput("");
              }}
              className="w-full min-h-[44px] py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:opacity-80"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ STEP 2: SENHA DE LIBERAÇÃO ═══
  if (screen === "liberacao") {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain elite-gradient geometric-pattern p-4 sm:p-6">
        <div className="min-h-full flex items-center justify-center py-4">
          <div className="bg-card rounded-2xl border-2 border-gold/50 p-5 sm:p-7 w-full max-w-sm sm:max-w-md text-center space-y-4 shadow-2xl">
            <div className="text-center">
              <h3 className="text-primary font-bold text-base">Acesso Master Validado</h3>
              <p className="text-muted-foreground text-xs mt-1">Insira a senha de liberação para este novo envio</p>
            </div>
            <PasswordInput
              value={liberacaoInput}
              onChange={setLiberacaoInput}
              placeholder="Senha de Liberação"
              maxLength={50}
              className={inputStyleCard}
            />
            <button
              onClick={handleLiberacaoSave}
              disabled={gravandoValidacao}
              className="w-full min-h-[46px] py-3 rounded-xl bg-primary text-gold font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {gravandoValidacao ? "Gravando..." : "Confirmar Senha"}
            </button>
            <button
              onClick={() => {
                setScreen("login");
                setLiberacaoInput("");
              }}
              className="w-full min-h-[44px] py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:opacity-80"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ STEP 3: CONFIRMAR SENHA DE LIBERAÇÃO ═══
  if (screen === "confirm-lib") {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain elite-gradient geometric-pattern p-4 sm:p-6">
        <div className="min-h-full flex items-center justify-center py-4">
          <div className="bg-card rounded-2xl border-2 border-gold/50 p-5 sm:p-7 w-full max-w-sm sm:max-w-md text-center space-y-4 shadow-2xl">
            <div className="text-center">
              <h3 className="text-primary font-bold text-base">Confirme a Senha de Liberação</h3>
              <p className="text-muted-foreground text-xs mt-1">Digite novamente a senha gravada para confirmar</p>
            </div>
            <PasswordInput
              value={confirmLibInput}
              onChange={setConfirmLibInput}
              placeholder="Repita a Senha de Liberação"
              maxLength={50}
              className={inputStyleCard}
            />
            <button
              onClick={handleConfirmLiberacao}
              className="w-full min-h-[46px] py-3 rounded-xl bg-primary text-gold font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Confirmar
            </button>
            <button
              onClick={() => {
                setScreen("login");
                setConfirmLibInput("");
              }}
              className="w-full min-h-[44px] py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:opacity-80"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "lib-saved") {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain elite-gradient geometric-pattern p-4 sm:p-6">
        <div className="min-h-full flex items-center justify-center py-4">
          <div className="flex flex-col items-center gap-5 w-full max-w-sm sm:max-w-md bg-[#07162b]/90 backdrop-blur-md border border-gold/25 rounded-2xl p-5 sm:p-7 shadow-2xl">
            <div className="text-center">
              <SystemLogo
                alt="Elite"
                className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 drop-shadow-lg rounded-2xl object-cover border border-gold/40"
              />
              <h1 className="text-lg font-bold text-gold">Senha Gravada</h1>
              <p className="text-gold-bright text-sm mt-1">A senha de liberação foi salva com sucesso.</p>
            </div>
            <div className="w-full bg-primary/40 border border-gold/25 rounded-xl p-4 text-center space-y-2">
              <p className="text-gold/80 text-sm">Senha gravada:</p>
              <p className="text-gold font-bold text-lg tracking-widest tabular-nums">{senhaLiberacaoTemp}</p>
              <p className="text-gold/60 text-xs mt-2">
                Envie esta senha ao cliente. Ao digitá-la, o sistema pedirá que ele crie um PIN de 6 dígitos.
              </p>
            </div>
            {validacaoGravada && (
              <div className="w-full bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3 text-center animate-fade-in">
                <p className="text-emerald-300 text-xs font-bold">Validação gravada com sucesso</p>
                <p className="text-emerald-200/75 text-xs mt-1">O usuário pode usar esta senha em qualquer terminal.</p>
              </div>
            )}
            <button
              onClick={async () => {
                setGravandoValidacao(true);
                try {
                  const persistResult = await persistLiberationValidation(senhaLiberacaoTemp);
                  if (!persistResult.ok) {
                    alert(persistResult.message || "Erro ao gravar validação.");
                    return;
                  }

                  setValidacaoGravada(true);
                  alert(
                    persistResult.message
                      ? `✅ Senha de validação gravada com sucesso!\n\n${persistResult.message}`
                      : "✅ Senha de validação gravada com sucesso!",
                  );
                } catch (err: unknown) {
                  console.error("[GravarValidacao] Exception:", err);
                  alert("Erro ao gravar validação: " + (err instanceof Error ? err.message : String(err)));
                } finally {
                  setGravandoValidacao(false);
                }
              }}
              disabled={gravandoValidacao || validacaoGravada}
              className="w-full min-h-[46px] py-3 rounded-xl gold-gradient text-primary font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {gravandoValidacao ? "Gravando..." : validacaoGravada ? "Validação Gravada" : "Gravar Validação"}
            </button>
            <button
              onClick={() => {
                setPendingLoginPassword(senhaLiberacaoTemp);
                setPendingAccessLevel("master");
                setScreen("email-pin-register");
              }}
              className="w-full min-h-[46px] py-3 rounded-xl border border-gold/35 text-gold font-bold text-sm hover:bg-gold/10 transition-colors"
            >
              Cadastrar Email e PIN Agora
            </button>
            <button
              onClick={() => {
                setScreen("login");
                location.reload();
              }}
              className="w-full min-h-[44px] py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:opacity-80"
            >
              Voltar ao Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ STEP 4: NEW 6-DIGIT PASSWORD ═══
  if (screen === "new-user") {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain elite-gradient geometric-pattern p-4 sm:p-6">
        <div className="min-h-full flex items-center justify-center py-4">
          <div className="flex flex-col items-center gap-5 w-full max-w-sm sm:max-w-md bg-[#07162b]/90 backdrop-blur-md border border-gold/25 rounded-2xl p-5 sm:p-7 shadow-2xl">
            <div className="text-center">
              <SystemLogo
                alt="Elite"
                className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 drop-shadow-lg rounded-2xl object-cover border border-gold/40"
              />
              <h1 className="text-lg font-bold text-gold">Sistema Liberado</h1>
              <p className="text-gold-bright text-sm mt-1">Acesso total confirmado</p>
            </div>
            <div className="w-full space-y-4">
              <p className="text-gold/80 text-sm text-center">Configurar nova senha de usuário (6 dígitos)</p>
              <PasswordInput
                value={newPassInput}
                onChange={setNewPassInput}
                maxLength={6}
                placeholder="Nova Senha (6 dígitos)"
                numericOnly
                className="min-h-[46px] px-4 py-3 rounded-xl bg-primary/60 border border-gold/30 text-gold text-base sm:text-lg tracking-widest font-bold placeholder:text-gold/40 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/40"
              />
              <button
                onClick={handleNewPass}
                className="w-full min-h-[46px] py-3 rounded-xl gold-gradient text-primary font-bold text-sm hover:opacity-90 transition-opacity"
              >
                Salvar Nova Senha
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══ ELITE WELCOME - DIAS RESTANTES ═══
  if (screen === "elite-welcome") {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain elite-gradient geometric-pattern p-4 sm:p-6">
        <div className="min-h-full flex items-center justify-center py-4">
          <div className="flex flex-col items-center gap-5 w-full max-w-sm sm:max-w-md bg-[#07162b]/90 backdrop-blur-md border border-gold/25 rounded-2xl p-5 sm:p-7 shadow-2xl">
            <div className="text-center">
              <SystemLogo
                alt="Elite"
                className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 drop-shadow-lg rounded-2xl object-cover border border-gold/40"
              />
              <h1 className="text-lg font-bold text-gold">Acesso Elite Liberado</h1>
            </div>
            <div className="w-full bg-primary/40 border border-gold/25 rounded-xl p-5 text-center space-y-2.5">
              <p className="text-gold/80 text-sm">Sua licença está ativa</p>
              <div
                className={`text-3xl font-bold tabular-nums ${eliteDiasRestantes <= 3 ? "text-destructive" : "text-gold-bright"}`}
              >
                {eliteDiasRestantes} {eliteDiasRestantes === 1 ? "dia restante" : "dias restantes"}
              </div>
              {eliteDiasRestantes <= 3 && (
                <p className="text-destructive text-xs font-bold">Sua licença está prestes a expirar.</p>
              )}
            </div>
            <button
              onClick={onLogin}
              className="w-full min-h-[48px] py-3 rounded-xl gold-gradient text-primary font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Acessar Simulador
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ ALTERAR PIN DE 6 DÍGITOS ═══
  if (screen === "change-pin") {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain elite-gradient geometric-pattern p-4 sm:p-6">
        <div className="min-h-full flex items-center justify-center py-4">
          <div className="bg-card rounded-2xl border-2 border-gold/50 p-5 sm:p-7 w-full max-w-sm sm:max-w-md text-center space-y-4 shadow-2xl">
            <h3 className="text-primary font-bold text-base">Alterar Senha de 6 Dígitos</h3>
            <p className="text-muted-foreground text-xs">Digite a senha atual e a nova senha</p>
            <PasswordInput
              value={currentPinInput}
              onChange={setCurrentPinInput}
              placeholder="Senha atual (6 dígitos)"
              maxLength={6}
              numericOnly
              className={inputStyleCard}
            />
            <PasswordInput
              value={newPinInput}
              onChange={setNewPinInput}
              placeholder="Nova senha (6 dígitos)"
              maxLength={6}
              numericOnly
              className={inputStyleCard}
            />
            {pinError && <p className="text-destructive text-xs font-medium">{pinError}</p>}
            <button
              onClick={handleChangePin}
              className="w-full min-h-[46px] py-3 rounded-xl bg-primary text-gold font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Confirmar Alteração
            </button>
            <button
              onClick={() => {
                setScreen("login");
                setCurrentPinInput("");
                setNewPinInput("");
                setPinError("");
              }}
              className="w-full min-h-[44px] py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:opacity-80"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ EMAIL + PIN REGISTER (combined) ═══
  if (screen === "email-pin-register") {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain elite-gradient geometric-pattern p-4 sm:p-6">
        <div className="min-h-full flex items-center justify-center py-4">
          <div className="bg-card rounded-2xl border-2 border-gold/50 p-5 sm:p-7 w-full max-w-sm sm:max-w-md text-center space-y-4 shadow-2xl">
            <div className="text-center">
              <SystemLogo
                alt="Elite"
                className="w-20 h-20 mx-auto mb-2 drop-shadow-lg rounded-2xl object-cover border border-gold/40"
              />
              <h3 className="text-primary font-bold text-base">Cadastro de Acesso</h3>
              <p className="text-muted-foreground text-xs mt-1">
                Cadastre seu email e crie sua senha de 6 dígitos para finalizar a ativação.
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-primary/80 mb-1 text-left">E-mail</label>
                <input
                  type="email"
                  value={emailPinRegInput}
                  onChange={(e) => {
                    setEmailPinRegInput(e.target.value);
                    setEmailPinError("");
                  }}
                  placeholder="seu.email@exemplo.com"
                  maxLength={100}
                  className="w-full min-h-[46px] px-3.5 py-2.5 border border-gold/35 rounded-xl text-base sm:text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-gold placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-primary/80 mb-1 text-left">
                  Senha de 6 Dígitos
                </label>
                <PasswordInput
                  value={pinRegInput}
                  onChange={(v) => {
                    setPinRegInput(v);
                    setEmailPinError("");
                  }}
                  placeholder="000000"
                  maxLength={6}
                  numericOnly
                  className={inputStyleCard}
                />
              </div>
            </div>
            {emailPinError && <p className="text-destructive text-xs font-medium">{emailPinError}</p>}
            <button
              onClick={handleEmailPinRegister}
              disabled={emailPinLoading}
              className="w-full min-h-[46px] py-3 rounded-xl gold-gradient text-primary font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {emailPinLoading ? "Cadastrando..." : "Cadastrar"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "email-register") {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain elite-gradient geometric-pattern p-4 sm:p-6">
        <div className="min-h-full flex items-center justify-center py-4">
          <div className="bg-card rounded-2xl border-2 border-gold/50 p-5 sm:p-7 w-full max-w-sm sm:max-w-md text-center space-y-4 relative shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setScreen("login");
                setEmailRegInput("");
                setEmailConfirmPassInput("");
                setEmailRegError("");
              }}
              className="absolute top-3 right-3 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center">
              <SystemLogo
                alt="Elite"
                className="w-20 h-20 mx-auto mb-2 drop-shadow-lg rounded-2xl object-cover border border-gold/40"
              />
              <h3 className="text-primary font-bold text-base">
                {pendingAccessLevel === "pin_corretor" ? "Informe seu E-mail" : "Cadastro de E-mail"}
              </h3>
              <p className="text-muted-foreground text-xs mt-1">
                {pendingAccessLevel === "pin_corretor"
                  ? "Informe o e-mail cadastrado no Painel Comercial para validar seu acesso."
                  : "Para sua segurança, cadastre seu e-mail e confirme com a senha utilizada no login."}
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-primary/80 mb-1 text-left">E-mail</label>
                <input
                  type="email"
                  value={emailRegInput}
                  onChange={(e) => {
                    setEmailRegInput(e.target.value);
                    setEmailRegError("");
                  }}
                  placeholder="seu.email@exemplo.com"
                  maxLength={100}
                  className="w-full min-h-[46px] px-3.5 py-2.5 border border-gold/35 rounded-xl text-base sm:text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-gold placeholder:text-muted-foreground"
                />
              </div>
              {pendingAccessLevel !== "pin_corretor" && (
                <div>
                  <label className="block text-xs font-semibold text-primary/80 mb-1 text-left">
                    Confirme sua Senha
                  </label>
                  <PasswordInput
                    value={emailConfirmPassInput}
                    onChange={(v) => {
                      setEmailConfirmPassInput(v);
                      setEmailRegError("");
                    }}
                    placeholder="Senha utilizada no login"
                    maxLength={50}
                    className={inputStyleCard}
                    centerText={false}
                  />
                </div>
              )}
            </div>
            {emailRegError && <p className="text-destructive text-xs font-medium">{emailRegError}</p>}
            <button
              onClick={handleEmailRegister}
              disabled={emailRegLoading}
              className="w-full min-h-[46px] py-3 rounded-xl gold-gradient text-primary font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {emailRegLoading ? "Registrando..." : "Confirmar Cadastro"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ DEFAULT LOGIN (RESPONSIVE: DESKTOP 2-COL · TABLET CENTERED + TOP BAR · MOBILE TOUCH-FIRST) ═══
  return (
    <div className="fixed inset-0 z-50 flex flex-col elite-gradient geometric-pattern overflow-hidden h-[100dvh]">
      {/* Desktop & Tablet Top Bar (3-zone contract) */}
      <header className="hidden md:flex items-center justify-between gap-8 w-full max-w-6xl mx-auto px-6 lg:px-10 py-4 border-b border-gold/15 shrink-0">
        <span className="text-sm lg:text-base font-bold text-gold tracking-wide whitespace-nowrap shrink-0">
          Simulador Corretor de Elite 4.0
        </span>

        <nav className="flex items-center gap-5 lg:gap-7 text-xs lg:text-sm font-medium text-gold/75" aria-label="Navegação principal">
          <button
            type="button"
            onClick={() => setCorretorModalOpen(true)}
            className="hover:text-gold hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-1"
          >
            Corretor Elite
          </button>
          <button
            type="button"
            onClick={() => {
              setAccessDbInitialTab("administrativo");
              setAccessDbOpen(true);
            }}
            className="hover:text-gold hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-1"
          >
            Administrativo
          </button>
          <button
            type="button"
            onClick={() => setLgpdOpen(true)}
            className="hover:text-gold hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-1"
          >
            LGPD
          </button>
          <button
            type="button"
            onClick={() => setFaleConoscoOpen(!faleConoscoOpen)}
            className="hover:text-gold hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-1"
          >
            Fale Conosco
          </button>
        </nav>

        <a
          href="https://simuladorcorretorelite.com.br/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-lg gold-gradient text-primary text-xs font-bold hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 no-underline"
        >
          Adquirir Licença
        </a>
      </header>

      {/* Scrollable Main Area — block scroll wrapper + min-h-full flex centering prevents top clipping on short screens */}
      <main className="flex-1 overflow-y-auto overscroll-contain scrollbar-hide">
        <div className="min-h-full w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 pt-5 sm:pt-8 lg:py-10 pb-[calc(5.75rem+env(safe-area-inset-bottom))] md:pb-10 flex flex-col justify-center">
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-7 lg:gap-12 items-center animate-fade-in">
            {/* Brand & Architecture Overview Column */}
            <section className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-3 sm:space-y-4 lg:space-y-6">
              <div className="flex flex-col sm:flex-row lg:flex-col items-center lg:items-start gap-3 sm:gap-4">
                <SystemLogo
                  alt="Simulador Corretor de Elite 4.0"
                  className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 shrink-0 drop-shadow-lg rounded-2xl object-cover border border-gold/40 shadow-gold/20"
                />
                <div className="space-y-1 sm:space-y-1.5 text-center sm:text-left">
                  <h1 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gold tracking-tight leading-tight text-balance">
                    Simulador <span className="text-gold-bright">Corretor de Elite 4.0</span>
                  </h1>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-0.5 text-xs sm:text-sm text-gold/80 font-medium">
                    <span>{isFull ? "Venda Segura" : "Venda Segura · Modo Demo"}</span>
                    <span aria-hidden="true" className="text-gold/40">·</span>
                    <span className={isFull ? "text-gold-bright" : "text-gold/75"}>{statusMsg}</span>
                  </div>
                </div>
              </div>

              {/* Mobile-only unobtrusive license CTA when demo banner is active */}
              {showLicenseBanner && !isFull && (
                <a
                  href="https://simuladorcorretorelite.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="md:hidden w-full max-w-md py-2.5 px-4 rounded-xl gold-gradient text-primary text-xs font-bold text-center no-underline hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  Adquirir Licença em simuladorcorretorelite.com.br
                </a>
              )}

              {/* Desktop institutional highlights (keeps mobile & tablet clean above the fold) */}
              <div className="hidden lg:block w-full max-w-lg pt-2 space-y-4 border-t border-gold/15">
                <p className="text-sm text-slate-300 leading-relaxed">
                  Ambiente exclusivo para imobiliárias e corretores com contrato ativo. Acesse no computador, tablet ou
                  celular com isolamento completo por conta.
                </p>

                <dl className="divide-y divide-gold/15 text-sm">
                  <div className="py-3">
                    <dt className="font-semibold text-gold">Isolamento por ID Exclusivo</dt>
                    <dd className="text-slate-300/85 text-xs mt-0.5 leading-relaxed">
                      Cada imobiliária (IMOB) e corretor autônomo ou vinculado (CORR) opera em espaço próprio sem
                      cruzamento de dados.
                    </dd>
                  </div>
                  <div className="py-3">
                    <dt className="font-semibold text-gold">Senha Pessoal e Google no Mesmo Contrato</dt>
                    <dd className="text-slate-300/85 text-xs mt-0.5 leading-relaxed">
                      Cadastre sua senha pessoal ou utilize sua conta Google vinculada ao e-mail contratado.
                    </dd>
                  </div>
                  <div className="py-3">
                    <dt className="font-semibold text-gold">Acesso Verificado</dt>
                    <dd className="text-slate-300/85 text-xs mt-0.5 leading-relaxed">
                      Liberação vinculada à confirmação de assinatura na página oficial simuladorcorretorelite.com.br.
                    </dd>
                  </div>
                </dl>
              </div>
            </section>

            {/* Right Access Form Column */}
            <section className="lg:col-span-6 w-full max-w-md mx-auto lg:ml-auto lg:mr-0">
              <div className="w-full rounded-2xl bg-[#07162b]/90 backdrop-blur-md border border-gold/25 shadow-2xl p-4 sm:p-6 lg:p-7 space-y-4">
                {/* Segmented Mode Switch: Entrar vs Criar Senha Pessoal */}
                <div
                  className="w-full grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-primary/70 border border-gold/20"
                  role="tablist"
                  aria-label="Modo de acesso"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={authTab === "login"}
                    onClick={() => {
                      setAuthTab("login");
                      setError("");
                      setInfoNotice("");
                    }}
                    className={`min-h-[42px] px-3 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                      authTab === "login"
                        ? "gold-gradient text-primary shadow-sm"
                        : "text-gold/75 hover:text-gold"
                    }`}
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={authTab === "create_password"}
                    onClick={() => {
                      setAuthTab("create_password");
                      setError("");
                      setInfoNotice("");
                    }}
                    className={`min-h-[42px] px-3 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                      authTab === "create_password"
                        ? "gold-gradient text-primary shadow-sm"
                        : "text-gold/75 hover:text-gold"
                    }`}
                  >
                    Criar Senha Pessoal
                  </button>
                </div>

                {/* Access Denied Notice */}
                {accessDeniedNotice && !accessDeniedNotice.authorized && (
                  <div className="w-full bg-red-950/75 border border-red-400/60 rounded-xl p-3.5 text-center space-y-2.5 animate-fade-in">
                    <p className="text-red-200 text-xs font-bold">
                      {accessDeniedNotice.code === "pending_payment"
                        ? "Pagamento Pendente de Confirmação"
                        : accessDeniedNotice.code === "expired"
                          ? "Licença Expirada"
                          : accessDeniedNotice.code === "blocked"
                            ? "Acesso Não Autorizado"
                            : "Cadastro Prévio Obrigatório"}
                    </p>
                    <p className="text-red-100/90 text-xs leading-relaxed">{accessDeniedNotice.message}</p>
                    <div className="flex flex-col gap-2 pt-1">
                      <a
                        href="https://simuladorcorretorelite.com.br"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full min-h-[44px] py-2 px-3 rounded-xl gold-gradient text-primary text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 no-underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        Confirmar Pagamento no Site
                      </a>
                      <button
                        type="button"
                        onClick={() => setAccessDeniedNotice(null)}
                        className="min-h-[36px] text-xs text-gold/75 hover:text-gold underline"
                      >
                        Fechar aviso
                      </button>
                    </div>
                  </div>
                )}

                {/* Session Kicked Notice */}
                {sessionKicked && (
                  <div className="w-full bg-destructive/20 border border-destructive/40 rounded-xl p-3.5 text-center animate-fade-in">
                    <p className="text-red-200 text-xs font-bold">Sessão encerrada</p>
                    <p className="text-red-100/85 text-xs mt-1">
                      Outro dispositivo acessou sua conta. Faça login novamente para retomar o acesso.
                    </p>
                    <button
                      type="button"
                      onClick={onSessionKickedAck}
                      className="mt-2 min-h-[36px] px-3 text-xs text-gold/80 underline hover:text-gold"
                    >
                      Entendido
                    </button>
                  </div>
                )}

                {/* Info / Verification Notice */}
                {infoNotice && (
                  <div className="w-full bg-emerald-950/75 border border-emerald-400/50 rounded-xl p-3.5 text-center space-y-2.5 animate-fade-in">
                    <p className="text-emerald-100 text-xs leading-relaxed">{infoNotice}</p>
                    {pendingVerifyEmail && (
                      <div className="flex flex-col gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleCheckEmailVerification}
                          disabled={verifyingEmail}
                          className="w-full min-h-[44px] py-2 px-3 rounded-xl gold-gradient text-primary text-xs font-bold hover:opacity-90 disabled:opacity-50"
                        >
                          {verifyingEmail ? "Verificando confirmação..." : "Já confirmei meu e-mail — Entrar"}
                        </button>
                        <button
                          type="button"
                          onClick={handleResendVerification}
                          disabled={resendingEmail}
                          className="min-h-[36px] text-xs text-gold/80 hover:text-gold underline"
                        >
                          {resendingEmail ? "Reenviando..." : `Reenviar link para ${pendingVerifyEmail}`}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Auth Forms */}
                {authTab === "create_password" ? (
                  <form onSubmit={handleCreatePersonalPassword} className="w-full space-y-3.5">
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Primeiro acesso de <strong className="text-gold">Imobiliária</strong> ou{" "}
                      <strong className="text-gold">Corretor</strong>? Crie sua senha pessoal utilizando o e-mail
                      vinculado ao contrato.
                    </p>

                    <div className="space-y-1.5">
                      <label htmlFor="reg-email" className="block text-xs font-medium text-gold/85">
                        E-mail do contrato
                      </label>
                      <input
                        id="reg-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={regEmail}
                        onChange={(e) => {
                          setRegEmail(e.target.value);
                          setError("");
                        }}
                        placeholder="seu.email@empresa.com.br"
                        maxLength={254}
                        className="w-full min-h-[46px] px-4 py-3 text-base sm:text-sm rounded-xl border border-gold/30 bg-primary/60 text-gold placeholder:text-gold/40 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/40 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="reg-password" className="block text-xs font-medium text-gold/85">
                        Criar senha pessoal
                      </label>
                      <PasswordInput
                        value={regPassword}
                        onChange={(v) => {
                          setRegPassword(v);
                          setError("");
                        }}
                        id="reg-password"
                        name="new-password"
                        autoComplete="new-password"
                        placeholder="Mín. 8 caracteres com letras e números"
                        maxLength={128}
                        className={inputStyle}
                        centerText={false}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="reg-confirm-password" className="block text-xs font-medium text-gold/85">
                        Confirmar senha pessoal
                      </label>
                      <PasswordInput
                        value={regConfirmPassword}
                        onChange={(v) => {
                          setRegConfirmPassword(v);
                          setError("");
                        }}
                        id="reg-confirm-password"
                        name="confirm-password"
                        autoComplete="new-password"
                        placeholder="Repita a senha pessoal"
                        maxLength={128}
                        className={inputStyle}
                        centerText={false}
                      />
                    </div>

                    {error && (
                      <p role="alert" className="text-red-300 text-center text-xs font-medium animate-fade-in">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={loading || googleLoading}
                      className="w-full min-h-[48px] py-3 rounded-xl gold-gradient text-primary font-bold text-sm hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50"
                    >
                      {loading ? "Cadastrando senha..." : "Cadastrar Senha Pessoal"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSubmit} className="w-full space-y-3.5">
                    <div className="space-y-1.5">
                      <label htmlFor="login-email" className="block text-xs font-medium text-gold/85">
                        E-mail do contrato <span className="text-gold/50 font-normal">(opcional para Master)</span>
                      </label>
                      <input
                        id="login-email"
                        type="email"
                        name="email"
                        autoComplete="username"
                        value={loginEmail}
                        onChange={(e) => {
                          setLoginEmail(e.target.value);
                          setError("");
                        }}
                        placeholder="seu.email@empresa.com.br"
                        maxLength={254}
                        className="w-full min-h-[46px] px-4 py-3 text-base sm:text-sm rounded-xl border border-gold/30 bg-primary/60 text-gold placeholder:text-gold/40 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/40 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <label htmlFor="password" className="text-xs font-medium text-gold/85 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-gold/70" />
                          Senha pessoal ou Master
                        </label>
                        <button
                          type="button"
                          onClick={handleResetPersonalPassword}
                          className="text-xs text-gold/70 hover:text-gold underline underline-offset-2 transition-colors whitespace-nowrap"
                        >
                          Esqueci a senha
                        </button>
                      </div>
                      <PasswordInput
                        value={password}
                        onChange={(v) => {
                          setPassword(v);
                          setError("");
                        }}
                        id="password"
                        name="password"
                        autoComplete="current-password"
                        placeholder="Digite sua senha"
                        maxLength={128}
                        className={inputStyle}
                        centerText={false}
                      />
                    </div>

                    {error && (
                      <p role="alert" className="text-red-300 text-center text-xs font-medium animate-fade-in">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={loading || googleLoading}
                      className="w-full min-h-[48px] py-3 rounded-xl gold-gradient text-primary font-bold text-sm tracking-wide hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50"
                    >
                      {loading ? "Verificando..." : "Entrar no Simulador"}
                    </button>
                  </form>
                )}

                {/* Divider + Google Auth */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-gold/20" />
                    <span className="text-[11px] text-gold/65 font-medium whitespace-nowrap">
                      ou continue com Google
                    </span>
                    <div className="h-px flex-1 bg-gold/20" />
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={googleLoading || loading}
                    className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 active:scale-[0.99] transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2.5"
                  >
                    {googleLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                    ) : (
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
                        <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z" />
                        <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z" />
                        <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
                      </svg>
                    )}
                    <span className="whitespace-nowrap">
                      {googleLoading ? "Conectando ao Google..." : "Entrar com Google"}
                    </span>
                  </button>

                  {/* Secondary Access Shortcuts (1-col on narrow phones, 2-col on sm+) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setPainelComercialLoginOpen(true)}
                      className="w-full min-h-[44px] px-3 py-2.5 rounded-xl border border-gold/35 bg-primary/40 text-gold text-xs font-semibold hover:bg-gold/15 transition-colors whitespace-nowrap"
                    >
                      Painel Comercial
                    </button>
                    <button
                      type="button"
                      onClick={() => setClienteSiteOpen(true)}
                      className="w-full min-h-[44px] px-3 py-2.5 rounded-xl border border-gold/35 bg-gold/10 text-gold text-xs font-semibold hover:bg-gold/20 transition-colors whitespace-nowrap"
                    >
                      Cliente do Site
                    </button>
                  </div>

                  {isFull && (
                    <div className="pt-1 flex justify-center">
                      <BiometriaLoginPanel onAuthenticated={onLogin} />
                    </div>
                  )}

                  {getSenhaUsuario() && (
                    <button
                      type="button"
                      onClick={() => setScreen("change-pin")}
                      className="w-full min-h-[42px] py-2 rounded-xl border border-gold/25 text-gold/85 text-xs font-semibold hover:bg-gold/10 transition-colors"
                    >
                      Alterar Senha de 6 Dígitos
                    </button>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Institutional Credits */}
          <footer className="mt-6 lg:mt-10 pt-4 border-t border-gold/10 text-center lg:text-left">
            <p className="text-gold/45 text-[11px] leading-relaxed">
              Desenvolvimento: www.simuladorcorretorelite.com.br · Apoio: RODRIGO DIAS - Gestão TI · INFORMETC
              Tecnologia em Informações Mercantis SC Ltda (CNPJ 00.921.557/0001-65) · Hospedagem ASSECOM ASSESSORIA
              (CNPJ 03.662.114/0001-95) · Contato: contatoapps@simuladorcorretorelite.com.br · Tel (11) 92205-2470 ·
              WhatsApp (11) 92002-4853
            </p>
          </footer>
        </div>
      </main>

      {/* Mobile-Only Fixed Bottom Navigation Bar (hidden on tablet/desktop where top bar is visible) */}
      <nav
        aria-label="Menu rápido"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#061224]/95 backdrop-blur-md border-t border-gold/20 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => setCorretorModalOpen(true)}
            className="min-h-[58px] flex flex-col items-center justify-center gap-1 px-1 text-gold/75 active:text-gold hover:text-gold transition-colors"
          >
            <Home className="w-5 h-5 shrink-0" />
            <span className="text-[10px] font-medium whitespace-nowrap truncate max-w-full">Corretor</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAccessDbInitialTab("administrativo");
              setAccessDbOpen(true);
            }}
            className="min-h-[58px] flex flex-col items-center justify-center gap-1 px-1 text-gold/75 active:text-gold hover:text-gold transition-colors"
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span className="text-[10px] font-medium whitespace-nowrap truncate max-w-full">Admin</span>
          </button>
          <button
            type="button"
            onClick={() => setLgpdOpen(true)}
            className="min-h-[58px] flex flex-col items-center justify-center gap-1 px-1 text-gold/65 active:text-gold hover:text-gold transition-colors"
          >
            <Shield className="w-5 h-5 shrink-0" />
            <span className="text-[10px] font-medium whitespace-nowrap truncate max-w-full">LGPD</span>
          </button>
          <button
            type="button"
            onClick={() => setFaleConoscoOpen(!faleConoscoOpen)}
            className="min-h-[58px] flex flex-col items-center justify-center gap-1 px-1 text-gold/65 active:text-gold hover:text-gold transition-colors"
          >
            <MessageCircle className="w-5 h-5 shrink-0" />
            <span className="text-[10px] font-medium whitespace-nowrap truncate max-w-full">Suporte</span>
          </button>
          <a
            href="https://simuladorcorretorelite.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[58px] flex flex-col items-center justify-center gap-1 px-1 text-gold/65 active:text-gold hover:text-gold transition-colors no-underline"
          >
            <ShoppingCart className="w-5 h-5 shrink-0" />
            <span className="text-[10px] font-medium whitespace-nowrap truncate max-w-full">Licença</span>
          </a>
        </div>
      </nav>

      {/* Corretor Elite (Autorizados) Modal */}
      {corretorModalOpen && (
        <div
          className="fixed inset-0 z-[1500] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setCorretorModalOpen(false)}
        >
          <div
            className="w-full sm:max-w-md max-h-[90dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border-t-2 sm:border-2 border-gold/45 bg-[#07182e] p-5 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-6 space-y-4 text-center shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-gold/30 mx-auto mb-1 sm:hidden" aria-hidden="true" />
            <button
              type="button"
              onClick={() => setCorretorModalOpen(false)}
              className="absolute top-3 right-3 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-gold/60 hover:text-gold"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-gold pt-1">Corretor Elite (Autorizados)</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Somente Corretores e Clientes previamente cadastrados com confirmação de pagamento na página principal{" "}
              <strong className="text-gold">simuladorcorretorelite.com.br</strong> têm acesso liberado.
            </p>
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full min-h-[46px] py-3 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
              >
                {googleLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Verificar e Entrar com Google
              </button>
              <button
                type="button"
                onClick={() => {
                  setCorretorModalOpen(false);
                  setClienteSiteOpen(true);
                }}
                className="w-full min-h-[44px] py-2.5 rounded-xl border border-gold/50 text-gold text-xs font-bold hover:bg-gold/10 transition-colors"
              >
                Cliente do Site (Compra Confirmada)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCorretorModalOpen(false);
                  setAccessDbInitialTab("corretor_elite");
                  setAccessDbOpen(true);
                }}
                className="w-full min-h-[44px] py-2.5 rounded-xl border border-gold/30 text-gold/85 text-xs font-bold hover:bg-gold/10 transition-colors"
              >
                Gerenciar Banco Corretor Elite (ADM)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCorretorModalOpen(false);
                  setScreen("master-modal");
                }}
                className="w-full min-h-[40px] py-2 text-xs text-gold/70 hover:text-gold underline"
              >
                Inserir Senha Master / Validação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <LgpdPanel externalOpen={lgpdOpen} onExternalClose={() => setLgpdOpen(false)} hideButton />
      {faleConoscoOpen && <FaleConoscoModal onClose={() => setFaleConoscoOpen(false)} />}
      <AccessDatabasePanel
        isOpen={accessDbOpen}
        onClose={() => setAccessDbOpen(false)}
        initialTab={accessDbInitialTab}
      />
      <DemoAdminPanel isOpen={demoAdminOpen} onClose={() => setDemoAdminOpen(false)} />
      <PainelComercial isOpen={painelComercialLoginOpen} onClose={() => setPainelComercialLoginOpen(false)} />
      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
      <ClienteSiteLogin isOpen={clienteSiteOpen} onClose={() => setClienteSiteOpen(false)} onLoginSuccess={onLogin} />
    </div>
  );
}
