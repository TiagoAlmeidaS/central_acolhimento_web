import { requireServerAuthSession } from "@/server/auth/session";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireServerAuthSession();
  return <>{children}</>;
}
