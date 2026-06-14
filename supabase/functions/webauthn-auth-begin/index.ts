/**
 * webauthn-auth-begin
 * Generates authentication options. Email is optional —
 * if provided, restricts allowed credentials to that user's registered keys for this domain.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateAuthenticationOptions } from "npm:@simplewebauthn/server@10.0.1";
import { getCorsHeaders, getRpId } from "../_shared/webauthnCors.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const origin = req.headers.get("origin") || "";
    const rpID = getRpId(origin);
    if (!rpID) {
      return new Response(JSON.stringify({ error: "Origin not allowed" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email } = await req.json().catch(() => ({}));
    const normalizedEmail = email ? String(email).trim().toLowerCase() : null;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Opportunistic cleanup of expired challenges
    await supabase
      .from("webauthn_challenges")
      .delete()
      .lt("expires_at", new Date().toISOString());


    let allowCredentials: { id: string; transports?: AuthenticatorTransport[] }[] = [];
    if (normalizedEmail) {
      const { data: creds } = await supabase
        .from("webauthn_credentials")
        .select("credential_id, transports")
        .eq("rp_id", rpID)
        .ilike("email", normalizedEmail);

      if (!creds || creds.length === 0) {
        return new Response(
          JSON.stringify({ error: "No credentials registered for this user on this domain" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      allowCredentials = creds.map((c: any) => ({
        id: c.credential_id,
        transports: c.transports ? (c.transports.split(",") as AuthenticatorTransport[]) : undefined,
      }));
    }

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: "preferred",
      allowCredentials,
    });

    // Persist challenge keyed by email (or "*" for discoverable credentials)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await supabase.from("webauthn_challenges").insert({
      email: normalizedEmail || "*",
      challenge: options.challenge,
      challenge_type: "authentication",
      rp_id: rpID,
      expires_at: expiresAt,
    });

    return new Response(JSON.stringify({ options }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[webauthn-auth-begin]", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
