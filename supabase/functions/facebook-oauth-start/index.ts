import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FRIENDLY_MISSING = 'A integração com o Facebook ainda não foi configurada. Peça ao administrador para cadastrar as credenciais FACEBOOK_CLIENT_ID e FACEBOOK_CLIENT_SECRET no painel de secrets da Lovable Cloud.';
const FRIENDLY_INVALID = 'As credenciais do Facebook (FACEBOOK_CLIENT_ID/FACEBOOK_CLIENT_SECRET) parecem inválidas. Verifique no painel do Meta for Developers se o App ID está ativo e se o Client Secret é o mesmo cadastrado nos secrets.';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function validateFacebookApp(appId: string, appSecret: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/oauth/access_token?client_id=${encodeURIComponent(appId)}&client_secret=${encodeURIComponent(appSecret)}&grant_type=client_credentials`
    );
    const data = await res.json();
    if (data.error) {
      return { ok: false, error: data.error.message || 'Credenciais rejeitadas pelo Facebook' };
    }
    if (!data.access_token) {
      return { ok: false, error: 'Facebook não devolveu token de aplicação' };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Falha de rede ao validar' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID') || Deno.env.get('FACEBOOK_CLIENT_ID');
    const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET') || Deno.env.get('FACEBOOK_CLIENT_SECRET');

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      return jsonResponse({
        error: FRIENDLY_MISSING,
        code: 'FB_CREDENTIALS_MISSING',
        missing: [
          !FACEBOOK_APP_ID ? 'FACEBOOK_CLIENT_ID' : null,
          !FACEBOOK_APP_SECRET ? 'FACEBOOK_CLIENT_SECRET' : null,
        ].filter(Boolean),
      }, 400);
    }

    // Validate credentials with Facebook before redirecting the user
    const check = await validateFacebookApp(FACEBOOK_APP_ID, FACEBOOK_APP_SECRET);
    if (!check.ok) {
      return jsonResponse({
        error: `${FRIENDLY_INVALID} Detalhe técnico: ${check.error}`,
        code: 'FB_CREDENTIALS_INVALID',
      }, 400);
    }

    const { userId, loginHint, instagramHandle, popup } = await req.json();
    if (!userId) {
      return jsonResponse({ error: 'userId é obrigatório' }, 400);
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
    const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/facebook-oauth-callback`;

    const scopes = [
      'instagram_basic',
      'instagram_content_publish',
      'pages_show_list',
      'pages_read_engagement',
      'ads_management',
    ].join(',');

    const stateObj = { uid: userId, ig: instagramHandle || null, popup: !!popup };
    const state = btoa(JSON.stringify(stateObj));

    const hintParam = loginHint ? `&login_hint=${encodeURIComponent(loginHint)}` : '';
    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent(state)}&response_type=code&auth_type=rerequest${hintParam}`;

    return jsonResponse({ authUrl });
  } catch (error) {
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      code: 'FB_OAUTH_START_ERROR',
    }, 500);
  }
});
