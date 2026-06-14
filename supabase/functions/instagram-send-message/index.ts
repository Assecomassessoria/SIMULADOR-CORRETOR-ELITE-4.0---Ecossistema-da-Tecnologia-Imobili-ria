// Envia DM via Instagram Messaging API (graph.instagram.com)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { recipientId, text, accessToken: tokenOverride } =
      await req.json();

    if (!recipientId || !text) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Parâmetros 'recipientId' (IGSID) e 'text' são obrigatórios.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken =
      tokenOverride ||
      Deno.env.get("TOKEN_INSTAGRAM") ||
      Deno.env.get("META_ACCESS_TOKEN");

    if (!accessToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Token do Instagram ausente. Configure o secret TOKEN_INSTAGRAM.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = "https://graph.instagram.com/v25.0/me/messages";
    const r = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: String(recipientId) },
        message: { text: String(text) },
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      console.error("Instagram DM erro:", data);
      let msg =
        data?.error?.message ||
        "Não foi possível enviar a mensagem no Instagram.";
      if (data?.error?.code === 190) {
        msg = "Token do Instagram inválido ou expirado. Reconecte sua conta.";
      } else if (data?.error?.code === 100) {
        msg =
          "Destinatário (IGSID) inválido ou usuário fora da janela de 24h de mensagens.";
      } else if (data?.error?.code === 10) {
        msg =
          "Permissão negada. Verifique as permissões instagram_manage_messages do app.";
      }
      return new Response(
        JSON.stringify({ success: false, error: msg, details: data.error }),
        { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Erro interno." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
