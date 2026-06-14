// Diagnostic: tests Meta Graph API connectivity for WhatsApp Cloud API or Facebook/Instagram.
// Invoked from admin panel buttons. Read-only.

const GRAPH = "https://graph.facebook.com/v19.0";

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== "https:" && protocol !== "http:") return false;
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
    "Access-Control-Allow-Origin": allowed ? origin : "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let target: "whatsapp" | "facebook" = "facebook";
  try {
    const body = await req.json();
    if (body?.target === "whatsapp") target = "whatsapp";
  } catch { /* default */ }

  const results: any = { target, timestamp: new Date().toISOString(), tests: {} };

  if (target === "whatsapp") {
    const TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN") || Deno.env.get("META_ACCESS_TOKEN") || Deno.env.get("TOKEN_CLIENTE_DO_SEU_APP");
    const PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") || Deno.env.get("WHATSAPP_PHONE_ID");

    results.tests.envCheck = {
      hasToken: !!TOKEN,
      hasPhoneNumberId: !!PHONE_ID,
    };

    if (!TOKEN || !PHONE_ID) {
      results.summary = {
        success: false,
        message: `❌ Credenciais ausentes. Configure os secrets: ${!TOKEN ? "WHATSAPP_ACCESS_TOKEN " : ""}${!PHONE_ID ? "WHATSAPP_PHONE_NUMBER_ID" : ""}`.trim(),
      };
      return new Response(JSON.stringify(results, null, 2), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const r = await fetch(`${GRAPH}/${PHONE_ID}?fields=id,display_phone_number,verified_name`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      const data = await r.json();
      results.tests.phoneNumberInfo = { status: r.status, ok: r.ok, data };
      results.summary = {
        success: r.ok,
        message: r.ok
          ? `✅ WhatsApp Cloud API conectado! Número: ${data.display_phone_number || data.id}`
          : `❌ Falha (HTTP ${r.status}): ${data?.error?.message || "Token inválido ou Phone ID errado"}`,
      };
    } catch (e: any) {
      results.tests.phoneNumberInfo = { error: e.message };
      results.summary = { success: false, message: `❌ Erro de rede: ${e.message}` };
    }
  } else {
    const TOKEN = Deno.env.get("META_ACCESS_TOKEN") || Deno.env.get("FACEBOOK_ACCESS_TOKEN") || Deno.env.get("TOKEN_CLIENTE_DO_SEU_APP");
    const APP_ID = Deno.env.get("FACEBOOK_APP_ID") || Deno.env.get("ID_DO_SEU_APP") || Deno.env.get("fbID_DO_SEU_APP");
    const IG_USER_ID = Deno.env.get("IG_USER_ID") || Deno.env.get("INSTAGRAM_USER_ID");

    results.tests.envCheck = {
      hasAccessToken: !!TOKEN,
      hasAppId: !!APP_ID,
      hasIgUserId: !!IG_USER_ID,
    };

    if (!TOKEN) {
      results.summary = {
        success: false,
        message: "❌ Token Meta ausente. Configure o secret META_ACCESS_TOKEN.",
      };
      return new Response(JSON.stringify(results, null, 2), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Test 1: token validity via /me
    try {
      const r = await fetch(`${GRAPH}/me?fields=id,name`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      const data = await r.json();
      results.tests.tokenIdentity = { status: r.status, ok: r.ok, data };
    } catch (e: any) {
      results.tests.tokenIdentity = { error: e.message };
    }

    // Test 2: pages access
    try {
      const r = await fetch(`${GRAPH}/me/accounts?fields=name,id,instagram_business_account`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      const data = await r.json();
      results.tests.pages = { status: r.status, ok: r.ok, count: data?.data?.length || 0, data: data?.data?.slice(0, 3) };
    } catch (e: any) {
      results.tests.pages = { error: e.message };
    }

    // Test 3: Instagram if available
    if (IG_USER_ID) {
      try {
        const r = await fetch(`${GRAPH}/${IG_USER_ID}?fields=id,username,name`, {
          headers: { Authorization: `Bearer ${TOKEN}` },
        });
        const data = await r.json();
        results.tests.instagram = { status: r.status, ok: r.ok, data };
      } catch (e: any) {
        results.tests.instagram = { error: e.message };
      }
    }

    const tokenOk = results.tests.tokenIdentity?.ok;
    const pagesOk = results.tests.pages?.ok;
    const igOk = !IG_USER_ID || results.tests.instagram?.ok;
    const success = tokenOk && pagesOk && igOk;
    results.summary = {
      success,
      message: success
        ? `✅ Facebook/Instagram conectado! ${results.tests.pages?.count || 0} página(s) acessível(is)${results.tests.instagram?.data?.username ? `, IG: @${results.tests.instagram.data.username}` : ""}.`
        : `❌ Falha: ${!tokenOk ? "token inválido" : !pagesOk ? "sem permissão pages_show_list" : "Instagram não acessível"}.`,
    };
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
