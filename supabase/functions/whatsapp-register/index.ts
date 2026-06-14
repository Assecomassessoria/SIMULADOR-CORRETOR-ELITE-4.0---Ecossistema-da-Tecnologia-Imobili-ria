// Sistema de Destino: Supabase Edge Functions (whatsapp-register)
// Descrição: Registra de forma segura o número do corretor no WhatsApp Cloud API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Gera o appsecret_proof usando a Web Crypto API nativa do Deno
 */
async function generateAppSecretProof(token: string, appSecret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(token));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Variáveis de ambiente seguras (com fallback para nomes existentes)
    const accessToken =
      Deno.env.get("TOKEN_DE_ACESSO_DO_WHATSAPP") ||
      Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const appSecret = Deno.env.get("FACEBOOK_CLIENT_SECRET");

    if (!accessToken || !appSecret) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Configurações do servidor incompletas (Tokens ausentes).",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Parâmetros do cliente
    const { phoneId, pin } = await req.json();

    if (!phoneId || !pin) {
      return new Response(
        JSON.stringify({ error: "Parâmetros 'phoneId' e 'pin' são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pinStr = String(pin);
    if (pinStr.length !== 6 || isNaN(Number(pinStr))) {
      return new Response(
        JSON.stringify({ error: "O PIN do WhatsApp precisa conter exatamente 6 números." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Prova de segurança (appsecret_proof)
    const appsecretProof = await generateAppSecretProof(accessToken, appSecret);

    // 4. Chamada à API Graph do Meta (v25.0)
    const url = `https://graph.facebook.com/v25.0/${encodeURIComponent(phoneId)}/register`;

    const metaResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        pin: pinStr,
        appsecret_proof: appsecretProof,
      }),
    });

    const metaData = await metaResponse.json();

    // 5. Tratamento de erros amigável
    if (!metaResponse.ok) {
      console.error("Erro retornado pelo Meta:", metaData);

      let mensagemAmigavel =
        "Não foi possível registrar seu número. Verifique suas credenciais no Meta.";
      if (metaData.error?.code === 100) {
        mensagemAmigavel =
          "O ID do Telefone informado é inválido ou não pertence a esta conta.";
      } else if (metaData.error?.error_subcode === 136025) {
        mensagemAmigavel =
          "O PIN fornecido está incorreto. Verifique o PIN cadastrado no painel do Meta.";
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: mensagemAmigavel,
          details: metaData.error?.message,
        }),
        {
          status: metaResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "WhatsApp vinculado com sucesso ao Simulador!",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Erro interno no servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
})
