import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- CORS ---

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
  const allowed = isAllowedOrigin(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "https://assecomassessoria.net.br",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

// --- Helpers ---

const getSupabaseAdmin = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalize(s: string): string {
  return s.replace(/[\.\-\s]/g, "").trim();
}

function json(body: unknown, corsHeaders: Record<string, string>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// --- Credentials from environment (no hardcoded fallbacks) ---
function getCredentials() {
  return {
    master: Deno.env.get("CREDENTIAL_MASTER") || "",
    masterAlt: Deno.env.get("CREDENTIAL_MASTER_ALT") || "",
    demoadm: Deno.env.get("CREDENTIAL_DEMOADM") || "",
    demoadmAlt: Deno.env.get("CREDENTIAL_DEMOADM_ALT") || "",
    manutencao: Deno.env.get("CREDENTIAL_MANUTENCAO") || "",
    painelComercial: Deno.env.get("CREDENTIAL_PAINEL_COMERCIAL") || "",
    reset: Deno.env.get("CREDENTIAL_RESET") || "",
    removePhoto: Deno.env.get("CREDENTIAL_REMOVE_PHOTO") || "",
    demoVendas: Deno.env.get("CREDENTIAL_DEMOVENDAS") || "",
    generalEmail:
      Deno.env.get("CREDENTIAL_GENERAL_EMAIL") ||
      Deno.env.get("CREDENCIAL_EMAIL_GERAL") ||
      "",
    generalPassword: Deno.env.get("CREDENCIAL_SENHA_GERAL") || "",
    adminPanelPassword:
      Deno.env.get("CREDENTIAL_ADMIN_PANEL") ||
      Deno.env.get("ADMIN_PASSWORD") ||
      "",
  };
}

// --- Main ---

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Corpo da requisição inválido ou ausente" }, corsHeaders, 400);
    }

    const { action, password, email, description } = body;

    // --- Ad generation (kept for backwards compat) ---
    if (action === "generate") {
      if (!description || description.trim().length < 5) {
        return json({ error: "Descrição obrigatória (mín. 5 caracteres)" }, corsHeaders, 400);
      }
      const ad = `🔥 OPORTUNIDADE: ${description}\n\nEntre em contato para mais detalhes!`;
      return json({ valid: true, ad }, corsHeaders);
    }

    if (!password) {
      return json({ valid: false, accessLevel: "" }, corsHeaders);
    }

    const creds = getCredentials();
    const supabase = getSupabaseAdmin();
    const normalizedPwd = normalize(password);

    // Helper: load dynamic admin password (changeable via UI)
    async function getDynamicAdminPwd(): Promise<string> {
      const { data } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "admin_password")
        .maybeSingle();
      return data?.value || "";
    }
    const dynamicAdmin = await getDynamicAdminPwd();
    const matchesDynamicAdmin = dynamicAdmin && normalize(password) === normalize(dynamicAdmin);

    // ACTION: change_admin_password — requires current admin password
    if (action === "change_admin_password") {
      const { current_password, new_password } = body;
      const currentValid =
        normalize(current_password) === normalize(creds.master) ||
        normalize(current_password) === normalize(creds.masterAlt) ||
        normalize(current_password) === normalize(creds.painelComercial) ||
        (dynamicAdmin && normalize(current_password) === normalize(dynamicAdmin));
      if (!currentValid) {
        return json({ valid: false, error: "Senha atual incorreta" }, corsHeaders, 401);
      }
      if (!new_password || String(new_password).length < 6) {
        return json({ valid: false, error: "Nova senha deve ter pelo menos 6 caracteres" }, corsHeaders, 400);
      }
      const { error: upErr } = await supabase
        .from("system_settings")
        .upsert({ key: "admin_password", value: String(new_password), updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (upErr) {
        return json({ valid: false, error: "Erro ao atualizar senha" }, corsHeaders, 500);
      }
      return json({ valid: true }, corsHeaders);
    }

    // =====================================================
    // ACTION: login
    // =====================================================
    if (action === "login") {
      // 1) Master password (or dynamic admin)
      if (matchesDynamicAdmin || normalizedPwd === normalize(creds.master) || normalizedPwd === normalize(creds.masterAlt) || (creds.generalPassword && normalizedPwd === normalize(creds.generalPassword))) {
        return json({ valid: true, accessLevel: "master" }, corsHeaders);
      }

      // 2) Demo ADM
      if (password === creds.demoadm || password === creds.demoadmAlt) {
        return json({ valid: true, accessLevel: "demoadm" }, corsHeaders);
      }

      // 3) Demo Vendas
      if (password === creds.demoVendas) {
        return json({ valid: true, accessLevel: "demovendas" }, corsHeaders);
      }

      // 4) ELITE license (ELITE-XXXXXXXX format or direct match in demo_licenses)
      const pwdHash = await sha256(password);
      const { data: licenseData } = await supabase
        .from("demo_licenses")
        .select("*")
        .or(`senha.eq.${password},senha.eq.${pwdHash}`)
        .limit(1)
        .maybeSingle();

      if (licenseData) {
        if (licenseData.status !== "Ativo") {
          return json({ valid: false, accessLevel: "inactive" }, corsHeaders);
        }
        const expDate = new Date(licenseData.data_expiracao);
        const now = new Date();
        if (expDate < now) {
          return json({ valid: false, accessLevel: "expired" }, corsHeaders);
        }
        const diasRestantes = Math.max(0, Math.ceil((expDate.getTime() - now.getTime()) / 86400000));
        return json({ valid: true, accessLevel: "elite_demo", diasRestantes }, corsHeaders);
      }

      // 5) Cadastro comercial (commercial license)
      const { data: comercialData } = await supabase
        .from("cadastro_comercial")
        .select("*")
        .or(`senha.eq.${password},senha.eq.${pwdHash}`)
        .eq("status", "Ativo")
        .limit(1)
        .maybeSingle();

      if (comercialData) {
        const expDate = comercialData.data_expiracao ? new Date(comercialData.data_expiracao) : null;
        if (expDate && expDate < new Date()) {
          return json({ valid: false, accessLevel: "expired" }, corsHeaders);
        }
        return json({ valid: true, accessLevel: "comercial" }, corsHeaders);
      }

      return json({ valid: false, accessLevel: "" }, corsHeaders);
    }

    // =====================================================
    // ACTION: admin
    // =====================================================
    if (action === "admin") {
      const adminPwd = creds.adminPanelPassword || creds.master;
      const valid = !!adminPwd && normalize(password) === normalize(adminPwd);
      return json({ valid, accessLevel: valid ? "admin" : "" }, corsHeaders);
    }

    // =====================================================
    // ACTION: master_validate
    // =====================================================
    if (action === "master_validate") {
      const valid =
        matchesDynamicAdmin ||
        normalizedPwd === normalize(creds.master) ||
        normalizedPwd === normalize(creds.masterAlt);
      return json({ valid, accessLevel: valid ? "master" : "" }, corsHeaders);
    }

    // =====================================================
    // ACTION: demoadm
    // =====================================================
    if (action === "demoadm") {
      const valid = password === creds.demoadm || password === creds.demoadmAlt || matchesDynamicAdmin;
      return json({ valid, accessLevel: valid ? "demoadm" : "" }, corsHeaders);
    }

    // =====================================================
    // ACTION: painel_comercial
    // =====================================================
    if (action === "painel_comercial") {
      const valid =
        matchesDynamicAdmin ||
        normalizedPwd === normalize(creds.painelComercial) ||
        normalizedPwd === normalize(creds.master) ||
        normalizedPwd === normalize(creds.masterAlt);
      return json({ valid, accessLevel: valid ? "painel_comercial" : "" }, corsHeaders);
    }

    // =====================================================
    // ACTION: general_access (admin password + email confirmation)
    // =====================================================
    if (action === "general_access") {
      if (!email) {
        return json({ valid: false, accessLevel: "email_required" }, corsHeaders);
      }
      const validPwd =
        matchesDynamicAdmin ||
        normalizedPwd === normalize(creds.painelComercial) ||
        normalizedPwd === normalize(creds.master) ||
        normalizedPwd === normalize(creds.masterAlt) ||
        (creds.generalPassword && normalizedPwd === normalize(creds.generalPassword));
      const emailLc = (email || "").toLowerCase().trim();
      const allowedEmails = [creds.generalEmail.toLowerCase().trim()].filter(Boolean);
      const validEmail = allowedEmails.includes(emailLc);
      if (validPwd && validEmail) {
        return json({ valid: true, accessLevel: "general_access" }, corsHeaders);
      }
      return json({ valid: false, accessLevel: "" }, corsHeaders);
    }

    // =====================================================
    // ACTION: reset
    // =====================================================
    if (action === "reset") {
      const valid = password === creds.reset;
      return json({ valid, accessLevel: valid ? "reset" : "" }, corsHeaders);
    }

    // =====================================================
    // ACTION: remove_photo
    // =====================================================
    if (action === "remove_photo") {
      const valid = password === creds.removePhoto;
      return json({ valid, accessLevel: valid ? "remove_photo" : "" }, corsHeaders);
    }

    // =====================================================
    // ACTION: check_liberation (bcrypt with SHA-256 legacy fallback)
    // =====================================================
    if (action === "check_liberation") {
      const bcrypt = await import("https://deno.land/x/bcrypt@v0.4.1/mod.ts");
      const legacyHash = await sha256(password);

      // Pull recent unused entries; scan with bcrypt.compare, plus legacy SHA-256 exact match
      const { data: libEntries } = await supabase
        .from("used_liberation_passwords")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      const match = await (async () => {
        for (const row of libEntries || []) {
          if (row.password_hash === legacyHash) return row;
          if (row.password_hash?.startsWith("$2")) {
            try {
              if (bcrypt.compareSync(password, row.password_hash)) return row;
            } catch { /* ignore */ }
          }
        }
        return null;
      })();

      if (!match) return json({ valid: false, accessLevel: "not_registered" }, corsHeaders);
      if (match.is_used) return json({ valid: false, accessLevel: "already_used" }, corsHeaders);
      return json({ valid: true, accessLevel: "liberation_available" }, corsHeaders);
    }

    // =====================================================
    // ACTION: register_liberation (bcrypt only for new entries)
    // =====================================================
    if (action === "register_liberation") {
      const bcrypt = await import("https://deno.land/x/bcrypt@v0.4.1/mod.ts");
      const pwdHash = bcrypt.hashSync(password);
      const { error: insertError } = await supabase.from("used_liberation_passwords").insert({
        password_hash: pwdHash,
        is_used: false,
      });
      if (insertError) {
        console.error("register_liberation insert error:", insertError);
        return json({ valid: false, accessLevel: "error" }, corsHeaders);
      }
      return json({ valid: true, accessLevel: "registered" }, corsHeaders);
    }

    // =====================================================
    // ACTION: use_liberation (bcrypt with SHA-256 legacy fallback)
    // =====================================================
    if (action === "use_liberation") {
      const bcrypt = await import("https://deno.land/x/bcrypt@v0.4.1/mod.ts");
      const legacyHash = await sha256(password);

      const { data: libEntries } = await supabase
        .from("used_liberation_passwords")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      const match = await (async () => {
        for (const row of libEntries || []) {
          if (row.password_hash === legacyHash) return row;
          if (row.password_hash?.startsWith("$2")) {
            try {
              if (bcrypt.compareSync(password, row.password_hash)) return row;
            } catch { /* ignore */ }
          }
        }
        return null;
      })();

      if (!match) return json({ valid: false, accessLevel: "not_registered" }, corsHeaders);
      if (match.is_used) return json({ valid: false, accessLevel: "already_used" }, corsHeaders);

      const { error: updateError } = await supabase
        .from("used_liberation_passwords")
        .update({
          is_used: true,
          used_at: new Date().toISOString(),
          used_by_email: email || null,
        })
        .eq("id", match.id);

      if (updateError) {
        console.error("use_liberation update error:", updateError);
        return json({ valid: false, accessLevel: "error" }, corsHeaders);
      }

      return json({ valid: true, accessLevel: "liberation_used" }, corsHeaders);
    }

    // =====================================================
    // ACTION: register_pin
    // =====================================================
    if (action === "register_pin") {
      if (!email || !password) {
        return json({ valid: false, accessLevel: "missing_data" }, corsHeaders);
      }

      // Use bcrypt for PIN hashing
      const bcrypt = await import("https://deno.land/x/bcrypt@v0.4.1/mod.ts");
      const pinHash = bcrypt.hashSync(password);

      // Upsert into user_pin_access
      const { error: upsertError } = await supabase.from("user_pin_access").upsert(
        {
          email: email.toLowerCase(),
          pin_hash: pinHash,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );

      if (upsertError) {
        console.error("register_pin error:", upsertError);
        return json({ valid: false, accessLevel: "error" }, corsHeaders);
      }

      return json({ valid: true, accessLevel: "pin_registered" }, corsHeaders);
    }

    // =====================================================
    // ACTION: pin_login
    // =====================================================
    if (action === "pin_login") {
      if (!email || !password) {
        return json({ valid: false, accessLevel: "" }, corsHeaders);
      }

      const { data: pinData } = await supabase
        .from("user_pin_access")
        .select("*")
        .eq("email", email.toLowerCase())
        .eq("is_active", true)
        .maybeSingle();

      if (!pinData) {
        // Also check corretores table
        const { data: corretorData } = await supabase
          .from("corretores")
          .select("*")
          .eq("email", email.toLowerCase())
          .eq("status", "ativo")
          .maybeSingle();

        if (!corretorData) {
          return json({ valid: false, accessLevel: "" }, corsHeaders);
        }

        const bcrypt = await import("https://deno.land/x/bcrypt@v0.4.1/mod.ts");
        const pinMatch = bcrypt.compareSync(password, corretorData.pin_hash);
        if (!pinMatch) {
          return json({ valid: false, accessLevel: "" }, corsHeaders);
        }

        return json({ valid: true, accessLevel: "corretor" }, corsHeaders);
      }

      const bcrypt = await import("https://deno.land/x/bcrypt@v0.4.1/mod.ts");
      const pinMatch = bcrypt.compareSync(password, pinData.pin_hash);
      if (!pinMatch) {
        return json({ valid: false, accessLevel: "" }, corsHeaders);
      }

      // Update last login
      await supabase
        .from("user_pin_access")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", pinData.id);

      return json({ valid: true, accessLevel: "user" }, corsHeaders);
    }

    // =====================================================
    // ACTION: get_my_roles (RBAC) — requires Authorization header with Supabase JWT
    // Returns the app_role[] of the authenticated user. Falls back to [] if none.
    // =====================================================
    if (action === "get_my_roles") {
      const authHeader = req.headers.get("Authorization") || "";
      const token = authHeader.replace(/^Bearer\s+/i, "");
      if (!token) {
        return json({ valid: false, roles: [], reason: "missing_token" }, corsHeaders, 401);
      }
      const { data: userData, error: userErr } = await supabase.auth.getUser(token);
      if (userErr || !userData?.user) {
        return json({ valid: false, roles: [], reason: "invalid_token" }, corsHeaders, 401);
      }
      const { data: rolesData, error: rolesErr } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id);
      if (rolesErr) {
        console.error("get_my_roles error:", rolesErr);
        return json({ valid: false, roles: [], reason: "query_error" }, corsHeaders, 500);
      }
      const roles = (rolesData || []).map((r: any) => r.role);
      return json({ valid: true, roles, user_id: userData.user.id }, corsHeaders);
    }

    // Default: unknown action
    return json({ valid: false, accessLevel: "" }, corsHeaders);
  } catch (err) {
    console.error("validate-password error:", err);
    return json({ error: "Erro interno no servidor" }, getCorsHeaders(req), 500);
  }
});
