import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

function popupHtml(status: "success" | "error", payload: Record<string, unknown>) {
  const data = JSON.stringify({ source: "meta-oauth", status, ...payload });
  return `<!doctype html><html><head><meta charset="utf-8"><title>Meta OAuth</title></head>
<body style="font-family:system-ui;background:#0b1b3d;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<div style="text-align:center">
  <h2 style="color:#d4af37;margin:0 0 8px">${status === "success" ? "Conectado!" : "Falha na conexão"}</h2>
  <p style="opacity:.8;font-size:14px">Você pode fechar esta janela.</p>
</div>
<script>
  try { window.opener && window.opener.postMessage(${data}, "*"); } catch(e){}
  setTimeout(function(){ try { window.close(); } catch(e){} }, 600);
</script>
</body></html>`;
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const stateRaw = url.searchParams.get('state') || '';
    let userId = stateRaw;
    let igHandleHint: string | null = null;
    let isPopup = false;
    try {
      const decoded = JSON.parse(atob(decodeURIComponent(stateRaw)));
      if (decoded?.uid) userId = decoded.uid;
      if (decoded?.ig) igHandleHint = decoded.ig;
      if (decoded?.popup) isPopup = true;
    } catch {
      // legacy: state is plain userId
    }
    const errorParam = url.searchParams.get('error');

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
    const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || '';

    const finish = (ok: boolean, msg: string) => {
      if (isPopup) {
        return new Response(
          popupHtml(ok ? "success" : "error", ok ? { message: msg } : { error: msg }),
          { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      }
      const qp = ok ? `meta_connected=true` : `meta_error=${encodeURIComponent(msg)}`;
      const redirectUrl = FRONTEND_URL ? `${FRONTEND_URL}/marketing/settings?${qp}` : `/?${qp}`;
      return Response.redirect(redirectUrl, 302);
    };

    if (errorParam) return finish(false, errorParam);
    if (!code || !userId) return new Response('Parâmetros inválidos', { status: 400 });

    const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID') || Deno.env.get('FACEBOOK_CLIENT_ID');
    const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET') || Deno.env.get('FACEBOOK_CLIENT_SECRET');
    const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/facebook-oauth-callback`;

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      return finish(false, 'Integração com o Facebook não configurada (faltam FACEBOOK_CLIENT_ID/SECRET).');
    }

    // 1. Exchange code for short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_secret=${FACEBOOK_APP_SECRET}&code=${code}`
    );
    const tokenData = await tokenRes.json();
    if (tokenData.error) return finish(false, tokenData.error.message);

    const shortLivedToken = tokenData.access_token;

    // 2. Long-lived token
    const longTokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&fb_exchange_token=${shortLivedToken}`
    );
    const longTokenData = await longTokenRes.json();
    if (longTokenData.error) return finish(false, longTokenData.error.message);

    const longLivedToken = longTokenData.access_token;

    // 3. Pages
    const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${longLivedToken}`);
    const pagesData = await pagesRes.json();

    let igUserId: string | null = null;
    let adAccountId: string | null = null;

    if (pagesData.data && pagesData.data.length > 0) {
      const pageId = pagesData.data[0].id;
      const pageToken = pagesData.data[0].access_token;
      const igRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`);
      const igData = await igRes.json();
      if (igData.instagram_business_account) igUserId = igData.instagram_business_account.id;
    }

    // 4. Ad account
    const adAccountRes = await fetch(`https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name&access_token=${longLivedToken}`);
    const adAccountData = await adAccountRes.json();
    if (adAccountData.data && adAccountData.data.length > 0) adAccountId = adAccountData.data[0].id;

    // 5. Save
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      { auth: { persistSession: false } }
    );

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        meta_access_token: longLivedToken,
        ig_user_id: igUserId,
        meta_ad_account_id: adAccountId,
        meta_connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return finish(false, 'Erro ao salvar credenciais');
    }

    return finish(true, 'Conectado com sucesso');
  } catch (error) {
    console.error('OAuth callback error:', error);
    return new Response('Erro interno', { status: 500 });
  }
});
