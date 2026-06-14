import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FOLDER_ID = "1ZZhnJoKZekjV_vyY5v1npdXWUnUTOaT7";
const GATEWAY = "https://connector-gateway.lovable.dev/google_drive/drive/v3";
const RETENTION_MONTHS = 36;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_DRIVE_API_KEY = Deno.env.get("GOOGLE_DRIVE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");
    if (!GOOGLE_DRIVE_API_KEY) throw new Error("GOOGLE_DRIVE_API_KEY não configurada");

    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - RETENTION_MONTHS);
    const cutoffIso = cutoff.toISOString();

    const headers = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GOOGLE_DRIVE_API_KEY,
    };

    // Listar arquivos da pasta criados antes do cutoff (não-trashed)
    const q = encodeURIComponent(`'${FOLDER_ID}' in parents and trashed = false and createdTime < '${cutoffIso}'`);
    const listUrl = `${GATEWAY}/files?q=${q}&fields=files(id,name,createdTime)&pageSize=1000&supportsAllDrives=true&includeItemsFromAllDrives=true`;
    const listResp = await fetch(listUrl, { headers });
    const listText = await listResp.text();
    if (!listResp.ok) throw new Error(`Drive list ${listResp.status}: ${listText}`);
    const { files = [] } = JSON.parse(listText);

    const trashed: any[] = [];
    const errors: any[] = [];
    for (const f of files) {
      const upd = await fetch(`${GATEWAY}/files/${f.id}?supportsAllDrives=true`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ trashed: true }),
      });
      if (upd.ok) trashed.push({ id: f.id, name: f.name, createdTime: f.createdTime });
      else errors.push({ id: f.id, status: upd.status, body: await upd.text() });
    }

    console.log(`cleanup: ${trashed.length} arquivos enviados à lixeira, ${errors.length} erros`);
    return new Response(JSON.stringify({
      success: true, cutoff: cutoffIso, totalEncontrados: files.length, trashed, errors,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("drive-cleanup-treinamento error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
