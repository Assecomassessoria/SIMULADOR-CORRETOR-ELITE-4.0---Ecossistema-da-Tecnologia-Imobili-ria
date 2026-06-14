function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  try {
    const { hostname, protocol } = new URL(origin);
    const isHttp = protocol === "https:" || protocol === "http:";
    if (!isHttp) return false;
    return (
      hostname === "assecomassessoria.net.br" ||
      hostname === "www.assecomassessoria.net.br" ||
      hostname.endsWith(".simuladorcorretorelite.com.br") ||
      hostname === "simuladorcorretorelite.com.br" ||
      hostname.endsWith(".lovable.app") ||
      hostname.endsWith(".lovableproject.com")
    );
  } catch {
    return false;
  }
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowed = isAllowedOrigin(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "https://simuladorcorretorelitedemo.lovable.app",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const now = new Date();
  const validUntil = new Date("2026-12-31T23:59:59");
  const dentroDaVigencia = now <= validUntil;

  // Tabela de planos vigente até 31/12/2026
  const planos = {
    mensal: { label: "Assinatura Mensal", value: "69,90" },
    semestral: { label: "Assinatura Semestral", value: "299,90" },
    anual: { label: "Assinatura Anual", value: "479,90" },
    anual_dev: { label: "Assinatura Anual + Desenvolvimento", value: "1.900,00" },
  };

  // Valor padrão (mantido para compatibilidade com chamadas antigas): Mensal
  const value = dentroDaVigencia ? planos.mensal.value : planos.mensal.value;

  return new Response(JSON.stringify({ value, planos, valid_until: "2026-12-31" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
