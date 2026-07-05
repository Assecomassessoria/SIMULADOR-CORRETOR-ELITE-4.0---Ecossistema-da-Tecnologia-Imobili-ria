// CRM API helper — all CRM operations go through the crm-api edge function
// which validates the session token server-side before performing any DB operation.

import { getSessionToken, getUserEmail, createSession, validateSession } from '@/lib/eliteUtils';

// Coalesce concurrent session recreation so parallel CRM calls share ONE new token.
// Without this, two parallel 401s each trigger createSession, and the second call
// invalidates the first token (manage-session 'create' deactivates prior sessions).
let _recoveryPromise: Promise<string | null> | null = null;
let _validationPromise: Promise<string | null> | null = null;

function recoverSession(): Promise<string | null> {
  if (_recoveryPromise) return _recoveryPromise;
  const email = getUserEmail();
  if (!email) return Promise.resolve(null);
  console.log('[CRM] Session invalid, recreating for', email);
  _recoveryPromise = createSession(email).finally(() => {
    // Release lock on next tick so concurrent callers awaiting it all see the same token
    setTimeout(() => { _recoveryPromise = null; }, 0);
  });
  return _recoveryPromise;
}

function ensureValidSession(): Promise<string | null> {
  if (_validationPromise) return _validationPromise;

  _validationPromise = (async () => {
    const token = getSessionToken();

    if (!token) {
      return recoverSession();
    }

    const isValid = await validateSession();
    if (isValid) return token;

    return recoverSession();
  })().finally(() => {
    setTimeout(() => {
      _validationPromise = null;
    }, 0);
  });

  return _validationPromise;
}

async function crmRequest(action: string, params: Record<string, any> = {}) {
  const email = getUserEmail();
  const token = getSessionToken();
  
  if (!email && !token) {
    console.log(`[CRM] No user session found. Skipping API request for action: ${action}`);
    return { success: true, data: [] };
  }

  const { supabase } = await import('@/integrations/supabase/client');

  const invoke = async (tk: string | null) => {
    try {
      const { data, error } = await supabase.functions.invoke('crm-api', {
        body: { action, session_token: tk, ...params },
      });
      return { data, error, status: 200 };
    } catch (e: any) {
      // supabase-js throws FunctionsHttpError on non-2xx. Try to extract response body.
      let body: any = null;
      const status: number = e?.context?.status || e?.status || 0;
      try {
        if (typeof e?.context?.json === 'function') body = await e.context.json();
        else if (typeof e?.context?.text === 'function') {
          const t = await e.context.text();
          try { body = JSON.parse(t); } catch { body = { error: t }; }
        }
      } catch { /* stream may already be consumed */ }
      return { data: body, error: body ? null : e, status };
    }
  };

  const initialToken = await ensureValidSession();
  let result = await invoke(initialToken);

  const isSessionError =
    (result.data && !result.data.success && /sess[aã]o|invalid|expirada|unauthor/i.test(String(result.data.error || ''))) ||
    result.status === 401 ||
    (result.error && /401|invalid|expirada|unauthor|non-2xx/i.test(String(result.error?.message || '')));

  if (isSessionError) {
    const newToken = await recoverSession();
    if (newToken) {
      result = await invoke(newToken);
    } else {
      console.warn('[CRM] Session invalid and email is missing or recover failed, clearing local session.');
      localStorage.removeItem("elite_login_date");
      clearSessionToken();
    }
  }

  const isListAction = action.endsWith('_list');

  if (result.error) {
    const errMsg = result.error.message || 'Erro na requisição CRM';
    console.warn(`[CRM] Request error for action ${action}:`, errMsg);
    if (isListAction) {
      return { success: false, error: errMsg, data: [] };
    }
    throw new Error(errMsg);
  }

  if (result.data && !result.data.success) {
    const errMsg = result.data.error || 'Erro na operação CRM';
    console.warn(`[CRM] Operation error for action ${action}:`, errMsg);
    if (isListAction) {
      return { success: false, error: errMsg, data: [] };
    }
    throw new Error(errMsg);
  }

  return result.data;
}

// ═══ LEADS ═══
export async function fetchLeads() {
  const result = await crmRequest('leads_list');
  return result.data || [];
}

export async function insertLead(payload: any) {
  return crmRequest('leads_insert', { payload });
}

export async function updateLead(id: string, payload: any) {
  return crmRequest('leads_update', { id, payload });
}

export async function deleteLead(id: string) {
  return crmRequest('leads_delete', { id });
}

// ═══ TASKS ═══
export async function fetchTasks() {
  const result = await crmRequest('tasks_list');
  return result.data || [];
}

export async function insertTask(payload: any) {
  return crmRequest('tasks_insert', { payload });
}

export async function updateTask(id: string, payload: any) {
  return crmRequest('tasks_update', { id, payload });
}

export async function deleteTask(id: string) {
  return crmRequest('tasks_delete', { id });
}

// ═══ CONSTRUTORAS ═══
export async function fetchConstrutoras() {
  const result = await crmRequest('construtoras_list');
  return result.data || [];
}

export async function insertConstrutora(payload: any) {
  return crmRequest('construtoras_insert', { payload });
}

export async function updateConstrutora(id: string, payload: any) {
  return crmRequest('construtoras_update', { id, payload });
}

export async function deleteConstrutora(id: string) {
  return crmRequest('construtoras_delete', { id });
}

// ═══ ACTIVITY LOG ═══
export async function fetchActivities(lead_id?: string) {
  const result = await crmRequest('activity_list', lead_id ? { lead_id } : {});
  return result.data || [];
}

export async function insertActivity(payload: any) {
  return crmRequest('activity_insert', { payload });
}
