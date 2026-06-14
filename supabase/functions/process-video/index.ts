import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoBase64, overlayText, position = "bottom", fontColor = "#FFFFFF", fontSize = 48 } = await req.json();

    if (!videoBase64 || typeof videoBase64 !== 'string') {
      return new Response(JSON.stringify({ error: 'Vídeo base64 é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!overlayText || typeof overlayText !== 'string' || overlayText.length > 200) {
      return new Response(JSON.stringify({ error: 'Texto de sobreposição inválido (máx 200 caracteres)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Decode video
    const cleanBase64 = videoBase64.replace(/^data:video\/\w+;base64,/, '');
    const videoBytes = decode(cleanBase64);

    const inputPath = `/tmp/input_${Date.now()}.mp4`;
    const outputPath = `/tmp/output_${Date.now()}.mp4`;

    await Deno.writeFile(inputPath, videoBytes);

    // Determine Y position for text
    let yExpr = "h-th-40";
    if (position === "top") yExpr = "40";
    else if (position === "center") yExpr = "(h-th)/2";

    // FFmpeg drawtext filter
    const escapedText = overlayText.replace(/'/g, "'\\''").replace(/:/g, "\\:");
    const fontSizeNum = Math.min(Math.max(Number(fontSize) || 48, 16), 120);
    const drawtext = `drawtext=text='${escapedText}':fontsize=${fontSizeNum}:fontcolor=${fontColor}:x=(w-tw)/2:y=${yExpr}:shadowcolor=black@0.6:shadowx=2:shadowy=2`;

    const ffmpegCmd = new Deno.Command("ffmpeg", {
      args: [
        "-i", inputPath,
        "-vf", drawtext,
        "-codec:a", "copy",
        "-y", outputPath,
      ],
      stdout: "piped",
      stderr: "piped",
    });

    const ffmpegResult = await ffmpegCmd.output();

    if (!ffmpegResult.success) {
      const stderr = new TextDecoder().decode(ffmpegResult.stderr);
      console.error("FFmpeg error:", stderr);
      // Cleanup
      try { await Deno.remove(inputPath); } catch {}
      return new Response(JSON.stringify({ error: 'Erro ao processar vídeo com FFmpeg' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Read output and upload
    const outputBytes = await Deno.readFile(outputPath);
    const fileName = `video_overlay_${Date.now()}.mp4`;

    const { error: uploadError } = await supabase.storage
      .from('imagens_anuncios')
      .upload(fileName, outputBytes, { contentType: 'video/mp4', upsert: false });

    // Cleanup temp files
    try { await Deno.remove(inputPath); } catch {}
    try { await Deno.remove(outputPath); } catch {}

    if (uploadError) {
      return new Response(JSON.stringify({ error: `Upload falhou: ${uploadError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: urlData } = supabase.storage.from('imagens_anuncios').getPublicUrl(fileName);

    return new Response(JSON.stringify({
      sucesso: true,
      publicUrl: urlData.publicUrl,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
