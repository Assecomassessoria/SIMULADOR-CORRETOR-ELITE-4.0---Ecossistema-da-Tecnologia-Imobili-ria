// Backend isolado para a Evolution API (auto-hospedada).
// O front NUNCA recebe a EVOLUTION_API_URL nem a EVOLUTION_API_KEY.
// Ações suportadas: "connect" (cria instância + devolve QR), "status", "disconnect".

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      hostname.endsWith(".lovableproject.com") ||
      hostname === "localhost"
    );
  } catch {
    return false;
  }
}

function corsFor(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin(origin) ? origin : "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function json(body: unknown, cors: Record<string, string>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function slugify(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48) || "corretor";
}

async function evo(
  baseUrl: string,
  apiKey: string,
  path: string,
  method: "GET" | "POST" | "DELETE" = "GET",
  body?: unknown,
) {
  const url = `${baseUrl.replace(/\/+$/, "")}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "apikey": apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
  const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    return json(
      { error: "Evolution API não configurada no servidor." },
      cors,
      500,
    );
  }

  let body: { action?: string; identifier?: string } = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "JSON inválido" }, cors, 400);
  }

  const { action, identifier } = body;
  if (!action || !identifier) {
    return json({ error: "action e identifier são obrigatórios" }, cors, 400);
  }

  // Logger de tentativas (não bloqueia a resposta)
  const logAttempt = async (resultState: string, success: boolean) => {
    try {
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await admin.from("whatsapp_connection_attempts").insert({
        identifier: String(identifier).toLowerCase().slice(0, 200),
        action: String(action).slice(0, 40),
        result_state: resultState.slice(0, 40),
        success,
      });
    } catch (e) {
      console.error("logAttempt error:", e);
    }
  };

  // Opcional: identificar usuário logado (não obrigatório - o identifier basta)
  try {
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    }
  } catch { /* identidade opcional */ }

  const instanceName = `elite-${slugify(identifier)}`;

  try {
    // --------------- STATUS ---------------
    if (action === "status") {
      const r = await evo(
        EVOLUTION_API_URL,
        EVOLUTION_API_KEY,
        `/instance/connectionState/${encodeURIComponent(instanceName)}`,
      );
      if (r.status === 404) return json({ state: "not_created" }, cors);
      if (!r.ok) return json({ state: "error", details: r.data }, cors);
      // Evolution v2: { instance: { instanceName, state: "open"|"connecting"|"close" } }
      const state = (r.data as any)?.instance?.state ?? "unknown";
      return json({ state, instanceName }, cors);
    }

    // --------------- CONNECT (cria instância se necessário e devolve QR) ---------------
    if (action === "connect") {
      // Registra tentativa
      void logAttempt("attempt", false);
      // 1) Cria a instância (idempotente: ignora se já existe)
      const create = await evo(
        EVOLUTION_API_URL,
        EVOLUTION_API_KEY,
        "/instance/create",
        "POST",
        {
          instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
        },
      );

      // Se já existe, Evolution responde 403/409 - tudo bem, segue para pegar o QR
      if (create.ok && (create.data as any)?.qrcode?.base64) {
        const qr = (create.data as any).qrcode;
        return json(
          { qr: qr.base64, code: qr.code, instanceName, state: "qr" },
          cors,
        );
      }

      // 2) Busca QR via /instance/connect
      const conn = await evo(
        EVOLUTION_API_URL,
        EVOLUTION_API_KEY,
        `/instance/connect/${encodeURIComponent(instanceName)}`,
      );

      if (!conn.ok) {
        return json(
          { error: "Falha ao iniciar conexão", details: conn.data },
          cors,
          conn.status || 500,
        );
      }

      const d = conn.data as any;
      // Já conectada
      if (d?.instance?.state === "open") {
        return json({ state: "open", instanceName }, cors);
      }
      // QR disponível (formato pode vir como base64 direto OU dentro de qrcode)
      const base64 = d?.base64 || d?.qrcode?.base64 || null;
      const code = d?.code || d?.qrcode?.code || null;
      if (base64) {
        return json({ qr: base64, code, instanceName, state: "qr" }, cors);
      }

      return json(
        { state: "pending", instanceName, raw: d },
        cors,
      );
    }

    // --------------- DISCONNECT ---------------
    if (action === "disconnect") {
      await evo(
        EVOLUTION_API_URL,
        EVOLUTION_API_KEY,
        `/instance/logout/${encodeURIComponent(instanceName)}`,
        "DELETE",
      );
      return json({ ok: true }, cors);
    }

    return json({ error: `Ação desconhecida: ${action}` }, cors, 400);
  } catch (err) {
    console.error("whatsapp-evolution error:", err);
    return json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      cors,
      500,
    );
  }
});
