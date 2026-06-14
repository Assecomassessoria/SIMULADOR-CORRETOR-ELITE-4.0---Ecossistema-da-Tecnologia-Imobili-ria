/**
 * Integração com CRMs externos via webhook.
 * Configuração persistida em localStorage (gerenciada no AdminPanel).
 * Provedores suportados out-of-the-box: CV CRM (Construtor de Vendas),
 * Anapro, e um slot "Personalizado" (genérico HTTP POST JSON).
 *
 * Cada provedor tem um adapter que monta o payload no formato esperado
 * pelo destino. Falhas são silenciosas (apenas console.warn) para não
 * bloquear o fluxo de cadastro do lead no CRM interno.
 */

export type CrmProvider = "cvcrm" | "anapro" | "custom";

export interface CrmWebhookConfig {
  enabled: boolean;
  url: string;
  token?: string; // Bearer / api-key (header)
  /** Nome amigável apenas para o slot "custom". */
  label?: string;
}

export type CrmWebhooksConfig = Record<CrmProvider, CrmWebhookConfig>;

const STORAGE_KEY = "elite_crm_webhooks_v1";

export const DEFAULT_WEBHOOKS: CrmWebhooksConfig = {
  cvcrm: { enabled: false, url: "", token: "" },
  anapro: { enabled: false, url: "", token: "" },
  custom: { enabled: false, url: "", token: "", label: "CRM Personalizado" },
};

export const PROVIDER_META: Record<CrmProvider, { name: string; hint: string }> = {
  cvcrm: {
    name: "CV CRM (Construtor de Vendas)",
    hint: "Cole a URL do webhook gerada no painel do CV CRM (Integrações → Webhook).",
  },
  anapro: {
    name: "Anapro",
    hint: "URL do endpoint Anapro para captura de leads (geralmente /api/v1/leads).",
  },
  custom: {
    name: "CRM Personalizado",
    hint: "Qualquer endpoint HTTP que aceite POST JSON. Útil para n8n, Zapier, Make ou CRM próprio.",
  },
};

export function getCrmWebhooks(): CrmWebhooksConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_WEBHOOKS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_WEBHOOKS, ...parsed };
  } catch {
    return { ...DEFAULT_WEBHOOKS };
  }
}

export function saveCrmWebhooks(cfg: CrmWebhooksConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

// ════════════════════════════════════════════════════════════════
// Adapters: convertem o lead interno no payload de cada CRM.
// ════════════════════════════════════════════════════════════════

interface LeadLike {
  nome?: string;
  email?: string;
  whatsapp?: string;
  cpf_cnpj?: string;
  origem?: string;
  estagio?: string;
  valor_negociacao?: number;
  observacoes?: string;
  responsavel?: string;
  construtora_id?: string | null;
  [k: string]: any;
}

function buildPayload(provider: CrmProvider, lead: LeadLike, event: string) {
  const base = {
    event, // "lead.created" | "lead.updated" | "test"
    source: "Simulador Corretor Elite",
    timestamp: new Date().toISOString(),
  };

  switch (provider) {
    case "cvcrm":
      return {
        ...base,
        nome: lead.nome,
        email: lead.email,
        telefone: lead.whatsapp,
        cpf: lead.cpf_cnpj,
        origem: lead.origem || "Simulador Elite",
        etapa: lead.estagio,
        valor: lead.valor_negociacao,
        observacao: lead.observacoes,
        corretor_email: lead.responsavel,
      };
    case "anapro":
      return {
        ...base,
        Nome: lead.nome,
        Email: lead.email,
        Telefone: lead.whatsapp,
        CPF: lead.cpf_cnpj,
        Midia: lead.origem || "Simulador Elite",
        Estagio: lead.estagio,
        ValorNegociacao: lead.valor_negociacao,
        Observacao: lead.observacoes,
        Corretor: lead.responsavel,
      };
    case "custom":
    default:
      return { ...base, lead };
  }
}

// ════════════════════════════════════════════════════════════════
// Dispatch
// ════════════════════════════════════════════════════════════════

async function postOne(
  provider: CrmProvider,
  cfg: CrmWebhookConfig,
  lead: LeadLike,
  event: string,
): Promise<{ ok: boolean; status?: number; error?: string }> {
  if (!cfg.enabled || !cfg.url) return { ok: false, error: "disabled" };
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (cfg.token) {
      headers["Authorization"] = cfg.token.startsWith("Bearer ") ? cfg.token : `Bearer ${cfg.token}`;
      headers["x-api-key"] = cfg.token;
    }
    const res = await fetch(cfg.url, {
      method: "POST",
      mode: "cors",
      headers,
      body: JSON.stringify(buildPayload(provider, lead, event)),
    });
    return { ok: res.ok, status: res.status };
  } catch (e: any) {
    return { ok: false, error: e?.message || "network error" };
  }
}

/** Dispara para TODOS os webhooks ativos (paralelo, falha silenciosa). */
export async function dispatchLeadToCrms(lead: LeadLike, event: "lead.created" | "lead.updated") {
  const cfg = getCrmWebhooks();
  const tasks: Promise<unknown>[] = [];
  (Object.keys(cfg) as CrmProvider[]).forEach((p) => {
    const c = cfg[p];
    if (c.enabled && c.url) {
      tasks.push(
        postOne(p, c, lead, event).then((r) => {
          if (!r.ok) console.warn(`[CRM ${p}] webhook falhou:`, r);
        }),
      );
    }
  });
  await Promise.allSettled(tasks);
}

/** Testa UM provedor com um lead de exemplo. */
export async function testCrmWebhook(provider: CrmProvider, cfg: CrmWebhookConfig) {
  const sampleLead: LeadLike = {
    nome: "Lead de Teste - Simulador Elite",
    email: "teste@simuladorcorretorelite.com.br",
    whatsapp: "(11) 99999-0000",
    cpf_cnpj: "000.000.000-00",
    origem: "Teste de Integração",
    estagio: "Novo",
    valor_negociacao: 250000,
    observacoes: "Disparo de teste a partir do painel administrativo.",
    responsavel: "admin@simuladorcorretorelite.com.br",
  };
  return postOne(provider, cfg, sampleLead, "test");
}
