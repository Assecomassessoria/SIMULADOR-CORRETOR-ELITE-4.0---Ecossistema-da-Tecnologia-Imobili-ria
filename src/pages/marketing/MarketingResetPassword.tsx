import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, Lock, Eye, EyeOff } from "lucide-react";

const MarketingResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setMessage("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("✅ Senha atualizada com sucesso!");
      setTimeout(() => navigate("/marketing"), 2000);
    }
    setLoading(false);
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[hsl(210,100%,12%)]">
        <div className="w-full max-w-md rounded-2xl border-2 border-[hsl(43,72%,53%)] bg-[hsl(210,100%,18%)] p-8 shadow-2xl shadow-[hsl(43,72%,53%)/0.1] text-center">
          <Sparkles className="h-7 w-7 text-[hsl(43,72%,53%)] mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Link inválido ou expirado
          </h1>
          <p className="text-[hsl(0,0%,67%)] text-sm mb-6">
            Solicite um novo link de redefinição de senha.
          </p>
          <button
            onClick={() => navigate("/marketing/auth")}
            className="text-[hsl(43,72%,53%)] hover:underline font-medium text-sm"
          >
            Voltar ao login
          </button>
        </div>
      </div>
    );
  }

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
          Nova Senha
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[hsl(0,0%,67%)] mb-1">Nova Senha</label>
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

          <div>
            <label className="block text-sm font-medium text-[hsl(0,0%,67%)] mb-1">Confirmar Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(0,0%,67%)]" />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-[hsl(210,50%,30%)] bg-[hsl(210,30%,25%)] pl-10 pr-10 p-3 text-white placeholder:text-[hsl(0,0%,67%)/0.5] focus:outline-none focus:ring-2 focus:ring-[hsl(43,72%,53%)]"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[hsl(43,72%,53%)] p-3 text-lg font-bold text-[hsl(210,100%,12%)] transition-all hover:brightness-110 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-5 w-5 animate-spin" />}
            Redefinir Senha
          </button>
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
      </div>
    </div>
  );
};

export default MarketingResetPassword;
