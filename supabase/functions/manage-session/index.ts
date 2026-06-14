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

function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, email, session_token, device_fingerprint } = await req.json();

    if (!action || typeof action !== "string" || action.length > 30) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseAdmin();

    switch (action) {
      case "create": {
        if (!email || typeof email !== "string" || email.length > 255) {
          return new Response(
            JSON.stringify({ success: false, error: "Invalid email" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await supabase
          .from("active_sessions")
          .update({ is_active: false })
          .eq("email", email.trim().toLowerCase())
          .eq("is_active", true);

        const token = generateToken();
        const { error } = await supabase.from("active_sessions").insert({
          email: email.trim().toLowerCase(),
          session_token: token,
          device_fingerprint: device_fingerprint || null,
        });

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: "Failed to create session" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, session_token: token }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "validate": {
        if (!session_token || typeof session_token !== "string") {
          console.log("[manage-session] validate: missing token");
          return new Response(
            JSON.stringify({ valid: false }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error: selectError } = await supabase
          .from("active_sessions")
          .select("id, is_active")
          .eq("session_token", session_token)
          .eq("is_active", true)
          .single();

        if (selectError && selectError.code !== "PGRST116") {
          // DB error (not "no rows") — return error so client knows it's transient
          console.log("[manage-session] validate: DB error", selectError.message);
          return new Response(
            JSON.stringify({ valid: true, transient_error: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (data) {
          await supabase
            .from("active_sessions")
            .update({ last_seen_at: new Date().toISOString() })
            .eq("id", data.id);
        }

        console.log("[manage-session] validate:", data ? "valid" : "invalid", "token:", session_token.slice(0, 8) + "...");

        return new Response(
          JSON.stringify({ valid: !!data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "logout": {
        if (!session_token || typeof session_token !== "string") {
          return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await supabase
          .from("active_sessions")
          .update({ is_active: false })
          .eq("session_token", session_token);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Internal error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
