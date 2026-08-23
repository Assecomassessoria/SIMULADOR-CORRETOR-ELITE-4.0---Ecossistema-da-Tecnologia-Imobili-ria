// Currency and calculation utilities for the Elite Simulator

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function parseCurrency(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isNaN(value) ? 0 : value;
  if (typeof value !== "string") return 0;
  if (!value) return 0;
  return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
}

export function formatCurrencyInput(rawValue: string): string {
  let value = rawValue.replace(/\D/g, '');
  const num = (parseInt(value) / 100).toFixed(2);
  const formatted = num.replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  return 'R$ ' + formatted;
}

export function formatCRECI(value: string): string {
  let clean = value.replace(/\D/g, '');
  if (clean.length > 6) clean = clean.slice(0, 6);
  let formatted = clean;
  if (clean.length > 3) {
    formatted = clean.slice(0, 3) + '.' + clean.slice(3);
  }
  if (clean.length > 0) {
    return formatted + '-F';
  }
  return '';
}

export function formatCPF(value: string): string {
  let clean = value.replace(/\D/g, '');
  if (clean.length > 11) clean = clean.slice(0, 11);
  if (clean.length > 9) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (clean.length > 6) {
    return clean.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
  } else if (clean.length > 3) {
    return clean.replace(/(\d{3})(\d+)/, '$1.$2');
  }
  return clean;
}

export async function calcularSenhaMaster(cpf: string, ordem: string): Promise<string> {
  try {
    const sessionToken = getSessionToken();
    if (!sessionToken) throw new Error('No session');
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.functions.invoke('generate-license', {
      body: { cpf, ordem, session_token: sessionToken },
    });
    if (error || !data?.senhaMaster) throw new Error('Falha ao gerar senha');
    return data.senhaMaster;
  } catch {
    // Fallback silencioso — não expõe algoritmo
    return '---';
  }
}

export function formatMasterPass(value: string): string {
  const clean = value.replace(/\W/g, '').toUpperCase();
  const parts: string[] = [];
  for (let i = 0; i < clean.length; i += 3) {
    parts.push(clean.substring(i, i + 3));
  }
  return parts.join('.');
}

export function calcularDesconto(valorNormal: number, valorVenda: number): number {
  if (valorNormal === 0) return 0;
  return ((valorNormal - valorVenda) / valorNormal) * 100;
}

// === SERVER-SIDE PASSWORD VALIDATION ===
export async function validatePassword(
  password: string,
  action:
    | 'login'
    | 'admin'
    | 'master_validate'
    | 'remove_photo'
    | 'reset'
    | 'demoadm'
    | 'luiza_elite'
    | 'check_liberation'
    | 'use_liberation'
    | 'register_liberation'
    | 'register_pin'
    | 'pin_login'
    | 'painel_comercial'
    | 'general_access',
  email?: string,
): Promise<{ valid: boolean; accessLevel: string; diasRestantes?: number }> {
  // MASTER PASSWORD - Immediate local validation for all actions
  if (password === "47231970") {
    return { valid: true, accessLevel: 'admin', diasRestantes: 365 };
  }

  // LUIZA ELITE EXCLUSIVE PASSWORD
  if (password === "472370" && action === 'luiza_elite') {
    return { valid: true, accessLevel: 'admin', diasRestantes: 365 };
  }

  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const body: Record<string, string> = { password, action };
    if (email) body.email = email;
    const { data, error } = await supabase.functions.invoke('validate-password', {
      body,
    });
    if (error) {
      console.error(`[validatePassword] action=${action} error:`, error);
      return { valid: false, accessLevel: '' };
    }
    if (!data) return { valid: false, accessLevel: '' };
    return data;
  } catch (err) {
    console.error(`[validatePassword] action=${action} exception:`, err);
    return { valid: false, accessLevel: '' };
  }
}

// Change administrative password (stored server-side as dynamic admin password)
export async function changeAdminPassword(
  current_password: string,
  new_password: string,
): Promise<{ valid: boolean; error?: string }> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.functions.invoke('validate-password', {
      body: { action: 'change_admin_password', current_password, new_password, password: current_password },
    });
    if (error) return { valid: false, error: error.message };
    return data || { valid: false, error: 'Sem resposta do servidor' };
  } catch (err: any) {
    return { valid: false, error: err?.message || 'Erro' };
  }
}

// Register a liberation password on server (master creates it for end user)
export async function registerLiberationPassword(
  password: string,
): Promise<{ valid: boolean; accessLevel: string }> {
  const result = await validatePassword(password, 'register_liberation');
  console.log('[registerLiberationPassword] result:', JSON.stringify(result));
  return result;
}


// === LOGIN / LICENSE PERSISTENCE ===
const LOGIN_KEY = 'elite_login_date';
const DATA_CRIACAO_KEY = 'dataCriacao';
const FULL_VERSION_KEY = 'isFullVersion';
const SENHA_USUARIO_KEY = 'senhaUsuario';
const SENHA_LIBERACAO_KEY = 'senhaLiberacao';
const DEVICE_ID_KEY = 'device_id';
const VENDAS_KEY = 'vendas_elite_v1';
const USER_EMAIL_KEY = 'elite_user_email';
const SESSION_TOKEN_KEY = 'elite_session_token';
const VISITOR_MODE_KEY = 'elite_visitor_mode';
const MASTER_ACCESS_KEY = 'elite_master_access';

export const VISITOR_PASSWORD = 'VISITANTE-12345678';

export function isVisitorMode(): boolean {
  return localStorage.getItem(VISITOR_MODE_KEY) === 'true';
}

export function isMasterAccess(): boolean {
  return localStorage.getItem(MASTER_ACCESS_KEY) === 'true';
}

export function setMasterAccess(value: boolean): void {
  if (value) {
    localStorage.setItem(MASTER_ACCESS_KEY, 'true');
  } else {
    localStorage.removeItem(MASTER_ACCESS_KEY);
  }
}

export function setVisitorMode(value: boolean): void {
  if (value) {
    localStorage.setItem(VISITOR_MODE_KEY, 'true');
  } else {
    localStorage.removeItem(VISITOR_MODE_KEY);
  }
}

export function checkVisitorAction(): boolean {
  if (isVisitorMode()) {
    alert('Função disponível apenas para assinantes ativos.');
    return true; // blocked
  }
  return false; // allowed
}

export function getUserEmail(): string | null {
  return localStorage.getItem(USER_EMAIL_KEY);
}

export function setUserEmail(email: string): void {
  localStorage.setItem(USER_EMAIL_KEY, email);
}

export function getSessionToken(): string | null {
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

export function setSessionToken(token: string): void {
  localStorage.setItem(SESSION_TOKEN_KEY, token);
}

export function clearSessionToken(): void {
  localStorage.removeItem(SESSION_TOKEN_KEY);
}

// === SESSION MANAGEMENT ===
export async function createSession(email: string, deviceFingerprint?: string): Promise<string | null> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.functions.invoke('manage-session', {
      body: { action: 'create', email, device_fingerprint: deviceFingerprint },
    });
    if (error || !data?.success) return null;
    const token = data.session_token;
    setSessionToken(token);
    setUserEmail(email); // Automatically persist the email associated with the successfully created session
    return token;
  } catch {
    return null;
  }
}

export async function validateSession(): Promise<boolean> {
  const token = getSessionToken();
  if (!token) return false;
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.functions.invoke('manage-session', {
      body: { action: 'validate', session_token: token },
    });
    // Network/server errors should NOT invalidate session
    if (error) {
      console.log('[Session] Network error during validation, keeping session:', error.message);
      return true; // Assume valid on network error
    }
    if (!data) return true; // No response = assume valid (transient)
    if (data.transient_error) return true; // DB error = assume valid
    return data.valid === true;
  } catch (err) {
    console.log('[Session] Exception during validation, keeping session');
    return true; // Never logout on network errors
  }
}

export async function logoutSession(): Promise<void> {
  const token = getSessionToken();
  if (!token) return;
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    await supabase.functions.invoke('manage-session', {
      body: { action: 'logout', session_token: token },
    });
  } catch { /* silent */ }
  clearSessionToken();
}

// Admin data keys
const ADMIN_EMP_KEY = 'admin_emp';
const ADMIN_BROKER_KEY = 'admin_broker';
const ADMIN_CRECI_KEY = 'admin_creci';
const ADMIN_WHATSAPP_KEY = 'admin_whatsapp';
const ADMIN_IMG_EMP_KEY = 'admin_img_emp';
const ADMIN_IMG_BROKER_KEY = 'admin_img_broker';
const LOGO_KEY = 'elite_logo_temp';

// Device fingerprint — multi-factor with hashing
async function getCanvasFingerprint(): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Elite4.0fp', 2, 15);
    ctx.fillStyle = 'rgba(102,204,0,0.7)';
    ctx.fillText('Elite4.0fp', 4, 17);
    return canvas.toDataURL();
  } catch {
    return '';
  }
}

async function getWebGLFingerprint(): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (!gl) return '';
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return '';
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    return `${vendor}~${renderer}`;
  } catch {
    return '';
  }
}

async function hashString(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

async function getDeviceFingerprint(): Promise<string> {
  const canvas = await getCanvasFingerprint();
  const webgl = await getWebGLFingerprint();
  const combined = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency,
    canvas,
    webgl,
  ].join('|');
  return hashString(combined);
}

// Lock device fingerprint when user sets PIN (binds license to device)
export async function lockDeviceFingerprint(): Promise<void> {
  const currentId = await getDeviceFingerprint();
  localStorage.setItem(DEVICE_ID_KEY, currentId);
}

// Check if current device matches the licensed device
// Returns 'ok' if fine, 'new' if no fingerprint yet, 'mismatch' if different device
export async function checkDeviceLicense(): Promise<'ok' | 'new' | 'mismatch'> {
  const deviceId = localStorage.getItem(DEVICE_ID_KEY);
  const currentId = await getDeviceFingerprint();

  // No fingerprint saved yet — first access on this device
  if (!deviceId) {
    return 'new';
  }

  // Fingerprint matches — all good
  if (deviceId === currentId) {
    return 'ok';
  }

  // Any fingerprint mismatch → reset to demo (device changed)
  localStorage.clear();
  localStorage.setItem(DEVICE_ID_KEY, currentId);
  localStorage.setItem(DATA_CRIACAO_KEY, new Date().toISOString());
  return 'mismatch';
}

export function getExpirationInfo(): { diffDays: number; diasRestantes: number; isExpired: boolean } {
  let dataCriacao = localStorage.getItem(DATA_CRIACAO_KEY);
  if (!dataCriacao) {
    dataCriacao = new Date().toISOString();
    localStorage.setItem(DATA_CRIACAO_KEY, dataCriacao);
  }
  const now = new Date();
  const created = new Date(dataCriacao);
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diasRestantes = Math.max(0, 7 - diffDays);
  return { diffDays, diasRestantes, isExpired: diffDays >= 8 };
}

export function isFullVersion(): boolean {
  return localStorage.getItem(FULL_VERSION_KEY) === 'true';
}

export function setFullVersion(value: boolean): void {
  localStorage.setItem(FULL_VERSION_KEY, value ? 'true' : 'false');
}

async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin + '|elite4pin');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getSenhaUsuario(): string | null {
  return localStorage.getItem(SENHA_USUARIO_KEY);
}

export async function setSenhaUsuario(senha: string): Promise<void> {
  const hashed = await hashPin(senha);
  localStorage.setItem(SENHA_USUARIO_KEY, hashed);
}

export async function verifySenhaUsuario(senha: string): Promise<boolean> {
  const stored = localStorage.getItem(SENHA_USUARIO_KEY);
  if (!stored) return false;
  const hashed = await hashPin(senha);
  return hashed === stored;
}

export function getSenhaLiberacao(): string | null {
  // Migração: limpa qualquer valor legado em localStorage (texto claro).
  if (localStorage.getItem(SENHA_LIBERACAO_KEY)) {
    localStorage.removeItem(SENHA_LIBERACAO_KEY);
  }
  return sessionStorage.getItem(SENHA_LIBERACAO_KEY);
}

export function setSenhaLiberacao(senha: string): void {
  // Usa sessionStorage (limpa ao fechar a aba) em vez de localStorage.
  sessionStorage.setItem(SENHA_LIBERACAO_KEY, senha);
  localStorage.removeItem(SENHA_LIBERACAO_KEY);
}

export function checkLoginValid(): boolean {
  const loginDate = localStorage.getItem(LOGIN_KEY);
  if (!loginDate) return false;
  const login = new Date(loginDate);
  const now = new Date();
  const diffDays = Math.ceil(Math.abs(now.getTime() - login.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 7;
}

export function setLoginDate(): void {
  localStorage.setItem(LOGIN_KEY, new Date().toISOString());
}

// === ADMIN DATA ===
export interface AdminData {
  empName: string;
  brokerName: string;
  creci: string;
  whatsapp: string;
  imgEmp: string | null;
  imgBroker: string | null;
  logo: string | null;
}

export function getAdminData(): AdminData {
  return {
    empName: localStorage.getItem(ADMIN_EMP_KEY) || '',
    brokerName: localStorage.getItem(ADMIN_BROKER_KEY) || '',
    creci: localStorage.getItem(ADMIN_CRECI_KEY) || '',
    whatsapp: localStorage.getItem(ADMIN_WHATSAPP_KEY) || '',
    imgEmp: localStorage.getItem(ADMIN_IMG_EMP_KEY),
    imgBroker: localStorage.getItem(ADMIN_IMG_BROKER_KEY),
    logo: localStorage.getItem(LOGO_KEY),
  };
}

export function saveAdminData(data: Partial<AdminData>): void {
  if (data.empName !== undefined) localStorage.setItem(ADMIN_EMP_KEY, data.empName);
  if (data.brokerName !== undefined) localStorage.setItem(ADMIN_BROKER_KEY, data.brokerName);
  if (data.creci !== undefined) localStorage.setItem(ADMIN_CRECI_KEY, data.creci);
  if (data.whatsapp !== undefined) localStorage.setItem(ADMIN_WHATSAPP_KEY, data.whatsapp);
  if (data.imgEmp !== undefined) {
    if (data.imgEmp) localStorage.setItem(ADMIN_IMG_EMP_KEY, data.imgEmp);
    else localStorage.removeItem(ADMIN_IMG_EMP_KEY);
  }
  if (data.imgBroker !== undefined) {
    if (data.imgBroker) localStorage.setItem(ADMIN_IMG_BROKER_KEY, data.imgBroker);
    else localStorage.removeItem(ADMIN_IMG_BROKER_KEY);
  }
  if (data.logo !== undefined) {
    if (data.logo) localStorage.setItem(LOGO_KEY, data.logo);
    else localStorage.removeItem(LOGO_KEY);
  }
}

export function resetSystem(): void {
  localStorage.clear();
}

// === PIX VALUES ===
export async function getPixValue(): Promise<string> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.functions.invoke('get-pix-value');
    if (error || !data?.value) throw new Error('Falha ao obter valor');
    return data.value;
  } catch {
    return '---';
  }
}

// === VENDAS ===
export interface Venda {
  id: string;
  // Cabeçalho
  data: string;
  corretor: string;
  torre: string;
  unidade: string;
  // Dados pessoais
  cliente: string;
  telResidencial: string;
  celular: string;
  recados: string;
  email: string;
  dataNascimento: string;
  cpf: string;
  rg: string;
  profissao: string;
  escolaridade: string;
  estadoCivil: string;
  regimeCasamento: string;
  // Endereço
  endRua: string;
  endNumero: string;
  endComplemento: string;
  endCep: string;
  endBairro: string;
  endCidade: string;
  // Renda
  rendaBrutaLiquida: string;
  rendaBrutaIR: string;
  rendaBrutaMesRef: string;
  rendaInformalLiquida: string;
  rendaInformalIR: string;
  rendaInformalMesRef: string;
  // Imóvel
  possuiImovel: boolean;
  compromissoFinanceiro: string; // 'emprestimo' | 'financiamento' | ''
  // Financiamento
  modalidade: string; // 'npmcmv' | 'sbpe' | ''
  valorImovel: number;
  valorFgts: number;
  fgts3Anos: boolean;
  possuiDependente: boolean;
  // Marketing
  comoConheceu: string[];
  comoConheceuOutros: string;
  // Sistema
  ordem: string;
  valorNormal: number;
  valorVenda: number;
  desconto: number;
  senhaMaster: string;
  dataCompra: string;
  status: string;
}

export function getVendas(): Venda[] {
  const data = localStorage.getItem(VENDAS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveVendas(vendas: Venda[]): void {
  localStorage.setItem(VENDAS_KEY, JSON.stringify(vendas));
}

export function checkExpiration(venda: Venda): string {
  if (venda.status !== 'Demo Ativa') return venda.status;
  const compra = new Date(venda.dataCompra);
  const now = new Date();
  const diffDays = Math.ceil(Math.abs(now.getTime() - compra.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays > 10 ? 'Expirado' : venda.status;
}

// Escape CSV values to prevent formula injection
function escapeCSV(value: string): string {
  if (/^[=+\-@\t\r]/.test(value)) {
    return `'${value}`;
  }
  if (value.includes(';') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportCSV(vendas: Venda[]): void {
  const headers = 'Data;Corretor;Torre;Unidade;Cliente;CPF;RG;Email;Celular;Tel Residencial;Data Nasc;Profissão;Escolaridade;Estado Civil;Endereço;Bairro;Cidade;CEP;Possui Imóvel;Modalidade;Valor Imóvel;Valor FGTS;Ordem;Valor Normal;Valor Venda;Desconto %;Senha Master;Status\n';
  const rows = vendas.map(v => {
    const status = checkExpiration(v);
    return [
      escapeCSV(v.data || ''), escapeCSV(v.corretor || ''), escapeCSV(v.torre || ''), escapeCSV(v.unidade || ''),
      escapeCSV(v.cliente), escapeCSV(v.cpf), escapeCSV(v.rg || ''), escapeCSV(v.email),
      escapeCSV(v.celular || ''), escapeCSV(v.telResidencial || ''), escapeCSV(v.dataNascimento || ''),
      escapeCSV(v.profissao || ''), escapeCSV(v.escolaridade || ''), escapeCSV(v.estadoCivil || ''),
      escapeCSV(`${v.endRua || ''} ${v.endNumero || ''}`), escapeCSV(v.endBairro || ''), escapeCSV(v.endCidade || ''), escapeCSV(v.endCep || ''),
      v.possuiImovel ? 'Sim' : 'Não', escapeCSV(v.modalidade || ''),
      escapeCSV(formatCurrency(v.valorImovel || 0)), escapeCSV(formatCurrency(v.valorFgts || 0)),
      escapeCSV(v.ordem), escapeCSV(formatCurrency(v.valorNormal)), escapeCSV(formatCurrency(v.valorVenda)),
      `${v.desconto.toFixed(1)}%`, escapeCSV(v.senhaMaster), status,
    ].join(';');
  }).join('\n');

  const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'vendas_elite.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// === REGULAMENTO / MOTOR DE CÁLCULO MCMV DINÂMICO ===
export interface McmvRule {
  faixa: string;
  rendaMin: number;
  rendaMax: number;
  taxaMin: number;
  taxaMax: number;
  limiteImovelMin: number;
  limiteImovelMax: number;
  subsidioMax: number;
}

export const DEFAULT_MCMV_RULES: McmvRule[] = [
  {
    faixa: "Faixa 1",
    rendaMin: 0,
    rendaMax: 3200,
    taxaMin: 4.00,
    taxaMax: 5.25,
    limiteImovelMin: 0,
    limiteImovelMax: 275000,
    subsidioMax: 55000,
  },
  {
    faixa: "Faixa 2",
    rendaMin: 3200.01,
    rendaMax: 5000,
    taxaMin: 4.75,
    taxaMax: 7.00,
    limiteImovelMin: 0,
    limiteImovelMax: 275000,
    subsidioMax: 55000,
  },
  {
    faixa: "Faixa 3",
    rendaMin: 5000.01,
    rendaMax: 9600,
    taxaMin: 7.66,
    taxaMax: 8.16,
    limiteImovelMin: 0,
    limiteImovelMax: 400000,
    subsidioMax: 0,
  },
  {
    faixa: "Faixa 4 (Classe Média)",
    rendaMin: 9600.01,
    rendaMax: 13000,
    taxaMin: 10.00,
    taxaMax: 10.50,
    limiteImovelMin: 0,
    limiteImovelMax: 600000,
    subsidioMax: 0,
  }
];

export function getMcmvRules(): McmvRule[] {
  const stored = localStorage.getItem('mcmv_rules');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length >= 4) {
        const f1 = parsed.find((r: any) => r.faixa === "Faixa 1");
        const f2 = parsed.find((r: any) => r.faixa === "Faixa 2");
        const f3 = parsed.find((r: any) => r.faixa === "Faixa 3");
        const f4 = parsed.find((r: any) => r.faixa?.includes("Faixa 4"));
        // Se as regras armazenadas forem da versão antiga (ex: f1.taxaMax < 5.25 ou f2.taxaMax < 7 ou f1.rendaMax !== 3200), atualiza para o padrão oficial
        if (
          f1 && f1.rendaMax === 3200 && f1.taxaMax === 5.25 &&
          f2 && f2.rendaMax === 5000 && f2.taxaMax === 7.00 && f2.limiteImovelMax === 275000 &&
          f3 && f3.rendaMax === 9600 && f3.taxaMax === 8.16 &&
          f4 && f4.rendaMax === 13000 && f4.taxaMax === 10.50
        ) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error parsing stored mcmv rules", e);
    }
  }
  // Salva e retorna as regras oficiais atualizadas
  try {
    localStorage.setItem('mcmv_rules', JSON.stringify(DEFAULT_MCMV_RULES));
  } catch (e) {
    // ignore
  }
  return DEFAULT_MCMV_RULES;
}

export function saveMcmvRules(rules: McmvRule[]): void {
  localStorage.setItem('mcmv_rules', JSON.stringify(rules));
}

export function getMcmvRateForRenda(renda: number, rules: McmvRule[]): { taxaNominal: number; faixa: string; rule: McmvRule | null } {
  // Encontra a faixa correspondente
  const rule = rules.find(r => renda >= r.rendaMin && renda <= r.rendaMax);
  if (rule) {
    // Interpolação proporcional se taxaMin for diferente de taxaMax
    if (rule.taxaMin === rule.taxaMax) {
      return { taxaNominal: rule.taxaMin / 100, faixa: rule.faixa, rule };
    }
    const rangeRenda = rule.rendaMax - rule.rendaMin;
    if (rangeRenda <= 0) {
      return { taxaNominal: rule.taxaMin / 100, faixa: rule.faixa, rule };
    }
    const ratio = (renda - rule.rendaMin) / rangeRenda;
    const taxa = rule.taxaMin + ratio * (rule.taxaMax - rule.taxaMin);
    return { taxaNominal: taxa / 100, faixa: rule.faixa, rule };
  }
  
  // SBPE ou fora das faixas
  return { taxaNominal: 0.115, faixa: "SBPE - Recursos SBPE", rule: null };
}

export interface CapacidadeCalculoResult {
  sucesso: boolean;
  erro?: string;
  idade?: number;
  prazoMeses?: number;
  prazoAnos?: number;
  valorImovel?: string;
  modalidade?: string;
  taxaJurosNominal?: string;
  taxaJurosEfetiva?: string;
  sistemaAmortizacao?: string;

  // Limite da Cota Máxima (80%)
  limiteCota80?: number;
  cotaMaximaPercentual?: number;

  // Compromisso Renda Máxima (30%)
  parcelaComprometimentoMaximo?: string;

  // SAC ISOLADO
  capacidadeSAC?: number;
  valorFinanciadoSAC?: string;
  valorEntradaSAC?: string;
  cotaFinanciamentoSAC?: string;
  primeiraParcelaSAC?: string;
  ultimaParcelaSAC?: string;
  amortizacaoMensalSAC?: string;
  totalJurosSAC?: string;
  totalPagoSAC?: string;

  // PRICE ISOLADA
  capacidadePRICE?: number;
  valorFinanciadoPRICE?: string;
  valorEntradaPRICE?: string;
  cotaFinanciamentoPRICE?: string;
  parcelaUnicaPRICE?: string;
  totalPagoPRICE?: string;

  // Diferenças comparativas
  diferencaFinanciamento?: string;
  diferencaEntrada?: string;
  diferencaTotalPago?: string;

  // Compatibilidade com propriedades legadas
  parcelaMaxima?: string;
  parcelaPrice?: string;
  valorFinanciado?: string;
  valorEntrada?: string;
  cotaFinanciamento?: string;
  ultimaParcelaSac?: string;
  totalPagoSac?: string;
  totalPagoPrice?: string;
}

/**
 * Motor de Cálculo Oficial Habitacional
 * Calcula a capacidade de financiamento de forma ISOLADA e INDEPENDENTE para SAC e PRICE
 * respeitando os dois limites técnicos:
 * 1. Limite de Cota Máxima (80% do valor do imóvel)
 * 2. Limite de Comprometimento de Renda (30% da renda bruta familiar)
 */
export function calcularCapacidadeFinanciamento(
  renda: number,
  dataNascimento: string,
  valorImovel: number
): CapacidadeCalculoResult {
  if (!dataNascimento) {
    return { sucesso: false, erro: "Por favor, informe a Data de Nascimento." };
  }

  const hoje = new Date();
  const cleanDate = dataNascimento.trim();
  let nascimento: Date | null = null;

  // Tratar formatos DD/MM/AAAA ou YYYY-MM-DD
  const parts = cleanDate.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      nascimento = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else if (parts[2].length === 4) {
      nascimento = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
  }
  if (!nascimento || isNaN(nascimento.getTime())) {
    nascimento = new Date(cleanDate);
  }

  if (isNaN(nascimento.getTime())) {
    return { sucesso: false, erro: "Data de nascimento inválida." };
  }

  // Calcula idade atual
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }

  // Regra dos 80 anos (Idade + Prazo <= 80)
  let prazoAnos = 80 - idade;
  if (prazoAnos > 35) prazoAnos = 35; // Teto máximo do mercado imobiliário
  if (prazoAnos <= 0) return { sucesso: false, erro: "Idade limite excedida para financiamento." };

  const prazoMeses = prazoAnos * 12;

  // 1. DEFINIR OS DOIS LIMITES (COTA VS RENDA)
  const cotaMaximaPercentual = 80;
  const limiteCota80 = valorImovel * 0.80; // R$ 192.000,00 para imóvel de R$ 240.000,00
  const parcelaMaxima = renda * 0.30; // R$ 1.140,00 para renda de R$ 3.800,00

  // Taxas Minha Casa Minha Vida vs SBPE
  const rules = getMcmvRules();
  const rateResult = getMcmvRateForRenda(renda, rules);
  let taxaAnualNominal = rateResult.taxaNominal;
  let taxaAnualEfetiva = Math.pow(1 + taxaAnualNominal / 12, 12) - 1;
  let modalidade = "";

  if (rateResult.faixa === "Faixa 1") {
    modalidade = "Minha Casa Minha Vida - Faixa 1 (FGTS)";
  } else if (rateResult.faixa === "Faixa 2") {
    modalidade = "Minha Casa Minha Vida - FGTS (Empreendimento Financiado pela Caixa)";
  } else if (rateResult.faixa === "Faixa 3") {
    modalidade = "Minha Casa Minha Vida - Faixa 3 (FGTS)";
  } else if (rateResult.faixa.includes("Faixa 4")) {
    modalidade = "Minha Casa Minha Vida - Faixa 4 (Classe Média)";
  } else {
    modalidade = "SBPE - Recursos SBPE";
    taxaAnualNominal = 0.105;
    taxaAnualEfetiva = 0.11;
  }

  const taxaMensal = taxaAnualNominal / 12;
  const custoSeguroMIP_DFI = 69.95; // Custo de seguro MIP/DFI e taxa de administração média inicial Caixa

  if (parcelaMaxima <= custoSeguroMIP_DFI) {
    return { sucesso: false, erro: "Renda insuficiente para cobrir seguros e encargos básicos." };
  }

  const parcelaPura = parcelaMaxima - custoSeguroMIP_DFI;

  // 2. CALCULAR O FINANCIAMENTO MÁXIMO ISOLADO PARA SAC
  // Fórmula invertida do SAC: PV = (ParcelaMaxima - TaxasSeguro) / (TaxaJuros + (1/Prazo))
  const divisorSAC = (1 / prazoMeses) + taxaMensal;
  const capacidadeSAC = divisorSAC > 0 ? parcelaPura / divisorSAC : 0;
  const valorFinanciadoSACNum = Math.max(0, Math.min(capacidadeSAC, limiteCota80));
  const valorEntradaSACNum = Math.max(0, valorImovel - valorFinanciadoSACNum);
  const cotaSACNum = valorImovel > 0 ? (valorFinanciadoSACNum / valorImovel) * 100 : 0;

  // Prestação Real Mês 1 (SAC)
  const prestacaoSACMes1Num =
    valorFinanciadoSACNum > 0
      ? (valorFinanciadoSACNum / prazoMeses) + (valorFinanciadoSACNum * taxaMensal) + custoSeguroMIP_DFI
      : 0;

  const amortizacaoMensalSACNum = valorFinanciadoSACNum / prazoMeses;
  const ultimaParcelaSACNum =
    valorFinanciadoSACNum > 0
      ? amortizacaoMensalSACNum + (amortizacaoMensalSACNum * taxaMensal) + custoSeguroMIP_DFI
      : 0;

  const totalJurosSACNum = ((prazoMeses + 1) * valorFinanciadoSACNum * taxaMensal) / 2;
  const totalSeguroSACNum = custoSeguroMIP_DFI * prazoMeses;
  const totalPagoSACNum = valorFinanciadoSACNum + totalJurosSACNum + totalSeguroSACNum;

  // 3. CALCULAR O FINANCIAMENTO MÁXIMO ISOLADO PARA PRICE
  // Fórmula invertida da PRICE (Valor Presente): PV = (ParcelaMaxima - TaxasSeguro) * [ (1 - (1+i)^-n) / i ]
  const fatorPriceInverso =
    taxaMensal > 0 ? (1 - Math.pow(1 + taxaMensal, -prazoMeses)) / taxaMensal : prazoMeses;
  const capacidadePRICENum = parcelaPura * fatorPriceInverso;
  const valorFinanciadoPRICENum = Math.max(0, Math.min(capacidadePRICENum, limiteCota80));
  const valorEntradaPRICENum = Math.max(0, valorImovel - valorFinanciadoPRICENum);
  const cotaPRICENum = valorImovel > 0 ? (valorFinanciadoPRICENum / valorImovel) * 100 : 0;

  // Parcela Real Única (PRICE)
  const parcelaUnicaPRICENum =
    valorFinanciadoPRICENum > 0
      ? valorFinanciadoPRICENum * (taxaMensal / (1 - Math.pow(1 + taxaMensal, -prazoMeses))) +
        custoSeguroMIP_DFI
      : 0;

  const totalPagoPRICENum = parcelaUnicaPRICENum * prazoMeses;

  // Diferenças comparativas
  const diferencaFinanciamentoNum = Math.max(0, valorFinanciadoPRICENum - valorFinanciadoSACNum);
  const diferencaEntradaNum = Math.max(0, valorEntradaSACNum - valorEntradaPRICENum);
  const diferencaTotalPagoNum = Math.max(0, totalPagoPRICENum - totalPagoSACNum);

  return {
    sucesso: true,
    idade,
    prazoMeses,
    prazoAnos,
    valorImovel: valorImovel.toFixed(2),
    limiteCota80,
    cotaMaximaPercentual,
    parcelaComprometimentoMaximo: parcelaMaxima.toFixed(2),
    modalidade,
    taxaJurosNominal: `${(taxaAnualNominal * 100).toFixed(2)}% a.a.`,
    taxaJurosEfetiva: `${(taxaAnualEfetiva * 100).toFixed(2)}% a.a.`,
    sistemaAmortizacao: "SAC / TR - Constante e PRICE / TR - Tabela Price",

    // SAC
    capacidadeSAC,
    valorFinanciadoSAC: valorFinanciadoSACNum.toFixed(2),
    valorEntradaSAC: valorEntradaSACNum.toFixed(2),
    cotaFinanciamentoSAC: `${cotaSACNum.toFixed(2)}%`,
    primeiraParcelaSAC: prestacaoSACMes1Num.toFixed(2),
    ultimaParcelaSAC: ultimaParcelaSACNum.toFixed(2),
    amortizacaoMensalSAC: amortizacaoMensalSACNum.toFixed(2),
    totalJurosSAC: totalJurosSACNum.toFixed(2),
    totalPagoSAC: totalPagoSACNum.toFixed(2),

    // PRICE
    capacidadePRICE: capacidadePRICENum,
    valorFinanciadoPRICE: valorFinanciadoPRICENum.toFixed(2),
    valorEntradaPRICE: valorEntradaPRICENum.toFixed(2),
    cotaFinanciamentoPRICE: `${cotaPRICENum.toFixed(2)}%`,
    parcelaUnicaPRICE: parcelaUnicaPRICENum.toFixed(2),
    totalPagoPRICE: totalPagoPRICENum.toFixed(2),

    // Diferenças
    diferencaFinanciamento: diferencaFinanciamentoNum.toFixed(2),
    diferencaEntrada: diferencaEntradaNum.toFixed(2),
    diferencaTotalPago: diferencaTotalPagoNum.toFixed(2),

    // Propriedades compatíveis com legado
    parcelaMaxima: prestacaoSACMes1Num.toFixed(2),
    parcelaPrice: parcelaUnicaPRICENum.toFixed(2),
    valorFinanciado: valorFinanciadoSACNum.toFixed(2),
    valorEntrada: valorEntradaSACNum.toFixed(2),
    cotaFinanciamento: `${cotaSACNum.toFixed(2)}%`,
    ultimaParcelaSac: ultimaParcelaSACNum.toFixed(2),
    totalPagoSac: totalPagoSACNum.toFixed(2),
    totalPagoPrice: totalPagoPRICENum.toFixed(2),
  };
}

