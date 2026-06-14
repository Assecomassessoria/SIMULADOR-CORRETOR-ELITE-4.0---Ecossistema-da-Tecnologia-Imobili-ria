import { useState } from "react";
import { X, Mail, User, Lock, Eye, EyeOff, Loader2, ShoppingBag } from "lucide-react";
import { setFullVersion, setUserEmail, createSession } from "@/lib/eliteUtils";

const API_BASE = "https://gxizjiajlarbadgizbvx.supabase.co/functions/v1";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

function maskCpfCnpj(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function validateNewPassword(p: string): string | null {
  if (p.length < 8) return "Mínimo 8 caracteres";
  if (!/[a-zA-Z]/.test(p)) return "Inclua pelo menos 1 letra";
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(p)) return "Inclua pelo menos 1 caractere especial";
  return null;
}

export default function ClienteSiteLogin({ isOpen, onClose, onLoginSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // First access flow
  const [firstAccess, setFirstAccess] = useState(false);
  const [senhaProvisoria, setSenhaProvisoria] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNova, setConfirmarNova] = useState("");
  const [showNova, setShowNova] = useState(false);

  if (!isOpen) return null;

  const reset = () => {
    setEmail(""); setCpfCnpj(""); setPassword(""); setError(""); setInfo("");
    setFirstAccess(false); setSenhaProvisoria(""); setNovaSenha(""); setConfirmarNova("");
  };

  const handleClose = () => { reset(); onClose(); };

  const finishLogin = (planoNome?: string) => {
    setFullVersion(true);
    setUserEmail(email);
    try { createSession(email); } catch {}
    setInfo(`✅ Acesso liberado${planoNome ? ` - ${planoNome}` : ""}. Redirecionando...`);
    setTimeout(() => { onLoginSuccess(); handleClose(); }, 800);
  };

  const handleConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setInfo("");
    if (!email || !cpfCnpj || !password) {
      setError("Preencha todos os campos.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/consulta-acesso`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), cpf_cnpj: cpfCnpj.replace(/\D/g, "") }),
      });
      const data = await res.json().catch(() => ({}));

      if (data.status === "approved") {
        if (data.primeiro_acesso) {
          if (password !== data.senha_provisoria) {
            setError("Senha provisória incorreta. Verifique o email recebido após a compra.");
            setLoading(false);
            return;
          }
          setSenhaProvisoria(data.senha_provisoria);
          setFirstAccess(true);
          setInfo("Primeiro acesso detectado. Defina sua nova senha.");
        } else {
          // Validar senha definitiva contra o backend externo
          const verRes = await fetch(`${API_BASE}/verifica-senha`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email.trim().toLowerCase(),
              cpf_cnpj: cpfCnpj.replace(/\D/g, ""),
              senha: password,
            }),
          });
          const verData = await verRes.json().catch(() => ({}));
          if (verData.ok) {
            finishLogin(data.plano);
          } else {
            setError(verData.erro || "Senha incorreta.");
          }
        }
      } else if (data.status === "pending") {
        setError("Pagamento em processamento. Tente novamente em alguns minutos.");
      } else if (data.status === "rejected") {
        setError("Pagamento recusado. Contate o WhatsApp (11) 94677-0625.");
      } else if (data.status === "nao_encontrado") {
        setError("Email/CPF não localizados em nossas compras.");
      } else {
        setError(data.erro || "Não foi possível validar o acesso. Tente novamente.");
      }
    } catch (err) {
      setError("Erro de conexão com o servidor de licenças.");
    } finally {
      setLoading(false);
    }
  };

  const handleDefinirSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setInfo("");
    const v = validateNewPassword(novaSenha);
    if (v) { setError(v); return; }
    if (novaSenha !== confirmarNova) { setError("As senhas não coincidem."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/definir-senha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          cpf_cnpj: cpfCnpj.replace(/\D/g, ""),
          senha_provisoria: senhaProvisoria,
          nova_senha: novaSenha,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        finishLogin();
      } else {
        setError(data.erro || "Não foi possível definir a nova senha.");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full pl-10 pr-3 py-3 rounded-lg bg-primary/40 border border-gold/30 text-gold placeholder:text-gold/40 focus:outline-none focus:border-gold transition-colors";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border-2 border-gold/40 bg-primary p-6 shadow-2xl relative animate-fade-in">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gold/60 hover:text-gold transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-center gap-2 mb-1">
          <ShoppingBag className="w-6 h-6 text-gold" />
          <h2 className="text-lg font-extrabold uppercase tracking-wider text-gold">
            Cliente do Site
          </h2>
        </div>
        <p className="text-center text-gold/60 text-xs mb-5">
          Acesso para quem comprou em simuladorcorretorelite.com.br
        </p>

        {!firstAccess ? (
          <form onSubmit={handleConsulta} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/60" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="Email da compra"
                className={inputCls}
                autoComplete="email"
                required
              />
            </div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/60" />
              <input
                type="text"
                value={cpfCnpj}
                onChange={(e) => { setCpfCnpj(maskCpfCnpj(e.target.value)); setError(""); }}
                placeholder="CPF ou CNPJ"
                className={inputCls}
                inputMode="numeric"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/60" />
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Senha (provisória ou definitiva)"
                className={inputCls + " pr-10"}
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gold/60 hover:text-gold"
                aria-label="Mostrar/ocultar senha"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && <p className="text-destructive text-xs text-center">{error}</p>}
            {info && <p className="text-green-400 text-xs text-center">{info}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg gold-gradient text-primary font-extrabold uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Validando..." : "Entrar"}
            </button>

            <p className="text-center text-gold/50 text-[10px] mt-2">
              Após a compra, você recebe por email a senha provisória no formato{" "}
              <span className="font-mono">SIMULADOR-XXXXXXXXX</span>.
            </p>
          </form>
        ) : (
          <form onSubmit={handleDefinirSenha} className="space-y-3">
            <p className="text-gold/80 text-xs text-center">
              Defina sua nova senha. Mín. 8 caracteres, com letra e caractere especial.{" "}
              <span className="text-gold/60">Ex.: <span className="font-mono">#L123456</span></span>
            </p>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/60" />
              <input
                type={showNova ? "text" : "password"}
                value={novaSenha}
                onChange={(e) => { setNovaSenha(e.target.value); setError(""); }}
                placeholder="Nova senha"
                className={inputCls + " pr-10"}
                required
              />
              <button
                type="button"
                onClick={() => setShowNova(!showNova)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gold/60 hover:text-gold"
              >
                {showNova ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/60" />
              <input
                type={showNova ? "text" : "password"}
                value={confirmarNova}
                onChange={(e) => { setConfirmarNova(e.target.value); setError(""); }}
                placeholder="Confirmar nova senha"
                className={inputCls}
                required
              />
            </div>

            {error && <p className="text-destructive text-xs text-center">{error}</p>}
            {info && <p className="text-green-400 text-xs text-center">{info}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg gold-gradient text-primary font-extrabold uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Salvando..." : "Definir Senha e Entrar"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
