// Test endpoint: validates if Google Apps Script POST endpoint is reachable and writes to sheet.
// Open: invoked from admin panel button. No auth required (read-only diagnostic).

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwfxHSWKKoSFf9KjLM-1Z-faqM3Gyn5qcW0mKHdnz6UcMnt3zdXwmEFauazc-noyLRQ/exec";

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
    "Access-Control-Allow-Origin": allowed ? origin : "https://simuladorcorretorelitedemo.lovable.app",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const results: any = {
    url: GOOGLE_SCRIPT_URL,
    timestamp: new Date().toISOString(),
    tests: {},
  };

  // TEST 1: GET (verifies deployment is alive)
  try {
    const getRes = await fetch(GOOGLE_SCRIPT_URL, { method: "GET", redirect: "follow" });
    const getText = await getRes.text();
    results.tests.get = {
      status: getRes.status,
      ok: getRes.ok,
      body: getText.length > 200 ? getText.slice(0, 200) + "..." : getText,
    };
  } catch (e: any) {
    results.tests.get = { error: e.message };
  }

  // TEST 2: POST JSON
  try {
    const payload = {
      aba: "TESTE",
      msg: "test-connection-button",
      timestamp: new Date().toISOString(),
    };
    const postRes = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });
    const postText = await postRes.text();
    let parsed: any = null;
    try { parsed = JSON.parse(postText); } catch { /* not json */ }
    results.tests.post = {
      status: postRes.status,
      ok: postRes.ok,
      isJsonResponse: !!parsed,
      body: parsed ?? (postText.length > 300 ? postText.slice(0, 300) + "..." : postText),
      payload_sent: payload,
    };
  } catch (e: any) {
    results.tests.post = { error: e.message };
  }

  // Summary
  const postOk = results.tests.post?.ok && results.tests.post?.isJsonResponse;
  results.summary = {
    success: !!postOk,
    message: postOk
      ? "✅ POST funcionando! Apps Script aceita escrita na planilha."
      : `❌ POST falhou (HTTP ${results.tests.post?.status}). ${
          results.tests.get?.ok
            ? "GET funciona mas POST não — doPost() não está implantado nesta versão. Crie NOVA implantação no Apps Script (não 'Editar')."
            : "Apps Script inacessível."
        }`,
  };

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
