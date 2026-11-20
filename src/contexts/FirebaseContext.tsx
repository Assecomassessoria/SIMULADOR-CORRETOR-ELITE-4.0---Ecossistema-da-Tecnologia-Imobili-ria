import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, signInWithGooglePopup, signOutFirebase } from "@/lib/firebase";
import {
  isMasterEmail,
  setFullVersion,
  setMasterAccess,
  setUserEmail,
  setVisitorMode,
  setAuthProvider,
  clearAuthProvider,
} from "@/lib/eliteUtils";

interface FirebaseContextValue {
  user: User | null;
  isAuthReady: boolean;
  isGoogleMaster: boolean;
  signInWithGoogle: () => Promise<{ user: User; isMaster: boolean }>;
  signOutGoogle: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);

      if (currentUser?.email) {
        const email = currentUser.email.trim().toLowerCase();
        setUserEmail(email);
        setAuthProvider("google");
        if (currentUser.emailVerified && isMasterEmail(email)) {
          setMasterAccess(true);
          setFullVersion(true);
          setVisitorMode(false);
          sessionStorage.setItem("luiza_elite_auth", "true");
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const result = await signInWithGooglePopup();
    const email = (result.user.email || "").trim().toLowerCase();
    if (email) {
      setUserEmail(email);
    }
    setAuthProvider("google");
    setVisitorMode(false);
    if (result.isMaster) {
      setMasterAccess(true);
      setFullVersion(true);
      sessionStorage.setItem("luiza_elite_auth", "true");
    }
    return result;
  }, []);

  const signOutGoogle = useCallback(async () => {
    await signOutFirebase();
    clearAuthProvider();
  }, []);

  const isGoogleMaster = Boolean(user?.emailVerified && isMasterEmail(user?.email));

  return (
    <FirebaseContext.Provider
      value={{
        user,
        isAuthReady,
        isGoogleMaster,
        signInWithGoogle,
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
