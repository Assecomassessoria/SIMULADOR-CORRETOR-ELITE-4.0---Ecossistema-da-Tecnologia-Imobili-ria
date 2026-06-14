import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Settings as SettingsIcon, Facebook, CheckCircle, XCircle, Loader2, LogOut, ArrowLeft } from "lucide-react";

const MarketingSettings = () => {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<{
    meta_access_token: string | null;
    ig_user_id: string | null;
    meta_ad_account_id: string | null;
    meta_connected_at: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const metaConnected = searchParams.get("meta_connected");
    const metaError = searchParams.get("meta_error");
    if (metaConnected === "true") {
      setMessage("✅ Instagram/Meta Ads conectado com sucesso!");
    } else if (metaError) {
      setMessage(`❌ Erro: ${metaError}`);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/marketing/auth");
        return;
      }
      setUser(user);

      const { data } = await supabase
        .from("profiles" as any)
        .select("meta_access_token, ig_user_id, meta_ad_account_id, meta_connected_at")
        .eq("id", user.id)
        .single();

      setProfile(data as any);
      setLoginEmail(localStorage.getItem("meta_login_email") || user.email || "");
      setInstagramHandle(localStorage.getItem("meta_ig_handle") || "");
      setLoading(false);
    };
    loadProfile();
  }, [navigate, searchParams]);

  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      const d: any = ev.data;
      if (!d || d.source !== "meta-oauth") return;
      if (d.status === "success") {
        setMessage("✅ Instagram/Meta Ads conectado com sucesso!");
        if (user) {
          supabase
            .from("profiles" as any)
            .select("meta_access_token, ig_user_id, meta_ad_account_id, meta_connected_at")
            .eq("id", user.id)
            .single()
            .then(({ data }) => setProfile(data as any));
        }
      } else {
        setMessage(`❌ ${d.error || "Falha na conexão"}`);
      }
      setConnecting(false);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [user]);

  const handleConnectFacebook = async () => {
    if (!user) return;
    setConnecting(true);
    setMessage("");

    try {
      const cleanHandle = instagramHandle.trim().replace(/^@/, "");
      localStorage.setItem("meta_login_email", loginEmail.trim());
      localStorage.setItem("meta_ig_handle", cleanHandle);

      const { data, error } = await supabase.functions.invoke("facebook-oauth-start", {
        body: {
          userId: user.id,
          loginHint: loginEmail.trim() || undefined,
          instagramHandle: cleanHandle || undefined,
          popup: true,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.authUrl) throw new Error("URL de autenticação não retornada");

      const w = 600, h = 720;
      const y = window.top!.outerHeight / 2 + window.top!.screenY - h / 2;
      const x = window.top!.outerWidth / 2 + window.top!.screenX - w / 2;
      const popup = window.open(data.authUrl, "meta-oauth", `width=${w},height=${h},left=${x},top=${y}`);
      if (!popup) {
        setConnecting(false);
        setMessage("❌ Pop-up bloqueado. Permita janelas pop-up e tente novamente.");
        return;
      }
      const timer = setInterval(() => {
        if (popup.closed) { clearInterval(timer); setConnecting(false); }
      }, 800);
    } catch (err) {
      setMessage(`❌ ${err instanceof Error ? err.message : "Erro ao conectar"}`);
      setConnecting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/marketing/auth");
  };

  const isConnected = profile?.meta_access_token && profile?.ig_user_id;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(210,100%,12%)]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(43,72%,53%)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[hsl(210,100%,12%)]">
      <div className="w-full max-w-lg rounded-2xl border-2 border-[hsl(43,72%,53%)] bg-[hsl(210,100%,18%)] p-8 shadow-2xl shadow-[hsl(43,72%,53%)/0.1]">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <SettingsIcon className="h-7 w-7 text-[hsl(43,72%,53%)]" />
            <h1 className="text-2xl font-bold text-[hsl(43,72%,53%)]" style={{ fontFamily: "'Playfair Display', serif" }}>Configurações</h1>
          </div>
          <button
            onClick={() => navigate("/marketing")}
            className="text-[hsl(0,0%,67%)] hover:text-white transition-colors text-sm flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </div>

        {/* User info */}
        <div className="rounded-lg border border-[hsl(210,50%,30%)] p-4 mb-6 space-y-3">
          <div>
            <p className="text-xs text-[hsl(0,0%,67%)] mb-1">Sessão Elite (somente leitura)</p>
            <p className="text-white text-sm font-medium">{user?.email}</p>
          </div>
          <div>
            <label className="text-xs text-[hsl(43,72%,53%)] font-medium">
              E-mail / usuário do Facebook para conectar
            </label>
            <input
              type="text"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="seu-email-do-facebook@exemplo.com"
              className="mt-1 w-full rounded-md bg-[hsl(210,100%,12%)] border border-[hsl(210,50%,30%)] px-3 py-2 text-sm text-white placeholder:text-[hsl(0,0%,45%)] focus:outline-none focus:border-[hsl(43,72%,53%)]"
            />
            <p className="text-[11px] text-[hsl(0,0%,55%)] mt-1">
              Pode ser diferente do e-mail Elite. Será sugerido ao logar no Facebook.
            </p>
          </div>
          <div>
            <label className="text-xs text-[hsl(43,72%,53%)] font-medium">
              @ do Instagram (opcional)
            </label>
            <input
              type="text"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              placeholder="@simuladorcorretorelite4.0"
              className="mt-1 w-full rounded-md bg-[hsl(210,100%,12%)] border border-[hsl(210,50%,30%)] px-3 py-2 text-sm text-white placeholder:text-[hsl(0,0%,45%)] focus:outline-none focus:border-[hsl(43,72%,53%)]"
            />
            <p className="text-[11px] text-[hsl(0,0%,55%)] mt-1">
              Usado como referência. A conta IG real é vinculada via página do Facebook conectada.
            </p>
          </div>
        </div>

        {/* Meta Connection */}
        <div className="rounded-lg border border-[hsl(210,50%,30%)] p-5 mb-6 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            <Facebook className="h-5 w-5 text-[hsl(220,46%,48%)]" />
            Instagram / Meta Ads
          </h2>

          {isConnected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Conectado</span>
              </div>
              <div className="text-sm text-[hsl(0,0%,67%)] space-y-1">
                <p>IG User ID: <span className="text-white font-mono text-xs">{profile?.ig_user_id}</span></p>
                <p>Ad Account: <span className="text-white font-mono text-xs">{profile?.meta_ad_account_id || "N/A"}</span></p>
                <p>Conectado em: <span className="text-white">{profile?.meta_connected_at ? new Date(profile.meta_connected_at).toLocaleString("pt-BR") : "N/A"}</span></p>
              </div>
              <button
                onClick={handleConnectFacebook}
                disabled={connecting}
                className="w-full rounded-lg border border-[hsl(210,50%,30%)] p-3 text-sm font-medium text-[hsl(0,0%,67%)] transition-all hover:bg-[hsl(210,50%,30%)/0.5] flex items-center justify-center gap-2"
              >
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Facebook className="h-4 w-4" />}
                Reconectar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[hsl(0,0%,67%)]">
                <XCircle className="h-5 w-5" />
                <span>Não conectado</span>
              </div>
              <p className="text-xs text-[hsl(0,0%,67%)]">
                Conecte sua conta do Facebook para publicar automaticamente no Instagram e criar anúncios no Meta Ads.
              </p>
              <button
                onClick={handleConnectFacebook}
                disabled={connecting}
                className="w-full rounded-lg bg-[hsl(220,46%,48%)] p-3 text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Facebook className="h-4 w-4" />}
                Conectar Instagram / Meta Ads
              </button>
            </div>
          )}
        </div>

        {message && (
          <div className={`mb-6 rounded-lg p-3 text-sm font-medium ${
            message.startsWith("✅")
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-destructive/20 text-destructive border border-destructive/30"
          }`}>
            {message}
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full rounded-lg border border-destructive/50 p-3 text-sm font-medium text-destructive transition-all hover:bg-destructive/10 flex items-center justify-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sair da Conta
        </button>
      </div>
    </div>
  );
};

export default MarketingSettings;
