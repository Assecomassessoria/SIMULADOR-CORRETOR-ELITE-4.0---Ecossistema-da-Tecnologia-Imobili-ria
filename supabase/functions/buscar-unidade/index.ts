import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { empreendimento, unidade } = await req.json();
    if (!empreendimento || !unidade) {
      return new Response(JSON.stringify({ error: "empreendimento e unidade são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Buscar tabela do empreendimento (case-insensitive, mais recente)
    const { data: tabelas } = await supabase
      .from("empreendimento_tabelas")
      .select("id, empreendimento_nome, construtora_cnpj, updated_at")
      .ilike("empreendimento_nome", `%${empreendimento}%`)
      .order("updated_at", { ascending: false });

    if (!tabelas?.length) {
      return new Response(JSON.stringify({ found: false, reason: "empreendimento_nao_encontrado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tabela = tabelas[0];

    const unidadeTrim = String(unidade).trim();
    const { data: unidades } = await supabase
      .from("empreendimento_unidades")
      .select("*")
      .eq("tabela_id", tabela.id)
      .ilike("unidade", unidadeTrim)
      .limit(1);

    if (!unidades?.length) {
      return new Response(JSON.stringify({ found: false, reason: "unidade_nao_encontrada", tabela_id: tabela.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const u = unidades[0];
    return new Response(
      JSON.stringify({
        found: true,
        empreendimento: tabela.empreendimento_nome,
        construtora_cnpj: tabela.construtora_cnpj,
        atualizado_em: tabela.updated_at,
        unidade: u.unidade,
        andar: u.andar,
        apto_torre: u.apto_torre,
        valor_lancamento: u.valor_lancamento,
        tipologia: u.tipologia,
        metragem: u.metragem,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
