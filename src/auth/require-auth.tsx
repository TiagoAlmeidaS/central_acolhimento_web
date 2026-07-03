"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/auth/auth-context";

export function RequireAuth({ children }: Readonly<{ children: React.ReactNode }>) {
  const { loading, isConfigured, session } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && isConfigured && !session) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isConfigured, loading, pathname, router, session]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-600 shadow-panel">
          Carregando sessão...
        </div>
      </div>
    );
  }

  if (isConfigured && !session) {
    return null;
  }

  return <>{children}</>;
}
