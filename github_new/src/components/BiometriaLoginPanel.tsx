/**
 * BiometriaLoginPanel — entrada biométrica + cadastro neste dispositivo.
 * Apenas para corretores Definitiva/Master (isFullVersion === true).
 */
import { useEffect, useState } from "react";
import { Fingerprint, ShieldCheck, X, Loader2 } from "lucide-react";
import {
  isBiometriaSupported,
  isBiometriaPlatformAvailable,
  hasLocalBiometriaFor,
  loginWithBiometria,
  registerBiometria,
  clearLocalBiometria,
} from "@/lib/webauthn";
import {
  getUserEmail,
  isFullVersion,
  verifySenhaUsuario,
  validatePassword,
  setUserEmail,
  setFullVersion,
} from "@/lib/eliteUtils";

interface Props {
  onAuthenticated: () => void;
}

export default function BiometriaLoginPanel({ onAuthenticated }: Props) {
  const [supported, setSupported] = useState(false);
  const [platformAvailable, setPlatformAvailable] = useState(false);
  const [storedEmail, setStoredEmail] = useState<string | null>(null);
  const [hasLocal, setHasLocal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showRegister, setShowRegister] = useState(false);
  const [regEmail, setRegEmail] = useState("");
  const [regCredential, setRegCredential] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);

  const [noKeyOnDevice, setNoKeyOnDevice] = useState(false);

  useEffect(() => {
    setSupported(isBiometriaSupported());
    isBiometriaPlatformAvailable().then(setPlatformAvailable);
    const email = getUserEmail();
    setStoredEmail(email);
    setHasLocal(!!email && hasLocalBiometriaFor(email));
  }, []);

  // Hidden if browser cannot do biometria
  if (!supported || !platformAvailable) return null;



  const handleLogin = async () => {
    if (!storedEmail) return;
    setError("");
    setNoKeyOnDevice(false);
    setLoading(true);
    try {
      await loginWithBiometria(storedEmail);
      onAuthenticated();
    } catch (e: any) {
      const name = e?.name || "";
      const msg = String(e?.message || "");
      // Chrome/Safari abortam com NotAllowedError quando nenhuma passkey local casa com o allowCredentials.
      // O diálogo nativo já mostrou "Nenhuma chave de acesso disponível neste dispositivo".
      if (name === "NotAllowedError" || /No credentials|not allowed|no passkey|chave de acesso/i.test(msg)) {
        // Limpa a flag enganosa — este dispositivo NÃO tem a chave para este domínio.
        clearLocalBiometria(storedEmail);
        setHasLocal(false);
        setNoKeyOnDevice(true);
        setError(
          `Nenhuma chave de acesso para ${window.location.hostname} neste dispositivo. ` +
          `Você provavelmente cadastrou em outro aparelho ou domínio. ` +
          `Entre com a senha e cadastre a biometria novamente aqui.`
        );
      } else if (/cancel|abort|timed? ?out/i.test(msg)) {
        setError("Biometria cancelada ou tempo esgotado. Tente novamente ou use sua senha.");
      } else if (/COUNTER_REGRESSION/i.test(msg)) {
        setError("Credencial inválida (possível clonagem). Recadastre a biometria.");
      } else {
        setError(msg || "Falha na autenticação biométrica.");
      }
    } finally {
      setLoading(false);
    }
  };


  const handleRegister = async () => {
    setRegError("");
    const email = regEmail.trim().toLowerCase();
    const credential = regCredential.trim();
    if (!email || !credential) {
      setRegError("Informe e-mail e senha/PIN para confirmar.");
      return;
    }
    setRegLoading(true);
    try {
      // Confirm identity: try PIN match first (local), then server-side validation
      let ok = false;
      if (/^\d{6}$/.test(credential)) {
        ok = await verifySenhaUsuario(credential);
        if (!ok) {
          const r = await validatePassword(credential, "pin_login", email);
          ok = r.valid;
        }
      } else {
        // Master / liberation / general access password
        const r = await validatePassword(credential, "login");
        ok =
          r.valid &&
          (r.accessLevel === "master" ||
            r.accessLevel === "elite_demo" ||
            r.accessLevel === "painel_comercial");
        if (!ok) {
          const r2 = await validatePassword(credential, "painel_comercial");
          ok = r2.valid;
        }
      }
      if (!ok) {
        setRegError("Credenciais inválidas. Use seu PIN de 6 dígitos ou senha master.");
        return;
      }

      const deviceName =
        navigator.userAgent.match(/(iPhone|iPad|Android|Macintosh|Windows|Linux)/)?.[0] ||
        "Dispositivo";

      await registerBiometria(email, deviceName);
      setUserEmail(email);
      if (!isFullVersion()) setFullVersion(true);
      setStoredEmail(email);
      setHasLocal(true);
      setRegSuccess(true);
      setTimeout(() => {
        setShowRegister(false);
        setRegSuccess(false);
        setRegEmail("");
        setRegCredential("");
      }, 1800);
    } catch (e: any) {
      const name = e?.name || "";
      const msg = String(e?.message || "");
      if (name === "NotAllowedError" || /cancel|abort|timed? ?out/i.test(msg)) {
        setRegError("Cadastro cancelado. Toque em Confirmar para tentar novamente.");
      } else {
        setRegError(msg || "Falha ao cadastrar biometria.");
      }
    } finally {
      setRegLoading(false);
    }
  };


  return (
    <div className="space-y-2">
      {hasLocal && storedEmail && (
        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3 rounded-lg border-2 border-gold/60 bg-primary/40 text-gold font-bold text-sm uppercase tracking-wider hover:bg-primary/60 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-5 h-5" />}
          Entrar com biometria
        </button>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-2 space-y-1.5">
          <p className="text-xs text-destructive text-center">{error}</p>
          <div className="flex gap-2">
            {noKeyOnDevice ? (
              <button
                type="button"
                onClick={() => {
                  setRegEmail(storedEmail || "");
                  setShowRegister(true);
                  setRegError("");
                  setError("");
                  setNoKeyOnDevice(false);
                }}
                className="flex-1 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider border border-gold/40 text-gold hover:bg-gold/10 transition-colors"
              >
                Cadastrar neste dispositivo
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLogin}
                disabled={loading || !storedEmail}
                className="flex-1 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider border border-gold/40 text-gold hover:bg-gold/10 transition-colors disabled:opacity-50"
              >
                Tentar novamente
              </button>
            )}
            <button
              type="button"
              onClick={() => { setError(""); setNoKeyOnDevice(false); }}
              className="flex-1 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider border border-border text-muted-foreground hover:bg-muted transition-colors"
            >
              Usar senha
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setRegEmail(storedEmail || "");
          setShowRegister(true);
          setRegError("");
        }}
        className="w-full py-2 text-[11px] text-gold/70 hover:text-gold underline underline-offset-2 flex items-center justify-center gap-1"
      >
        <ShieldCheck className="w-3 h-3" />
        {hasLocal ? "Cadastrar outra biometria" : "Cadastrar biometria neste dispositivo"}
      </button>

      {showRegister && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4"
          onClick={() => !regLoading && setShowRegister(false)}
        >
          <div
            className="w-full max-w-sm bg-card border-2 border-gold/40 rounded-xl p-5 space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-primary uppercase flex items-center gap-2">
                <Fingerprint className="w-4 h-4" /> Cadastrar Biometria
              </h4>
              <button
                onClick={() => setShowRegister(false)}
                disabled={regLoading}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {regSuccess ? (
              <div className="py-6 text-center space-y-2">
                <ShieldCheck className="w-12 h-12 text-green-500 mx-auto" />
                <p className="text-sm font-semibold text-foreground">
                  Biometria cadastrada com sucesso!
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Use a digital ou Face ID nos próximos acessos.
                </p>
              </div>
            ) : (
              <>
                <p className="text-[11px] text-muted-foreground">
                  Confirme sua identidade. A biometria fica vinculada a este dispositivo e a este
                  domínio (<strong>{window.location.hostname}</strong>). A senha tradicional continua
                  funcionando como alternativa.
                </p>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Seu e-mail cadastrado"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
                />
                <input
                  type="password"
                  value={regCredential}
                  onChange={(e) => setRegCredential(e.target.value)}
                  placeholder="PIN de 6 dígitos OU senha master"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
                />
                {regError && <p className="text-xs text-destructive">{regError}</p>}
                <button
                  onClick={handleRegister}
                  disabled={regLoading}
                  className="w-full py-2.5 rounded-lg gold-gradient text-primary font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {regLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Fingerprint className="w-3 h-3" />
                  )}
                  Confirmar e ativar biometria
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
