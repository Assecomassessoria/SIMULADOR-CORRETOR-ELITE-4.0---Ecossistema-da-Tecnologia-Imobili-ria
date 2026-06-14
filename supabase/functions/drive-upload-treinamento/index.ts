import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FOLDER_ID = "1ZZhnJoKZekjV_vyY5v1npdXWUnUTOaT7";
const GATEWAY = "https://connector-gateway.lovable.dev/google_drive";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_DRIVE_API_KEY = Deno.env.get("GOOGLE_DRIVE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");
    if (!GOOGLE_DRIVE_API_KEY) throw new Error("GOOGLE_DRIVE_API_KEY não configurada (conecte o Google Drive)");

    const { fileName, contentBase64, mimeType } = await req.json();
    if (!fileName || !contentBase64) {
      return new Response(JSON.stringify({ error: "fileName e contentBase64 são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dataUploadIso = new Date().toISOString();
    const metadata = {
      name: fileName,
      parents: [FOLDER_ID],
      mimeType: mimeType || "application/pdf",
      properties: {
        data_de_upload: dataUploadIso,
        origem: "luiza_ia_treinamentos",
        retencao_meses: "36",
      },
      description: `Treinamento Luiza IA — upload em ${dataUploadIso} — retenção 36 meses`,
    };

    // Multipart upload (RFC 2387)
    const boundary = `lovable_${crypto.randomUUID()}`;
    const enc = new TextEncoder();
    const binary = Uint8Array.from(atob(contentBase64), (c) => c.charCodeAt(0));

    const head = enc.encode(
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify(metadata) + `\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: ${metadata.mimeType}\r\n` +
      `Content-Transfer-Encoding: base64\r\n\r\n`
    );
    const tail = enc.encode(`\r\n--${boundary}--`);
    const body = new Uint8Array(head.length + binary.length + tail.length);
    body.set(head, 0);
    body.set(binary, head.length);
    body.set(tail, head.length + binary.length);

    const url = `${GATEWAY}/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink,createdTime,properties`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_DRIVE_API_KEY,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    });

    const respText = await resp.text();
    if (!resp.ok) {
      console.error("Drive upload falhou", resp.status, respText);
      return new Response(JSON.stringify({ error: `Drive ${resp.status}: ${respText}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const file = JSON.parse(respText);

    return new Response(JSON.stringify({
      success: true,
      file,
      mensagem: "Documento arquivado com sucesso na Central de Inteligência Luiz IA. Disponível para treinamento por 36 meses.",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("drive-upload-treinamento error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
