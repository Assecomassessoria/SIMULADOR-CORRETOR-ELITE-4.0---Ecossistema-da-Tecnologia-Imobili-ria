import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, Mail, Lock, Eye, EyeOff, User, Phone } from "lucide-react";

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
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const cleanPassword = password.trim();

    // MASTER & EXCLUSIVE PASSWORD BYPASS
    if (cleanPassword === "47231970" || cleanPassword === "472370") {
      sessionStorage.setItem("luiza_elite_auth", "true");
      if (cleanPassword === "47231970") {
        const { setMasterAccess, setFullVersion } = await import("@/lib/eliteUtils");
        setMasterAccess(true);
        setFullVersion(true);
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
