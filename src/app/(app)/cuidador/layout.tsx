import { requireServerAuthSession } from "@/server/auth/session";

export default async function CaregiverLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireServerAuthSession("caregiver");
  return <>{children}</>;
}
