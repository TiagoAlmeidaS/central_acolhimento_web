"use client";

import { startTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Caregiver, Member, Seed, Tenant } from "@/server/domain/mvp";
import {
  Avatar,
  Button,
  Card,
  CardHeader,
  Drawer,
  EmptyState,
  Input,
  Pill,
  Select,
  Table,
  Td,
  Textarea,
  Th,
  Tr,
  useToast,
} from "@/ui/atalaia";
import { Check } from "@/ui/coord/check";
import { Meter } from "@/ui/coord/meter";
import { CAREGIVER_CAPACITY, activeMemberCount, plural } from "@/ui/coord/seed-utils";

const emptyForm = {
  tenantId: "",
  name: "",
  phone: "",
  email: "",
  notes: "",
  active: true,
};

type DrawerState = { id: string | null } | null;

function CopyNotice({ text }: { text: string }) {
  const { toast } = useToast();
  return (
    <div className="grid gap-2 rounded-control bg-success-soft px-3 py-2.5 text-[13px] text-success">
      <span>Mensagem pronta para enviar ao cuidador.</span>
      <pre className="whitespace-pre-wrap font-sans text-xs text-fg">{text}</pre>
      <div>
        <Button
          size="sm"
          icon="copy"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              toast("Mensagem copiada.");
            } catch {
              toast("Não foi possível copiar. Selecione o texto e copie.", { tone: "error" });
            }
          }}
        >
          Copiar mensagem
        </Button>
      </div>
    </div>
  );
}

/**
 * Equipe de cuidadores: tabela com carga e status; clicar numa linha (ou em “Adicionar cuidador”)
 * abre o drawer com dados, acesso e as pessoas atribuídas.
 */
export function CaregiverManager({
  caregivers,
  tenants,
  members = [],
  seeds = [],
}: Readonly<{
  caregivers: Caregiver[];
  tenants: Tenant[];
  /** Opcional: habilita carga real e a lista de pessoas atribuídas. */
  members?: Member[];
  seeds?: Seed[];
}>) {
  const router = useRouter();
  const { toast } = useToast();
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [form, setForm] = useState({ ...emptyForm, tenantId: tenants[0]?.id ?? "" });
  const [submitting, setSubmitting] = useState(false);
  const [busyAccess, setBusyAccess] = useState(false);
  const [busyPassword, setBusyPassword] = useState(false);
  const [access, setAccess] = useState({ email: "", password: "" });
  const [accessNotice, setAccessNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const editing = drawer?.id ? (caregivers.find((caregiver) => caregiver.id === drawer.id) ?? null) : null;
  const hasMembersData = members.length > 0 || seeds.length > 0;
  const showTenant = tenants.length > 1;

  function loadOf(caregiver: Caregiver) {
    return hasMembersData ? activeMemberCount(caregiver.id, members) : (caregiver.activeMembers ?? 0);
  }

  function openNew() {
    setForm({ ...emptyForm, tenantId: tenants[0]?.id ?? "" });
    setAccess({ email: "", password: "" });
    setAccessNotice(null);
    setError(null);
    setDrawer({ id: null });
  }

  function openEdit(caregiver: Caregiver) {
    setForm({
      tenantId: caregiver.tenantId,
      name: caregiver.name,
      phone: caregiver.phone,
      email: caregiver.email ?? "",
      notes: caregiver.notes,
      active: caregiver.active,
    });
    setAccess({ email: caregiver.email ?? "", password: "" });
    setAccessNotice(null);
    setError(null);
    setDrawer({ id: caregiver.id });
  }

  function closeDrawer() {
    setDrawer(null);
    setError(null);
  }

  function generatePassword() {
    const suffix = Math.floor(100000 + Math.random() * 900000);
    setAccess((current) => ({ ...current, password: `Central@${suffix}` }));
    setAccessNotice(null);
  }

  async function createCaregiverAccess(caregiver: Caregiver) {
    if (!access.email || !access.password) {
      setError("Informe e-mail e senha inicial para criar o acesso.");
      return;
    }

    setBusyAccess(true);
    setError(null);
    setAccessNotice(null);

    const response = await fetch(`/api/caregivers/${caregiver.id}/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: access.email, password: access.password }),
    });

    setBusyAccess(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Não foi possível criar o acesso do cuidador.");
      return;
    }

    setAccessNotice(
      [
        `Olá, ${caregiver.name}! Seu acesso ao Atalaia foi criado.`,
        "",
        `E-mail: ${access.email}`,
        `Senha inicial: ${access.password}`,
        "",
        "Acesse a plataforma pelo link de login enviado pela coordenação.",
      ].join("\n"),
    );
    setAccess((current) => ({ ...current, password: "" }));
    toast("Acesso criado.");
    startTransition(() => router.refresh());
  }

  async function resetCaregiverPassword(caregiver: Caregiver) {
    if (!access.password) {
      setError("Informe ou sugira uma nova senha para redefinir.");
      return;
    }

    setBusyPassword(true);
    setError(null);
    setAccessNotice(null);

    const response = await fetch(`/api/caregivers/${caregiver.id}/password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: access.password }),
    });

    setBusyPassword(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Não foi possível redefinir a senha do cuidador.");
      return;
    }

    setAccessNotice(
      [
        `Olá, ${caregiver.name}! Sua senha do Atalaia foi redefinida pela coordenação.`,
        "",
        `E-mail: ${caregiver.email ?? access.email}`,
        `Senha provisória: ${access.password}`,
        "",
        "Depois de entrar, você pode trocar essa senha em Perfil > Alterar senha.",
      ].join("\n"),
    );
    setAccess((current) => ({ ...current, password: "" }));
    toast("Senha redefinida.");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Informe o nome do cuidador.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const response = await fetch(editing ? `/api/caregivers/${editing.id}` : "/api/caregivers", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: form.tenantId,
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        notes: form.notes,
        active: form.active,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Não foi possível salvar o cuidador.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    toast(editing ? "Cuidador salvo." : `${form.name.split(" ")[0]} entrou na equipe.`);
    closeDrawer();
    startTransition(() => router.refresh());
  }

  const assignedMembers = editing ? members.filter((member) => member.caregiverId === editing.id && member.status !== "inactive") : [];
  const assignedSeeds = editing
    ? seeds.filter((seed) => seed.caregiverId === editing.id && seed.status !== "inactive" && seed.status !== "consolidated" && seed.status !== "in_progress")
    : [];
  const tenantById = new Map(tenants.map((tenant) => [tenant.id, tenant]));

  return (
    <>
      <Card aria-labelledby="team-heading">
        <CardHeader
          id="team-heading"
          title="Cuidadores"
          meta={`${caregivers.filter((c) => c.active).length} ativos de ${caregivers.length}`}
          action={
            <Button variant="primary" size="sm" icon="plus" onClick={openNew}>
              Adicionar cuidador
            </Button>
          }
        />
        {caregivers.length > 0 ? (
          <Table caption="Cuidadores" wrapperClassName="mt-2">
            <thead>
              <tr>
                <Th>Nome</Th>
                <Th>Contato</Th>
                {showTenant ? <Th>Localidade</Th> : null}
                <Th>Assistidos</Th>
                <Th>Acesso</Th>
                <Th>Situação</Th>
              </tr>
            </thead>
            <tbody>
              {caregivers.map((caregiver) => {
                const load = loadOf(caregiver);
                return (
                  <Tr key={caregiver.id} onActivate={() => openEdit(caregiver)} aria-label={`Abrir ${caregiver.name}`}>
                    <Td>
                      <span className="flex items-center gap-2 font-semibold">
                        <Avatar name={caregiver.name} />
                        {caregiver.name}
                      </span>
                      {caregiver.notes ? <small className="block max-w-64 truncate text-xs text-muted">{caregiver.notes}</small> : null}
                    </Td>
                    <Td>
                      <span className="font-mono text-xs">{caregiver.phone || "—"}</span>
                      {caregiver.email ? <small className="block text-xs text-muted">{caregiver.email}</small> : null}
                    </Td>
                    {showTenant ? <Td>{tenantById.get(caregiver.tenantId)?.name ?? "—"}</Td> : null}
                    <Td>
                      <span className="flex items-center gap-2">
                        <Meter value={load} max={CAREGIVER_CAPACITY} className="w-20" />
                        <span className="font-mono text-xs tabular-nums">
                          {load}/{CAREGIVER_CAPACITY}
                        </span>
                      </span>
                    </Td>
                    <Td>{caregiver.tenantUserId ? <Pill tone="success">Com acesso</Pill> : <Pill tone="muted">Sem acesso</Pill>}</Td>
                    <Td>{caregiver.active ? <Pill tone="success">Ativo</Pill> : <Pill tone="muted">Inativo</Pill>}</Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        ) : (
          <div className="p-4">
            <EmptyState
              title="Nenhum cuidador ainda."
              reason="Cuidadores acompanham as pessoas da jornada. Sem eles, os contatos ficam em “Precisa de alguém”."
              hint="Use “Adicionar cuidador” aqui em cima ou crie um convite ou canal de cadastro nas abas ao lado."
            />
          </div>
        )}
      </Card>

      {drawer ? (
        <Drawer
          open
          onClose={closeDrawer}
          title={editing ? editing.name : "Adicionar cuidador"}
          subtitle={
            editing
              ? plural(loadOf(editing), "assistido ativo", "assistidos ativos")
              : "Para quem não vai entrar por um convite ou canal de cadastro."
          }
          footer={
            <>
              <Button variant="ghost" onClick={closeDrawer}>
                Cancelar
              </Button>
              <Button type="submit" form="caregiver-drawer-form" variant="primary" loading={submitting}>
                {editing ? "Salvar" : "Adicionar"}
              </Button>
            </>
          }
        >
          <form id="caregiver-drawer-form" className="grid gap-3.5" onSubmit={handleSubmit} noValidate>
            <Select
              label="Localidade"
              value={form.tenantId}
              onChange={(event) => setForm((current) => ({ ...current, tenantId: event.target.value }))}
              options={tenants.map((tenant) => ({ value: tenant.id, label: tenant.name }))}
              placeholder="Selecione a localidade"
              required
            />
            <Input
              label="Nome completo *"
              data-autofocus=""
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Ex.: Ana Lima"
              required
            />
            <div className="grid grid-cols-2 gap-3 max-[420px]:grid-cols-1">
              <Input
                label="Telefone"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder="(00) 90000-0000"
                inputMode="tel"
              />
              <Input
                label="E-mail"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>
            <Textarea
              label="Observações"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Contexto, disponibilidade, região de atuação..."
              rows={3}
            />
            <Check
              label="Cuidador ativo"
              hint="Ativo: pode receber novas pessoas."
              checked={form.active}
              onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
            />
            {error ? (
              <p role="alert" className="rounded-control bg-danger-soft px-3 py-2 text-[13px] text-danger">
                {error}
              </p>
            ) : null}
          </form>

          {editing ? (
            <section className="grid gap-2.5 border-t border-border pt-4" aria-label="Acesso à plataforma">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">Acesso</span>
              {editing.tenantUserId ? (
                <p className="text-[13px] text-success">Acesso ativo vinculado a este cuidador.</p>
              ) : (
                <p className="text-[13px] text-muted">
                  Sem acesso. Crie o login sem duplicar o cuidador nem perder as pessoas atribuídas.
                </p>
              )}
              {!editing.tenantUserId ? (
                <Input
                  label="E-mail de acesso"
                  type="email"
                  value={access.email}
                  onChange={(event) => setAccess((current) => ({ ...current, email: event.target.value }))}
                  placeholder="email do cuidador"
                />
              ) : null}
              <Input
                label={editing.tenantUserId ? "Nova senha provisória" : "Senha inicial"}
                value={access.password}
                onChange={(event) => setAccess((current) => ({ ...current, password: event.target.value }))}
                placeholder={editing.tenantUserId ? "nova senha provisória" : "senha inicial"}
                autoComplete="off"
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={generatePassword}>
                  Sugerir senha
                </Button>
                {editing.tenantUserId ? (
                  <Button size="sm" loading={busyPassword} onClick={() => resetCaregiverPassword(editing)}>
                    Redefinir senha
                  </Button>
                ) : (
                  <Button size="sm" loading={busyAccess} onClick={() => createCaregiverAccess(editing)}>
                    Criar acesso
                  </Button>
                )}
              </div>
              {accessNotice ? <CopyNotice text={accessNotice} /> : null}
            </section>
          ) : null}

          {editing && hasMembersData ? (
            <section className="grid gap-2 border-t border-border pt-4" aria-label="Pessoas atribuídas">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
                Pessoas atribuídas
              </span>
              {assignedMembers.length + assignedSeeds.length === 0 ? (
                <p className="text-[13px] text-muted">
                  Ninguém atribuído ainda. Atribua pelo painel em “Precisa de alguém” ou dentro de um contato.
                </p>
              ) : (
                <ul className="grid gap-1">
                  {assignedMembers.map((member) => (
                    <li key={member.id} className="flex items-center justify-between gap-2 text-[13px]">
                      <Link className="truncate hover:underline" href={`/coord/membros/${member.id}/editar`}>
                        {member.name}
                      </Link>
                      <Pill tone="cold">Assistido</Pill>
                    </li>
                  ))}
                  {assignedSeeds.map((seed) => (
                    <li key={seed.id} className="flex items-center justify-between gap-2 text-[13px]">
                      <Link className="truncate hover:underline" href={`/coord/contatos?contato=${encodeURIComponent(seed.id)}`}>
                        {seed.referenceName}
                      </Link>
                      <Pill tone="primary">Contato</Pill>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}
        </Drawer>
      ) : null}
    </>
  );
}
