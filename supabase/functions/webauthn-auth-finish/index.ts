/**
 * webauthn-auth-finish
 * Verifies the authentication response, updates counter, and emits a session_token.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyAuthenticationResponse } from "npm:@simplewebauthn/server@10.0.1";
import { isoBase64URL } from "npm:@simplewebauthn/server@10.0.1/helpers";
import { getCorsHeaders, getRpId } from "../_shared/webauthnCors.ts";

function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

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

    const { email, response, device_fingerprint } = await req.json();
    if (!response) {
      return new Response(JSON.stringify({ error: "Missing response" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const normalizedEmail = email ? String(email).trim().toLowerCase() : null;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Locate credential by ID
    const credentialId: string = response.id;
    const { data: credRow } = await supabase
      .from("webauthn_credentials")
      .select("*")
      .eq("rp_id", rpID)
      .eq("credential_id", credentialId)
      .maybeSingle();

    if (!credRow) {
      return new Response(JSON.stringify({ error: "Credential not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const effectiveEmail = normalizedEmail || credRow.email;

    // Get most recent challenge (either keyed by email or "*")
    const { data: challengeRow } = await supabase
      .from("webauthn_challenges")
      .select("id, challenge, expires_at, email")
      .in("email", [effectiveEmail, "*"])
      .eq("rp_id", rpID)
      .eq("challenge_type", "authentication")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!challengeRow || new Date(challengeRow.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Challenge expired or not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Opportunistic cleanup of expired challenges (keeps table lean)
    await supabase
      .from("webauthn_challenges")
      .delete()
      .lt("expires_at", new Date().toISOString());

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: challengeRow.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        authenticator: {
          credentialID: isoBase64URL.toBuffer(credRow.credential_id),
          credentialPublicKey: isoBase64URL.toBuffer(credRow.public_key),
          counter: Number(credRow.counter || 0),
          transports: credRow.transports ? credRow.transports.split(",") : undefined,
        },
        requireUserVerification: false,
      });
    } catch (verifyErr) {
      // simplewebauthn throws if newCounter <= storedCounter (clone/replay attack)
      console.error("[webauthn-auth-finish] verification threw", verifyErr);
      return new Response(
        JSON.stringify({
          error: "Verification failed",
          code: "VERIFY_THROW",
          detail: String(verifyErr),
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!verification.verified) {
      return new Response(JSON.stringify({ error: "Verification failed" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Strict FIDO2 counter check — reject if hardware counter regressed or stalled
    const storedCounter = Number(credRow.counter || 0);
    const newCounter = Number(verification.authenticationInfo.newCounter || 0);
    // Only enforce when the authenticator advertises a real counter (> 0).
    // Some platform authenticators (notably iOS/passkeys synced via iCloud) keep counter at 0 — allowed.
    if (storedCounter > 0 && newCounter <= storedCounter) {
      console.warn(
        `[webauthn-auth-finish] CLONE SUSPECT — stored=${storedCounter} new=${newCounter} cred=${credRow.id}`
      );
      return new Response(
        JSON.stringify({
          error: "Possível clonagem de credencial detectada. Cadastre a biometria novamente.",
          code: "COUNTER_REGRESSION",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update counter + last_used_at
    await supabase
      .from("webauthn_credentials")
      .update({
        counter: newCounter,
        last_used_at: new Date().toISOString(),
      })
      .eq("id", credRow.id);


    // Cleanup challenge
    await supabase.from("webauthn_challenges").delete().eq("id", challengeRow.id);

    // Issue a session_token (same shape as manage-session "create")
    await supabase
      .from("active_sessions")
      .update({ is_active: false })
      .eq("email", effectiveEmail)
      .eq("is_active", true);

    const token = generateToken();
    await supabase.from("active_sessions").insert({
      email: effectiveEmail,
      session_token: token,
      device_fingerprint: device_fingerprint || null,
    });

    return new Response(
      JSON.stringify({ success: true, session_token: token, email: effectiveEmail }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[webauthn-auth-finish]", e);
    return new Response(JSON.stringify({ error: "Internal error", detail: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
