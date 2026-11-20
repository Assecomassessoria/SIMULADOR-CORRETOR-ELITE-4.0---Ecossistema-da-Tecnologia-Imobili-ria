import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  EmailAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  linkWithCredential,
  linkWithPopup,
  updatePassword,
  reload,
  signOut,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { isAdminEmail } from "@/lib/eliteUtils";

const resolvedFirebaseConfig = {
  ...firebaseConfig,
  appId: "1:1098924412940:web:0e0d5042fdc703ad261e29",
};

export const app = initializeApp(resolvedFirebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// Validate Firestore connection on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Sanitization helpers synchronized verbatim with firebase-blueprint.json constraints
const VALID_ID_REGEX = /^[a-zA-Z0-9_-]+$/;
const MAX_UID_LEN = 128;
const MAX_EMAIL_LEN = 254;
const MAX_DISPLAY_NAME_LEN = 120;
const MAX_PHOTO_URL_LEN = 512;

function sanitizeString(value: string | null | undefined, maxLen: number): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLen);
}

export function validatePersonalPasswordStrength(password: string): string | null {
  if (!password || password.length < 8) {
    return "A senha pessoal deve ter pelo menos 8 caracteres.";
  }
  if (password.length > 128) {
    return "A senha pessoal não pode ultrapassar 128 caracteres.";
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "A senha pessoal deve conter pelo menos 1 letra e 1 número.";
  }
  return null;
}

export function resolveUserAuthProvider(user: User): "google" | "password" | "google+password" {
  const providers = new Set((user.providerData || []).map((p) => p.providerId));
  const hasGoogle = providers.has("google.com");
  const hasPassword = providers.has("password");
  if (hasGoogle && hasPassword) return "google+password";
  if (hasPassword) return "password";
  return "google";
}

export function formatFirebaseAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || "";
  switch (code) {
    case "auth/invalid-email":
      return "Informe um endereço de e-mail válido.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "E-mail ou senha pessoal incorretos. Caso seja seu primeiro acesso, use 'Criar Senha Pessoal' ou 'Entrar com Google'.";
    case "auth/email-already-in-use":
      return "Este e-mail já possui senha cadastrada. Faça login normalmente, use 'Entrar com Google' ou clique em 'Esqueci minha senha'.";
    case "auth/weak-password":
      return "Senha muito fraca. Utilize no mínimo 8 caracteres com letras e números.";
    case "auth/too-many-requests":
      return "Muitas tentativas seguidas. Aguarde alguns instantes e tente novamente.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Autenticação com Google cancelada.";
    case "auth/popup-blocked":
      return "Pop-up bloqueado pelo navegador. Libere pop-ups para continuar.";
    case "auth/requires-recent-login":
      return "Por segurança, saia e entre novamente antes de alterar sua senha pessoal.";
    case "auth/provider-already-linked":
      return "Este método de autenticação já está vinculado à sua conta.";
    case "auth/credential-already-in-use":
      return "Esta conta Google já está vinculada a outro acesso.";
    case "auth/operation-not-allowed":
      return "O provedor E-mail/Senha ainda precisa ser ativado no Firebase Console (Authentication → Sign-in method → E-mail/senha). Enquanto isso, entre com Google.";
    default:
      return err instanceof Error ? err.message : "Não foi possível concluir a autenticação. Tente novamente.";
  }
}

/**
 * Synchronizes the authenticated user's profile to Firestore `/users/{uid}`.
 * Enforces all volumetric and structural constraints from firebase-blueprint.json.
 */
export async function syncGoogleUserProfile(user: User): Promise<void> {
  const uid = user.uid.slice(0, MAX_UID_LEN);
  const email = sanitizeString(user.email, MAX_EMAIL_LEN);

  if (!VALID_ID_REGEX.test(uid) || !email || !user.emailVerified) {
    return;
  }

  const userPath = `users/${uid}`;
  const userRef = doc(db, "users", uid);
  const displayName = sanitizeString(user.displayName, MAX_DISPLAY_NAME_LEN);
  const photoURL = sanitizeString(user.photoURL, MAX_PHOTO_URL_LEN);
  const provider = resolveUserAuthProvider(user);

  let existsSnap = false;
  try {
    const snap = await getDoc(userRef);
    existsSnap = snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }

  if (!existsSnap) {
    const role: "user" | "admin" = isAdminEmail(email) ? "admin" : "user";
    const createPayload: Record<string, unknown> = {
      uid,
      email,
      role,
      provider,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };
    if (displayName) createPayload.displayName = displayName;
    if (photoURL) createPayload.photoURL = photoURL;

    try {
      await setDoc(userRef, createPayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, userPath);
    }
  } else {
    const updatePayload: Record<string, unknown> = {
      email,
      provider,
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };
    if (displayName) updatePayload.displayName = displayName;
    if (photoURL) updatePayload.photoURL = photoURL;

    try {
      await updateDoc(userRef, updatePayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, userPath);
    }
  }
}

export const syncAuthenticatedUserProfile = syncGoogleUserProfile;

export async function signInWithGooglePopup(): Promise<{ user: User; isMaster: boolean }> {
  const credential = await signInWithPopup(auth, googleProvider);
  const user = credential.user;
  const email = (user.email || "").trim().toLowerCase();
  const isMaster = Boolean(user.emailVerified && isAdminEmail(email));

  return { user, isMaster };
}

export async function signInWithPersonalPassword(email: string, password: string): Promise<User> {
  const cleanEmail = email.trim().toLowerCase().slice(0, MAX_EMAIL_LEN);
  const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
  return credential.user;
}

export async function registerPersonalPassword(email: string, password: string): Promise<User> {
  const cleanEmail = email.trim().toLowerCase().slice(0, MAX_EMAIL_LEN);
  const strengthErr = validatePersonalPasswordStrength(password);
  if (strengthErr) throw new Error(strengthErr);

  const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
  const user = credential.user;
  if (!user.emailVerified) {
    try {
      await sendEmailVerification(user);
    } catch (err) {
      console.warn("[Firebase] Verification email notice:", err);
    }
  }
  return user;
}

export async function linkOrUpdatePersonalPassword(password: string): Promise<User> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.email) {
    throw new Error("Conecte-se primeiro com a conta do contrato para cadastrar ou alterar sua senha pessoal.");
  }
  const strengthErr = validatePersonalPasswordStrength(password);
  if (strengthErr) throw new Error(strengthErr);

  const hasPasswordProvider = currentUser.providerData.some((p) => p.providerId === "password");
  if (hasPasswordProvider) {
    await updatePassword(currentUser, password);
    return currentUser;
  }

  const emailCredential = EmailAuthProvider.credential(currentUser.email, password);
  const result = await linkWithCredential(currentUser, emailCredential);
  return result.user;
}

export async function linkGoogleAccountToCurrentUser(): Promise<User> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Nenhuma sessão ativa para vincular a conta Google.");
  }
  const result = await linkWithPopup(currentUser, googleProvider);
  return result.user;
}

export async function sendPersonalPasswordReset(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase().slice(0, MAX_EMAIL_LEN);
  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("Informe o e-mail vinculado ao contrato.");
  }
  await sendPasswordResetEmail(auth, cleanEmail);
}

export async function resendVerificationEmail(): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Faça login com seu e-mail e senha para reenviar a confirmação.");
  }
  await sendEmailVerification(currentUser);
}

export async function reloadCurrentUser(): Promise<User | null> {
  if (!auth.currentUser) return null;
  await reload(auth.currentUser);
  return auth.currentUser;
}

export async function signOutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn("[Firebase] Sign out notice:", err);
  }
}
