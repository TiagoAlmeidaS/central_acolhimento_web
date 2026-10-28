"use client";

import { AuthProvider } from "@/auth/auth-context";
import { ToastProvider } from "@/ui/atalaia/toast";

export function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}
