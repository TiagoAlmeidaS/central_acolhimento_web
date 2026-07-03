import { AppShell } from "@/ui/navigation/app-shell";

export default function CoordLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
