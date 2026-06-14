/**
 * webauthn-register-finish
 * Verifies the registration response and persists the new credential.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyRegistrationResponse } from "npm:@simplewebauthn/server@10.0.1";
import { isoBase64URL } from "npm:@simplewebauthn/server@10.0.1/helpers";
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

    const { email, response, device_name } = await req.json();
    if (!email || !response) {
      return new Response(JSON.stringify({ error: "Missing email or response" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const normalizedEmail = String(email).trim().toLowerCase();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Retrieve most recent challenge
    const { data: challengeRow } = await supabase
      .from("webauthn_challenges")
      .select("id, challenge, expires_at")
      .ilike("email", normalizedEmail)
      .eq("rp_id", rpID)
      .eq("challenge_type", "registration")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!challengeRow || new Date(challengeRow.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Challenge expired or not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return new Response(JSON.stringify({ error: "Verification failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;
    const credentialIdB64 = isoBase64URL.fromBuffer(credentialID);
    const publicKeyB64 = isoBase64URL.fromBuffer(credentialPublicKey);
    const transports = Array.isArray(response.response?.transports)
      ? response.response.transports.join(",")
      : null;

    await supabase.from("webauthn_credentials").insert({
      email: normalizedEmail,
      credential_id: credentialIdB64,
      public_key: publicKeyB64,
      counter,
      transports,
      rp_id: rpID,
      device_name: device_name || null,
    });

    // Cleanup used challenge
    await supabase.from("webauthn_challenges").delete().eq("id", challengeRow.id);

    return new Response(JSON.stringify({ success: true, credential_id: credentialIdB64 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[webauthn-register-finish]", e);
    return new Response(JSON.stringify({ error: "Internal error", detail: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
