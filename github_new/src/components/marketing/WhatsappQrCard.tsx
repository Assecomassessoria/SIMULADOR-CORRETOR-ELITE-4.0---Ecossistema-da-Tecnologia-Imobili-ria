import { useEffect, useRef, useState } from "react";
import { Loader2, CheckCircle2, RefreshCw, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getUserEmail } from "@/lib/eliteUtils";

type State = "idle" | "loading" | "qr" | "open" | "error";

interface Props {
  /** Identificador único do corretor (default: email logado no simulador). */
  identifier?: string;
  /** Layout compacto (sem cartão completo) — usado dentro de Dialogs. */
  compact?: boolean;
}

export default function WhatsappQrCard({ identifier, compact = false }: Props) {
  const id = (identifier || getUserEmail() || "corretor").trim();
  const [state, setState] = useState<State>("idle");
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const pollRef = useRef<number | null>(null);

  // Verifica status inicial
  useEffect(() => {
    void checkStatus();
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function checkStatus() {
    try {
      const { data, error: e } = await supabase.functions.invoke(
        "whatsapp-evolution",
        { body: { action: "status", identifier: id } },
      );
      if (e) throw new Error(e.message);
      if (data?.state === "open") {
        setState("open");
        setQr(null);
        if (pollRef.current) {
          window.clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }
    } catch {
      /* silencioso no primeiro check */
    }
  }

  async function generateQr() {
    setError("");
    setState("loading");
    setQr(null);
    try {
      const { data, error: e } = await supabase.functions.invoke(
        "whatsapp-evolution",
        { body: { action: "connect", identifier: id } },
      );
      if (e) throw new Error(e.message);
      if (data?.error) throw new Error(data.error);

      if (data?.state === "open") {
        setState("open");
        return;
      }
      if (data?.qr) {
        const src = data.qr.startsWith("data:")
          ? data.qr
          : `data:image/png;base64,${data.qr}`;
        setQr(src);
        setState("qr");
        startPolling();
        return;
      }
      throw new Error("QR Code não disponível. Tente novamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar QR Code.");
      setState("error");
    }
  }

  function startPolling() {
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke(
          "whatsapp-evolution",
          { body: { action: "status", identifier: id } },
        );
        if (data?.state === "open") {
          setState("open");
          setQr(null);
          if (pollRef.current) {
            window.clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }
      } catch { /* ignora */ }
    }, 3500);
  }

  async function disconnect() {
    setState("loading");
    try {
      await supabase.functions.invoke("whatsapp-evolution", {
        body: { action: "disconnect", identifier: id },
      });
    } finally {
      setState("idle");
      setQr(null);
    }
  }

  const badge = (() => {
    if (state === "open") {
      return (
        <span className="px-2 py-1 text-xs font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/40 rounded-full">
          ✓ WhatsApp Conectado
        </span>
      );
    }
    if (state === "qr") {
      return (
        <span className="px-2 py-1 text-xs font-medium text-amber-300 bg-amber-500/15 border border-amber-500/40 rounded-full">
          Aguardando leitura…
        </span>
      );
    }
    if (state === "loading") {
      return (
        <span className="px-2 py-1 text-xs font-medium text-[hsl(43,72%,53%)] bg-[hsl(43,72%,53%)/0.15] border border-[hsl(43,72%,53%)/0.4] rounded-full">
          Gerando QR…
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium text-[hsl(0,0%,75%)] bg-[hsl(210,100%,12%)] border border-[hsl(210,50%,30%)] rounded-full">
        Desconectado
      </span>
    );
  })();

  const inner = (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white">WhatsApp</h3>
            <p className="text-[11px] text-[hsl(0,0%,67%)]">Conexão instantânea via QR Code</p>
          </div>
        </div>
        {badge}
      </div>

      <p className="text-xs text-[hsl(0,0%,75%)] mb-4 leading-relaxed">
        Abra o WhatsApp no seu celular, vá em <strong className="text-white">Aparelhos Conectados</strong> e leia o código para ativar suas automações.
      </p>

      <div className="flex flex-col items-center justify-center border-2 border-dashed border-[hsl(210,50%,30%)] rounded-lg p-4 bg-[hsl(210,100%,12%)] min-h-[220px]">
        {state === "loading" && (
          <div className="flex flex-col items-center gap-2 text-[hsl(0,0%,75%)]">
            <Loader2 className="w-8 h-8 animate-spin text-[hsl(43,72%,53%)]" />
            <span className="text-xs">Gerando QR Code…</span>
          </div>
        )}

        {state === "qr" && qr && (
          <div className="flex flex-col items-center gap-3">
            <img
              src={qr}
              alt="QR Code WhatsApp"
              className="w-48 h-48 rounded-md bg-white p-2"
            />
            <p className="text-[11px] text-[hsl(0,0%,67%)]">
              Aguardando leitura no seu celular…
            </p>
            <button
              onClick={generateQr}
              className="text-[11px] text-[hsl(43,72%,53%)] hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Gerar novo
            </button>
          </div>
        )}

        {state === "open" && (
          <div className="flex flex-col items-center gap-3 text-emerald-400">
            <CheckCircle2 className="w-14 h-14" />
            <span className="font-bold text-sm">WhatsApp Conectado</span>
            <button
              onClick={disconnect}
              className="text-[11px] text-red-400 hover:underline flex items-center gap-1 mt-1"
            >
              <LogOut className="w-3 h-3" /> Desconectar
            </button>
          </div>
        )}

        {(state === "idle" || state === "error") && (
          <div className="flex flex-col items-center gap-3">
            {state === "error" && (
              <p className="text-[11px] text-red-400 text-center max-w-[240px]">{error}</p>
            )}
            <button
              onClick={generateQr}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm transition-colors"
            >
              Gerar QR Code
            </button>
          </div>
        )}
      </div>

      <p className="text-[10px] text-[hsl(0,0%,55%)] mt-2 text-center font-mono break-all">
        Instância: elite-{id.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48)}
      </p>
    </>
  );

  if (compact) return <div className="space-y-1">{inner}</div>;

  return (
    <div className="rounded-xl border-2 border-[hsl(43,72%,53%)] bg-[hsl(210,100%,18%)] p-5 shadow-2xl shadow-[hsl(43,72%,53%)/0.1]">
      {inner}
    </div>
  );
}
