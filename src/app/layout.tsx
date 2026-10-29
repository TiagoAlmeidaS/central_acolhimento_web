import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter, Inter_Tight } from "next/font/google";
import Script from "next/script";
import { AppProviders } from "@/ui/providers/app-providers";
import { THEME_INIT_SCRIPT } from "@/ui/atalaia/theme-script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-inter-tight",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Atalaia",
  description:
    "Atalaia: acolhimento e cuidado de quem chega à igreja, com ninguém esquecido. Coordenação e cuidadores no mesmo lugar.",
};

export const viewport: Viewport = {
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${interTight.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Script id="atalaia-theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
