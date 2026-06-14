// Edge Function: audit-report-link
// Gera um link assinado para download do Relatório de Auditoria, Conformidade
// e Segurança, com validade definida pelo solicitante.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { PDF_BASE64, PDF_FILENAME } from "./asset.ts";

const ALLOWED_ORIGINS = new Set([
  "https://assecomassessoria.net.br",
  "https://www.assecomassessoria.net.br",
  "https://simuladorelite.simuladorcorretorelite.com.br",
  "https://www.simuladorelite.simuladorcorretorelite.com.br",
  "https://simuladorhabitacional.simuladorcorretorelite.com.br",
  "https://www.simuladorhabitacional.simuladorcorretorelite.com.br",
  "https://acessocorrelite-simuladorcorretorelite-com-br.lovable.app",
]);

function cors(origin: string | null) {
  const allow =
    origin && (ALLOWED_ORIGINS.has(origin) || origin.endsWith(".lovable.app"))
      ? origin
      : "*";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, authorization, apikey",
    "Content-Type": "application/json",
  };
}

const BUCKET = "relatorios-auditoria";
const OBJECT_PATH = "current/" + PDF_FILENAME;
const MAX_EXPIRES = 60 * 60 * 24 * 365; // 1 ano
const MIN_EXPIRES = 60; // 1 minuto

function b64ToBytes(b64: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

Deno.serve(async (req) => {
  const headers = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers });

  try {
    let expiresIn = 60 * 60 * 24 * 7; // default 7 dias
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const raw = Number(body?.expiresIn);
      if (Number.isFinite(raw) && raw > 0) {
        expiresIn = Math.min(MAX_EXPIRES, Math.max(MIN_EXPIRES, Math.floor(raw)));
      }
    } else {
      const url = new URL(req.url);
      const raw = Number(url.searchParams.get("expiresIn"));
      if (Number.isFinite(raw) && raw > 0) {
        expiresIn = Math.min(MAX_EXPIRES, Math.max(MIN_EXPIRES, Math.floor(raw)));
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Garante que o PDF esteja no bucket (upsert)
    const bytes = b64ToBytes(PDF_BASE64);
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(OBJECT_PATH, bytes, {
        contentType: "application/pdf",
        upsert: true,
      });
    if (upErr) throw upErr;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(OBJECT_PATH, expiresIn, { download: PDF_FILENAME });
    if (error) throw error;

    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    return new Response(
      JSON.stringify({
        url: data.signedUrl,
        filename: PDF_FILENAME,
        expiresIn,
        expiresAt,
      }),
      { headers },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e?.message ?? e) }),
      { status: 500, headers },
    );
  }
});
