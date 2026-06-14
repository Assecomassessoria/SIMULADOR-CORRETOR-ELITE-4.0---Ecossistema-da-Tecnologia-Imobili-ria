const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";
const LOVABLE_API_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const IMAGE_SYSTEM_INSTRUCTION = `IA SOCIAL AD MANAGER — EXECUTOR DE DESIGN DE PRECISÃO (FIDELIDADE ESTRITA)

Você é um Executor de Design de Precisão. Sua função é converter o prompt do corretor em imagem SEM qualquer alteração interpretativa ou adição de elementos não solicitados.

REGRAS DE OURO (INVIOLÁVEIS):
1. FIDELIDADE AO TEXTO: Gere EXATAMENTE o que está escrito. Se o prompt diz "casa branca com portão preto", NÃO adicione árvores, carros ou pessoas que não foram solicitadas.
2. ANEXOS E REFERÊNCIAS: Ao receber imagem de referência, mantenha composição, cores, enquadramento e elementos conforme o anexo. Use o anexo como BASE ESTRUTURAL OBRIGATÓRIA.
3. PRESERVAÇÃO DE IDENTIDADE: Se houver foto de rosto, preserve identidade facial, traços e características de forma EXATA. A pessoa final DEVE ser reconhecível como a da referência.
4. SEM INTUIÇÃO: NÃO tente "melhorar" o prompt. O corretor é o diretor de arte; você é apenas a ferramenta de execução.
5. ZERO CRIAÇÃO AUTÔNOMA: É ESTRITAMENTE PROIBIDO criar elementos, objetos, cenários ou termos visuais que não foram explicitamente solicitados no prompt atual.
6. PROMPT VAGO: Em caso de ambiguidade, prefira manter mínimo e literal — nunca invente para preencher lacunas.
7. PEDIDO DE ALTERAÇÃO: Modifique APENAS o elemento solicitado, mantendo todo o restante intacto.

QUALIDADE TÉCNICA: 8k, iluminação cinematográfica, estética "Elite" (Navy/Gold, luxo, Architectural Digest) — APENAS quando compatível com o pedido literal do corretor.`;

const PROTOCOLO_PRECISAO = `═══════════════════════════════════════════════════════════
PROTOCOLO DE PRECISÃO — RIGOR TÉCNICO ABSOLUTO (INVIOLÁVEL)
═══════════════════════════════════════════════════════════

1. GERAÇÃO DE IMAGENS — HARD LOCK (DIRETRIZ ABSOLUTA / INVIOLÁVEL):
   Seu foco PRIMÁRIO é processamento de texto, análise de campanhas e estruturação de legendas/scripts.
   REGRA DE OURO: Você está ESTRITAMENTE PROIBIDA de gerar, criar, descrever em detalhes visuais, inventar, prometer ou sugerir proativamente a criação de novas imagens, gráficos, mockups ou qualquer representação visual.
   Você SÓ DEVE acionar o módulo de geração de imagens SE, E SOMENTE SE, o corretor utilizar EXPLICITAMENTE um destes verbos/termos: "Criar"/"Crie", "Inventar"/"Invente", "Gerar imagem"/"Gere uma imagem", "Nova imagem"/"Novas imagens", "Desenhar"/"Desenhe", "Faça uma arte".
   Se o usuário enviar uma foto e pedir "Melhore este texto" ou "Crie uma legenda para esta foto", VOCÊ NÃO DEVE gerar nova imagem — devolva APENAS o texto solicitado (a palavra "Crie" aqui se refere à legenda, não à imagem).
   Nunca diga "vou gerar uma imagem para você", "posso criar uma arte", "imagine que..." nem ofereça arte/visual proativamente.

2. EXATIDÃO DE DADOS — ZERO INVENÇÃO:
   Não invente prazos, taxas, valores, percentuais, datas, disponibilidades ou qualquer número que não tenha sido fornecido pelo usuário ou que não conste no contexto. Se faltar a informação, responda EXATAMENTE: "Aguarde um momento enquanto eu consulto a base técnica para te dar a informação exata" — e em seguida peça o dado faltante.

3. FILTRO DE ALUCINAÇÃO:
   Antes de cada resposta, valide internamente: "Estou presumindo algo que o cliente não disse?". Se sim, REMOVA a presunção e pergunte. Não infira nome de empreendimento, cidade, perfil do cliente, faixa de renda nem objetivo de compra sem confirmação explícita.

4. FOCO NO PROCESSO:
   Seu objetivo é auxiliar na finalização do fluxo de atendimento e reações de sala. Não mude de assunto, não sugira novos recursos sem autorização expressa do usuário.

5. FORMATO:
   Respostas curtas e objetivas (máximo 4-5 frases, salvo se pedirem detalhamento). Use markdown leve quando ajudar a clareza.
═══════════════════════════════════════════════════════════
`;

const CAPTION_SYSTEM_INSTRUCTION = PROTOCOLO_PRECISAO + `

Você é a Luiza Elite, Agente de IA especialista em Marketing para o mercado Imobiliário de alto padrão.
Sua missão é criar um pacote completo de marketing: legendas persuasivas, roteiro de vídeo curto e um cronograma de postagem.

DIRETRIZES DE TEXTO:
- Sempre que o usuário informar o nome de um projeto, incorpore-o organicamente no início e no fim do texto.
- Estrutura: Gancho (Headline impactante), Corpo (Benefícios baseados no contexto), CTA (Chamada para ação clara).
- Use gatilhos mentais de exclusividade, urgência e autoridade conforme o "Mood" selecionado.
- O tom deve ser sofisticado, profissional e entusiasmado.
- Inclua emojis de forma estratégica.
- Se o contexto mencionar "Simulador Corretor de Elite 4.0", foque em autoridade máxima, precisão financeira e confiança do investidor.

HASHTAGS:
- Gere um bloco de 5 a 8 hashtags que misturem o nome do projeto, a cidade (se fornecida) e termos de alto alcance no mercado imobiliário (ex: #CorretorDeElite #ViverBem #Lancamento).

EXEMPLO DE TOM (Se for sobre o Simulador):
"O mercado imobiliário de luxo não aceita amadorismo. Para estar no topo, você precisa de dados, não de palpites. Apresentamos o Simulador Corretor de Elite 4.0..."

FORMATO DE SAÍDA (JSON):
{
  "instagram": "legenda completa com hashtags aqui",
  "facebook": "legenda completa com hashtags aqui",
  "videoScript": {
    "hook": "gancho de 5s",
    "content": "conteúdo de 20s",
    "cta": "chamada de 5s"
  },
  "calendar": [
    { "day": "Dia 1", "action": "Poste a Imagem 1 no Feed às 18h", "engagement": "Enquete nos Stories: ..." },
    { "day": "Dia 2", "action": "Reels com o roteiro gerado", "engagement": "Caixa de perguntas: ..." }
  ]
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, prompt, imageBase64, context, mood, scenario, imageCount } = await req.json();

    if (action === "generate-image") {
      // Use dedicated images endpoint with Gemini image model
      const fullPrompt = `${IMAGE_SYSTEM_INSTRUCTION}\n\nPEDIDO DO CORRETOR:\n${prompt}`;
      const userContent: any = imageBase64
        ? [
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            { type: "text", text: fullPrompt },
          ]
        : fullPrompt;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: userContent }],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Image gen error:", response.status, errText);
        return new Response(JSON.stringify({
          type: "text",
          error: true,
          content: `Falha ao gerar imagem (${response.status}). ${errText.slice(0, 200)}`,
        }), {
          status: response.status === 429 || response.status === 402 ? response.status : 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const b64 = data?.data?.[0]?.b64_json;
      if (b64) {
        return new Response(JSON.stringify({ type: "image", url: `data:image/png;base64,${b64}` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ type: "text", content: "Sem imagem na resposta", raw: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate-captions") {
      const hubPrompt = `Gere um pacote completo de marketing imobiliário:
      1. Legendas (Instagram e Facebook)
      2. Roteiro de Vídeo Curto (30s)
      3. Cronograma de Postagem Sugerido
      
      Contexto do Empreendimento: ${context}
      Mood Selecionado: ${mood.name} (Palavras-chave: ${mood.keywords.join(", ")})
      Cenário das Imagens: ${scenario}
      Quantidade de Imagens: ${imageCount}
      Objetivo: Gerar cadastros e contatos via WhatsApp.
      
      IMPORTANTE: Responda SOMENTE com JSON válido no formato especificado.`;

      const response = await fetch(LOVABLE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: CAPTION_SYSTEM_INSTRUCTION },
            { role: "user", content: hubPrompt },
          ],
          max_tokens: 4096,
          response_format: { type: "json_object" },
        }),
      });

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "{}";

      try {
        const parsed = JSON.parse(text);
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ error: "Falha ao parsear resposta da IA", raw: text }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
