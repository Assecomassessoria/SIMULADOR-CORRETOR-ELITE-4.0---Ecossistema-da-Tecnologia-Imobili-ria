import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!ACCESS_TOKEN) throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado");

    const { userEmail } = await req.json();

    const preference = {
      items: [
        {
          title: "Luiza Elite — Pacote 35 Imagens IA",
          quantity: 1,
          unit_price: 49.9,
          currency_id: "BRL",
          description: "Crédito de 35 imagens para geração via Luiza Elite Marketing IA",
        },
      ],
      payer: userEmail ? { email: userEmail } : undefined,
      back_urls: {
        success: "https://simuladorcorretorelitedemo.lovable.app/marketing?credits=success",
        failure: "https://simuladorcorretorelitedemo.lovable.app/marketing?credits=failure",
        pending: "https://simuladorcorretorelitedemo.lovable.app/marketing?credits=pending",
      },
      auto_return: "approved",
      external_reference: `luiza_elite_credits_${Date.now()}`,
    };

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("MercadoPago error:", response.status, errBody);
      throw new Error(`Erro ao criar preferência: ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify({ init_point: data.init_point, sandbox_init_point: data.sandbox_init_point }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mercadopago-checkout error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
