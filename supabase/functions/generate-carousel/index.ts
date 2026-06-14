import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { descricaoImovel, numSlides = 5 } = await req.json();

    if (!descricaoImovel || typeof descricaoImovel !== "string" || descricaoImovel.length > 2000) {
      return new Response(JSON.stringify({ error: "Descrição inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const slidesCount = Math.min(Math.max(Number(numSlides) || 7, 3), 12);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const logs: string[] = [];
    const aiHeaders = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    };

    // Step 1: Generate structured caption with numbered topics
    const captionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: aiHeaders,
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em marketing imobiliário de luxo. Crie legendas envolventes para carrosséis do Instagram.

REGRAS IMPORTANTES:
1. A primeira linha deve ser o TÍTULO PRINCIPAL da postagem (curto e impactante, máximo 8 palavras).
2. Depois, liste exatamente ${slidesCount - 1} tópicos numerados (1., 2., 3., etc.) que serão os títulos dos slides.
3. Cada tópico numerado deve ter no máximo 6 palavras.
4. Após os tópicos, escreva a legenda completa com emojis e hashtags.
5. Mencione que é um carrossel e convide a deslizar.
6. Máximo 300 palavras total.

Exemplo de formato:
Seu Refúgio de Luxo Te Espera

1. Planejamento sem surpresas
2. Comparação real de preços
3. Acabamento premium incluso
4. Localização privilegiada

🏠 Deslize para conhecer... [resto da legenda com emojis e hashtags]`,
          },
          {
            role: "user",
            content: `Crie uma legenda estruturada para um carrossel de ${slidesCount} slides sobre: ${descricaoImovel}`,
          },
        ],
      }),
    });

    if (!captionResponse.ok) {
      const status = captionResponse.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Erro ao gerar legenda");
    }

    const captionData = await captionResponse.json();
    const legenda = captionData.choices?.[0]?.message?.content || "";
    logs.push("✅ Legenda do carrossel gerada.");

    // Extract slide titles from the structured caption
    const slideTitles: string[] = [];
    const lines = legenda
      .split("\n")
      .map((l: string) => l.trim())
      .filter((l: string) => l);

    if (lines.length > 0) {
      const mainTitle = lines.find((l: string) => !l.match(/^\d+\./));
      slideTitles.push(mainTitle || descricaoImovel.substring(0, 40));
    }

    for (const line of lines) {
      const match = line.match(/^\d+\.\s*(.+)/);
      if (match) {
        slideTitles.push(match[1].trim());
      }
    }

    while (slideTitles.length < slidesCount) {
      slideTitles.push(`Detalhe ${slideTitles.length}`);
    }

    logs.push(`✅ ${slideTitles.length} títulos extraídos da legenda.`);

    // Step 2: Generate slide prompts with AI
    const promptsResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: aiHeaders,
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você gera prompts curtos (máximo 15 palavras cada) para imagens de carrossel imobiliário. Todos devem ter o MESMO estilo visual para consistência. Responda APENAS com um JSON array de strings, sem markdown.`,
          },
          {
            role: "user",
            content: `Gere ${slidesCount} prompts de imagem para um carrossel sobre: ${descricaoImovel}. Slide 1 é a capa. Mantenha estilo consistente: "estética minimalista, iluminação suave, render 8k, fotografia profissional". Formato: ["prompt1", "prompt2", ...]`,
          },
        ],
      }),
    });

    let slidePrompts: string[] = [];
    if (promptsResponse.ok) {
      const promptsData = await promptsResponse.json();
      const raw = promptsData.choices?.[0]?.message?.content || "[]";
      try {
        const jsonMatch = raw.match(/\[[\s\S]*\]/);
        slidePrompts = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      } catch {
        console.error("Failed to parse slide prompts:", raw);
      }
    }

    if (slidePrompts.length < slidesCount) {
      const styleKeywords = "estética minimalista, iluminação suave, render 8k, fotografia profissional";
      slidePrompts = Array.from({ length: slidesCount }, (_, i) =>
        i === 0
          ? `Capa luxuosa: ${descricaoImovel}, ${styleKeywords}`
          : `Detalhe ${i} do imóvel: ${descricaoImovel}, ${styleKeywords}`,
      );
    }

    logs.push(`✅ ${slidePrompts.length} prompts de slides gerados.`);

    // Step 3: Generate images
    const imagens: string[] = [];
    const publicUrls: string[] = [];
    const batchId = Date.now();

    for (let i = 0; i < slidesCount; i++) {
      logs.push(`🎨 Gerando slide ${i + 1}/${slidesCount}...`);

      try {
        const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: aiHeaders,
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [
              {
                role: "user",
                content: `Generate a stunning square (1:1) real estate photo: ${slidePrompts[i]}. Professional real estate photography, luxury feel, 8K quality.`,
              },
            ],
            modalities: ["image", "text"],
          }),
        });

        if (!imageResponse.ok) {
          logs.push(`⚠️ Falha no slide ${i + 1}: status ${imageResponse.status}`);
          if (imageResponse.status === 429) {
            logs.push("⏳ Rate limited, aguardando 5s...");
            await new Promise((r) => setTimeout(r, 5000));
          }
          continue;
        }

        const imageData = await imageResponse.json();
        const imageUrlData = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageUrlData) {
          logs.push(`⚠️ Slide ${i + 1}: sem imagem na resposta.`);
          continue;
        }

        imagens.push(imageUrlData);

        // Upload to storage
        const base64Data = imageUrlData.replace(/^data:image\/\w+;base64,/, "");
        const imageBytes = decode(base64Data);
        const fileName = `carousel_${batchId}_slide${i + 1}.png`;

        const { error: uploadError } = await supabase.storage
          .from("imagens_anuncios")
          .upload(fileName, imageBytes, { contentType: "image/png", upsert: false });

        if (uploadError) {
          logs.push(`⚠️ Upload slide ${i + 1}: ${uploadError.message}`);
        } else {
          const { data: urlData } = supabase.storage.from("imagens_anuncios").getPublicUrl(fileName);
          publicUrls.push(urlData.publicUrl);
          logs.push(`✅ Slide ${i + 1} gerado e salvo.`);
        }

        if (i < slidesCount - 1) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      } catch (err) {
        console.error(`Error generating slide ${i + 1}:`, err);
        logs.push(`⚠️ Erro no slide ${i + 1}.`);
      }
    }

    logs.push(`✅ Carrossel completo: ${imagens.length}/${slidesCount} slides gerados.`);

    return new Response(
      JSON.stringify({
        sucesso: true,
        legenda,
        slideTitles: slideTitles.slice(0, slidesCount),
        imagens,
        publicUrls,
        logs,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Erro:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
