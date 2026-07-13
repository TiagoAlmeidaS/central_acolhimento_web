"use client";

import { startTransition, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { UserProfileView } from "@/server/domain/mvp";
import { Button, Card, Input, SectionTitle } from "@/ui/v2-components/ui";
import { IconCheck, IconLock, IconPhone, IconUser } from "@/ui/v2-components/icons";

export function ProfileManager({
  initialProfile,
  homePath,
}: Readonly<{
  initialProfile: UserProfileView;
  homePath: string;
}>) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [form, setForm] = useState({
    firstName: initialProfile.firstName,
    lastName: initialProfile.lastName,
    phone: initialProfile.phone,
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProfile(true);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
      }),
    });

    setSavingProfile(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel salvar o perfil.");
      return;
    }

    const nextProfile = (await response.json()) as UserProfileView;
    setProfile(nextProfile);
    setForm({
      firstName: nextProfile.firstName,
      lastName: nextProfile.lastName,
      phone: nextProfile.phone,
    });
    setSuccess("Perfil atualizado.");
    startTransition(() => router.refresh());
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingPassword(true);
    setError(null);
    setSuccess(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSavingPassword(false);
      setError("A confirmacao da nova senha nao confere.");
      return;
    }

    const response = await fetch("/api/profile/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }),
    });

    setSavingPassword(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Nao foi possivel atualizar a senha.");
      return;
    }

    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setSuccess("Senha atualizada.");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "24px 16px 32px", maxWidth: 920, margin: "0 auto" }}>
      <div>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)" }}>
          Conta · Perfil
        </p>
        <h1 style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em" }}>
          Meu perfil
        </h1>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--text-2)", lineHeight: 1.5 }}>
          Atualize seus dados pessoais e gerencie o acesso da conta no contexto atual.
        </p>
      </div>

      {error ? <Banner tone="error">{error}</Banner> : null}
      {success ? <Banner tone="success">{success}</Banner> : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        <Card padding={20}>
          <SectionTitle>Dados pessoais</SectionTitle>
          <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input label="Nome" value={form.firstName} onChange={(value) => setForm((current) => ({ ...current, firstName: value }))} icon={<IconUser />} required />
            <Input label="Sobrenome" value={form.lastName} onChange={(value) => setForm((current) => ({ ...current, lastName: value }))} icon={<IconUser />} required />
            <Input label="Email" value={profile.email} onChange={() => undefined} type="email" disabled />
            <Input label="Telefone" value={form.phone} onChange={(value) => setForm((current) => ({ ...current, phone: value }))} icon={<IconPhone />} required />
            <Button type="submit" variant="primary" size="md" disabled={savingProfile} icon={<IconCheck />} full>
              {savingProfile ? "Salvando..." : "Salvar alteracoes"}
            </Button>
          </form>
        </Card>

        <Card padding={20}>
          <SectionTitle>Contexto atual</SectionTitle>
          <Info label="Nome completo" value={profile.fullName} />
          <Info label="Localidade" value={profile.tenantName} />
          <Info label="Cidade / Estado" value={`${profile.tenantCity} - ${profile.tenantState}`} />
          <Info label="Perfil" value={profile.role === "coordinator" ? "Coordenacao" : "Cuidador"} />
          <Info label="Conta" value={profile.active ? "Ativa" : "Inativa"} />
          <div style={{ marginTop: 16 }}>
            <Button type="button" variant="secondary" size="md" onClick={() => router.push(homePath)} full>
              Voltar ao painel
            </Button>
          </div>
        </Card>
      </div>

      {profile.caregiver ? (
        <Card padding={20}>
          <SectionTitle>Dados operacionais do cuidador</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <Info label="Nome operacional" value={profile.caregiver.name} />
            <Info label="Telefone operacional" value={profile.caregiver.phone || "Sem telefone"} />
            <Info label="Email operacional" value={profile.caregiver.email ?? "Sem email"} />
            <Info label="Membros ativos" value={String(profile.caregiver.activeMembers)} />
            <Info label="Status operacional" value={profile.caregiver.active ? "Ativo" : "Inativo"} />
          </div>
          <div style={{ marginTop: 12 }}>
            <Info label="Observacoes operacionais" value={profile.caregiver.notes || "Sem observacoes"} />
          </div>
        </Card>
      ) : null}

      <Card padding={20}>
        <SectionTitle>Seguranca</SectionTitle>
        <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label="Senha atual" type="password" value={passwordForm.currentPassword} onChange={(value) => setPasswordForm((current) => ({ ...current, currentPassword: value }))} icon={<IconLock />} required />
          <Input label="Nova senha" type="password" value={passwordForm.newPassword} onChange={(value) => setPasswordForm((current) => ({ ...current, newPassword: value }))} icon={<IconLock />} required />
          <Input label="Confirmar nova senha" type="password" value={passwordForm.confirmPassword} onChange={(value) => setPasswordForm((current) => ({ ...current, confirmPassword: value }))} icon={<IconLock />} required />
          <Button type="submit" variant="primary" size="md" disabled={savingPassword} full>
            {savingPassword ? "Atualizando..." : "Atualizar senha"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function Banner({ children, tone }: Readonly<{ children: string; tone: "error" | "success" }>) {
  const style = tone === "error"
    ? { background: "#FFF1F2", border: "1px solid #FECDD3", color: "#E11D48" }
    : { background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#15803D" };

  return <div style={{ ...style, padding: "12px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600 }}>{children}</div>;
}

function Info({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div style={{ padding: "12px 14px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface-2)" }}>
      <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{value}</div>
    </div>
  );
}
