import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Facebook, Instagram, CheckCircle, XCircle, Loader2, Shield } from "lucide-react";
import WhatsappQrCard from "./WhatsappQrCard";

const MarketingConnections = () => {
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
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const metaConnected = searchParams.get("meta_connected");
    const metaError = searchParams.get("meta_error");
    if (metaConnected === "true") setMessage("✅ Instagram/Meta Ads conectado com sucesso!");
    else if (metaError) setMessage(`❌ ${metaError}`);
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
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
    load();
  }, [searchParams]);

  const reloadProfile = async (uid: string) => {
    const { data } = await supabase
      .from("profiles" as any)
      .select("meta_access_token, ig_user_id, meta_ad_account_id, meta_connected_at")
      .eq("id", uid)
      .single();
    setProfile(data as any);
  };

  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      const d = ev.data;
      if (!d || d.source !== "meta-oauth") return;
      if (d.status === "success") {
        setMessage("✅ Instagram/Meta Ads conectado com sucesso!");
        if (user) reloadProfile(user.id);
      } else {
        setMessage(`❌ ${d.error || "Falha na conexão"}`);
      }
      setConnecting(false);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [user]);

  const handleConnect = async () => {
    if (!user) {
      setMessage("❌ Você precisa estar logado no Marketing para conectar.");
      return;
    }
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
      const popup = window.open(
        data.authUrl,
        "meta-oauth",
        `width=${w},height=${h},left=${x},top=${y}`
      );
      if (!popup) {
        setConnecting(false);
        setMessage("❌ Pop-up bloqueado. Permita janelas pop-up para este site e tente novamente.");
        return;
      }
      // Detecta fechamento manual
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          setConnecting(false);
        }
      }, 800);
    } catch (err) {
      setMessage(`❌ ${err instanceof Error ? err.message : "Erro ao conectar"}`);
      setConnecting(false);
    }
  };

  const isConnected = !!(profile?.meta_access_token && profile?.ig_user_id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(210,100%,12%)] py-8">
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[hsl(43,72%,53%)]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Conexões — Hub de Marketing
          </h1>
          <p className="text-sm text-[hsl(0,0%,75%)] mt-2">
            Conecte sua Página do Facebook e o Instagram Profissional vinculado para que a Luiza Elite publique automaticamente.
          </p>
        </div>

        {/* PASSO 1: Identidade */}
        <div className="rounded-xl border-2 border-[hsl(43,72%,53%)] bg-[hsl(210,100%,18%)] p-5 space-y-4 shadow-2xl shadow-[hsl(43,72%,53%)/0.1]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[hsl(43,72%,53%)/0.2] border border-[hsl(43,72%,53%)/0.4] flex items-center justify-center text-[hsl(43,72%,53%)] font-bold">01</div>
            <div>
              <h2 className="text-white font-semibold">Identidade e Contexto</h2>
              <p className="text-xs text-[hsl(0,0%,67%)]">Usado como referência no login da Meta</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-[hsl(43,72%,53%)] font-medium flex items-center gap-1">
                <Facebook className="w-3 h-3" /> E-mail / usuário do Facebook
              </label>
              <input
                type="text"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="seu-email-do-facebook@exemplo.com"
                className="mt-1 w-full rounded-md bg-[hsl(210,100%,12%)] border border-[hsl(210,50%,30%)] px-3 py-2 text-sm text-white placeholder:text-[hsl(0,0%,45%)] focus:outline-none focus:border-[hsl(43,72%,53%)]"
              />
            </div>

            <div>
              <label className="text-xs text-[hsl(43,72%,53%)] font-medium flex items-center gap-1">
                <Instagram className="w-3 h-3" /> @ do Instagram Profissional
              </label>
              <div className="mt-1 flex items-center rounded-md bg-[hsl(210,100%,12%)] border border-[hsl(210,50%,30%)] focus-within:border-[hsl(43,72%,53%)]">
                <span className="pl-3 text-[hsl(43,72%,53%)]">@</span>
                <input
                  type="text"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value.replace(/^@/, ""))}
                  placeholder="simuladorcorretorelite4.0"
                  className="flex-1 bg-transparent px-2 py-2 text-sm text-white placeholder:text-[hsl(0,0%,45%)] focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-[hsl(0,0%,67%)] mt-1">
                A conta IG deve ser <strong className="text-white">Profissional/Comercial</strong> e estar vinculada à sua Página do Facebook.
              </p>
            </div>
          </div>
        </div>

        {/* PASSO 2: OAuth Meta */}
        <div className="rounded-xl border-2 border-[hsl(43,72%,53%)] bg-[hsl(210,100%,18%)] p-5 space-y-4 shadow-2xl shadow-[hsl(43,72%,53%)/0.1]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[hsl(43,72%,53%)/0.2] border border-[hsl(43,72%,53%)/0.4] flex items-center justify-center text-[hsl(43,72%,53%)] font-bold">02</div>
            <div>
              <h2 className="text-white font-semibold">Automação Meta Business</h2>
              <p className="text-xs text-[hsl(0,0%,67%)]">Login oficial via OAuth (Graph API v19)</p>
            </div>
          </div>

          {isConnected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Conta conectada</span>
              </div>
              <div className="text-xs text-[hsl(0,0%,67%)] space-y-1 font-mono bg-[hsl(210,100%,12%)] p-3 rounded-md border border-[hsl(210,50%,30%)]">
                <p>IG User ID: <span className="text-white">{profile?.ig_user_id}</span></p>
                <p>Ad Account: <span className="text-white">{profile?.meta_ad_account_id || "—"}</span></p>
                <p>Desde: <span className="text-white">{profile?.meta_connected_at ? new Date(profile.meta_connected_at).toLocaleString("pt-BR") : "—"}</span></p>
              </div>
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="w-full rounded-lg border border-[hsl(210,50%,30%)] p-3 text-sm font-medium text-[hsl(0,0%,75%)] transition-all hover:bg-[hsl(210,50%,30%)/0.5] flex items-center justify-center gap-2"
              >
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Facebook className="h-4 w-4" />}
                Reconectar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[hsl(0,0%,75%)]">
                <XCircle className="h-5 w-5" />
                <span>Não conectado</span>
              </div>
              <p className="text-xs text-[hsl(0,0%,75%)]">
                Ao clicar abaixo você será direcionado para o ambiente seguro da Meta. Permissões solicitadas:
                <span className="block mt-1 font-mono text-[10px] text-[hsl(43,72%,53%)/0.9]">
                  instagram_basic · instagram_content_publish · pages_show_list · pages_read_engagement · ads_management
                </span>
              </p>
              <button
                onClick={handleConnect}
                disabled={connecting || !user}
                className="w-full rounded-lg bg-[hsl(43,72%,53%)] hover:brightness-110 p-3 text-sm font-bold text-[hsl(210,100%,12%)] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Facebook className="h-4 w-4" />}
                Entrar com Facebook e conectar Instagram
              </button>
              {!user && (
                <p className="text-[11px] text-amber-400 text-center">
                  Faça login no Hub de Marketing antes de conectar.
                </p>
              )}
            </div>
          )}
        </div>

        {/* PASSO 3: WhatsApp via QR Code (Evolution API) */}
        <div className="rounded-xl border-2 border-[hsl(43,72%,53%)] bg-[hsl(210,100%,18%)] p-5 space-y-4 shadow-2xl shadow-[hsl(43,72%,53%)/0.1]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[hsl(43,72%,53%)/0.2] border border-[hsl(43,72%,53%)/0.4] flex items-center justify-center text-[hsl(43,72%,53%)] font-bold">03</div>
            <div>
              <h2 className="text-white font-semibold">WhatsApp do Corretor</h2>
              <p className="text-xs text-[hsl(0,0%,67%)]">Conexão via QR Code — Evolution API (servidor próprio)</p>
            </div>
          </div>
          <WhatsappQrCard identifier={user?.email || undefined} />
        </div>

        {message && (
          <div className={`rounded-lg p-3 text-sm font-medium ${
            message.startsWith("✅")
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-destructive/20 text-destructive border border-destructive/30"
          }`}>
            {message}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-[11px] text-[hsl(0,0%,67%)] pt-2">
          <Shield className="w-3 h-3" />
          Segurança garantida via Meta Graph API v19.0
        </div>
      </div>
    </div>
  );
};

export default MarketingConnections;
