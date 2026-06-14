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
} from "lucide-react";
const logoElite = "https://pub-a3cfd193eb6748ec96b423de3caf804f.r2.dev/logo-elite.jpg";
import DemoAdminPanel from "@/components/DemoAdminPanel";
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
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  centerText?: boolean;
  numericOnly?: boolean;
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
        placeholder={placeholder}
        maxLength={maxLength}
        onKeyDown={onKeyDown}
        className={`w-full pr-10 ${className} ${centerText ? "text-center" : ""}`}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gold/50 hover:text-gold transition-colors"
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
      className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-card border-2 border-gold/40 rounded-xl p-5 shadow-2xl space-y-3 animate-fade-in mb-16 sm:mb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-primary uppercase">Fale Conosco</h4>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <input
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          placeholder="Nome"
          className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
        />
        <input
          value={form.whatsapp}
          onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
          placeholder="WhatsApp"
          className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
        />
        <input
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Email"
          type="email"
          className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
        />
        <input
          value={form.creci}
          onChange={(e) => setForm({ ...form, creci: e.target.value })}
          placeholder="CRECI"
          className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
        />
        <input
          value={form.cidade}
          onChange={(e) => setForm({ ...form, cidade: e.target.value })}
          placeholder="Cidade"
          className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
        />
        <textarea
          value={form.mensagem}
          onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
          placeholder="Mensagem"
          rows={3}
          className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground resize-none"
        />
        <button
          onClick={handleSend}
          disabled={sending}
          className="w-full py-2.5 rounded-lg gold-gradient text-primary font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1"
        >
          <Send className="w-3 h-3" /> Enviar
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
  const [painelComercialLoginOpen, setPainelComercialLoginOpen] = useState(false);
  const [masterInput, setMasterInput] = useState("");
  const [liberacaoInput, setLiberacaoInput] = useState("");
  const [confirmLibInput, setConfirmLibInput] = useState("");
  const [newPassInput, setNewPassInput] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [senhaLiberacaoTemp, setSenhaLiberacaoTemp] = useState("");
  const [dataEnvioTemp, setDataEnvioTemp] = useState("");
  const [loading, setLoading] = useState(false);
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
        setStatusMsg("SISTEMA LIBERADO - ACESSO TOTAL");
      } else {
        setStatusMsg(`Acesso Provisório: Restam ${diasRestantes} dias`);
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

  // DEFAULT LOGIN
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isExpired && !isFull) {
      resetSystem();
      setScreen("blocked");
      return;
    }

    const cleanPassword = password.trim();

    // MASTER PASSWORD - Immediate unlimited access bypass
    if (cleanPassword === "47231970") {
      setMasterAccess(true);
      setFullVersion(true);
      await createSession("lourencoljritu@gmail.com");
      onLogin();
      return;
    }

    // Visitor mode — no server call, immediate access
    if (cleanPassword === VISITOR_PASSWORD) {
      setVisitorMode(true);
      await createSession("visitante@elite4.local");
      onLogin();
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
    "px-4 py-3 rounded-lg bg-primary/50 border border-gold/30 text-gold placeholder:text-gold/40 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all";
  const inputStyleCard =
    "px-4 py-3 text-lg font-bold tracking-widest border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold";

  // ═══ BLOCKED SCREEN ═══
  if (screen === "blocked") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center elite-gradient overflow-y-auto">
        <div className="flex flex-col items-center gap-4 px-6 w-full max-w-md py-8">
          <h1 className="text-xl font-bold text-destructive">SISTEMA BLOQUEADO</h1>
          <p className="text-gold/80 text-sm text-center">
            O prazo de 03, 07, 21 e 364 dias expirou e o sistema foi resetado.
          </p>
          <div className="bg-primary/30 border border-gold/30 rounded-lg p-4 text-center text-sm space-y-2 w-full">
            <p className="text-gold/80">Para liberação e fornecimento de nova senha definitiva:</p>
            <p className="text-gold font-bold">Chave PIX: 00921557000165</p>
            <p className="text-gold-bright font-bold text-lg">R$ {pixValue}</p>
            <div className="text-gold/60 text-xs space-y-1 mt-3">
              <p>R$ 69,90 - (Assinatura Mensal - WEB + APP + C.R.M.) - 31/12/2026</p>
              <p>R$ 299,90 - (Assinatura Semestral WEB + BONUS C.R.M.) até 31/12/2026</p>
              <p>R$ 479,90 - (Assinatura Anual - APP + Web) - 31/12/2026</p>
              <p className="text-gold-bright font-semibold">
                R$ 1.900,00 - (Assinatura Anual COMPLETA - WEB + APP + CRM + MKT + LUIZA IA) - 12 meses
              </p>
            </div>
            <p className="text-gold/40 text-[10px] mt-3">
              INFORMETEC - TECNOLOGIA EM INFORMAÇÕES MERCANTIS - CNPJ 00.921.557/0001-95
            </p>
            <p className="text-gold/50 text-[10px]">
              SIMULADOR CORRETOR ELITE 4.0 - ECOSSISTEMA DA TECNOLOGIA IMOBILIÁRIA{" "}
            </p>
          </div>
          <button
            onClick={() => setScreen("master-modal")}
            className="w-full py-2 rounded-lg border border-gold/30 text-gold text-xs uppercase font-bold hover:bg-gold/10 transition-colors mt-2"
          >
            Inserir Senha Master
          </button>
          <button
            onClick={() => {
              // Direct validation code entry for blocked users
              const code = prompt("Digite a senha de validação recebida:");
              if (!code) return;

              // AQUI ESTÁ A CORREÇÃO: Mantém os pontos e tira só espaços vazios
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
            className="w-full py-2 rounded-lg border border-gold/30 text-gold text-xs uppercase font-bold hover:bg-gold/10 transition-colors"
          >
            {loading ? "Verificando..." : "Senha Validação"}
          </button>

          <button
            onClick={() => location.reload()}
            className="w-full py-2.5 rounded-lg gold-gradient text-primary font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            Atualizar
          </button>
        </div>
      </div>
    );
  }

  // ═══ STEP 1: MASTER MODAL ═══
  if (screen === "master-modal") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center elite-gradient">
        <div className="bg-card rounded-xl border-2 border-gold/50 p-6 w-full max-w-xs text-center space-y-4">
          <h3 className="text-primary font-bold uppercase text-sm">Digite Senha Master</h3>
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
            className="w-full py-3 rounded-lg bg-primary text-gold font-bold uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Validando..." : "Validar Acesso"}
          </button>
          <button
            onClick={() => {
              // Direct validation code entry for blocked users
              const code = prompt("Digite a senha de validação recebida:");
              if (!code) return;

              // MANTÉM OS PONTOS (Remove apenas espaços antes/depois)
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
            className="w-full py-2 rounded-lg border border-gold/30 text-gold text-xs uppercase font-bold hover:bg-gold/10 transition-colors"
          >
            {loading ? "Verificando..." : "Senha Validação"}
          </button>
          <button
            onClick={() => {
              setScreen("login");
              setMasterInput("");
            }}
            className="w-full py-2 rounded-lg bg-muted text-muted-foreground text-xs uppercase hover:opacity-80"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // ═══ STEP 2: SENHA DE LIBERAÇÃO ═══
  if (screen === "liberacao") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center elite-gradient">
        <div className="bg-card rounded-xl border-2 border-gold/50 p-6 w-full max-w-xs text-center space-y-4">
          <div className="text-center">
            <h3 className="text-primary font-bold uppercase text-sm">Acesso Master Validado</h3>
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
            className="w-full py-3 rounded-lg bg-primary text-gold font-bold uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {gravandoValidacao ? "Gravando..." : "Confirmar Senha"}
          </button>
          <button
            onClick={() => {
              setScreen("login");
              setLiberacaoInput("");
            }}
            className="w-full py-2 rounded-lg bg-muted text-muted-foreground text-xs uppercase hover:opacity-80"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // ═══ STEP 3: CONFIRMAR SENHA DE LIBERAÇÃO ═══
  if (screen === "confirm-lib") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center elite-gradient">
        <div className="bg-card rounded-xl border-2 border-gold/50 p-6 w-full max-w-xs text-center space-y-4">
          <div className="text-center">
            <h3 className="text-primary font-bold uppercase text-sm">Confirme a Senha de Liberação</h3>
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
            className="w-full py-3 rounded-lg bg-primary text-gold font-bold uppercase hover:opacity-90 transition-opacity"
          >
            Confirmar
          </button>
          <button
            onClick={() => {
              setScreen("login");
              setConfirmLibInput("");
            }}
            className="w-full py-2 rounded-lg bg-muted text-muted-foreground text-xs uppercase hover:opacity-80"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  if (screen === "lib-saved") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center elite-gradient">
        <div className="flex flex-col items-center gap-6 px-6 w-full max-w-sm">
          <div className="text-center">
            <img src={logoElite} alt="Elite" className="w-24 h-24 mx-auto mb-3 drop-shadow-lg rounded-2xl" />
            <h1 className="text-lg font-bold text-gold uppercase">Senha Gravada ✅</h1>
            <p className="text-gold-bright text-sm mt-1">A senha de liberação foi salva com sucesso!</p>
          </div>
          <div className="w-full bg-primary/30 border border-gold/30 rounded-lg p-4 text-center space-y-2">
            <p className="text-gold/80 text-sm">Senha gravada:</p>
            <p className="text-gold font-bold text-lg tracking-widest">{senhaLiberacaoTemp}</p>
            <p className="text-gold/50 text-xs mt-2">
              Envie esta senha ao cliente. Ao digitá-la, o sistema pedirá que ele crie um PIN de 6 dígitos.
            </p>
          </div>
          {validacaoGravada && (
            <div className="w-full bg-green-900/30 border border-green-500/40 rounded-lg p-3 text-center animate-fade-in">
              <p className="text-green-400 text-xs font-bold">✅ Validação gravada com sucesso!</p>
              <p className="text-green-400/70 text-[10px] mt-1">O usuário pode usar esta senha em qualquer terminal.</p>
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
            className="w-full py-3 rounded-lg gold-gradient text-primary font-bold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {gravandoValidacao ? "Gravando..." : validacaoGravada ? "Validação Gravada ✅" : "Gravar Validação"}
          </button>
          <button
            onClick={() => {
              setPendingLoginPassword(senhaLiberacaoTemp);
              setPendingAccessLevel("master");
              setScreen("email-pin-register");
            }}
            className="w-full py-3 rounded-lg border border-gold/30 text-gold font-bold uppercase hover:bg-gold/10 transition-colors"
          >
            Cadastrar Email e PIN Agora
          </button>
          <button
            onClick={() => {
              setScreen("login");
              location.reload();
            }}
            className="w-full py-2 rounded-lg bg-muted text-muted-foreground text-xs uppercase hover:opacity-80"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // ═══ STEP 4: NEW 6-DIGIT PASSWORD ═══
  if (screen === "new-user") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center elite-gradient">
        <div className="flex flex-col items-center gap-6 px-6 w-full max-w-sm">
          <div className="text-center">
            <img src={logoElite} alt="Elite" className="w-24 h-24 mx-auto mb-3 drop-shadow-lg rounded-2xl" />
            <h1 className="text-lg font-bold text-gold uppercase">Sistema Liberado</h1>
            <p className="text-gold-bright text-sm mt-1">Acesso total confirmado!</p>
          </div>
          <div className="w-full space-y-4 bg-primary/30 border border-gold/30 rounded-lg p-4">
            <p className="text-gold/80 text-sm text-center">Configurar nova senha de usuário (6 dígitos)</p>
            <PasswordInput
              value={newPassInput}
              onChange={setNewPassInput}
              maxLength={6}
              placeholder="Nova Senha (6 dígitos)"
              numericOnly
              className="px-4 py-3 rounded-lg bg-primary/50 border border-gold/30 text-gold text-lg tracking-widest font-bold placeholder:text-gold/40 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
            <button
              onClick={handleNewPass}
              className="w-full py-3 rounded-lg gold-gradient text-primary font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              Salvar Nova Senha
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ ELITE WELCOME - DIAS RESTANTES ═══
  if (screen === "elite-welcome") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center elite-gradient">
        <div className="flex flex-col items-center gap-6 px-6 w-full max-w-sm">
          <div className="text-center">
            <img src={logoElite} alt="Elite" className="w-24 h-24 mx-auto mb-3 drop-shadow-lg rounded-2xl" />
            <h1 className="text-lg font-bold text-gold uppercase">Acesso ELITE Liberado</h1>
          </div>
          <div className="w-full bg-primary/30 border border-gold/30 rounded-lg p-5 text-center space-y-3">
            <p className="text-gold/80 text-sm">Sua licença ELITE está ativa</p>
            <div className={`text-3xl font-bold ${eliteDiasRestantes <= 3 ? "text-destructive" : "text-gold-bright"}`}>
              {eliteDiasRestantes} {eliteDiasRestantes === 1 ? "dia restante" : "dias restantes"}
            </div>
            {eliteDiasRestantes <= 3 && (
              <p className="text-destructive text-xs font-bold">⚠ Sua licença está prestes a expirar!</p>
            )}
          </div>
          <button
            onClick={onLogin}
            className="w-full py-3 rounded-lg gold-gradient text-primary font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            Acessar Simulador
          </button>
        </div>
      </div>
    );
  }

  // ═══ ALTERAR PIN DE 6 DÍGITOS ═══
  if (screen === "change-pin") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center elite-gradient">
        <div className="bg-card rounded-xl border-2 border-gold/50 p-6 w-full max-w-xs text-center space-y-4">
          <h3 className="text-primary font-bold uppercase text-sm">Alterar Senha de 6 Dígitos</h3>
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
          {pinError && <p className="text-destructive text-xs">{pinError}</p>}
          <button
            onClick={handleChangePin}
            className="w-full py-3 rounded-lg bg-primary text-gold font-bold uppercase hover:opacity-90 transition-opacity"
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
            className="w-full py-2 rounded-lg bg-muted text-muted-foreground text-xs uppercase hover:opacity-80"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // ═══ EMAIL + PIN REGISTER (combined) ═══
  if (screen === "email-pin-register") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center elite-gradient overflow-y-auto">
        <div className="bg-card rounded-xl border-2 border-gold/50 p-6 w-full max-w-xs text-center space-y-4 my-8">
          <div className="text-center">
            <img src={logoElite} alt="Elite" className="w-20 h-20 mx-auto mb-2 drop-shadow-lg rounded-2xl" />
            <h3 className="text-primary font-bold uppercase text-sm">Cadastro de Acesso</h3>
            <p className="text-muted-foreground text-xs mt-1">
              Cadastre seu email e crie sua senha de 6 dígitos para finalizar a ativação.
            </p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-gold uppercase mb-1 text-left">Email</label>
              <input
                type="email"
                value={emailPinRegInput}
                onChange={(e) => {
                  setEmailPinRegInput(e.target.value);
                  setEmailPinError("");
                }}
                placeholder="seu.email@exemplo.com"
                maxLength={100}
                className="w-full px-3 py-2.5 border border-gold/30 rounded-lg text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gold uppercase mb-1 text-left">
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
          {emailPinError && <p className="text-destructive text-xs">{emailPinError}</p>}
          <button
            onClick={handleEmailPinRegister}
            disabled={emailPinLoading}
            className="w-full py-3 rounded-lg gold-gradient text-primary font-bold uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {emailPinLoading ? "Cadastrando..." : "Cadastrar"}
          </button>
        </div>
      </div>
    );
  }

  if (screen === "email-register") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center elite-gradient">
        <div className="bg-card rounded-xl border-2 border-gold/50 p-6 w-full max-w-xs text-center space-y-4 relative">
          <button
            onClick={() => {
              setScreen("login");
              setEmailRegInput("");
              setEmailConfirmPassInput("");
              setEmailRegError("");
            }}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-center">
            <img src={logoElite} alt="Elite" className="w-20 h-20 mx-auto mb-2 drop-shadow-lg rounded-2xl" />
            <h3 className="text-primary font-bold uppercase text-sm">
              {pendingAccessLevel === "pin_corretor" ? "Informe seu Email" : "Cadastro de Email"}
            </h3>
            <p className="text-muted-foreground text-xs mt-1">
              {pendingAccessLevel === "pin_corretor"
                ? "Informe o email cadastrado no Painel Comercial para validar seu acesso."
                : "Para sua segurança, cadastre seu email e confirme com a senha utilizada no login."}
            </p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-gold uppercase mb-1 text-left">Email</label>
              <input
                type="email"
                value={emailRegInput}
                onChange={(e) => {
                  setEmailRegInput(e.target.value);
                  setEmailRegError("");
                }}
                placeholder="seu.email@exemplo.com"
                maxLength={100}
                className="w-full px-3 py-2.5 border border-gold/30 rounded-lg text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground"
              />
            </div>
            {pendingAccessLevel !== "pin_corretor" && (
              <div>
                <label className="block text-[10px] font-bold text-gold uppercase mb-1 text-left">
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
          {emailRegError && <p className="text-destructive text-xs">{emailRegError}</p>}
          <button
            onClick={handleEmailRegister}
            disabled={emailRegLoading}
            className="w-full py-3 rounded-lg gold-gradient text-primary font-bold uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {emailRegLoading ? "Registrando..." : "Confirmar Cadastro"}
          </button>
        </div>
      </div>
    );
  }

  // ═══ DEFAULT LOGIN ═══

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col elite-gradient geometric-pattern overflow-hidden"
      style={{ height: "100dvh" }}
    >
      {/* ADQUIRA SUA LICENÇA */}
      {showLicenseBanner && !isFull && (
        <a
          href="https://simuladorcorretorelite.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-3 right-3 px-4 py-2.5 rounded shadow-lg text-[10px] md:text-xs font-extrabold uppercase tracking-wider text-center leading-tight no-underline z-50 animate-pulse transition-transform hover:scale-105 active:scale-95"
          style={{
            background: "linear-gradient(135deg, hsl(42 60% 50%) 0%, hsl(42 70% 40%) 100%)",
            color: "hsl(220 70% 10%)",
            border: "2px solid hsl(42 80% 60% / 0.7)",
            boxShadow: "0 0 15px hsl(42 60% 50% / 0.5), 0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          ⭐ Adquira Sua Licença
        </a>
      )}

      {/* Main Content - centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 w-full max-w-sm mx-auto overflow-y-auto pb-20 pt-4 scrollbar-hide">
        <div className="animate-fade-in flex flex-col items-center gap-3 sm:gap-5 w-full">
          <div className="text-center">
            <img
              src={logoElite}
              alt="Simulador Corretor de Elite 4.0"
              className="w-20 h-20 sm:w-32 sm:h-32 mx-auto mb-2 sm:mb-4 drop-shadow-lg rounded-2xl"
            />
            <h1 className="text-base sm:text-xl font-bold tracking-wider uppercase leading-tight">
              {isFull ? (
                <span className="text-gold">Simulador Corretor de Elite 4.0</span>
              ) : (
                <span className="text-gold">
                  Simulador <span className="text-gold-bright">Corretor de Elite 4.0</span>
                </span>
              )}
            </h1>
            <p className="text-gold/80 text-[10px] sm:text-xs tracking-[3px] sm:tracking-[4px] mt-1 sm:mt-2 uppercase font-semibold">
              {isFull ? "VENDA SEGURA" : "VENDA SEGURA - DEMO"}
            </p>
          </div>

          <p className={`text-xs font-semibold ${isFull ? "text-gold-bright" : "text-gold/70"}`}>{statusMsg}</p>

          {sessionKicked && (
            <div className="w-full bg-destructive/20 border border-destructive/40 rounded-lg p-3 text-center animate-fade-in">
              <p className="text-destructive text-xs font-bold">⚠ Sessão encerrada</p>
              <p className="text-destructive/80 text-[10px] mt-1">
                Outro dispositivo acessou sua conta. Faça login novamente para retomar o acesso.
              </p>
              <button onClick={onSessionKickedAck} className="mt-2 text-[10px] text-gold/60 underline hover:text-gold">
                Entendido
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-gold/70" />
              <p className="text-gold/70 text-sm">Insira a senha para acessar o simulador</p>
            </div>
            <PasswordInput
              value={password}
              onChange={(v) => {
                setPassword(v);
                setError("");
              }}
              placeholder="Senha de acesso"
              maxLength={50}
              className={inputStyle}
            />
            {error && <p className="text-destructive text-center text-sm animate-fade-in">{error}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3.5 rounded-lg gold-gradient text-primary font-extrabold uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-50 text-sm"
              >
                {loading ? "Verificando..." : "ENTRAR"}
              </button>
              <button
                type="button"
                onClick={() => setPainelComercialLoginOpen(true)}
                className="flex-1 py-3.5 rounded-lg border-2 border-gold/40 bg-transparent text-gold text-xs font-extrabold uppercase tracking-wider hover:bg-gold hover:text-primary transition-all"
              >
                PAINEL COMERCIAL
              </button>
            </div>

            <button
              type="button"
              onClick={() => setClienteSiteOpen(true)}
              className="w-full py-3 rounded-lg border-2 border-gold/60 bg-gold/10 text-gold text-xs font-extrabold uppercase tracking-wider hover:bg-gold hover:text-primary transition-all"
            >
              🛒 Cliente do Site (Comprou em simuladorcorretorelite.com.br)
            </button>

            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="w-full text-center text-gold/70 hover:text-gold text-xs underline underline-offset-4 transition-colors"
            >
              Esqueci minha senha
            </button>
          </form>

          {isFull && (
            <div className="pt-1">
              <BiometriaLoginPanel onAuthenticated={onLogin} />
            </div>
          )}

          {getSenhaUsuario() && (
            <button
              onClick={() => setScreen("change-pin")}
              className="w-full py-2 rounded-lg border border-gold/30 text-gold text-xs uppercase font-bold hover:bg-gold/10 transition-colors"
            >
              Alterar Senha de 6 Dígitos
            </button>
          )}

          {/* Credits */}
          <p className="text-gold/40 text-[10px] text-center mt-4 leading-relaxed">
            Desenvolvimento: www.simuladorcorretorelite.com.br | Apoio: RODRIGO DIAS - Gestão TI | INFORMETC Tecnologia
            em Informações Mercantis SC Ltda - CNPJ 00.921.557/0001-65 | Hospedagem ASSECOM ASSESSORIA - CNPJ
            03.662.114/0001-95. - Contato: contatoapps@simuladorcorretorelite.com.br - Telefone (11)92205-2470 -
            Whatsapp (11)920024853
          </p>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-primary/80 backdrop-blur-md border-t-2 border-gold/20">
        <div className="max-w-md mx-auto flex">
          <button
            onClick={() => setScreen("master-modal")}
            className="flex-1 flex flex-col items-center gap-1 py-3 text-gold/50 hover:text-gold transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Corretor Elite</span>
          </button>
          <button
            onClick={() => setDemoAdminOpen(true)}
            className="flex-1 flex flex-col items-center gap-1 py-3 text-gold/50 hover:text-gold transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Administrativo</span>
          </button>
          <button
            onClick={() => setLgpdOpen(true)}
            className="flex-1 flex flex-col items-center gap-1 py-3 text-gold/50 hover:text-gold transition-colors"
          >
            <Shield className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">LGPD</span>
          </button>
          <button
            onClick={() => setFaleConoscoOpen(!faleConoscoOpen)}
            className="flex-1 flex flex-col items-center gap-1 py-3 text-gold/50 hover:text-gold transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Fale Conosco</span>
          </button>
          <a
            href="https://simuladorcorretorelite.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-gold/50 hover:text-gold transition-colors text-center"
          >
            <ShoppingCart className="w-5 h-5 mx-auto" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Adquirir Licença</span>
          </a>
        </div>
      </nav>

      {/* Modals */}
      <LgpdPanel externalOpen={lgpdOpen} onExternalClose={() => setLgpdOpen(false)} hideButton />
      {faleConoscoOpen && <FaleConoscoModal onClose={() => setFaleConoscoOpen(false)} />}
      <DemoAdminPanel isOpen={demoAdminOpen} onClose={() => setDemoAdminOpen(false)} />
      <PainelComercial isOpen={painelComercialLoginOpen} onClose={() => setPainelComercialLoginOpen(false)} />
      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
      <ClienteSiteLogin isOpen={clienteSiteOpen} onClose={() => setClienteSiteOpen(false)} onLoginSuccess={onLogin} />
    </div>
  );
}
