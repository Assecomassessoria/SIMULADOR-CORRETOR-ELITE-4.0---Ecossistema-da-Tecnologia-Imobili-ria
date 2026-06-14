import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, FileSpreadsheet, MessageCircle, Facebook } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type TestKey = "sheets" | "whatsapp" | "facebook";

const TESTS: { key: TestKey; label: string; fn: string; body?: any; Icon: any }[] = [
  { key: "sheets", label: "Google Sheets", fn: "test-sheets-connection", Icon: FileSpreadsheet },
  { key: "whatsapp", label: "Meta / WhatsApp", fn: "test-meta-connection", body: { target: "whatsapp" }, Icon: MessageCircle },
  { key: "facebook", label: "Facebook / Instagram", fn: "test-meta-connection", body: { target: "facebook" }, Icon: Facebook },
];

export default function SheetsConnectionTest() {
  const [loading, setLoading] = useState<TestKey | null>(null);
  const [results, setResults] = useState<Record<TestKey, any>>({} as any);

  const runTest = async (t: typeof TESTS[number]) => {
    setLoading(t.key);
    setResults((r) => ({ ...r, [t.key]: null }));
    try {
      const { data, error } = await supabase.functions.invoke(t.fn, { body: t.body || {} });
      if (error) throw error;
      setResults((r) => ({ ...r, [t.key]: data }));
    } catch (e: any) {
      setResults((r) => ({ ...r, [t.key]: { summary: { success: false, message: `Erro: ${e.message}` } } }));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-4 border-b border-gold/20 bg-primary/5 space-y-3">
      {TESTS.map((t) => {
        const result = results[t.key];
        const ok = result?.summary?.success;
        const Icon = t.Icon;
        return (
          <div key={t.key}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-gold" />
                <span className="text-xs font-bold uppercase tracking-wider text-gold">
                  Teste de Conexão {t.label}
                </span>
              </div>
              <button
                onClick={() => runTest(t)}
                disabled={loading !== null}
                className="px-3 py-1.5 text-xs font-bold uppercase rounded bg-gold text-primary hover:bg-gold/90 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
              >
                {loading === t.key ? <Loader2 className="w-3 h-3 animate-spin" /> : "Testar"}
              </button>
            </div>

            {result && (
              <div
                className={`mt-2 p-3 rounded text-xs ${
                  ok
                    ? "bg-green-500/10 border border-green-500/40 text-green-400"
                    : "bg-red-500/10 border border-red-500/40 text-red-400"
                }`}
              >
                <div className="flex items-start gap-2 font-semibold mb-1">
                  {ok ? (
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  )}
                  <span>{result.summary?.message}</span>
                </div>
                {result.tests && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-gold/70 hover:text-gold text-xs">
                      Ver detalhes técnicos
                    </summary>
                    <pre className="mt-2 p-2 bg-black/40 rounded overflow-x-auto text-[10px] text-gold/80 max-h-64">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
