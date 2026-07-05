"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AuthSession, LoginResult } from "@/server/domain/mvp";

type AuthContextValue = {
  session: AuthSession | null;
  user: AuthSession["user"] | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithPassword: (
    email: string,
    password: string,
    tenantUserId?: string | null
  ) => Promise<{ error: Error | null; result: LoginResult | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/session", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        setSession(null);
        return;
      }

      const payload = (await response.json()) as { session: AuthSession | null };
      setSession(payload.session);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", {
          method: "GET",
          cache: "no-store",
        });

        if (!active) {
          return;
        }

        if (!response.ok) {
          setSession(null);
          return;
        }

        const payload = (await response.json()) as { session: AuthSession | null };
        if (active) {
          setSession(payload.session);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, []);

  const signInWithPassword = useCallback(
    async (email: string, password: string, tenantUserId?: string | null) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, tenantUserId: tenantUserId ?? null }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        return { error: new Error(payload.error ?? "Nao foi possivel entrar."), result: null };
      }

      const payload = (await response.json()) as LoginResult;
      if (payload.type === "authenticated") {
        setSession(payload.session);
      }

      return { error: null, result: payload };
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    return { error: new Error("Login com Google foi desativado nesta etapa.") };
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
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
      refreshSession,
    }),
    [loading, refreshSession, session, signInWithGoogle, signInWithPassword, signOut]
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
