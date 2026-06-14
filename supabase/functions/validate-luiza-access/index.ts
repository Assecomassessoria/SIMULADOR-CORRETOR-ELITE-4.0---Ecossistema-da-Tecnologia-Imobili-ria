// Validates the Luiza Elite hub access password against env-stored secret.
// Avoids exposing the password in the client bundle.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalize(s: string): string {
  return (s || "").replace(/[\.\-\s]/g, "").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { password } = await req.json().catch(() => ({}));
    const expected = Deno.env.get("LUIZA_ELITE_PASSWORD") || "";
    const masterFallback = Deno.env.get("CREDENCIAL_SENHA_GERAL") || "";
    const valid =
      !!password &&
      ((expected && normalize(password) === normalize(expected)) ||
        (masterFallback && normalize(password) === normalize(masterFallback)));
    return new Response(JSON.stringify({ valid: !!valid }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ valid: false }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
