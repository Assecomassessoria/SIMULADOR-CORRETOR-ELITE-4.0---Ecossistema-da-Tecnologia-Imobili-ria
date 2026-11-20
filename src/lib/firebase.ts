import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
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
import { isMasterEmail } from "@/lib/eliteUtils";

const app = initializeApp(firebaseConfig);
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

/**
 * Synchronizes the authenticated Google user's profile to Firestore `/users/{uid}`.
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

  let existsSnap = false;
  try {
    const snap = await getDoc(userRef);
    existsSnap = snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }

  if (!existsSnap) {
    const role: "user" | "admin" = isMasterEmail(email) ? "admin" : "user";
    const createPayload: Record<string, unknown> = {
      uid,
      email,
      role,
      provider: "google",
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

export async function signInWithGooglePopup(): Promise<{ user: User; isMaster: boolean }> {
  const credential = await signInWithPopup(auth, googleProvider);
  const user = credential.user;
  const email = (user.email || "").trim().toLowerCase();
  const isMaster = Boolean(user.emailVerified && isMasterEmail(email));

  // Sync profile in Firestore (non-blocking if user lacks network/quota after auth)
  try {
    await syncGoogleUserProfile(user);
  } catch (err) {
    console.warn("[Firebase] Profile sync notice:", err);
  }

  return { user, isMaster };
}

export async function signOutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn("[Firebase] Sign out notice:", err);
  }
}
