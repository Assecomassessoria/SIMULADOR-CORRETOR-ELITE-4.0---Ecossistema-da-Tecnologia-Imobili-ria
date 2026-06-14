import { useState } from "react";
import { X, Mail, KeyRound, Lock, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = "email" | "otp" | "newpin" | "done";

export default function ForgotPasswordModal({ open, onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  if (!open) return null;

  const reset = () => {
    setStep("email");
    setEmail("");
    setOtp("");
    setToken("");
    setNewPin("");
    setConfirmPin("");
    setError("");
    setInfo("");
    setLoading(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const requestCode = async () => {
    setError("");
    setInfo("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Informe um e-mail válido.");
      return;
    }
    setLoading(true);
    try {
      const { data, error: invErr } = await supabase.functions.invoke("password-reset-otp", {
        body: { action: "request", email: email.trim().toLowerCase() },
      });
      if (invErr || !data?.success) {
        setError(data?.error || "Não foi possível enviar o código. Tente novamente.");
        return;
      }
      setInfo("Se o e-mail estiver cadastrado, enviaremos um código em até 1 minuto.");
      setStep("otp");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setError("");
    if (!/^\d{6}$/.test(otp)) {
      setError("Digite o código de 6 dígitos.");
      return;
    }
    setLoading(true);
    try {
      const { data, error: invErr } = await supabase.functions.invoke("password-reset-otp", {
        body: { action: "verify", email: email.trim().toLowerCase(), otp },
      });
      if (invErr || !data?.success || !data?.token) {
        setError(data?.error || "Código incorreto ou expirado.");
        return;
      }
      setToken(data.token);
      setStep("newpin");
    } finally {
      setLoading(false);
    }
  };

  const resetPin = async () => {
    setError("");
    if (!/^\d{6}$/.test(newPin)) {
      setError("O PIN deve ter exatamente 6 dígitos.");
      return;
    }
    if (newPin !== confirmPin) {
      setError("Os PINs não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const { data, error: invErr } = await supabase.functions.invoke("password-reset-otp", {
        body: { action: "reset", email: email.trim().toLowerCase(), token, newPin },
      });
      if (invErr || !data?.success) {
        setError(data?.error || "Não foi possível redefinir. Tente novamente.");
        return;
      }
      setStep("done");
    } finally {
      setLoading(false);
    }
  };

  const titleMap: Record<Step, string> = {
    email: "Recuperar Senha",
    otp: "Confirme o Código",
    newpin: "Novo PIN",
    done: "Senha Redefinida",
  };

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={close}
    >
      <div
        className="w-full max-w-sm bg-card border-2 border-gold/40 rounded-xl p-6 shadow-2xl space-y-4 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step !== "email" && step !== "done" && (
              <button
                onClick={() => {
                  setError("");
                  if (step === "otp") setStep("email");
                  else if (step === "newpin") setStep("otp");
                }}
                className="text-gold/60 hover:text-gold transition-colors"
                type="button"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider">{titleMap[step]}</h3>
          </div>
          <button onClick={close} className="text-muted-foreground hover:text-foreground" type="button">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicator */}
        {step !== "done" && (
          <div className="flex gap-1">
            {(["email", "otp", "newpin"] as Step[]).map((s, i) => {
              const active = ["email", "otp", "newpin"].indexOf(step) >= i;
              return (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-colors ${active ? "bg-gold" : "bg-border"}`}
                />
              );
            })}
          </div>
        )}

        {/* Content */}
        {step === "email" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Informe seu e-mail cadastrado. Enviaremos um código de 6 dígitos para você redefinir seu PIN.
            </p>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/50" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full pl-10 pr-3 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                onKeyDown={(e) => e.key === "Enter" && requestCode()}
              />
            </div>
            <button
              onClick={requestCode}
              disabled={loading}
              className="w-full py-3 rounded-lg gold-gradient text-primary font-extrabold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Enviar Código
            </button>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Digite o código de 6 dígitos enviado para <strong className="text-foreground">{email}</strong>.
            </p>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/50" />
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full pl-10 pr-3 py-3 rounded-lg border border-border bg-background text-foreground text-center text-lg tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-gold/40"
                onKeyDown={(e) => e.key === "Enter" && verifyCode()}
                autoFocus
              />
            </div>
            <button
              onClick={verifyCode}
              disabled={loading || otp.length !== 6}
              className="w-full py-3 rounded-lg gold-gradient text-primary font-extrabold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirmar Código
            </button>
            <button
              onClick={requestCode}
              disabled={loading}
              type="button"
              className="w-full text-center text-xs text-gold/70 hover:text-gold underline underline-offset-4 transition-colors"
            >
              Reenviar código
            </button>
          </div>
        )}

        {step === "newpin" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Defina seu novo PIN de 6 dígitos.</p>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/50" />
              <input
                type="password"
                inputMode="numeric"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Novo PIN"
                maxLength={6}
                className="w-full pl-10 pr-3 py-3 rounded-lg border border-border bg-background text-foreground text-center tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-gold/40"
                autoFocus
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/50" />
              <input
                type="password"
                inputMode="numeric"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Confirme o PIN"
                maxLength={6}
                className="w-full pl-10 pr-3 py-3 rounded-lg border border-border bg-background text-foreground text-center tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-gold/40"
                onKeyDown={(e) => e.key === "Enter" && resetPin()}
              />
            </div>
            <button
              onClick={resetPin}
              disabled={loading}
              className="w-full py-3 rounded-lg gold-gradient text-primary font-extrabold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Redefinir PIN
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="text-center space-y-4 py-2">
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto" />
            <p className="text-sm text-foreground">Seu PIN foi redefinido com sucesso!</p>
            <p className="text-xs text-muted-foreground">Use o novo PIN de 6 dígitos para entrar.</p>
            <button
              onClick={close}
              className="w-full py-3 rounded-lg gold-gradient text-primary font-extrabold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              Voltar ao Login
            </button>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive text-xs rounded-lg p-2.5">
            {error}
          </div>
        )}
        {info && step === "otp" && (
          <div className="bg-gold/10 border border-gold/30 text-gold text-[11px] rounded-lg p-2.5">{info}</div>
        )}
      </div>
    </div>
  );
}
