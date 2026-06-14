// Shared CORS helper for WebAuthn edge functions.
// Allows the 4 production domains + Lovable previews.

export function isAllowedOrigin(origin: string): boolean {
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
      hostname.endsWith(".lovableproject.com") ||
      hostname === "localhost" ||
      hostname === "127.0.0.1"
    );
  } catch {
    return false;
  }
}

export function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowed = isAllowedOrigin(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "https://simuladorcorretorelite.com.br",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

/**
 * RP ID derived from origin hostname.
 * Independent registration per domain (no SSO) → return the hostname as-is.
 */
export function getRpId(origin: string): string | null {
  if (!isAllowedOrigin(origin)) return null;
  try {
    return new URL(origin).hostname;
  } catch {
    return null;
  }
}
