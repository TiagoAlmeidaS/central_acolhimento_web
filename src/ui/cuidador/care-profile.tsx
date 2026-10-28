"use client";

import { startTransition, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { UserProfileView } from "@/server/domain/mvp";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  PageContainer,
  PageHeader,
  Pill,
  ThemeToggle,
  useToast,
} from "@/ui/atalaia";
import { formatPhone } from "@/ui/mvp/contact-form-utils";
import { Sheet, useResetOnOpen } from "./sheet";

const PROFILE_FORM = "cuidador-profile-form";
const PASSWORD_FORM = "cuidador-password-form";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[116px_1fr] gap-3 border-t border-border py-2.5 text-sm first:border-t-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

async function readError(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  return payload.error ?? fallback;
}

/** Perfil do cuidador: cartão de leitura, edição em drawer, troca de senha em drawer e tema. */
export function CareProfile({ initialProfile }: Readonly<{ initialProfile: UserProfileView }>) {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState(initialProfile);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [form, setForm] = useState({ firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useResetOnOpen(editing, () => {
    setForm({ firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone });
    setError(null);
    setSaving(false);
  });
  useResetOnOpen(changingPassword, () => {
    setPasswords({ current: "", next: "", confirm: "" });
    setPasswordError(null);
    setSavingPassword(false);
  });

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: form.firstName, lastName: form.lastName, phone: form.phone }),
      });
      if (!response.ok) {
        setError(await readError(response, "Não foi possível salvar o perfil."));
        setSaving(false);
        return;
      }
      setProfile((await response.json()) as UserProfileView);
      setSaving(false);
      setEditing(false);
      toast("Perfil atualizado.");
      startTransition(() => router.refresh());
    } catch {
      setSaving(false);
      setError("Não foi possível salvar o perfil. Verifique a conexão e tente de novo.");
    }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (passwords.next !== passwords.confirm) {
      setPasswordError("A confirmação da nova senha não confere.");
      return;
    }
    setSavingPassword(true);
    setPasswordError(null);
    try {
      const response = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.next }),
      });
      if (!response.ok) {
        setPasswordError(await readError(response, "Não foi possível atualizar a senha."));
        setSavingPassword(false);
        return;
      }
      setSavingPassword(false);
      setChangingPassword(false);
      toast("Senha atualizada.");
    } catch {
      setSavingPassword(false);
      setPasswordError("Não foi possível atualizar a senha. Verifique a conexão e tente de novo.");
    }
  }

  return (
    <PageContainer className="grid gap-4">
      <PageHeader
        className="mb-0"
        title="Meu perfil"
        subtitle="Seus dados e o contexto em que você cuida."
        action={
          <Button variant="primary" icon="user" onClick={() => setEditing(true)}>
            Editar dados
          </Button>
        }
      />

      <Card>
        <CardBody className="flex items-center gap-3.5">
          <Avatar name={profile.fullName} size="lg" />
          <div className="min-w-0 flex-1">
            <b className="block truncate font-display text-xl font-medium tracking-[-0.02em]">{profile.fullName}</b>
            <span className="block truncate text-sm text-muted">{profile.tenantName}</span>
            <span className="mt-1.5 flex flex-wrap gap-1.5">
              <Pill tone="primary">{profile.role === "coordinator" ? "Coordenação" : "Cuidador"}</Pill>
              <Pill tone={profile.active ? "success" : "muted"}>{profile.active ? "Conta ativa" : "Conta inativa"}</Pill>
            </span>
          </div>
        </CardBody>
      </Card>

      <Card aria-labelledby="dados-h">
        <CardHeader id="dados-h" title="Dados pessoais" />
        <div className="px-4 pb-4 pt-1">
          <dl>
            <Row label="E-mail">{profile.email}</Row>
            <Row label="Telefone">{profile.phone || <span className="text-muted">Não informado</span>}</Row>
            <Row label="Localidade">{profile.tenantName}</Row>
            <Row label="Cidade / UF">
              {profile.tenantCity} - {profile.tenantState}
            </Row>
          </dl>
        </div>
      </Card>

      {profile.caregiver ? (
        <Card aria-labelledby="oper-h">
          <CardHeader id="oper-h" title="Como cuidador" meta={`${profile.caregiver.activeMembers} assistidos ativos`} />
          <div className="px-4 pb-4 pt-1">
            <dl>
              <Row label="Nome operacional">{profile.caregiver.name}</Row>
              <Row label="Telefone">{profile.caregiver.phone || <span className="text-muted">Sem telefone</span>}</Row>
              <Row label="E-mail">{profile.caregiver.email ?? <span className="text-muted">Sem e-mail</span>}</Row>
              <Row label="Situação">{profile.caregiver.active ? "Ativo: pode receber novas pessoas" : "Inativo"}</Row>
              <Row label="Observações">
                {profile.caregiver.notes || <span className="text-muted">Sem observações</span>}
              </Row>
            </dl>
          </div>
        </Card>
      ) : null}

      <Card aria-labelledby="conta-h">
        <CardHeader id="conta-h" title="Conta e aparência" />
        <CardBody className="grid gap-2.5">
          <ThemeToggle className="w-full justify-start border-border-strong" />
          <Button icon="lock" className="w-full justify-start" onClick={() => setChangingPassword(true)}>
            Alterar senha
          </Button>
        </CardBody>
      </Card>

      <Sheet
        open={editing}
        onClose={() => setEditing(false)}
        title="Editar dados"
        subtitle="O e-mail de acesso não muda por aqui."
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" form={PROFILE_FORM} loading={saving}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </>
        }
      >
        <form id={PROFILE_FORM} onSubmit={saveProfile} className="grid gap-4">
          <div className="grid grid-cols-2 gap-3 max-[380px]:grid-cols-1">
            <Input
              label="Nome *"
              value={form.firstName}
              onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
              autoComplete="given-name"
              data-autofocus=""
              required
            />
            <Input
              label="Sobrenome *"
              value={form.lastName}
              onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
              autoComplete="family-name"
              required
            />
          </div>
          <Input label="E-mail" type="email" value={profile.email} readOnly disabled />
          <Input
            label="Telefone *"
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: formatPhone(event.target.value) }))}
            autoComplete="tel"
            required
          />
          {error ? (
            <p role="alert" className="rounded-card border border-danger/50 bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}
        </form>
      </Sheet>

      <Sheet
        open={changingPassword}
        onClose={() => setChangingPassword(false)}
        title="Alterar senha"
        subtitle="Use a senha atual para definir uma nova."
        footer={
          <>
            <Button variant="ghost" onClick={() => setChangingPassword(false)} disabled={savingPassword}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" form={PASSWORD_FORM} loading={savingPassword}>
              {savingPassword ? "Atualizando..." : "Atualizar senha"}
            </Button>
          </>
        }
      >
        <form id={PASSWORD_FORM} onSubmit={savePassword} className="grid gap-4">
          <Input
            label="Senha atual *"
            type="password"
            value={passwords.current}
            onChange={(event) => setPasswords((current) => ({ ...current, current: event.target.value }))}
            autoComplete="current-password"
            data-autofocus=""
            required
          />
          <Input
            label="Nova senha *"
            type="password"
            value={passwords.next}
            onChange={(event) => setPasswords((current) => ({ ...current, next: event.target.value }))}
            autoComplete="new-password"
            required
          />
          <Input
            label="Confirmar nova senha *"
            type="password"
            value={passwords.confirm}
            onChange={(event) => setPasswords((current) => ({ ...current, confirm: event.target.value }))}
            autoComplete="new-password"
            required
          />
          {passwordError ? (
            <p role="alert" className="rounded-card border border-danger/50 bg-danger-soft px-3 py-2 text-sm text-danger">
              {passwordError}
            </p>
          ) : null}
        </form>
      </Sheet>
    </PageContainer>
  );
}
