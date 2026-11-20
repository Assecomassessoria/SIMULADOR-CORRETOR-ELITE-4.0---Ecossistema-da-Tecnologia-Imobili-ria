import { useState } from "react";
import {
  X,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Building2,
  UserCheck,
  Copy,
  Check,
  Lock,
} from "lucide-react";
import { useFirebaseAuth } from "@/contexts/FirebaseContext";
import { formatFirebaseAuthError, validatePersonalPasswordStrength } from "@/lib/firebase";

interface PersonalSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PersonalSecurityModal({ isOpen, onClose }: PersonalSecurityModalProps) {
  const { user, accessAuthorization, linkPersonalPassword, linkGoogleProvider } = useFirebaseAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen) return null;

  const providers = new Set((user?.providerData || []).map((p) => p.providerId));
  const hasPassword = providers.has("password");
  const hasGoogle = providers.has("google.com");

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const strengthError = validatePersonalPasswordStrength(newPassword);
    if (strengthError) {
      setFeedback({ type: "err", text: strengthError });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ type: "err", text: "A confirmação de senha não confere. Digite a mesma senha nos dois campos." });
      return;
    }

    setSaving(true);
    try {
      await linkPersonalPassword(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      setFeedback({
        type: "ok",
        text: hasPassword
          ? "Sua senha pessoal foi atualizada com sucesso!"
          : "Senha pessoal cadastrada e vinculada ao seu contrato! Agora você pode entrar com E-mail + Senha Pessoal ou Google.",
      });
    } catch (err) {
      setFeedback({ type: "err", text: formatFirebaseAuthError(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleLinkGoogle = async () => {
    setFeedback(null);
    setLinkingGoogle(true);
    try {
      await linkGoogleProvider();
      setFeedback({
        type: "ok",
        text: "Conta Google vinculada com sucesso ao mesmo ID e contrato!",
      });
    } catch (err) {
      setFeedback({ type: "err", text: formatFirebaseAuthError(err) });
    } finally {
      setLinkingGoogle(false);
    }
  };

  const handleCopyId = async () => {
    if (!accessAuthorization?.codigoId) return;
    try {
      await navigator.clipboard.writeText(accessAuthorization.codigoId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const papelLabel =
    accessAuthorization?.papel === "master_adm"
      ? "Master / Administrador"
      : accessAuthorization?.papel === "admin_imobiliaria"
        ? "Admin da Imobiliária"
        : accessAuthorization?.tipoConta === "imobiliaria"
          ? "Corretor Vinculado à Imobiliária"
          : "Corretor / Cliente Individual (Autônomo)";

  return (
    <div
      className="fixed inset-0 z-[2100] flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border-2 border-gold/45 bg-[#07182e] text-slate-100 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gold/30 bg-[#041022]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-gold" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-gold">
                Minha Conta &amp; Senha Pessoal
              </h2>
              <p className="text-[11px] text-gold/65">Identidade Isolada (ID Próprio) e Acesso Híbrido</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gold/70 hover:text-gold hover:bg-gold/10"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Identity Card */}
          <div className="rounded-xl bg-[#0b213d] border border-gold/30 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold/75">
                Identificação no Contrato
              </span>
              {accessAuthorization?.codigoId && (
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="px-2 py-0.5 rounded border border-gold/40 bg-gold/15 text-gold font-mono text-[11px] font-extrabold flex items-center gap-1 hover:bg-gold/25"
                >
                  <span>ID: {accessAuthorization.codigoId}</span>
                  {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              )}
            </div>

            <div className="space-y-1 text-xs">
              <p className="font-bold text-white">{accessAuthorization?.recordName || user?.displayName || user?.email}</p>
              <p className="text-gold/85 truncate">{user?.email || "Sessão local"}</p>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-gold/25 text-[10px] font-bold text-amber-200 flex items-center gap-1">
                  {accessAuthorization?.tipoConta === "imobiliaria" ? (
                    <Building2 className="w-3 h-3" />
                  ) : (
                    <UserCheck className="w-3 h-3" />
                  )}
                  {papelLabel}
                </span>
                {accessAuthorization?.imobiliariaNome && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-400/40 text-[10px] font-bold text-amber-300">
                    Imobiliária: {accessAuthorization.imobiliariaNome}
                    {accessAuthorization.imobiliariaCodigo ? ` (${accessAuthorization.imobiliariaCodigo})` : ""}
                  </span>
                )}
              </div>
            </div>

            {/* Linked Providers Status */}
            {user && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gold/15 text-[10px] font-bold">
                <span
                  className={`px-2 py-1 rounded border flex items-center gap-1 ${
                    hasPassword
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                      : "bg-slate-800/80 border-slate-700 text-slate-400"
                  }`}
                >
                  <Lock className="w-3 h-3" />
                  {hasPassword ? "Senha Pessoal Ativa" : "Senha Pessoal Não Cadastrada"}
                </span>
                <span
                  className={`px-2 py-1 rounded border flex items-center gap-1 ${
                    hasGoogle
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                      : "bg-slate-800/80 border-slate-700 text-slate-400"
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  {hasGoogle ? "Google Vinculado" : "Google Não Vinculado"}
                </span>
              </div>
            )}
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-lg text-xs font-semibold border ${
                feedback.type === "ok"
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                  : "bg-red-500/15 border-red-500/40 text-red-300"
              }`}
            >
              {feedback.text}
            </div>
          )}

          {!user ? (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/35 text-amber-200 text-xs leading-relaxed">
              Para cadastrar sua <strong>Senha Pessoal</strong> ou vincular sua conta <strong>Google</strong> ao seu
              contrato com isolamento por ID, faça login com seu e-mail cadastrado ou Google na tela inicial.
            </div>
          ) : (
            <>
              {/* Create / Update Personal Password Form */}
              <form onSubmit={handleSavePassword} className="space-y-3 rounded-xl bg-[#0b213d] border border-gold/25 p-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gold">
                  {hasPassword ? "Alterar Senha Pessoal" : "Cadastrar Senha Pessoal"}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Mínimo 8 caracteres contendo letras e números. Funciona junto com seu login Google no mesmo ID.
                </p>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gold/80 mb-1">
                    {hasPassword ? "Nova Senha Pessoal *" : "Criar Senha Pessoal *"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      minLength={8}
                      maxLength={128}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setFeedback(null);
                      }}
                      placeholder="Mín. 8 caracteres (letras e números)"
                      className="w-full px-3 py-2 pr-9 text-xs rounded-lg bg-[#07182e] border border-gold/30 text-gold placeholder:text-gold/40 focus:outline-none focus:border-gold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gold/60 hover:text-gold"
                      tabIndex={-1}
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gold/80 mb-1">
                    Confirmar Senha Pessoal *
                  </label>
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    minLength={8}
                    maxLength={128}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setFeedback(null);
                    }}
                    placeholder="Repita a senha pessoal"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[#07182e] border border-gold/30 text-gold placeholder:text-gold/40 focus:outline-none focus:border-gold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 rounded-lg gold-gradient text-primary font-extrabold uppercase text-xs tracking-wider hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {hasPassword ? "Atualizar Senha Pessoal" : "Salvar Senha Pessoal"}
                    </>
                  )}
                </button>
              </form>

              {/* Link Google Account if signed in via Email/Password only */}
              {!hasGoogle && (
                <button
                  type="button"
                  onClick={handleLinkGoogle}
                  disabled={linkingGoogle}
                  className="w-full py-2.5 rounded-xl bg-white text-slate-900 text-xs font-extrabold uppercase tracking-wider hover:bg-slate-100 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {linkingGoogle ? (
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
                  Vincular Conta Google ao Mesmo Contrato
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
