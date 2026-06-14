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
    const { admin_password } = await req.json();
    if (!(await validateAdmin(admin_password))) {
      return new Response(JSON.stringify({ error: "Senha inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("empreendimento_tabelas")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;

    // Generate signed URLs for download (1h)
    const items = await Promise.all(
      (data || []).map(async (t) => {
        let download_url: string | null = null;
        if (t.arquivo_path) {
          const { data: signed } = await supabase.storage
            .from("tabelas-empreendimentos")
            .createSignedUrl(t.arquivo_path, 3600);
          download_url = signed?.signedUrl || null;
        }
        return { ...t, download_url };
      }),
    );

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
