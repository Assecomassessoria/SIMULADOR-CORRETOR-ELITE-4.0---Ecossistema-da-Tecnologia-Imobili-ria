import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  try {
    const { hostname, protocol } = new URL(origin);
    const isHttp = protocol === "https:" || protocol === "http:";
    if (!isHttp) return false;
    return (
      hostname === "assecomassessoria.net.br" ||
      hostname === "www.assecomassessoria.net.br" ||
      hostname.endsWith(".simuladorcorretorelite.com.br") ||
      hostname === "simuladorcorretorelite.com.br" ||
      hostname.endsWith(".lovable.app") ||
      hostname.endsWith(".lovableproject.com")
    );
  } catch {
    return false;
  }
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowed = isAllowedOrigin(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "https://simuladorcorretorelitedemo.lovable.app",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-admin-password, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwfxHSWKKoSFf9KjLM-1Z-faqM3Gyn5qcW0mKHdnz6UcMnt3zdXwmEFauazc-noyLRQ/exec";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { admin_password, tipo_cadastro } = body;

    const demoAdmPasswords = [
      Deno.env.get("CREDENTIAL_DEMOADM") || "",
      Deno.env.get("CREDENTIAL_DEMOADM_ALT") || "",
    ].filter(Boolean);

    const supabase = getSupabaseAdmin();
    const isAdminAuth = admin_password && demoAdmPasswords.includes(admin_password);

    // Marketing signup - send to Google Sheets (no admin auth needed)
    if (tipo_cadastro === "marketing_signup") {
      const { nome, email: mktEmail, senha: mktSenha } = body;
      if (!nome || !mktEmail) {
        return new Response(
          JSON.stringify({ success: false, error: "Nome e Email são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      try {
        const sheetPayload = {
          aba: "MARKETING",
          nome,
          email: mktEmail,
          senha: mktSenha || "",
          data_cadastro: new Date().toLocaleDateString("pt-BR"),
        };
        console.log("Sending marketing signup to Google Sheets...");
        const gsResponse = await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sheetPayload),
          redirect: "follow",
        });
        const gsText = await gsResponse.text();
        console.log("Google Sheets marketing response:", gsText);
      } catch (gsErr) {
        console.error("Google Sheets marketing send error (non-blocking):", gsErr);
      }
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load comercial data (no auth needed for reading, uses service role)
    if (tipo_cadastro === "load_comercial") {
      const { senha_acesso } = body;
      
      // If no senha_acesso provided or it's the master password, don't load any cadastro
      if (!senha_acesso) {
        return new Response(
          JSON.stringify({ success: true, cadastro: null, corretores: [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if this is the master password (should not match any cadastro)
      const painelComercialPass = Deno.env.get("CREDENTIAL_PAINEL_COMERCIAL") || "";
      if (senha_acesso === painelComercialPass) {
        return new Response(
          JSON.stringify({ success: true, cadastro: null, corretores: [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: cadastro } = await supabase
        .from("cadastro_comercial")
        .select("*")
        .eq("senha", senha_acesso)
        .single();

      let corretores: any[] = [];
      if (cadastro) {
        const { data: corretoresData } = await supabase
          .from("corretores")
          .select("*")
          .eq("cadastro_comercial_id", cadastro.id)
          .order("created_at", { ascending: true });
        corretores = corretoresData || [];
      }

      return new Response(
        JSON.stringify({ success: true, cadastro, corretores }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // List all cadastro comercial records
    if (tipo_cadastro === "list_comercial") {
      if (!isAdminAuth) {
        return new Response(
          JSON.stringify({ success: false, error: "Acesso não autorizado" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const { data: comerciais } = await supabase
        .from("cadastro_comercial")
        .select("*")
        .order("created_at", { ascending: false });

      return new Response(
        JSON.stringify({ success: true, data: comerciais || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update comercial status
    if (tipo_cadastro === "comercial_status") {
      if (!isAdminAuth) {
        return new Response(
          JSON.stringify({ success: false, error: "Acesso não autorizado" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const { comercial_id, status } = body;
      const { error: dbError } = await supabase.from("cadastro_comercial")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", comercial_id);

      return new Response(
        JSON.stringify({ success: !dbError, error: dbError?.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For corretor operations, allow special passwords
    const isCorretorOp = tipo_cadastro === "corretor" || tipo_cadastro === "corretor_status";
    const isSpecialOp = isCorretorOp && (admin_password === "__corretor_register__" || admin_password === "__corretor_status__");

    if (!isAdminAuth && !isSpecialOp) {
      return new Response(
        JSON.stringify({ success: false, error: "Acesso não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle commercial registration
    if (tipo_cadastro === "comercial") {
      const {
        razao_social, cpf_cnpj, endereco, bairro, cidade, estado, cep,
        nome_contato, contato, whatsapp, email, plano, plano_label,
        max_usuarios, senha, validade_dias, data_envio, data_expiracao
      } = body;

      if (!razao_social || !senha) {
        return new Response(
          JSON.stringify({ success: false, error: "Campos obrigatórios faltando" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Save to cadastro_comercial table
      const { data: cadastroData, error: dbError } = await supabase.from("cadastro_comercial").insert({
        razao_social,
        cpf_cnpj: cpf_cnpj || null,
        endereco: endereco || null,
        bairro: bairro || null,
        cidade: cidade || null,
        estado: estado || null,
        cep: cep || null,
        nome_contato: nome_contato || null,
        contato: contato || null,
        whatsapp: whatsapp || null,
        email: email || null,
        plano,
        plano_label: plano_label || null,
        max_usuarios: parseInt(max_usuarios) || 5,
        senha,
        validade_dias: parseInt(validade_dias) || 365,
        data_envio: data_envio || null,
        data_expiracao: data_expiracao || null,
      }).select('id').single();

      if (dbError) {
        console.error("DB insert cadastro_comercial error:", dbError.message);
        return new Response(
          JSON.stringify({ success: false, error: dbError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send to Google Sheets - aba COMERCIAL
      try {
        const sheetPayload = {
          aba: "COMERCIAL",
          razao_social,
          cpf_cnpj: cpf_cnpj || "",
          endereco: endereco || "",
          bairro: bairro || "",
          cidade: cidade || "",
          estado: estado || "",
          cep: cep || "",
          nome_contato: nome_contato || "",
          contato: contato || "",
          whatsapp: whatsapp || "",
          email: email || "",
          plano: plano_label || plano,
          max_usuarios: max_usuarios || 5,
          senha,
          validade_dias: validade_dias || "365",
          data_envio: data_envio || "",
          data_expiracao: data_expiracao || "",
          status: "Ativo",
        };

        console.log("Sending cadastro comercial to Google Sheets...");
        const gsResponse = await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sheetPayload),
          redirect: "follow",
        });
        const gsText = await gsResponse.text();
        console.log("Google Sheets response:", gsText);
      } catch (gsErr) {
        console.error("Google Sheets send error (non-blocking):", gsErr);
      }

      return new Response(
        JSON.stringify({ success: true, cadastro_id: cadastroData?.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle corretor registration
    if (tipo_cadastro === "corretor") {
      const { cadastro_comercial_id, nome, cpf, creci, whatsapp, email, pin, data_cadastro } = body;

      if (!nome || !cpf || !pin) {
        return new Response(
          JSON.stringify({ success: false, error: "Nome, CPF e PIN são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const pinHash = await hashPassword(pin);

      const { data: corretorData, error: dbError } = await supabase.from("corretores").insert({
        cadastro_comercial_id: cadastro_comercial_id || null,
        nome,
        cpf,
        creci: creci || null,
        whatsapp: whatsapp || null,
        email: email || null,
        pin_hash: pinHash,
        status: "ativo",
        data_cadastro: data_cadastro || new Date().toLocaleDateString("pt-BR"),
      }).select('id').single();

      if (dbError) {
        console.error("DB insert corretor error:", dbError.message);
        return new Response(
          JSON.stringify({ success: false, error: dbError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send corretor to Google Sheets - aba COMERCIAL
      try {
        const sheetPayload = {
          aba: "COMERCIAL",
          tipo: "CORRETOR",
          nome,
          cpf,
          creci: creci || "",
          whatsapp: whatsapp || "",
          email: email || "",
          data_cadastro: data_cadastro || "",
          status: "Ativo",
        };

        console.log("Sending corretor to Google Sheets...");
        const gsResponse = await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sheetPayload),
          redirect: "follow",
        });
        const gsText = await gsResponse.text();
        console.log("Google Sheets corretor response:", gsText);
      } catch (gsErr) {
        console.error("Google Sheets corretor send error (non-blocking):", gsErr);
      }

      return new Response(
        JSON.stringify({ success: true, corretor_id: corretorData?.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle corretor status update
    if (tipo_cadastro === "corretor_status") {
      const { corretor_id, status } = body;
      const { error: dbError } = await supabase.from("corretores")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", corretor_id);

      if (dbError) {
        return new Response(
          JSON.stringify({ success: false, error: dbError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Legacy: demo license registration
    const { nome, whatsapp, email, cidade, senha, validade_dias } = body;

    if (!nome || !senha || !validade_dias) {
      return new Response(
        JSON.stringify({ success: false, error: "Campos obrigatórios faltando" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const dataExpiracao = new Date();
    dataExpiracao.setDate(dataExpiracao.getDate() + parseInt(validade_dias));

    const senhaHash = await hashPassword(senha);

    const { error } = await supabase.from("demo_licenses").insert({
      nome,
      whatsapp: whatsapp || null,
      email: email || null,
      cidade: cidade || null,
      senha: senhaHash,
      validade_dias: parseInt(validade_dias),
      data_expiracao: dataExpiracao.toISOString(),
      status: "Ativo",
    });

    if (error) {
      console.error("DB insert error:", error.message);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("register-elite error:", e);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
