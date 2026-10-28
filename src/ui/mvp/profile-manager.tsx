"use client";

import { startTransition, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { UserProfileView } from "@/server/domain/mvp";
import { Button, Card, CardBody, CardHeader, Drawer, Input, PageHeader, Pill, cx, useToast } from "@/ui/atalaia";
import { FormError, FormGrid, Kv, SettingRow, readApiError, useResetOnOpen } from "@/ui/gestao";

const emptyPasswordForm = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function ProfileManager({
  initialProfile,
  homePath,
  contained = true,
}: Readonly<{
  initialProfile: UserProfileView;
  homePath: string;
  /**
   * Aplica a coluna de 920px com respiro lateral próprio (uso padrão, ex.: tela do cuidador).
   * Quem já envolve a página em `PageContainer` passa `contained={false}`.
   */
  contained?: boolean;
}>) {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState(initialProfile);
  const [form, setForm] = useState({
    firstName: initialProfile.firstName,
    lastName: initialProfile.lastName,
    phone: initialProfile.phone,
  });
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useResetOnOpen(passwordOpen, () => {
    setPasswordForm(emptyPasswordForm);
    setPasswordError(null);
  });

  const dirty =
    form.firstName !== profile.firstName || form.lastName !== profile.lastName || form.phone !== profile.phone;

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProfile(true);
    setProfileError(null);

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
      setProfileError(await readApiError(response, "Não foi possível salvar o perfil."));
      return;
    }

    const nextProfile = (await response.json()) as UserProfileView;
    setProfile(nextProfile);
    setForm({
      firstName: nextProfile.firstName,
      lastName: nextProfile.lastName,
      phone: nextProfile.phone,
    });
    toast("Perfil atualizado.");
    startTransition(() => router.refresh());
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("A confirmação da nova senha não confere.");
      return;
    }

    setSavingPassword(true);
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
      setPasswordError(await readApiError(response, "Não foi possível atualizar a senha."));
      return;
    }

    toast("Senha atualizada.");
    setPasswordOpen(false);
  }

  return (
    <div className={cx("grid gap-4", contained ? "mx-auto w-full max-w-[920px] px-4 pb-16 pt-6" : "max-w-[920px]")}>
      <PageHeader
        className="mb-1"
        title="Meu perfil"
        subtitle="Seus dados de contato e acesso à conta."
        secondary={<Button onClick={() => router.push(homePath)}>Voltar ao painel</Button>}
      />

      <Card>
        <form onSubmit={handleSaveProfile}>
          <CardHeader title="Dados pessoais" />
          <SettingRow title="Nome" text="Como a coordenação e os assistidos veem você.">
            <FormGrid>
              <Input
                aria-label="Nome"
                value={form.firstName}
                onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                required
              />
              <Input
                aria-label="Sobrenome"
                value={form.lastName}
                onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                required
              />
            </FormGrid>
          </SettingRow>
          <SettingRow title="Telefone" text="Usado nos avisos e no resumo diário.">
            <Input
              aria-label="Telefone"
              value={form.phone}
              inputMode="tel"
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              required
            />
          </SettingRow>
          <SettingRow title="E-mail" text="É o seu acesso. Para trocar, fale com a coordenação.">
            <Input aria-label="E-mail" type="email" value={profile.email} readOnly />
          </SettingRow>
          <div className="grid gap-2 border-t border-border p-4">
            <FormError>{profileError}</FormError>
            <div className="flex justify-end">
              <Button variant="primary" type="submit" loading={savingProfile} disabled={!dirty}>
                Salvar alterações
              </Button>
            </div>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader title="Contexto atual" />
        <CardBody>
          <Kv
            items={[
              { label: "Nome completo", value: profile.fullName },
              { label: "Localidade", value: profile.tenantName },
              { label: "Cidade / Estado", value: `${profile.tenantCity} - ${profile.tenantState}` },
              { label: "Perfil", value: profile.role === "coordinator" ? "Coordenação" : "Cuidador" },
              {
                label: "Conta",
                value: <Pill tone={profile.active ? "success" : "muted"}>{profile.active ? "Ativa" : "Inativa"}</Pill>,
              },
            ]}
          />
        </CardBody>
      </Card>

      {profile.caregiver ? (
        <Card>
          <CardHeader title="Dados operacionais do cuidador" />
          <CardBody>
            <Kv
              items={[
                { label: "Nome operacional", value: profile.caregiver.name },
                { label: "Telefone", value: profile.caregiver.phone || "Sem telefone" },
                { label: "E-mail", value: profile.caregiver.email ?? "Sem e-mail" },
                { label: "Assistidos ativos", value: <span className="font-mono">{profile.caregiver.activeMembers}</span> },
                {
                  label: "Situação",
                  value: (
                    <Pill tone={profile.caregiver.active ? "success" : "muted"}>
                      {profile.caregiver.active ? "Ativo" : "Inativo"}
                    </Pill>
                  ),
                },
                { label: "Observações", value: profile.caregiver.notes || "Sem observações" },
              ]}
            />
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Segurança" />
        <SettingRow title="Senha" text="Troque a senha de vez em quando e não a repita em outros sites.">
          <div>
            <Button icon="lock" onClick={() => setPasswordOpen(true)}>
              Alterar senha
            </Button>
          </div>
        </SettingRow>
      </Card>

      <Drawer
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        title="Alterar senha"
        subtitle="Informe a senha atual e escolha uma nova."
        footer={
          <>
            <Button variant="ghost" onClick={() => setPasswordOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" form="password-form" loading={savingPassword}>
              Atualizar senha
            </Button>
          </>
        }
      >
        <form id="password-form" onSubmit={handleChangePassword} className="grid gap-4">
          <Input
            label="Senha atual"
            type="password"
            autoComplete="current-password"
            value={passwordForm.currentPassword}
            onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
            required
            data-autofocus
          />
          <Input
            label="Nova senha"
            type="password"
            autoComplete="new-password"
            value={passwordForm.newPassword}
            onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
            required
          />
          <Input
            label="Confirmar nova senha"
            type="password"
            autoComplete="new-password"
            value={passwordForm.confirmPassword}
            onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
            required
          />
          <FormError>{passwordError}</FormError>
        </form>
      </Drawer>
    </div>
  );
}
