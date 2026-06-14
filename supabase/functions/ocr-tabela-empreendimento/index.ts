// OCR de tabelas escaneadas usando Lovable AI (Gemini Vision)
// Recebe imagens (base64) renderizadas de páginas PDF e retorna unidades estruturadas

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function validateAdmin(password: string): Promise<boolean> {
  if (!password) return false;
  return [
    Deno.env.get("CREDENTIAL_MASTER"),
    Deno.env.get("CREDENTIAL_MASTER_ALT"),
    Deno.env.get("CREDENCIAL_EMAIL_GERAL"),
    Deno.env.get("CREDENCIAL_SENHA_GERAL"),
  ].some((p) => p && p === password);
}

interface Unidade {
  unidade: string;
  andar?: string;
  apto_torre?: string;
  valor_lancamento?: number;
  tipologia?: string;
  metragem?: string;
}

const SYSTEM_PROMPT = `Você é um extrator de dados de tabelas de vendas de empreendimentos imobiliários.
Analise a imagem (página de PDF escaneado ou foto) de uma tabela de unidades e retorne TODAS as unidades visíveis.
Para cada linha da tabela, identifique:
- unidade (número/identificador da unidade ou apartamento — OBRIGATÓRIO)
- andar (andar/pavimento — opcional)
- apto_torre (torre/bloco — opcional)
- valor_lancamento (valor de tabela/lançamento em reais como número, sem R$ nem pontuação de milhar — opcional)
- tipologia (ex.: 2 dorms, suite — opcional)
- metragem (área privativa, ex.: "45,30 m²" — opcional)

Ignore cabeçalhos, totais, rodapés e linhas vazias. Não invente dados.
Retorne APENAS via a função extract_unidades.`;

const TOOL = {
  type: "function",
  function: {
    name: "extract_unidades",
    description: "Retorna as unidades extraídas da imagem da tabela",
    parameters: {
      type: "object",
      properties: {
        unidades: {
          type: "array",
          items: {
            type: "object",
            properties: {
              unidade: { type: "string" },
              andar: { type: "string" },
              apto_torre: { type: "string" },
              valor_lancamento: { type: "number" },
              tipologia: { type: "string" },
              metragem: { type: "string" },
            },
            required: ["unidade"],
            additionalProperties: false,
          },
        },
      },
      required: ["unidades"],
      additionalProperties: false,
    },
  },
};

async function ocrPage(imageBase64: string): Promise<Unidade[]> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada");

  const dataUrl = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Extraia todas as unidades visíveis nesta tabela." },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      tools: [TOOL],
      tool_choice: { type: "function", function: { name: "extract_unidades" } },
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    if (resp.status === 429) throw new Error("Limite de requisições atingido. Tente novamente em alguns instantes.");
    if (resp.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos em Configurações > Workspace > Uso.");
    throw new Error(`Falha OCR (${resp.status}): ${txt.slice(0, 200)}`);
  }

  const data = await resp.json();
  const call = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (!call?.function?.arguments) return [];
  try {
    const args = JSON.parse(call.function.arguments);
    return Array.isArray(args.unidades) ? args.unidades : [];
  } catch {
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { admin_password, images } = await req.json() as {
      admin_password: string;
      images: string[];
    };

    if (!(await validateAdmin(admin_password))) {
      return new Response(JSON.stringify({ error: "Senha inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Array.isArray(images) || !images.length) {
      return new Response(JSON.stringify({ error: "Nenhuma imagem enviada" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (images.length > 20) {
      return new Response(JSON.stringify({ error: "Limite de 20 páginas por OCR. Divida o PDF." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const all: Unidade[] = [];
    const errors: string[] = [];
    for (let i = 0; i < images.length; i++) {
      try {
        const rows = await ocrPage(images[i]);
        all.push(...rows);
      } catch (e) {
        errors.push(`Página ${i + 1}: ${e instanceof Error ? e.message : "erro"}`);
      }
    }

    // dedup por unidade (mantém primeira ocorrência)
    const seen = new Set<string>();
    const dedup = all.filter((u) => {
      const k = String(u.unidade || "").trim().toLowerCase();
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    return new Response(JSON.stringify({ unidades: dedup, total: dedup.length, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
