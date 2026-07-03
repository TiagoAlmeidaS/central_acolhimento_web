import type { Metadata } from "next";
import { AppProviders } from "@/ui/providers/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Central de Acolhimento",
  description: "Monólito Next.js para coordenação e cuidado da Central de Acolhimento.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
