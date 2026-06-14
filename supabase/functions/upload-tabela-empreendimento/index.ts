import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Unidade {
  unidade: string;
  andar?: string;
  apto_torre?: string;
  valor_lancamento?: number;
  tipologia?: string;
  metragem?: string;
}

async function validateAdmin(password: string): Promise<boolean> {
  if (!password) return false;
  const candidates = [
    Deno.env.get("CREDENTIAL_MASTER"),
    Deno.env.get("CREDENTIAL_MASTER_ALT"),
    Deno.env.get("CREDENCIAL_EMAIL_GERAL"),
    Deno.env.get("CREDENCIAL_SENHA_GERAL"),
  ];
  return candidates.some((p) => p && p === password);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      admin_password,
      construtora_cnpj,
      empreendimento_nome,
      cidade,
      uf,
      arquivo_tipo,
      arquivo_base64,
      arquivo_filename,
      uploaded_by_email,
      unidades,
    } = body as {
      admin_password: string;
      construtora_cnpj: string;
      empreendimento_nome: string;
      cidade?: string;
      uf?: string;
      arquivo_tipo: "pdf" | "xlsx";
      arquivo_base64: string;
      arquivo_filename: string;
      uploaded_by_email?: string;
      unidades: Unidade[];
    };

    if (!(await validateAdmin(admin_password))) {
      return new Response(JSON.stringify({ error: "Senha administrativa inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!construtora_cnpj || !empreendimento_nome || !arquivo_tipo || !unidades?.length) {
      return new Response(JSON.stringify({ error: "Dados incompletos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Upload arquivo no bucket
    const bin = Uint8Array.from(atob(arquivo_base64), (c) => c.charCodeAt(0));
    const safeName = arquivo_filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${construtora_cnpj.replace(/\D/g, "")}/${Date.now()}_${safeName}`;
    const { error: upErr } = await supabase.storage.from("tabelas-empreendimentos").upload(path, bin, {
      contentType:
        arquivo_tipo === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      upsert: true,
    });
    if (upErr) console.warn("upload storage falhou:", upErr.message);

    // Substitui tabela existente do mesmo empreendimento+cnpj (replace)
    const { data: prev } = await supabase
      .from("empreendimento_tabelas")
      .select("id, arquivo_path, total_unidades, updated_at")
      .eq("construtora_cnpj", construtora_cnpj)
      .ilike("empreendimento_nome", empreendimento_nome);

    let replaced_previous = false;
    let previous_info: { total_unidades: number; updated_at: string } | null = null;
    if (prev && prev.length) {
      replaced_previous = true;
      previous_info = { total_unidades: prev[0].total_unidades, updated_at: prev[0].updated_at };
      // remove arquivos antigos do storage
      const paths = prev.map((p) => p.arquivo_path).filter(Boolean) as string[];
      if (paths.length) {
        await supabase.storage.from("tabelas-empreendimentos").remove(paths);
      }
      await supabase
        .from("empreendimento_tabelas")
        .delete()
        .in(
          "id",
          prev.map((p) => p.id),
        );
    }

    const { data: tabela, error: tErr } = await supabase
      .from("empreendimento_tabelas")
      .insert({
        construtora_cnpj,
        empreendimento_nome,
        cidade,
        uf,
        arquivo_path: path,
        arquivo_tipo,
        total_unidades: unidades.length,
        uploaded_by_email,
      })
      .select()
      .single();

    if (tErr || !tabela) throw new Error(tErr?.message || "Falha ao criar tabela");

    // Inserir unidades em lotes de 1000
    const rows = unidades.map((u) => ({
      tabela_id: tabela.id,
      unidade: String(u.unidade).trim(),
      andar: u.andar?.toString() || null,
      apto_torre: u.apto_torre?.toString() || null,
      valor_lancamento: u.valor_lancamento ?? null,
      tipologia: u.tipologia?.toString() || null,
      metragem: u.metragem?.toString() || null,
    }));

    for (let i = 0; i < rows.length; i += 1000) {
      const chunk = rows.slice(i, i + 1000);
      const { error } = await supabase.from("empreendimento_unidades").insert(chunk);
      if (error) throw new Error(error.message);
    }

    return new Response(
      JSON.stringify({ ok: true, tabela_id: tabela.id, total: rows.length, replaced_previous, previous_info }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("upload-tabela-empreendimento:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 1000,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
