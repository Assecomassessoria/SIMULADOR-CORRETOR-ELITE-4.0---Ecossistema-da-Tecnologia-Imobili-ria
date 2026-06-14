import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwfxHSWKKoSFf9KjLM-1Z-faqM3Gyn5qcW0mKHdnz6UcMnt3zdXwmEFauazc-noyLRQ/exec";

function getSupabaseAdmin() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { session_token, admin_password, ...payload } = body;

    let authorized = false;

    if (session_token) {
      const supabase = getSupabaseAdmin();
      const { data: session } = await supabase
        .from('active_sessions')
        .select('id')
        .eq('session_token', session_token)
        .eq('is_active', true)
        .single();
      if (session) authorized = true;
    }

    if (!authorized && admin_password) {
      const demoAdmPasswords = [
        Deno.env.get("CREDENTIAL_DEMOADM") || "",
        Deno.env.get("CREDENTIAL_DEMOADM_ALT") || "",
      ].filter(Boolean);
      if (demoAdmPasswords.includes(admin_password)) authorized = true;
    }

    if (!authorized) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("Sending to Google Sheets, aba:", payload.aba || "unknown");

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    const text = await response.text();

    let result;
    try {
      result = JSON.parse(text);
    } catch {
      result = { raw: text, status: response.status };
    }

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error:", msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
