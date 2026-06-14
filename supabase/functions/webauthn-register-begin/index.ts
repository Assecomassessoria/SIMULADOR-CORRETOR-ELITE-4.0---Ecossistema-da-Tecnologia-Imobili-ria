/**
 * webauthn-register-begin
 * Generates registration options for a new biometric credential.
 * Caller must already be authenticated by password/PIN (we trust the client to send a verified email).
 * Eligibility (definitiva/master plan) is the broker's responsibility — gated in frontend UI.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateRegistrationOptions } from "npm:@simplewebauthn/server@10.0.1";
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

    const { email, device_name } = await req.json();
    if (!email || typeof email !== "string" || email.length > 255) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const normalizedEmail = email.trim().toLowerCase();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Opportunistic cleanup of expired challenges
    await supabase
      .from("webauthn_challenges")
      .delete()
      .lt("expires_at", new Date().toISOString());


    // Exclude credentials already registered for this user/domain
    const { data: existing } = await supabase
      .from("webauthn_credentials")
      .select("credential_id, transports")
      .eq("rp_id", rpID)
      .ilike("email", normalizedEmail);

    const excludeCredentials = (existing || []).map((c: any) => ({
      id: c.credential_id,
      transports: c.transports ? c.transports.split(",") : undefined,
    }));

    const options = await generateRegistrationOptions({
      rpName: "Simulador Corretor de Elite 4.0",
      rpID,
      userName: normalizedEmail,
      userDisplayName: device_name || normalizedEmail,
      attestationType: "none",
      excludeCredentials,
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
        authenticatorAttachment: "platform", // prefer Face ID / Touch ID / Windows Hello
      },
      supportedAlgorithmIDs: [-7, -257],
    });

    // Persist challenge (5 min TTL)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await supabase.from("webauthn_challenges").insert({
      email: normalizedEmail,
      challenge: options.challenge,
      challenge_type: "registration",
      rp_id: rpID,
      expires_at: expiresAt,
    });

    return new Response(JSON.stringify({ options }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[webauthn-register-begin]", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
