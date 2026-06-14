import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function validateSessionToken(supabase: any, sessionToken: string): Promise<boolean> {
  if (!sessionToken || typeof sessionToken !== "string") return false;
  const { data } = await supabase
    .from("active_sessions")
    .select("id, is_active")
    .eq("session_token", sessionToken)
    .eq("is_active", true)
    .single();
  return !!data;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, session_token, ...params } = body;

    if (!action || typeof action !== "string" || action.length > 50) {
      return errorResponse(corsHeaders, "Invalid action", 400);
    }

    const supabase = getSupabaseAdmin();

    const isValid = await validateSessionToken(supabase, session_token);
    if (!isValid) {
      return new Response(
        JSON.stringify({ success: false, error: "Sessão inválida ou expirada" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    switch (action) {
      case "leads_list": {
        const { data, error } = await supabase.from("crm_leads").select("*").order("created_at", { ascending: false });
        if (error) return errorResponse(corsHeaders, error.message);
        return jsonResponse(corsHeaders, { success: true, data });
      }
      case "leads_insert": {
        const { payload } = params;
        if (!payload || !payload.nome) return errorResponse(corsHeaders, "Nome é obrigatório");
        const { data, error } = await supabase.from("crm_leads").insert(payload).select().single();
        if (error) return errorResponse(corsHeaders, error.message);
        return jsonResponse(corsHeaders, { success: true, data });
      }
      case "leads_update": {
        const { id, payload } = params;
        if (!id) return errorResponse(corsHeaders, "ID é obrigatório");
        const { data, error } = await supabase.from("crm_leads").update(payload).eq("id", id).select().single();
        if (error) return errorResponse(corsHeaders, error.message);
        return jsonResponse(corsHeaders, { success: true, data });
      }
      case "leads_delete": {
        const { id } = params;
        if (!id) return errorResponse(corsHeaders, "ID é obrigatório");
        const { error } = await supabase.from("crm_leads").delete().eq("id", id);
        if (error) return errorResponse(corsHeaders, error.message);
        return jsonResponse(corsHeaders, { success: true });
      }
      case "tasks_list": {
        const { data, error } = await supabase.from("crm_tasks").select("*").order("created_at", { ascending: false });
        if (error) return errorResponse(corsHeaders, error.message);
        return jsonResponse(corsHeaders, { success: true, data });
      }
      case "tasks_insert": {
        const { payload } = params;
        if (!payload || !payload.titulo) return errorResponse(corsHeaders, "Título é obrigatório");
        const { data, error } = await supabase.from("crm_tasks").insert(payload).select().single();
        if (error) return errorResponse(corsHeaders, error.message);
        return jsonResponse(corsHeaders, { success: true, data });
      }
      case "tasks_update": {
        const { id, payload } = params;
        if (!id) return errorResponse(corsHeaders, "ID é obrigatório");
        const { data, error } = await supabase.from("crm_tasks").update(payload).eq("id", id).select().single();
        if (error) return errorResponse(corsHeaders, error.message);
        return jsonResponse(corsHeaders, { success: true, data });
      }
      case "tasks_delete": {
        const { id } = params;
        if (!id) return errorResponse(corsHeaders, "ID é obrigatório");
        const { error } = await supabase.from("crm_tasks").delete().eq("id", id);
        if (error) return errorResponse(corsHeaders, error.message);
        return jsonResponse(corsHeaders, { success: true });
      }
      case "construtoras_list": {
        const { data, error } = await supabase.from("crm_construtoras").select("*").order("ordem", { ascending: true });
        if (error) return errorResponse(corsHeaders, error.message);
        return jsonResponse(corsHeaders, { success: true, data });
      }
      case "construtoras_insert": {
        const { payload } = params;
        if (!payload || !payload.nome_empreendimento) return errorResponse(corsHeaders, "Nome do empreendimento é obrigatório");
        const { data, error } = await supabase.from("crm_construtoras").insert(payload).select().single();
        if (error) return errorResponse(corsHeaders, error.message);
        return jsonResponse(corsHeaders, { success: true, data });
      }
      case "construtoras_update": {
        const { id, payload } = params;
        if (!id) return errorResponse(corsHeaders, "ID é obrigatório");
        const { data, error } = await supabase.from("crm_construtoras").update(payload).eq("id", id).select().single();
        if (error) return errorResponse(corsHeaders, error.message);
        return jsonResponse(corsHeaders, { success: true, data });
      }
      case "construtoras_delete": {
        const { id } = params;
        if (!id) return errorResponse(corsHeaders, "ID é obrigatório");
        const { error } = await supabase.from("crm_construtoras").delete().eq("id", id);
        if (error) return errorResponse(corsHeaders, error.message);
        return jsonResponse(corsHeaders, { success: true });
      }
      case "activity_list": {
        const { lead_id } = params;
        let query = supabase.from("crm_activity_log").select("*").order("created_at", { ascending: false });
        if (lead_id) query = query.eq("lead_id", lead_id);
        const { data, error } = await query;
        if (error) return errorResponse(corsHeaders, error.message);
        return jsonResponse(corsHeaders, { success: true, data });
      }
      case "activity_insert": {
        const { payload } = params;
        if (!payload || !payload.tipo || !payload.descricao) return errorResponse(corsHeaders, "Campos obrigatórios faltando");
        const { data, error } = await supabase.from("crm_activity_log").insert(payload).select().single();
        if (error) return errorResponse(corsHeaders, error.message);
        return jsonResponse(corsHeaders, { success: true, data });
      }
      default:
        return errorResponse(corsHeaders, "Ação desconhecida", 400);
    }
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});

function jsonResponse(corsHeaders: Record<string, string>, data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(corsHeaders: Record<string, string>, message: string, status = 400) {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
