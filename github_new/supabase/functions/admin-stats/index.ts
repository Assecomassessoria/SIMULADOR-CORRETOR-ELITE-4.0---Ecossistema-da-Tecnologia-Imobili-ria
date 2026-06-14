// Retorna métricas agregadas para o Painel Administrativo.
// Exige a master password do simulador (mesma usada para abrir o painel).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    // 1) Corretores ativos (tabela corretores - cadastro comercial)
    const { count: corretoresAtivos } = await admin
      .from("corretores")
      .select("*", { count: "exact", head: true })
      .eq("status", "ativo");

    // 2) PINs ativos (corretores com acesso PIN configurado)
    const { count: pinsAtivos } = await admin
      .from("user_pin_access")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // 3) Tentativas de conexão WhatsApp
    const { count: waTentativas } = await admin
      .from("whatsapp_connection_attempts")
      .select("*", { count: "exact", head: true })
      .eq("action", "connect");

    // Únicos que tentaram conectar
    const { data: waIds } = await admin
      .from("whatsapp_connection_attempts")
      .select("identifier")
      .eq("action", "connect")
      .limit(5000);
    const waUnicos = new Set((waIds || []).map((r) => r.identifier)).size;

    // Últimas 7 tentativas
    const { data: ultimas } = await admin
      .from("whatsapp_connection_attempts")
      .select("identifier, created_at, result_state")
      .order("created_at", { ascending: false })
      .limit(7);

    return new Response(
      JSON.stringify({
        corretoresAtivos: corretoresAtivos ?? 0,
        pinsAtivos: pinsAtivos ?? 0,
        whatsappTentativas: waTentativas ?? 0,
        whatsappCorretoresUnicos: waUnicos,
        ultimasTentativas: ultimas ?? [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
