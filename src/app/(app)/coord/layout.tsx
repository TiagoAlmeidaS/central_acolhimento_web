import { requireServerAuthSession } from "@/server/auth/session";
import { AppShell } from "@/ui/navigation/app-shell";

export default async function CoordLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireServerAuthSession("coordinator");
  return <AppShell>{children}</AppShell>;
}
