import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GRAPH_API_BASE = 'https://graph.facebook.com/v19.0';

const audienceMapping: Record<string, object> = {
  'interesses_imoveis': { interests: [{ id: '6003088849592', name: 'Real Estate' }] },
  'alto_padrao': { interests: [{ id: '6003949439364', name: 'Luxury real estate' }] },
  'corretor_imoveis': { interests: [{ id: '6003115456382', name: 'Real Estate Broker' }] },
  'corretora_imoveis': { interests: [{ id: '6003115456382', name: 'Real Estate Broker' }] },
  'imobiliaria_imob': { interests: [{ id: '6003115456382', name: 'Real Estate Broker' }] },
  'construtora_const': { interests: [{ id: '6003661131105', name: 'Construction' }] },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { legenda, imageUrl, imageUrls, isCarousel, orcamentoAnuncio, publicoAlvo, isCustomAudience, userId } = await req.json();

    let META_ACCESS_TOKEN: string | undefined;
    let META_AD_ACCOUNT_ID: string | undefined;
    let IG_USER_ID: string | undefined;

    if (userId) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') || '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
        { auth: { persistSession: false } }
      );

      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('meta_access_token, ig_user_id, meta_ad_account_id')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        return new Response(JSON.stringify({
          error: 'Perfil não encontrado. Faça login novamente.'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      META_ACCESS_TOKEN = profile.meta_access_token || undefined;
      IG_USER_ID = profile.ig_user_id || undefined;
      META_AD_ACCOUNT_ID = profile.meta_ad_account_id || undefined;
    }

    if (!META_ACCESS_TOKEN) META_ACCESS_TOKEN = Deno.env.get('META_ACCESS_TOKEN');
    if (!META_AD_ACCOUNT_ID) META_AD_ACCOUNT_ID = Deno.env.get('META_AD_ACCOUNT_ID');
    if (!IG_USER_ID) IG_USER_ID = Deno.env.get('IG_USER_ID');

    if (!META_ACCESS_TOKEN || !META_AD_ACCOUNT_ID || !IG_USER_ID) {
      return new Response(JSON.stringify({
        error: 'Credenciais Meta não configuradas. Conecte sua conta Instagram/Meta Ads nas Configurações.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!legenda || !orcamentoAnuncio) {
      return new Response(JSON.stringify({ error: 'Legenda e orçamento são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const logs: string[] = [];

    // === INSTAGRAM PUBLISHING ===
    if (isCarousel && imageUrls && imageUrls.length > 0) {
      const childIds: string[] = [];
      for (let i = 0; i < imageUrls.length; i++) {
        const childRes = await fetch(
          `${GRAPH_API_BASE}/${IG_USER_ID}/media?access_token=${META_ACCESS_TOKEN}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_url: imageUrls[i], is_carousel_item: true }),
          }
        );
        const childData = await childRes.json();
        if (childData.error) {
          logs.push(`⚠️ Erro no slide ${i + 1}: ${childData.error.message}`);
        } else {
          childIds.push(childData.id);
        }
      }

      if (childIds.length > 0) {
        const carouselRes = await fetch(
          `${GRAPH_API_BASE}/${IG_USER_ID}/media?access_token=${META_ACCESS_TOKEN}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ media_type: 'CAROUSEL', caption: legenda, children: childIds }),
          }
        );
        const carouselData = await carouselRes.json();
        if (carouselData.error) {
          logs.push(`⚠️ Erro ao criar carrossel: ${carouselData.error.message}`);
        } else {
          const publishRes = await fetch(
            `${GRAPH_API_BASE}/${IG_USER_ID}/media_publish?access_token=${META_ACCESS_TOKEN}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ creation_id: carouselData.id }),
            }
          );
          const publishData = await publishRes.json();
          if (publishData.error) {
            logs.push(`⚠️ Erro ao publicar carrossel: ${publishData.error.message}`);
          } else {
            logs.push(`✅ Carrossel publicado no Instagram (ID: ${publishData.id}).`);
          }
        }
      } else {
        logs.push('⚠️ Nenhum slide válido para publicar.');
      }
    } else if (imageUrl) {
      const containerRes = await fetch(
        `${GRAPH_API_BASE}/${IG_USER_ID}/media?access_token=${META_ACCESS_TOKEN}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url: imageUrl, caption: legenda }),
        }
      );
      const containerData = await containerRes.json();
      if (containerData.error) {
        logs.push(`⚠️ Erro ao criar container Instagram: ${containerData.error.message}`);
      } else {
        const publishRes = await fetch(
          `${GRAPH_API_BASE}/${IG_USER_ID}/media_publish?access_token=${META_ACCESS_TOKEN}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ creation_id: containerData.id }),
          }
        );
        const publishData = await publishRes.json();
        if (publishData.error) {
          logs.push(`⚠️ Erro ao publicar: ${publishData.error.message}`);
        } else {
          logs.push(`✅ Publicado no Instagram (ID: ${publishData.id}).`);
        }
      }
    } else {
      logs.push('⚠️ Sem imagem para publicar no Instagram.');
    }

    // === AD CAMPAIGN ===
    const campaignRes = await fetch(
      `${GRAPH_API_BASE}/${META_AD_ACCOUNT_ID}/campaigns?access_token=${META_ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Campanha Elite - ${new Date().toLocaleDateString('pt-BR')}`,
          objective: 'OUTCOME_AWARENESS',
          status: 'ACTIVE',
          special_ad_categories: ['HOUSING'],
        }),
      }
    );
    const campaignData = await campaignRes.json();

    if (campaignData.error) {
      logs.push(`⚠️ Erro na campanha: ${campaignData.error.message}`);
    } else {
      const campaignId = campaignData.id;
      let targeting: object;
      if (isCustomAudience && typeof publicoAlvo === 'string' && publicoAlvo.length > 0) {
        targeting = { interests: [{ id: '6003088849592', name: 'Real Estate' }] };
        logs.push(`ℹ️ Público personalizado: "${publicoAlvo}" (usando targeting base Real Estate).`);
      } else {
        targeting = audienceMapping[publicoAlvo] || audienceMapping['interesses_imoveis'];
      }

      const adSetRes = await fetch(
        `${GRAPH_API_BASE}/${META_AD_ACCOUNT_ID}/adsets?access_token=${META_ACCESS_TOKEN}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `AdSet - ${isCustomAudience ? 'Custom' : publicoAlvo}`,
            campaign_id: campaignId,
            daily_budget: Number(orcamentoAnuncio) * 100,
            billing_event: 'IMPRESSIONS',
            bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
            targeting: {
              geo_locations: { countries: ['BR'] },
              publisher_platforms: ['instagram'],
              flexible_spec: [targeting],
            },
            status: 'ACTIVE',
          }),
        }
      );
      const adSetData = await adSetRes.json();
      if (adSetData.error) {
        logs.push(`⚠️ Erro no AdSet: ${adSetData.error.message}`);
      } else {
        logs.push(`🚀 Anúncio ativado!`);
      }
    }

    return new Response(JSON.stringify({ sucesso: true, logs }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
