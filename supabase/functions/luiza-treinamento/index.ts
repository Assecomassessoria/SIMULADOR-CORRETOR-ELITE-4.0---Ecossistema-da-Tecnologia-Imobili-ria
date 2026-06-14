import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `Você é a Luiza Elite, especialista em análise de Memorial Descritivo, Contratos e materiais de empreendimentos imobiliários.

Receberá o conteúdo (texto extraído) de até 10 PDFs de UM ÚNICO empreendimento.
Sua tarefa: produzir um TREINAMENTO estruturado para o corretor.

Responda EXCLUSIVAMENTE em JSON válido (sem markdown, sem cercas de código), no schema:
{
  "nomeEmpreendimento": string,
  "construtora": string | null,
  "localizacao": string | null,
  "descricao": string,           // 2-3 parágrafos comerciais
  "diferenciais": string[],      // 5-8 itens
  "tipologias": string[],        // ex: "2 dorms 55m²"
  "lazer": string[],
  "condicoesComerciais": string, // resumo de pagamento/financiamento se houver
  "perguntasSugeridas": string[],// 6-10 perguntas que o corretor pode fazer à Luiza sobre este empreendimento
  "resumoExecutivo": string      // pitch de 30 segundos para usar com cliente
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { documentos = [], imagens = [] } = await req.json(); // documentos: [{nome, texto}], imagens: [{nome, dataUrl}]
    if ((!Array.isArray(documentos) || documentos.length === 0) && (!Array.isArray(imagens) || imagens.length === 0)) {
      return new Response(JSON.stringify({ error: "Nenhum documento ou imagem enviada" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const docsText = documentos
      .slice(0, 10)
      .map((d: any, i: number) => `=== DOCUMENTO ${i + 1}: ${d.nome} ===\n${(d.texto || "").slice(0, 25000)}`)
      .join("\n\n");

    const imgsHeader = imagens.length
      ? `\n\n=== ${imagens.length} IMAGEM(NS) ANEXADA(S) — extraia texto, dados, tabelas, plantas, valores e diferenciais visíveis ===`
      : "";

    const userParts: any[] = [{ type: "text", text: (docsText || "") + imgsHeader || "Analise as imagens anexadas." }];
    for (const img of imagens.slice(0, 10)) {
      if (img?.dataUrl) userParts.push({ type: "image_url", image_url: { url: img.dataUrl } });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userParts },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI error:", response.status, errorText);
      if (response.status === 429) return new Response(JSON.stringify({ error: "Limite de uso atingido. Tente novamente em instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Créditos esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = { resumoExecutivo: raw }; }

    return new Response(JSON.stringify({ treinamento: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("treinamento error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
