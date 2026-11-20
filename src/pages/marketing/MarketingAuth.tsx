import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, Mail, Lock, Eye, EyeOff, User, Phone } from "lucide-react";
import { useFirebaseAuth } from "@/contexts/FirebaseContext";
import {
  MASTER_EMAIL,
  MASTER_PASSWORD,
  setMasterAccess,
  setFullVersion,
  setUserEmail,
  setAuthProvider,
  setLoginDate,
} from "@/lib/eliteUtils";

const getPasswordStrength = (pwd: string): { level: number; label: string; color: string } => {
  if (!pwd) return { level: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 2) return { level: 1, label: "Fraca", color: "bg-destructive" };
  if (score <= 3) return { level: 2, label: "Média", color: "bg-yellow-500" };
  return { level: 3, label: "Forte", color: "bg-green-500" };
};

const MarketingAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { signInWithGoogle } = useFirebaseAuth();

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setMessage("");
    try {
      const { user, authorization } = await signInWithGoogle();
      if (!authorization.authorized) {
        setMessage(authorization.message);
        return;
      }
      setLoginDate();
      sessionStorage.setItem("luiza_elite_auth", "true");
      if (user.email) {
        setUserEmail(user.email.trim().toLowerCase());
      }
      navigate("/marketing");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        setMessage("Login com Google cancelado.");
      } else if (code === "auth/popup-blocked") {
        setMessage("Pop-up bloqueado pelo navegador. Permita pop-ups e tente novamente.");
      } else {
        setMessage("Não foi possível entrar com o Google. Tente novamente.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const cleanPassword = password.trim();
    const cleanEmail = email.trim().toLowerCase();

    // MASTER & EXCLUSIVE PASSWORD BYPASS
    if (cleanPassword === MASTER_PASSWORD || cleanPassword === "472370") {
      sessionStorage.setItem("luiza_elite_auth", "true");
      if (cleanPassword === MASTER_PASSWORD) {
        setMasterAccess(true);
        setFullVersion(true);
        setUserEmail(cleanEmail || MASTER_EMAIL);
        setAuthProvider("master");
        setLoginDate();
      }
      setLoading(false);
      navigate("/marketing");
      return;
    }

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
      } else {
        navigate("/marketing");
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { name, whatsapp },
        },
      });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage("✅ Verifique seu e-mail para confirmar o cadastro.");
        // Send to Google Sheets - aba MARKETING
        try {
          await supabase.functions.invoke("register-elite", {
            body: {
              tipo_cadastro: "marketing_signup",
              nome: name,
              email,
              senha: password,
            },
          });
        } catch (gsErr) {
          console.error("Google Sheets marketing error (non-blocking):", gsErr);
        }
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[hsl(210,100%,12%)]">
      <div className="w-full max-w-md rounded-2xl border-2 border-[hsl(43,72%,53%)] bg-[hsl(210,100%,18%)] p-8 shadow-2xl shadow-[hsl(43,72%,53%)/0.1]">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Sparkles className="h-7 w-7 text-[hsl(43,72%,53%)]" />
          <h1 className="text-3xl font-bold text-[hsl(43,72%,53%)]" style={{ fontFamily: "'Playfair Display', serif" }}>
            IA Social Ad Manager
          </h1>
        </div>

        <h2 className="text-xl font-semibold text-white text-center mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
          {isLogin ? "Entrar" : "Criar Conta"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-[hsl(0,0%,67%)] mb-1">Nome</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(0,0%,67%)]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-lg border border-[hsl(210,50%,30%)] bg-[hsl(210,30%,25%)] pl-10 p-3 text-white placeholder:text-[hsl(0,0%,67%)/0.5] focus:outline-none focus:ring-2 focus:ring-[hsl(43,72%,53%)]"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[hsl(0,0%,67%)] mb-1">WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(0,0%,67%)]" />
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    required
                    className="w-full rounded-lg border border-[hsl(210,50%,30%)] bg-[hsl(210,30%,25%)] pl-10 p-3 text-white placeholder:text-[hsl(0,0%,67%)/0.5] focus:outline-none focus:ring-2 focus:ring-[hsl(43,72%,53%)]"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-[hsl(0,0%,67%)] mb-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(0,0%,67%)]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-[hsl(210,50%,30%)] bg-[hsl(210,30%,25%)] pl-10 p-3 text-white placeholder:text-[hsl(0,0%,67%)/0.5] focus:outline-none focus:ring-2 focus:ring-[hsl(43,72%,53%)]"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[hsl(0,0%,67%)] mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(0,0%,67%)]" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-[hsl(210,50%,30%)] bg-[hsl(210,30%,25%)] pl-10 pr-10 p-3 text-white placeholder:text-[hsl(0,0%,67%)/0.5] focus:outline-none focus:ring-2 focus:ring-[hsl(43,72%,53%)]"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(0,0%,67%)] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {!isLogin && password && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i <= getPasswordStrength(password).level
                        ? getPasswordStrength(password).color
                        : "bg-[hsl(210,50%,30%)]"
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs font-medium ${
                getPasswordStrength(password).level === 1 ? "text-destructive" :
                getPasswordStrength(password).level === 2 ? "text-yellow-500" : "text-green-500"
              }`}>
                Senha {getPasswordStrength(password).label}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[hsl(43,72%,53%)] p-3 text-lg font-bold text-[hsl(210,100%,12%)] transition-all hover:brightness-110 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-5 w-5 animate-spin" />}
            {isLogin ? "Entrar" : "Cadastrar"}
          </button>

          {isLogin && (
            <button
              type="button"
              onClick={async () => {
                if (!email) {
                  setMessage("Digite seu e-mail primeiro.");
                  return;
                }
                setLoading(true);
                setMessage("");
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: `${window.location.origin}/marketing/reset-password`,
                });
                if (error) {
                  setMessage(error.message);
                } else {
                  setMessage("✅ Link de redefinição enviado para seu e-mail.");
                }
                setLoading(false);
              }}
              className="w-full text-sm text-[hsl(43,72%,53%)] hover:underline font-medium mt-1"
            >
              Esqueci minha senha
            </button>
          )}
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[hsl(43,72%,53%)/0.25]" />
          <span className="text-xs uppercase tracking-wider text-[hsl(0,0%,67%)]">ou</span>
          <div className="h-px flex-1 bg-[hsl(43,72%,53%)/0.25]" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="w-full rounded-lg bg-white text-slate-900 p-3 text-sm font-bold shadow-md hover:bg-slate-100 transition-all disabled:opacity-60 flex items-center justify-center gap-2.5"
        >
          {googleLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-700" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
              <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z" />
              <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z" />
              <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
            </svg>
          )}
          {googleLoading ? "Conectando ao Google..." : "Entrar com Google"}
        </button>

        {message && (
          <div className={`mt-4 rounded-lg p-3 text-sm font-medium ${
            message.startsWith("✅") 
              ? "bg-green-500/20 text-green-400 border border-green-500/30" 
              : "bg-destructive/20 text-destructive border border-destructive/30"
          }`}>
            {message}
          </div>
        )}

        <p className="mt-6 text-center text-sm text-[hsl(0,0%,67%)]">
          {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
          <button
            onClick={() => { setIsLogin(!isLogin); setMessage(""); }}
            className="text-[hsl(43,72%,53%)] hover:underline font-medium"
          >
            {isLogin ? "Cadastre-se" : "Faça login"}
          </button>
        </p>

        <button
          onClick={() => navigate("/")}
          className="mt-4 w-full rounded-lg border border-[hsl(43,72%,53%)] p-2.5 text-sm font-semibold text-[hsl(43,72%,53%)] transition-all hover:bg-[hsl(43,72%,53%)]/10"
        >
          ← Voltar para Simulação
        </button>
      </div>
    </div>
  );
};

export default MarketingAuth;
