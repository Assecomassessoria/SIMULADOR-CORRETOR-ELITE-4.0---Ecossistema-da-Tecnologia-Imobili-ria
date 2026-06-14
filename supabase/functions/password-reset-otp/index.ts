import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  try {
    const { hostname, protocol } = new URL(origin);
    return (
      (protocol === "https:" || protocol === "http:") &&
      (hostname === "assecomassessoria.net.br" ||
        hostname === "www.assecomassessoria.net.br" ||
      hostname.endsWith(".simuladorcorretorelite.com.br") ||
      hostname === "simuladorcorretorelite.com.br" ||
        hostname.endsWith(".lovable.app") ||
        hostname.endsWith(".lovableproject.com"))
    );
  } catch {
    return false;
  }
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin(origin) ? origin : "https://assecomassessoria.net.br",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwfxHSWKKoSFf9KjLM-1Z-faqM3Gyn5qcW0mKHdnz6UcMnt3zdXwmEFauazc-noyLRQ/exec";

const getSupabaseAdmin = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function json(body: unknown, corsHeaders: Record<string, string>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function generateOtp(): string {
  // 6-digit numeric code
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(buf[0] % 1000000).padStart(6, "0");
}

function generateToken(): string {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function userExists(supabase: ReturnType<typeof getSupabaseAdmin>, email: string): Promise<boolean> {
  const e = email.toLowerCase();
  const { data: pin } = await supabase.from("user_pin_access").select("id").eq("email", e).maybeSingle();
  if (pin) return true;
  const { data: corretor } = await supabase.from("corretores").select("id").eq("email", e).maybeSingle();
  if (corretor) return true;
  return false;
}

async function sendOtpEmail(email: string, otp: string) {
  const subject = "Código de Recuperação - Simulador Corretor de Elite 4.0";
  const body = `Olá,\n\nVocê solicitou a recuperação da sua senha de 6 dígitos.\n\nSeu código de verificação é: ${otp}\n\nEste código expira em 10 minutos.\n\nSe você não solicitou esta recuperação, ignore este e-mail.\n\nSimulador Corretor de Elite 4.0`;

  const payload = {
    aba: "PASSWORD_RESET_OTP",
    email,
    otp,
    subject,
    body,
    enviar_email: true,
    timestamp: new Date().toISOString(),
  };

  try {
    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });
    const text = await res.text();
    console.log("[OTP] Apps Script response:", text.slice(0, 300));
  } catch (err) {
    console.error("[OTP] Apps Script error:", err);
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action, email, otp, token, newPin } = body as {
      action: "request" | "verify" | "reset";
      email?: string;
      otp?: string;
      token?: string;
      newPin?: string;
    };

    const supabase = getSupabaseAdmin();

    // ---------- REQUEST ----------
    if (action === "request") {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json({ success: false, error: "E-mail inválido." }, corsHeaders, 400);
      }
      const normEmail = email.toLowerCase();

      // Always respond success to avoid email enumeration; only send if user exists
      const exists = await userExists(supabase, normEmail);
      if (exists) {
        const code = generateOtp();
        const codeHash = await sha256(code);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        // Invalidate previous unused OTPs for this email
        await supabase
          .from("password_reset_otps")
          .update({ used: true })
          .eq("email", normEmail)
          .eq("used", false);

        const { error: insErr } = await supabase.from("password_reset_otps").insert({
          email: normEmail,
          otp_hash: codeHash,
          expires_at: expiresAt,
        });
        if (insErr) {
          console.error("[OTP] insert error:", insErr);
          return json({ success: false, error: "Erro ao gerar código." }, corsHeaders, 500);
        }

        await sendOtpEmail(normEmail, code);
      } else {
        console.log("[OTP] request for unknown email:", normEmail);
      }

      return json(
        { success: true, message: "Se o e-mail estiver cadastrado, um código será enviado." },
        corsHeaders,
      );
    }

    // ---------- VERIFY ----------
    if (action === "verify") {
      if (!email || !otp || !/^\d{6}$/.test(otp)) {
        return json({ success: false, error: "E-mail ou código inválido." }, corsHeaders, 400);
      }
      const normEmail = email.toLowerCase();

      const { data: row } = await supabase
        .from("password_reset_otps")
        .select("*")
        .eq("email", normEmail)
        .eq("used", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!row) {
        return json({ success: false, error: "Código não encontrado. Solicite novamente." }, corsHeaders, 400);
      }

      if (new Date(row.expires_at).getTime() < Date.now()) {
        await supabase.from("password_reset_otps").update({ used: true }).eq("id", row.id);
        return json({ success: false, error: "Código expirado. Solicite um novo." }, corsHeaders, 400);
      }

      if (row.attempts >= 5) {
        await supabase.from("password_reset_otps").update({ used: true }).eq("id", row.id);
        return json({ success: false, error: "Muitas tentativas. Solicite um novo código." }, corsHeaders, 400);
      }

      const otpHash = await sha256(otp);
      if (otpHash !== row.otp_hash) {
        await supabase
          .from("password_reset_otps")
          .update({ attempts: row.attempts + 1 })
          .eq("id", row.id);
        return json({ success: false, error: "Código incorreto." }, corsHeaders, 400);
      }

      // Generate short-lived verification token (15 min) — kept in same row
      const verifyToken = generateToken();
      const newExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await supabase
        .from("password_reset_otps")
        .update({ verified_token: verifyToken, expires_at: newExpires })
        .eq("id", row.id);

      return json({ success: true, token: verifyToken }, corsHeaders);
    }

    // ---------- RESET ----------
    if (action === "reset") {
      if (!email || !token || !newPin || !/^\d{6}$/.test(newPin)) {
        return json({ success: false, error: "Dados inválidos." }, corsHeaders, 400);
      }
      const normEmail = email.toLowerCase();

      const { data: row } = await supabase
        .from("password_reset_otps")
        .select("*")
        .eq("email", normEmail)
        .eq("used", false)
        .eq("verified_token", token)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!row) {
        return json({ success: false, error: "Sessão de redefinição inválida." }, corsHeaders, 400);
      }
      if (new Date(row.expires_at).getTime() < Date.now()) {
        await supabase.from("password_reset_otps").update({ used: true }).eq("id", row.id);
        return json({ success: false, error: "Sessão expirada. Reinicie o processo." }, corsHeaders, 400);
      }

      const bcrypt = await import("https://deno.land/x/bcrypt@v0.4.1/mod.ts");
      const pinHash = await bcrypt.hash(newPin);

      // Update wherever the user exists
      const { data: pinRow } = await supabase
        .from("user_pin_access")
        .select("id")
        .eq("email", normEmail)
        .maybeSingle();

      if (pinRow) {
        await supabase
          .from("user_pin_access")
          .update({ pin_hash: pinHash, is_active: true, updated_at: new Date().toISOString() })
          .eq("id", pinRow.id);
      } else {
        // Try corretores
        const { data: corretor } = await supabase
          .from("corretores")
          .select("id")
          .eq("email", normEmail)
          .maybeSingle();
        if (corretor) {
          await supabase
            .from("corretores")
            .update({ pin_hash: pinHash, updated_at: new Date().toISOString() })
            .eq("id", corretor.id);
        } else {
          // Create new pin_access entry
          await supabase.from("user_pin_access").insert({
            email: normEmail,
            pin_hash: pinHash,
            is_active: true,
          });
        }
      }

      await supabase
        .from("password_reset_otps")
        .update({ used: true, verified_token: null })
        .eq("id", row.id);

      return json({ success: true }, corsHeaders);
    }

    return json({ success: false, error: "Ação desconhecida." }, corsHeaders, 400);
  } catch (err) {
    console.error("password-reset-otp error:", err);
    return json({ success: false, error: "Erro interno." }, getCorsHeaders(req), 500);
  }
});
