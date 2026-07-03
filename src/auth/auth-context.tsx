"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type LocalUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
};

type LocalSession = {
  user: LocalUser;
};

type AuthContextValue = {
  session: LocalSession | null;
  user: LocalUser | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "central-acolhimento-local-session";

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [session, setSession] = useState<LocalSession | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const serialized = window.localStorage.getItem(STORAGE_KEY);
      return serialized ? (JSON.parse(serialized) as LocalSession) : null;
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  });
  const [loading] = useState(false);

  const signInWithPassword = useCallback(async (email: string, _password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: _password }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      return { error: new Error(payload.error ?? "Nao foi possivel entrar.") };
    }

    const payload = (await response.json()) as { user: LocalUser };
    const nextSession = { user: payload.user };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
    return { error: null };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    return { error: new Error("Login com Google foi desativado nesta etapa. Use o acesso local.") };
  }, []);

  const signOut = useCallback(async () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      isConfigured: true,
      signInWithPassword,
      signInWithGoogle,
      signOut,
    }),
    [loading, session, signInWithGoogle, signInWithPassword, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
