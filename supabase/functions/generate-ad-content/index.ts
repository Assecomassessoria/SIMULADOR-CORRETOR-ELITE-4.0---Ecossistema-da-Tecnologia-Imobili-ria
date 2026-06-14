import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // 1. Lidar com requisições OPTIONS (CORS)
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // 2. Capturar todos os dados do corpo da requisição uma única vez
    const { description, tipo, numSlides, image_url } = await req.json();

    // 3. Validação básica
    if (!description) {
      return new Response(JSON.stringify({ error: "description is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const isCarousel = tipo === "carrossel";
    const slides = numSlides || 12;

    // 4. Configurar o Prompt focado em ELITE e SOBREPOSIÇÃO (Legalmente seguro)
    const systemPrompt = isCarousel
      ? `Você é um especialista em marketing imobiliário de elite. 
Sua tarefa é organizar o conteúdo para um carrossel de ${slides} slides que serão SOBREPOSTOS na imagem original do projeto. 
Mantenha a imagem original intacta. NÃO gere prompts para novas imagens.

Retorne EXATAMENTE e APENAS um objeto JSON no formato:
{
  "legenda": "Legenda persuasiva com emojis e hashtags imobiliárias",
  "slideContent": [
    { "titulo": "Capa Impactante", "subtitulo": "Frase curta de apoio" }
  ]
}

Regras:
1. "slideContent" deve ter exatamente ${slides} objetos.
2. O conteúdo deve focar em valorizar o prédio da foto de referência.
3. Responda APENAS o JSON puro, sem markdown.`
      : `Você é um especialista em marketing imobiliário de elite.
Sua tarefa é criar o texto para um post único que será SOBREPOSTO na imagem original.

Retorne EXATAMENTE e APENAS um objeto JSON no formato:
{
  "legenda": "Legenda completa com emojis e hashtags",
  "tituloSobreposto": "Título curto para a imagem",
  "subtituloSobreposto": "Parágrafo curto para a imagem"
}

Regras: Use o estilo Elite (Navy/Gold). Responda APENAS o JSON puro.`;

    // 5. Chamada para a API da IA (Multimodal: Texto + Imagem)
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: `Baseie-se fielmente nesta imagem e no texto: ${description}` },
              ...(image_url ? [{ type: "image_url", image_url: { url: image_url } }] : []),
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429)
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await response.json();
    let content = aiData.choices?.[0]?.message?.content || "";

    // 6. Limpar qualquer formatação Markdown que a IA possa ter enviado
    content = content
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    // 7. Tentar parsear o JSON para garantir que está válido
    const parsed = JSON.parse(content);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-ad-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
