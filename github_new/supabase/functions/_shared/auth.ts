// Shared admin password validation for edge functions.
// All credentials come from env vars — no hardcoded fallbacks.

function normalize(s: string): string {
  return (s || "").replace(/[\.\-\s]/g, "").trim();
}

/**
 * Validate an "admin / master" password against env-stored credentials.
 * Returns true if the provided password matches any configured admin secret.
 */
export function validateAdminPassword(password: string): boolean {
  if (!password) return false;
  const candidates = [
    Deno.env.get("CREDENTIAL_MASTER"),
    Deno.env.get("CREDENTIAL_MASTER_ALT"),
    Deno.env.get("CREDENCIAL_EMAIL_GERAL"),
    Deno.env.get("CREDENCIAL_SENHA_GERAL"),
    Deno.env.get("CREDENTIAL_PAINEL_COMERCIAL"),
  ];
  const np = normalize(password);
  return candidates.some((c) => c && normalize(c) === np);
}

export { normalize };
