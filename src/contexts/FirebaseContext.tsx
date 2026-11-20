import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  auth,
  signInWithGooglePopup,
  signInWithPersonalPassword,
  registerPersonalPassword,
  linkOrUpdatePersonalPassword,
  linkGoogleAccountToCurrentUser,
  sendPersonalPasswordReset,
  resendVerificationEmail,
  reloadCurrentUser,
  signOutFirebase,
  syncAuthenticatedUserProfile,
} from "@/lib/firebase";
import {
  verifyAuthenticatedUserAccess,
  bindAuthenticatedContractIdentity,
  type AccessAuthorizationResult,
} from "@/lib/accessDatabase";
import {
  isAdminEmail,
  setFullVersion,
  setMasterAccess,
  setUserEmail,
  setVisitorMode,
  setAuthProvider,
  clearAuthProvider,
} from "@/lib/eliteUtils";

export interface AuthSignInOutcome {
  user: User;
  isMaster: boolean;
  authorization: AccessAuthorizationResult;
  needsEmailVerification?: boolean;
}

interface FirebaseContextValue {
  user: User | null;
  isAuthReady: boolean;
  isGoogleMaster: boolean;
  accessAuthorization: AccessAuthorizationResult | null;
  signInWithGoogle: () => Promise<AuthSignInOutcome>;
  signInAsAdminOnly: () => Promise<AuthSignInOutcome>;
  signInWithPassword: (email: string, password: string) => Promise<AuthSignInOutcome>;
  registerWithPassword: (email: string, password: string) => Promise<AuthSignInOutcome>;
  reloadAndVerifyEmail: () => Promise<AuthSignInOutcome | null>;
  resendEmailVerificationLink: () => Promise<void>;
  linkPersonalPassword: (password: string) => Promise<void>;
  linkGoogleProvider: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOutGoogle: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [accessAuthorization, setAccessAuthorization] = useState<AccessAuthorizationResult | null>(null);

  const finalizeAuthorizedSession = useCallback(async (signedUser: User, authorization: AccessAuthorizationResult) => {
    try {
      await syncAuthenticatedUserProfile(signedUser);
    } catch (err) {
      console.warn("[Firebase] Profile sync notice:", err);
    }

    const email = (signedUser.email || "").trim().toLowerCase();
    const isMaster = authorization.role === "master" || authorization.role === "adm";
    if (email) {
      setUserEmail(email);
    }
    setAuthProvider("google");
    setFullVersion(true);
    setVisitorMode(false);
    if (isMaster) {
      setMasterAccess(true);
      sessionStorage.setItem("luiza_elite_auth", "true");
    }
    setAccessAuthorization(authorization);
    return isMaster;
  }, []);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!active) return;
      setUser(currentUser);

      if (!currentUser) {
        setAccessAuthorization(null);
        setIsAuthReady(true);
        return;
      }

      try {
        const authorization = await verifyAuthenticatedUserAccess(currentUser);
        if (!active) return;

        if (!authorization.authorized) {
          setAccessAuthorization(authorization);
          setIsAuthReady(true);
          return;
        }

        setAccessAuthorization(authorization);
        const email = (currentUser.email || "").trim().toLowerCase();
        if (email) {
          setUserEmail(email);
        }
        setAuthProvider("google");
        setFullVersion(true);
        setVisitorMode(false);
        if (authorization.role === "master" || authorization.role === "adm") {
          setMasterAccess(true);
          sessionStorage.setItem("luiza_elite_auth", "true");
        }
      } catch (err) {
        console.warn("[FirebaseProvider] Access verification warning:", err);
      } finally {
        if (active) setIsAuthReady(true);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<AuthSignInOutcome> => {
    const { user: signedUser } = await signInWithGooglePopup();
    const authorization = await verifyAuthenticatedUserAccess(signedUser);

    if (!authorization.authorized) {
      setAccessAuthorization(authorization);
      await signOutFirebase();
      clearAuthProvider();
      setMasterAccess(false);
      return { user: signedUser, isMaster: false, authorization };
    }

    const isMaster = await finalizeAuthorizedSession(signedUser, authorization);
    return { user: signedUser, isMaster, authorization };
  }, [finalizeAuthorizedSession]);

  const signInAsAdminOnly = useCallback(async (): Promise<AuthSignInOutcome> => {
    const { user: signedUser } = await signInWithGooglePopup();
    const authorization = await verifyAuthenticatedUserAccess(signedUser);
    const isAdm = authorization.authorized && (authorization.role === "master" || authorization.role === "adm");

    if (!isAdm) {
      await signOutFirebase();
      clearAuthProvider();
      return {
        user: signedUser,
        isMaster: false,
        authorization: {
          authorized: false,
          role: "none",
          code: "blocked",
          message:
            "Acesso restrito ao Administrativo/Master. Esta conta não possui permissão administrativa.",
        },
      };
    }

    await finalizeAuthorizedSession(signedUser, authorization);
    return { user: signedUser, isMaster: true, authorization };
  }, [finalizeAuthorizedSession]);

  const signInWithPassword = useCallback(
    async (email: string, password: string): Promise<AuthSignInOutcome> => {
      const signedUser = await signInWithPersonalPassword(email, password);
      if (!signedUser.emailVerified) {
        const unverifiedResult: AccessAuthorizationResult = {
          authorized: false,
          role: "none",
          code: "unverified_email",
          message:
            "Seu e-mail ainda não foi confirmado. Clique no link enviado para sua caixa de entrada e depois clique em 'Já confirmei meu e-mail'.",
        };
        setAccessAuthorization(unverifiedResult);
        return {
          user: signedUser,
          isMaster: false,
          authorization: unverifiedResult,
          needsEmailVerification: true,
        };
      }

      const authorization = await verifyAuthenticatedUserAccess(signedUser);
      if (!authorization.authorized) {
        setAccessAuthorization(authorization);
        await signOutFirebase();
        clearAuthProvider();
        setMasterAccess(false);
        return { user: signedUser, isMaster: false, authorization };
      }

      const isMaster = await finalizeAuthorizedSession(signedUser, authorization);
      return { user: signedUser, isMaster, authorization };
    },
    [finalizeAuthorizedSession],
  );

  const registerWithPassword = useCallback(
    async (email: string, password: string): Promise<AuthSignInOutcome> => {
      const createdUser = await registerPersonalPassword(email, password);
      const pendingResult: AccessAuthorizationResult = {
        authorized: false,
        role: "none",
        code: "unverified_email",
        message:
          "Senha pessoal criada! Enviamos um link de confirmação para seu e-mail do contrato. Abra seu e-mail, clique no link e retorne para entrar (ou acesse imediatamente com Google usando o mesmo e-mail).",
      };
      setAccessAuthorization(pendingResult);
      return {
        user: createdUser,
        isMaster: false,
        authorization: pendingResult,
        needsEmailVerification: true,
      };
    },
    [],
  );

  const reloadAndVerifyEmail = useCallback(async (): Promise<AuthSignInOutcome | null> => {
    const refreshed = await reloadCurrentUser();
    if (!refreshed) return null;
    setUser(refreshed);

    if (!refreshed.emailVerified) {
      const pendingResult: AccessAuthorizationResult = {
        authorized: false,
        role: "none",
        code: "unverified_email",
        message: "Ainda não detectamos a confirmação do e-mail. Verifique sua caixa de entrada ou spam e tente novamente.",
      };
      setAccessAuthorization(pendingResult);
      return {
        user: refreshed,
        isMaster: false,
        authorization: pendingResult,
        needsEmailVerification: true,
      };
    }

    const authorization = await verifyAuthenticatedUserAccess(refreshed);
    if (!authorization.authorized) {
      setAccessAuthorization(authorization);
      await signOutFirebase();
      clearAuthProvider();
      setMasterAccess(false);
      return { user: refreshed, isMaster: false, authorization };
    }

    const isMaster = await finalizeAuthorizedSession(refreshed, authorization);
    return { user: refreshed, isMaster, authorization };
  }, [finalizeAuthorizedSession]);

  const resendEmailVerificationLink = useCallback(async () => {
    await resendVerificationEmail();
  }, []);

  const linkPersonalPassword = useCallback(
    async (password: string) => {
      const updatedUser = await linkOrUpdatePersonalPassword(password);
      setUser(updatedUser);
      await syncAuthenticatedUserProfile(updatedUser);
      if (
        accessAuthorization?.recordId &&
        (accessAuthorization.collectionSource === "administrativo" ||
          accessAuthorization.collectionSource === "corretor_elite")
      ) {
        await bindAuthenticatedContractIdentity(
          accessAuthorization.collectionSource,
          accessAuthorization.recordId,
          updatedUser.uid,
          true,
        );
      }
      setAccessAuthorization((prev) => (prev ? { ...prev, senhaPessoalConfigurada: true } : prev));
    },
    [accessAuthorization],
  );

  const linkGoogleProvider = useCallback(async () => {
    const updatedUser = await linkGoogleAccountToCurrentUser();
    setUser(updatedUser);
    await syncAuthenticatedUserProfile(updatedUser);
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    await sendPersonalPasswordReset(email);
  }, []);

  const signOutGoogle = useCallback(async () => {
    await signOutFirebase();
    setAccessAuthorization(null);
    clearAuthProvider();
  }, []);

  const isGoogleMaster = Boolean(
    user?.emailVerified &&
      (isAdminEmail(user.email) ||
        (accessAuthorization?.authorized &&
          (accessAuthorization.role === "master" || accessAuthorization.role === "adm"))),
  );

  return (
    <FirebaseContext.Provider
      value={{
        user,
        isAuthReady,
        isGoogleMaster,
        accessAuthorization,
        signInWithGoogle,
        signInAsAdminOnly,
        signInWithPassword,
        registerWithPassword,
        reloadAndVerifyEmail,
        resendEmailVerificationLink,
        linkPersonalPassword,
        linkGoogleProvider,
        sendPasswordReset,
        signOutGoogle,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export function useFirebaseAuth(): FirebaseContextValue {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error("useFirebaseAuth must be used within a FirebaseProvider");
  }
  return ctx;
}
