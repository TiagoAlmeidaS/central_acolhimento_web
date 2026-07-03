"use client";

import { AuthProvider } from "@/auth/auth-context";

export function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AuthProvider>{children}</AuthProvider>;
}
