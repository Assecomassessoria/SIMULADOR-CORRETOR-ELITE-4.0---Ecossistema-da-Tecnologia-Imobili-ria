import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function validateAdmin(password: string): Promise<boolean> {
  if (!password) return false;
  return [
    Deno.env.get("CREDENTIAL_MASTER"),
    Deno.env.get("CREDENTIAL_MASTER_ALT"),
    Deno.env.get("CREDENCIAL_EMAIL_GERAL"),
    Deno.env.get("CREDENCIAL_SENHA_GERAL"),
  ].some((p) => p && p === password);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { admin_password, tabela_id } = await req.json();
    if (!(await validateAdmin(admin_password))) {
      return new Response(JSON.stringify({ error: "Senha inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!tabela_id) {
      return new Response(JSON.stringify({ error: "tabela_id obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: tabela } = await supabase
      .from("empreendimento_tabelas")
      .select("arquivo_path")
      .eq("id", tabela_id)
      .maybeSingle();

    if (tabela?.arquivo_path) {
      await supabase.storage.from("tabelas-empreendimentos").remove([tabela.arquivo_path]);
    }

    const { error } = await supabase.from("empreendimento_tabelas").delete().eq("id", tabela_id);
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
