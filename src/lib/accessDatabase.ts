import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  onSnapshot,
  serverTimestamp,
  type Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db, auth, handleFirestoreError, OperationType } from "@/lib/firebase";
import { isAdminEmail } from "@/lib/eliteUtils";

export type CorretorTipo = "corretor" | "cliente";
export type ModalidadeCorretor = "individual" | "imobiliaria";
export type TipoContaTenant = "imobiliaria" | "autonomo" | "adm";
export type PapelMultiTenant = "master_adm" | "admin_imobiliaria" | "corretor" | "cliente";
export type PlanoTipo = "mensal" | "semestral" | "anual" | "anual_completo" | "imobiliaria";
export type PlanoImobiliariaTipo = "plano01" | "plano02" | "plano03" | "plano04" | "plano05" | "master";
export type AccessStatus = "ativo" | "pendente_pagamento" | "bloqueado" | "expirado";
export type AdministrativoTipo = "adm" | "imobiliaria";

export interface PlanoImobiliariaOption {
  value: PlanoImobiliariaTipo;
  label: string;
  max: number;
}

export const PLANOS_IMOBILIARIA: readonly PlanoImobiliariaOption[] = [
  { value: "plano01", label: "Plano 01 - 01 a 05 Usuários", max: 5 },
  { value: "plano02", label: "Plano 02 - 01 a 10 Usuários", max: 10 },
  { value: "plano03", label: "Plano 03 - 01 a 15 Usuários", max: 15 },
  { value: "plano04", label: "Plano 04 - 01 a 20 Usuários", max: 20 },
  { value: "plano05", label: "Plano 05 - 01 a 30 Usuários", max: 30 },
  { value: "master", label: "Plano Master - Acima de 31 Usuários", max: 50 },
] as const;

export function getPlanoImobiliariaInfo(plano?: string): PlanoImobiliariaOption {
  return PLANOS_IMOBILIARIA.find((p) => p.value === plano) || PLANOS_IMOBILIARIA[0];
}

export function generateAgencyCodigoCadastro(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `IMOB-${num}`;
}

export function generateCorretorCodigo(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `CORR-${num}`;
}

export function generateAgencySenhaAcesso(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ELITE-${result}`;
}

export function addDaysToIsoDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface CorretorEliteRecord {
  id: string;
  codigoCorretor?: string;
  tenantId?: string;
  tipoConta?: "autonomo" | "imobiliaria";
  papel?: "corretor" | "cliente";
  nome: string;
  email: string;
  tipo: CorretorTipo;
  modalidade?: ModalidadeCorretor;
  cpfCnpj?: string;
  creci?: string;
  telefone?: string;
  imobiliariaId?: string;
  imobiliariaCodigo?: string;
  imobiliariaNome?: string;
  imobiliariaEmail?: string;
  googleSubId?: string;
  senhaPessoalConfigurada?: boolean;
  pinHash?: string;
  plano: PlanoTipo;
  pagamentoConfirmado: boolean;
  origemPagamento: string;
  comprovanteRef?: string;
  autorizado: boolean;
  status: AccessStatus;
  validadeAte?: string;
  observacoes?: string;
  createdBy: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface AdministrativoRecord {
  id: string;
  tenantId?: string;
  codigoCadastro?: string;
  tipo: AdministrativoTipo;
  tipoConta?: "adm" | "imobiliaria";
  papel?: "master_adm" | "admin_imobiliaria";
  nome: string;
  email: string;
  googleSubId?: string;
  senhaPessoalConfigurada?: boolean;
  plano?: PlanoImobiliariaTipo;
  planoLabel?: string;
  senhaAcesso?: string;
  cpfCnpj?: string;
  creciJuridico?: string;
  responsavel?: string;
  telefone?: string;
  cidade?: string;
  limiteCorretores?: number;
  pagamentoConfirmado: boolean;
  autorizado: boolean;
  status: AccessStatus;
  validadeAte?: string;
  observacoes?: string;
  createdBy: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface AccessAuthorizationResult {
  authorized: boolean;
  role: "master" | "adm" | "imobiliaria" | "corretor" | "cliente" | "none";
  code: "ok" | "not_registered" | "pending_payment" | "blocked" | "expired" | "unverified_email";
  message: string;
  recordId?: string;
  recordName?: string;
  plano?: string;
  tenantId?: string;
  codigoId?: string;
  tipoConta?: TipoContaTenant;
  papel?: PapelMultiTenant;
  imobiliariaCodigo?: string;
  imobiliariaNome?: string;
  collectionSource?: "administrativo" | "corretor_elite" | "master";
  senhaPessoalConfigurada?: boolean;
}

// Verbatim limits synchronized with firebase-blueprint.json
const VALID_ID_REGEX = /^[a-zA-Z0-9_-]+$/;
export const LIMITS = {
  id: 128,
  codigoCadastro: 32,
  codigoCorretor: 32,
  nome: 120,
  email: 254,
  planoLabel: 80,
  senhaAcesso: 32,
  cpfCnpj: 20,
  creci: 32,
  creciJuridico: 32,
  responsavel: 120,
  telefone: 30,
  cidade: 80,
  imobiliariaNome: 120,
  origemPagamento: 120,
  comprovanteRef: 120,
  validadeAte: 32,
  observacoes: 500,
  pinHash: 64,
  limiteCorretoresMax: 10000,
} as const;

export const DEFAULT_PAYMENT_ORIGIN = "simuladorcorretorelite.com.br";

function cleanOptString(value: string | undefined | null, maxLen: number): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLen);
}

function cleanReqString(value: string, maxLen: number): string {
  return value.trim().slice(0, maxLen);
}

function cleanCodeString(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const cleaned = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, LIMITS.codigoCadastro);
  return cleaned || undefined;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase().slice(0, LIMITS.email);
}

/**
 * Computes a deterministic 32-char lowercase hex ID from an email address.
 * Strictly satisfies ^[a-zA-Z0-9_-]+$ and <= 128 chars from firebase-blueprint.json.
 */
export async function computeEmailRecordId(email: string): Promise<string> {
  const normalized = normalizeEmail(email);
  const encoded = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex.slice(0, 32);
}

export async function hashBrokerPin(pin: string): Promise<string> {
  const encoded = new TextEncoder().encode(`${pin.trim()}|elite4brokerpin`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, LIMITS.pinHash);
}

function isDateExpired(validadeAte?: string): boolean {
  if (!validadeAte || !/^\d{4}-\d{2}-\d{2}$/.test(validadeAte.trim())) return false;
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate(),
  ).padStart(2, "0")}`;
  return validadeAte.trim() < todayIso;
}

/**
 * Self-binds the verified Firebase Auth UID (googleSubId) and personal password status
 * onto the user's own pre-registered contract record without touching RBAC or tenant keys.
 */
export async function bindAuthenticatedContractIdentity(
  collectionName: "administrativo" | "corretor_elite",
  recordId: string,
  uid: string,
  hasPassword: boolean,
): Promise<void> {
  if (!VALID_ID_REGEX.test(recordId) || !VALID_ID_REGEX.test(uid)) return;
  const path = `${collectionName}/${recordId}`;
  try {
    await updateDoc(doc(db, collectionName, recordId), {
      googleSubId: uid.slice(0, LIMITS.id),
      senhaPessoalConfigurada: Boolean(hasPassword),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    // Non-blocking audit notice; never breaks login if already bound
    console.warn(`[AccessDB] Contract identity bind notice (${path}):`, error);
  }
}

/**
 * Strictly validates whether an authenticated user (Google OAuth and/or Email+Password)
 * is pre-registered, verified, authorized, and payment-confirmed in Firestore,
 * returning their strict multi-tenant context (tenantId, codigoId, papel, tipoConta).
 */
export async function verifyGoogleUserAccess(user: User): Promise<AccessAuthorizationResult> {
  const email = normalizeEmail(user.email || "");
  if (!email || !user.emailVerified) {
    return {
      authorized: false,
      role: "none",
      code: "unverified_email",
      message:
        "Seu e-mail precisa estar confirmado para acessar o simulador. Clique no link enviado para sua caixa de entrada ou entre com Google.",
    };
  }

  const hasPasswordProvider = (user.providerData || []).some((p) => p.providerId === "password");

  // Bootstrapped Master / Admin emails always retain full administrative access
  if (isAdminEmail(email)) {
    return {
      authorized: true,
      role: "master",
      code: "ok",
      message: "Acesso Master / Administrativo autorizado.",
      recordId: user.uid,
      recordName: user.displayName || email,
      tenantId: "master_global",
      codigoId: "MASTER-ADM",
      tipoConta: "adm",
      papel: "master_adm",
      collectionSource: "master",
      senhaPessoalConfigurada: hasPasswordProvider,
    };
  }

  const recordId = await computeEmailRecordId(email);

  // 1. Check Banco Administrativo (ADM e Imobiliárias Pagantes)
  const admPath = `administrativo/${recordId}`;
  try {
    const admSnap = await getDoc(doc(db, "administrativo", recordId));
    if (admSnap.exists()) {
      const data = admSnap.data() as AdministrativoRecord;
      if (data.status === "bloqueado" || !data.autorizado) {
        return {
          authorized: false,
          role: "none",
          code: "blocked",
          message:
            "Seu cadastro administrativo/imobiliária está bloqueado ou aguardando liberação do Administrador.",
          recordName: data.nome,
        };
      }
      if (data.status === "expirado" || isDateExpired(data.validadeAte)) {
        return {
          authorized: false,
          role: "none",
          code: "expired",
          message:
            "A validade do seu plano/contrato expirou. Renove em simuladorcorretorelite.com.br para liberar o acesso.",
          recordName: data.nome,
        };
      }
      if (data.tipo === "imobiliaria" && (!data.pagamentoConfirmado || data.status === "pendente_pagamento")) {
        return {
          authorized: false,
          role: "none",
          code: "pending_payment",
          message:
            "Pagamento da imobiliária ainda não confirmado. Conclua o pagamento em simuladorcorretorelite.com.br e aguarde a liberação.",
          recordName: data.nome,
        };
      }
      if (data.status === "ativo" && data.autorizado) {
        if (data.googleSubId !== user.uid || Boolean(data.senhaPessoalConfigurada) !== hasPasswordProvider) {
          void bindAuthenticatedContractIdentity("administrativo", recordId, user.uid, hasPasswordProvider);
        }
        return {
          authorized: true,
          role: data.tipo,
          code: "ok",
          message:
            data.tipo === "adm"
              ? "Acesso Administrativo autorizado."
              : `Acesso Imobiliária autorizado (${data.nome}).`,
          recordId,
          recordName: data.nome,
          plano: data.planoLabel || data.plano,
          tenantId: data.tenantId || recordId,
          codigoId: data.codigoCadastro || (data.tipo === "adm" ? "ADM" : `IMOB-${recordId.slice(0, 4).toUpperCase()}`),
          tipoConta: data.tipo === "adm" ? "adm" : "imobiliaria",
          papel: data.tipo === "adm" ? "master_adm" : "admin_imobiliaria",
          collectionSource: "administrativo",
          senhaPessoalConfigurada: hasPasswordProvider || Boolean(data.senhaPessoalConfigurada),
        };
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (!msg.toLowerCase().includes("permission")) {
      handleFirestoreError(error, OperationType.GET, admPath);
    }
  }

  // 2. Check Banco Corretor Elite (Corretores Autônomos e Corretores Vinculados a Imobiliária)
  const corretorPath = `corretor_elite/${recordId}`;
  try {
    const corretorSnap = await getDoc(doc(db, "corretor_elite", recordId));
    if (corretorSnap.exists()) {
      const data = corretorSnap.data() as CorretorEliteRecord;
      if (data.status === "bloqueado" || !data.autorizado) {
        return {
          authorized: false,
          role: "none",
          code: "blocked",
          message:
            "Seu acesso está bloqueado ou pendente de autorização na plataforma. Entre em contato com o Administrativo ou sua Imobiliária.",
          recordName: data.nome,
        };
      }
      if (data.status === "expirado" || isDateExpired(data.validadeAte)) {
        return {
          authorized: false,
          role: "none",
          code: "expired",
          message:
            "Sua licença expirou. Renove sua assinatura na página principal simuladorcorretorelite.com.br.",
          recordName: data.nome,
        };
      }
      if (!data.pagamentoConfirmado || data.status === "pendente_pagamento") {
        return {
          authorized: false,
          role: "none",
          code: "pending_payment",
          message:
            "Cadastro localizado, mas aguardando confirmação de pagamento na página principal simuladorcorretorelite.com.br.",
          recordName: data.nome,
        };
      }
      if (data.status === "ativo" && data.autorizado && data.pagamentoConfirmado) {
        if (data.googleSubId !== user.uid || Boolean(data.senhaPessoalConfigurada) !== hasPasswordProvider) {
          void bindAuthenticatedContractIdentity("corretor_elite", recordId, user.uid, hasPasswordProvider);
        }
        const isAgencyLinked = data.modalidade === "imobiliaria" || Boolean(data.imobiliariaId);
        return {
          authorized: true,
          role: data.tipo,
          code: "ok",
          message: `Acesso autorizado (${data.tipo === "corretor" ? "Corretor Elite" : "Cliente Cadastrado"}).`,
          recordId,
          recordName: data.nome,
          plano: data.plano,
          tenantId: isAgencyLinked && data.imobiliariaId ? data.imobiliariaId : data.tenantId || recordId,
          codigoId: data.codigoCorretor || `CORR-${recordId.slice(0, 4).toUpperCase()}`,
          tipoConta: isAgencyLinked ? "imobiliaria" : "autonomo",
          papel: data.tipo,
          imobiliariaCodigo: data.imobiliariaCodigo,
          imobiliariaNome: data.imobiliariaNome,
          collectionSource: "corretor_elite",
          senhaPessoalConfigurada: hasPasswordProvider || Boolean(data.senhaPessoalConfigurada),
        };
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (!msg.toLowerCase().includes("permission")) {
      handleFirestoreError(error, OperationType.GET, corretorPath);
    }
  }

  return {
    authorized: false,
    role: "none",
    code: "not_registered",
    message:
      "E-mail não vinculado a nenhum contrato ativo. Somente Imobiliárias, Corretores e Clientes pré-cadastrados após confirmação de pagamento em simuladorcorretorelite.com.br podem acessar.",
  };
}

export const verifyAuthenticatedUserAccess = verifyGoogleUserAccess;

// === LIVE SUBSCRIPTIONS (Admin Panel) ===

export function subscribeCorretorElite(
  onData: (records: CorretorEliteRecord[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const path = "corretor_elite";
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: CorretorEliteRecord[] = snapshot.docs.map((d) => ({
        ...(d.data() as CorretorEliteRecord),
        id: d.id,
      }));
      list.sort((a, b) => {
        const ta = a.updatedAt?.toMillis?.() ?? 0;
        const tb = b.updatedAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError) onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    },
  );
}

export function subscribeAdministrativo(
  onData: (records: AdministrativoRecord[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const path = "administrativo";
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: AdministrativoRecord[] = snapshot.docs.map((d) => ({
        ...(d.data() as AdministrativoRecord),
        id: d.id,
      }));
      list.sort((a, b) => {
        const ta = a.updatedAt?.toMillis?.() ?? 0;
        const tb = b.updatedAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError) onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    },
  );
}

// === AGENCY PORTAL (PAINEL COMERCIAL — ID + SENHA DA IMOBILIÁRIA) ===

export async function verifyAgencyPortalCredentials(
  codigoInput: string,
  senhaInput: string,
): Promise<{ ok: boolean; agency?: AdministrativoRecord; error?: string }> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.email || !currentUser.emailVerified) {
    return {
      ok: false,
      error: "Conecte-se com a conta verificada (Google ou E-mail/Senha) da Imobiliária ou Master/ADM.",
    };
  }

  const cleanCode = cleanCodeString(codigoInput);
  const cleanSenha = senhaInput.trim();
  if (!cleanCode || !cleanSenha) {
    return { ok: false, error: "Informe o ID do Cadastro e a Senha da Imobiliária." };
  }

  const email = normalizeEmail(currentUser.email);

  // Master / Admin can open any agency by matching ID + Password
  if (isAdminEmail(email)) {
    try {
      const snap = await getDocs(collection(db, "administrativo"));
      const match = snap.docs
        .map((d) => ({ ...(d.data() as AdministrativoRecord), id: d.id }))
        .find(
          (item) =>
            item.tipo === "imobiliaria" &&
            (item.codigoCadastro || "").toUpperCase() === cleanCode &&
            (item.senhaAcesso || "") === cleanSenha,
        );
      if (!match) {
        return { ok: false, error: "ID do Cadastro ou Senha da Imobiliária não encontrados no banco Administrativo." };
      }
      return { ok: true, agency: match };
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "administrativo");
    }
  }

  // Standard agency owner: strictly isolated to own agency document matching verified email
  const agencyId = await computeEmailRecordId(email);
  const admPath = `administrativo/${agencyId}`;
  try {
    const snap = await getDoc(doc(db, "administrativo", agencyId));
    if (!snap.exists()) {
      return {
        ok: false,
        error: "Imobiliária não encontrada para esta conta. Verifique o e-mail vinculado ao contrato.",
      };
    }
    const agency = { ...(snap.data() as AdministrativoRecord), id: snap.id };
    if (agency.tipo !== "imobiliaria") {
      return { ok: false, error: "Este cadastro não pertence a uma Imobiliária." };
    }
    if ((agency.codigoCadastro || "").toUpperCase() !== cleanCode || (agency.senhaAcesso || "") !== cleanSenha) {
      return { ok: false, error: "ID do Cadastro ou Senha da Imobiliária incorretos." };
    }
    if (!agency.autorizado || agency.status === "bloqueado") {
      return { ok: false, error: "Esta imobiliária está bloqueada. Contate o Administrativo." };
    }
    if (!agency.pagamentoConfirmado || agency.status === "pendente_pagamento") {
      return {
        ok: false,
        error: "Pagamento pendente de confirmação em simuladorcorretorelite.com.br.",
      };
    }
    if (agency.status === "expirado" || isDateExpired(agency.validadeAte)) {
      return { ok: false, error: "O contrato desta imobiliária expirou." };
    }
    return { ok: true, agency };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, admPath);
  }
}

export async function listAgenciesForAdmin(): Promise<AdministrativoRecord[]> {
  try {
    const snap = await getDocs(collection(db, "administrativo"));
    return snap.docs
      .map((d) => ({ ...(d.data() as AdministrativoRecord), id: d.id }))
      .filter((item) => item.tipo === "imobiliaria");
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "administrativo");
  }
}

export function subscribeAgencyBrokers(
  agency: AdministrativoRecord,
  onData: (records: CorretorEliteRecord[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const path = "corretor_elite";
  const q = query(collection(db, path), where("imobiliariaEmail", "==", normalizeEmail(agency.email)));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: CorretorEliteRecord[] = snapshot.docs
        .map((d) => ({ ...(d.data() as CorretorEliteRecord), id: d.id }))
        .filter((r) => r.imobiliariaId === agency.id && (!r.tenantId || r.tenantId === agency.id));
      list.sort((a, b) => {
        const ta = a.updatedAt?.toMillis?.() ?? 0;
        const tb = b.updatedAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError) onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    },
  );
}

export async function registerAgencyBroker(
  agency: AdministrativoRecord,
  input: {
    nome: string;
    email: string;
    codigoCorretor?: string;
    cpfCnpj?: string;
    creci?: string;
    telefone?: string;
    pin?: string;
  },
): Promise<{ recordId: string; codigoCorretor: string }> {
  const uid = auth.currentUser?.uid;
  if (!uid || !VALID_ID_REGEX.test(uid)) {
    throw new Error("Sessão não autenticada para gravar no Firestore.");
  }

  const email = normalizeEmail(input.email);
  const nome = cleanReqString(input.nome, LIMITS.nome);
  if (nome.length < 2) throw new Error("Informe o nome completo do corretor.");
  if (!email.includes("@") || email.length < 3) {
    throw new Error("Informe o e-mail válido do corretor (será usado para login Google ou senha pessoal).");
  }

  const recordId = await computeEmailRecordId(email);
  const codigoCorretor = cleanCodeString(input.codigoCorretor) || generateCorretorCodigo();
  const path = `corretor_elite/${recordId}`;

  const payload: Record<string, unknown> = {
    id: recordId,
    codigoCorretor,
    tenantId: agency.id,
    tipoConta: "imobiliaria",
    papel: "corretor",
    nome,
    email,
    tipo: "corretor",
    modalidade: "imobiliaria",
    imobiliariaId: agency.id,
    imobiliariaNome: cleanReqString(agency.nome, LIMITS.imobiliariaNome),
    imobiliariaEmail: normalizeEmail(agency.email),
    plano: "imobiliaria",
    pagamentoConfirmado: true,
    origemPagamento: DEFAULT_PAYMENT_ORIGIN,
    autorizado: true,
    status: "ativo",
    createdBy: uid.slice(0, LIMITS.id),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const imobCode = cleanCodeString(agency.codigoCadastro);
  if (imobCode) payload.imobiliariaCodigo = imobCode;

  const cpfCnpj = cleanOptString(input.cpfCnpj, LIMITS.cpfCnpj);
  if (cpfCnpj) payload.cpfCnpj = cpfCnpj;

  const creci = cleanOptString(input.creci, LIMITS.creci);
  if (creci) payload.creci = creci;

  const telefone = cleanOptString(input.telefone, LIMITS.telefone);
  if (telefone) payload.telefone = telefone;

  if (input.pin && /^\d{6}$/.test(input.pin.trim())) {
    payload.pinHash = await hashBrokerPin(input.pin);
  }

  const validadeAte = cleanOptString(agency.validadeAte, LIMITS.validadeAte);
  if (validadeAte) payload.validadeAte = validadeAte;

  try {
    await setDoc(doc(db, "corretor_elite", recordId), payload);
    return { recordId, codigoCorretor };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function toggleAgencyBrokerStatus(recordId: string, currentlyActive: boolean): Promise<void> {
  if (!VALID_ID_REGEX.test(recordId)) throw new Error("ID de corretor inválido.");
  const path = `corretor_elite/${recordId}`;
  try {
    await updateDoc(doc(db, "corretor_elite", recordId), {
      autorizado: !currentlyActive,
      status: !currentlyActive ? "ativo" : "bloqueado",
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// === CRUD: CORRETOR ELITE (ADMIN PANEL) ===

export interface CorretorEliteInput {
  codigoCorretor?: string;
  nome: string;
  email: string;
  tipo: CorretorTipo;
  modalidade: ModalidadeCorretor;
  cpfCnpj?: string;
  creci?: string;
  telefone?: string;
  imobiliariaId?: string;
  imobiliariaCodigo?: string;
  imobiliariaNome?: string;
  imobiliariaEmail?: string;
  plano: PlanoTipo;
  pagamentoConfirmado: boolean;
  origemPagamento?: string;
  comprovanteRef?: string;
  autorizado: boolean;
  status: AccessStatus;
  validadeAte?: string;
  observacoes?: string;
}

export async function createCorretorElite(input: CorretorEliteInput): Promise<{ recordId: string; codigoCorretor: string }> {
  const uid = auth.currentUser?.uid;
  if (!uid || !VALID_ID_REGEX.test(uid)) {
    throw new Error("Conecte-se com sua conta Master/ADM para gravar no banco de dados.");
  }

  const email = normalizeEmail(input.email);
  const nome = cleanReqString(input.nome, LIMITS.nome);
  if (nome.length < 2) throw new Error("Informe um nome válido (mínimo 2 caracteres).");
  if (!email.includes("@") || email.length < 3) throw new Error("Informe um e-mail válido.");

  if (input.modalidade === "imobiliaria" && !input.imobiliariaId) {
    throw new Error("Selecione a imobiliária vinculada para esta modalidade.");
  }

  const recordId = await computeEmailRecordId(email);
  const codigoCorretor = cleanCodeString(input.codigoCorretor) || generateCorretorCodigo();
  const isAgency = input.modalidade === "imobiliaria";
  const imobiliariaId = isAgency ? cleanOptString(input.imobiliariaId, LIMITS.id) : undefined;
  const tenantId = isAgency && imobiliariaId && VALID_ID_REGEX.test(imobiliariaId) ? imobiliariaId : recordId;

  const path = `corretor_elite/${recordId}`;

  const payload: Record<string, unknown> = {
    id: recordId,
    codigoCorretor,
    tenantId,
    tipoConta: isAgency ? "imobiliaria" : "autonomo",
    papel: input.tipo,
    nome,
    email,
    tipo: input.tipo,
    modalidade: input.modalidade,
    plano: isAgency ? "imobiliaria" : input.plano,
    pagamentoConfirmado: Boolean(input.pagamentoConfirmado),
    origemPagamento: cleanOptString(input.origemPagamento, LIMITS.origemPagamento) || DEFAULT_PAYMENT_ORIGIN,
    autorizado: Boolean(input.autorizado),
    status: input.status,
    createdBy: uid.slice(0, LIMITS.id),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const cpfCnpj = cleanOptString(input.cpfCnpj, LIMITS.cpfCnpj);
  if (cpfCnpj) payload.cpfCnpj = cpfCnpj;

  const creci = cleanOptString(input.creci, LIMITS.creci);
  if (creci) payload.creci = creci;

  const telefone = cleanOptString(input.telefone, LIMITS.telefone);
  if (telefone) payload.telefone = telefone;

  if (isAgency && imobiliariaId && VALID_ID_REGEX.test(imobiliariaId)) {
    payload.imobiliariaId = imobiliariaId;
    const imobCode = cleanCodeString(input.imobiliariaCodigo);
    if (imobCode) payload.imobiliariaCodigo = imobCode;
    const imobiliariaNome = cleanOptString(input.imobiliariaNome, LIMITS.imobiliariaNome);
    if (imobiliariaNome) payload.imobiliariaNome = imobiliariaNome;
    const imobEmail = input.imobiliariaEmail ? normalizeEmail(input.imobiliariaEmail) : undefined;
    if (imobEmail && imobEmail.length >= 3) payload.imobiliariaEmail = imobEmail;
  }

  const comprovanteRef = cleanOptString(input.comprovanteRef, LIMITS.comprovanteRef);
  if (comprovanteRef) payload.comprovanteRef = comprovanteRef;

  const validadeAte = cleanOptString(input.validadeAte, LIMITS.validadeAte);
  if (validadeAte) payload.validadeAte = validadeAte;

  const observacoes = cleanOptString(input.observacoes, LIMITS.observacoes);
  if (observacoes) payload.observacoes = observacoes;

  try {
    await setDoc(doc(db, "corretor_elite", recordId), payload);
    return { recordId, codigoCorretor };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCorretorElite(
  recordId: string,
  input: Omit<CorretorEliteInput, "email">,
): Promise<void> {
  if (!VALID_ID_REGEX.test(recordId)) throw new Error("ID de registro inválido.");
  const nome = cleanReqString(input.nome, LIMITS.nome);
  if (nome.length < 2) throw new Error("Informe um nome válido (mínimo 2 caracteres).");
  if (input.modalidade === "imobiliaria" && !input.imobiliariaId) {
    throw new Error("Selecione a imobiliária vinculada para esta modalidade.");
  }

  const path = `corretor_elite/${recordId}`;
  const codigoCorretor = cleanCodeString(input.codigoCorretor) || generateCorretorCodigo();
  const cpfCnpj = cleanOptString(input.cpfCnpj, LIMITS.cpfCnpj);
  const creci = cleanOptString(input.creci, LIMITS.creci);
  const telefone = cleanOptString(input.telefone, LIMITS.telefone);
  const isAgency = input.modalidade === "imobiliaria";
  const imobiliariaId = isAgency ? cleanOptString(input.imobiliariaId, LIMITS.id) : undefined;
  const imobiliariaCodigo = isAgency ? cleanCodeString(input.imobiliariaCodigo) : undefined;
  const imobiliariaNome = isAgency ? cleanOptString(input.imobiliariaNome, LIMITS.imobiliariaNome) : undefined;
  const imobiliariaEmail =
    isAgency && input.imobiliariaEmail ? normalizeEmail(input.imobiliariaEmail) : undefined;
  const tenantId = isAgency && imobiliariaId && VALID_ID_REGEX.test(imobiliariaId) ? imobiliariaId : recordId;
  const comprovanteRef = cleanOptString(input.comprovanteRef, LIMITS.comprovanteRef);
  const validadeAte = cleanOptString(input.validadeAte, LIMITS.validadeAte);
  const observacoes = cleanOptString(input.observacoes, LIMITS.observacoes);

  const payload: Record<string, unknown> = {
    codigoCorretor,
    tenantId,
    tipoConta: isAgency ? "imobiliaria" : "autonomo",
    papel: input.tipo,
    nome,
    tipo: input.tipo,
    modalidade: input.modalidade,
    plano: isAgency ? "imobiliaria" : input.plano,
    pagamentoConfirmado: Boolean(input.pagamentoConfirmado),
    origemPagamento: cleanOptString(input.origemPagamento, LIMITS.origemPagamento) || DEFAULT_PAYMENT_ORIGIN,
    autorizado: Boolean(input.autorizado),
    status: input.status,
    cpfCnpj: cpfCnpj ?? deleteField(),
    creci: creci ?? deleteField(),
    telefone: telefone ?? deleteField(),
    imobiliariaId: imobiliariaId && VALID_ID_REGEX.test(imobiliariaId) ? imobiliariaId : deleteField(),
    imobiliariaCodigo: imobiliariaId && imobiliariaCodigo ? imobiliariaCodigo : deleteField(),
    imobiliariaNome: imobiliariaId && imobiliariaNome ? imobiliariaNome : deleteField(),
    imobiliariaEmail: imobiliariaId && imobiliariaEmail && imobiliariaEmail.length >= 3 ? imobiliariaEmail : deleteField(),
    comprovanteRef: comprovanteRef ?? deleteField(),
    validadeAte: validadeAte ?? deleteField(),
    observacoes: observacoes ?? deleteField(),
    updatedAt: serverTimestamp(),
  };

  try {
    await updateDoc(doc(db, "corretor_elite", recordId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateCorretorEliteAccessStatus(
  recordId: string,
  patch: {
    pagamentoConfirmado: boolean;
    autorizado: boolean;
    status: AccessStatus;
    comprovanteRef?: string;
    validadeAte?: string;
  },
): Promise<void> {
  if (!VALID_ID_REGEX.test(recordId)) throw new Error("ID de registro inválido.");
  const path = `corretor_elite/${recordId}`;
  const payload: Record<string, unknown> = {
    pagamentoConfirmado: Boolean(patch.pagamentoConfirmado),
    autorizado: Boolean(patch.autorizado),
    status: patch.status,
    updatedAt: serverTimestamp(),
  };
  if (patch.comprovanteRef !== undefined) {
    const clean = cleanOptString(patch.comprovanteRef, LIMITS.comprovanteRef);
    payload.comprovanteRef = clean ?? deleteField();
  }
  if (patch.validadeAte !== undefined) {
    const clean = cleanOptString(patch.validadeAte, LIMITS.validadeAte);
    payload.validadeAte = clean ?? deleteField();
  }

  try {
    await updateDoc(doc(db, "corretor_elite", recordId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCorretorElite(recordId: string): Promise<void> {
  if (!VALID_ID_REGEX.test(recordId)) throw new Error("ID de registro inválido.");
  const path = `corretor_elite/${recordId}`;
  try {
    await deleteDoc(doc(db, "corretor_elite", recordId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// === CRUD: ADMINISTRATIVO (ADM E IMOBILIÁRIAS) ===

export interface AdministrativoInput {
  codigoCadastro?: string;
  tipo: AdministrativoTipo;
  nome: string;
  email: string;
  plano?: PlanoImobiliariaTipo;
  planoLabel?: string;
  senhaAcesso?: string;
  cpfCnpj?: string;
  creciJuridico?: string;
  responsavel?: string;
  telefone?: string;
  cidade?: string;
  limiteCorretores?: number | "";
  pagamentoConfirmado: boolean;
  autorizado: boolean;
  status: AccessStatus;
  validadeAte?: string;
  observacoes?: string;
}

function cleanLimiteCorretores(val: number | "" | undefined): number | undefined {
  if (val === "" || val === undefined || val === null) return undefined;
  const n = Math.floor(Number(val));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, LIMITS.limiteCorretoresMax);
}

export async function createAdministrativo(input: AdministrativoInput): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid || !VALID_ID_REGEX.test(uid)) {
    throw new Error("Conecte-se com sua conta Master/ADM para gravar no banco de dados.");
  }

  const email = normalizeEmail(input.email);
  const nome = cleanReqString(input.nome, LIMITS.nome);
  if (nome.length < 2) throw new Error("Informe um nome/razão social válido (mínimo 2 caracteres).");
  if (!email.includes("@") || email.length < 3) throw new Error("Informe um e-mail válido.");

  const recordId = await computeEmailRecordId(email);
  const path = `administrativo/${recordId}`;
  const isImob = input.tipo === "imobiliaria";

  const payload: Record<string, unknown> = {
    id: recordId,
    tenantId: recordId,
    tipo: input.tipo,
    tipoConta: input.tipo,
    papel: isImob ? "admin_imobiliaria" : "master_adm",
    nome,
    email,
    pagamentoConfirmado: Boolean(input.pagamentoConfirmado),
    autorizado: Boolean(input.autorizado),
    status: input.status,
    createdBy: uid.slice(0, LIMITS.id),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (isImob) {
    const code = cleanCodeString(input.codigoCadastro) || generateAgencyCodigoCadastro();
    payload.codigoCadastro = code;

    const planoInfo = getPlanoImobiliariaInfo(input.plano);
    payload.plano = planoInfo.value;
    payload.planoLabel = cleanOptString(input.planoLabel, LIMITS.planoLabel) || planoInfo.label;

    const senha = cleanOptString(input.senhaAcesso, LIMITS.senhaAcesso) || generateAgencySenhaAcesso();
    payload.senhaAcesso = senha;

    const limite = cleanLimiteCorretores(input.limiteCorretores);
    payload.limiteCorretores = limite !== undefined ? limite : planoInfo.max;
  } else {
    const code = cleanCodeString(input.codigoCadastro);
    if (code) payload.codigoCadastro = code;
    const limite = cleanLimiteCorretores(input.limiteCorretores);
    if (limite !== undefined) payload.limiteCorretores = limite;
  }

  const cpfCnpj = cleanOptString(input.cpfCnpj, LIMITS.cpfCnpj);
  if (cpfCnpj) payload.cpfCnpj = cpfCnpj;

  const creciJuridico = cleanOptString(input.creciJuridico, LIMITS.creciJuridico);
  if (creciJuridico) payload.creciJuridico = creciJuridico;

  const responsavel = cleanOptString(input.responsavel, LIMITS.responsavel);
  if (responsavel) payload.responsavel = responsavel;

  const telefone = cleanOptString(input.telefone, LIMITS.telefone);
  if (telefone) payload.telefone = telefone;

  const cidade = cleanOptString(input.cidade, LIMITS.cidade);
  if (cidade) payload.cidade = cidade;

  const validadeAte = cleanOptString(input.validadeAte, LIMITS.validadeAte);
  if (validadeAte) payload.validadeAte = validadeAte;

  const observacoes = cleanOptString(input.observacoes, LIMITS.observacoes);
  if (observacoes) payload.observacoes = observacoes;

  try {
    await setDoc(doc(db, "administrativo", recordId), payload);
    return recordId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateAdministrativo(
  recordId: string,
  input: Omit<AdministrativoInput, "email">,
): Promise<void> {
  if (!VALID_ID_REGEX.test(recordId)) throw new Error("ID de registro inválido.");
  const nome = cleanReqString(input.nome, LIMITS.nome);
  if (nome.length < 2) throw new Error("Informe um nome/razão social válido (mínimo 2 caracteres).");

  const path = `administrativo/${recordId}`;
  const isImob = input.tipo === "imobiliaria";
  const planoInfo = getPlanoImobiliariaInfo(input.plano);
  const code = cleanCodeString(input.codigoCadastro);
  const senha = cleanOptString(input.senhaAcesso, LIMITS.senhaAcesso);
  const cpfCnpj = cleanOptString(input.cpfCnpj, LIMITS.cpfCnpj);
  const creciJuridico = cleanOptString(input.creciJuridico, LIMITS.creciJuridico);
  const responsavel = cleanOptString(input.responsavel, LIMITS.responsavel);
  const telefone = cleanOptString(input.telefone, LIMITS.telefone);
  const cidade = cleanOptString(input.cidade, LIMITS.cidade);
  const limite = cleanLimiteCorretores(input.limiteCorretores);
  const validadeAte = cleanOptString(input.validadeAte, LIMITS.validadeAte);
  const observacoes = cleanOptString(input.observacoes, LIMITS.observacoes);

  const payload: Record<string, unknown> = {
    tenantId: recordId,
    tipo: input.tipo,
    tipoConta: input.tipo,
    papel: isImob ? "admin_imobiliaria" : "master_adm",
    nome,
    codigoCadastro: code ?? (isImob ? generateAgencyCodigoCadastro() : deleteField()),
    plano: isImob ? planoInfo.value : deleteField(),
    planoLabel: isImob ? cleanOptString(input.planoLabel, LIMITS.planoLabel) || planoInfo.label : deleteField(),
    senhaAcesso: isImob ? senha || generateAgencySenhaAcesso() : deleteField(),
    pagamentoConfirmado: Boolean(input.pagamentoConfirmado),
    autorizado: Boolean(input.autorizado),
    status: input.status,
    cpfCnpj: cpfCnpj ?? deleteField(),
    creciJuridico: creciJuridico ?? deleteField(),
    responsavel: responsavel ?? deleteField(),
    telefone: telefone ?? deleteField(),
    cidade: cidade ?? deleteField(),
    limiteCorretores: limite !== undefined ? limite : isImob ? planoInfo.max : deleteField(),
    validadeAte: validadeAte ?? deleteField(),
    observacoes: observacoes ?? deleteField(),
    updatedAt: serverTimestamp(),
  };

  try {
    await updateDoc(doc(db, "administrativo", recordId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateAdministrativoAccessStatus(
  recordId: string,
  patch: {
    pagamentoConfirmado: boolean;
    autorizado: boolean;
    status: AccessStatus;
    validadeAte?: string;
  },
): Promise<void> {
  if (!VALID_ID_REGEX.test(recordId)) throw new Error("ID de registro inválido.");
  const path = `administrativo/${recordId}`;
  const payload: Record<string, unknown> = {
    pagamentoConfirmado: Boolean(patch.pagamentoConfirmado),
    autorizado: Boolean(patch.autorizado),
    status: patch.status,
    updatedAt: serverTimestamp(),
  };
  if (patch.validadeAte !== undefined) {
    const clean = cleanOptString(patch.validadeAte, LIMITS.validadeAte);
    payload.validadeAte = clean ?? deleteField();
  }

  try {
    await updateDoc(doc(db, "administrativo", recordId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteAdministrativo(recordId: string): Promise<void> {
  if (!VALID_ID_REGEX.test(recordId)) throw new Error("ID de registro inválido.");
  const path = `administrativo/${recordId}`;
  try {
    await deleteDoc(doc(db, "administrativo", recordId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
