"use client";

import { startTransition, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Tenant } from "@/server/domain/mvp";
import { Button, Card, CardHeader, Drawer, EmptyState, Input, Pill, Table, Td, Th, Tr, useToast } from "@/ui/atalaia";
import { FormError, FormGrid, Notice, Switch, plural, readApiError, useResetOnOpen } from "@/ui/gestao";
import { SearchableSelect } from "@/ui/v2-components/ui";
import { ESTADOS_BRASIL, getCidadesByEstado } from "@/lib/br-locations";

const emptyForm = {
  name: "",
  city: "",
  state: "",
  coordinator: "",
  status: "active" as "active" | "inactive",
};

export function TenantManager({ tenants }: Readonly<{ tenants: Tenant[] }>) {
  const router = useRouter();
  const { toast } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useResetOnOpen(drawerOpen, () => {
    setForm(
      editing
        ? {
            name: editing.name,
            city: editing.city,
            state: editing.state,
            coordinator: editing.coordinator ?? "",
            status: editing.status,
          }
        : emptyForm,
    );
    setSubmitting(false);
    setError(null);
  });

  /** Cidades filtradas pelo estado selecionado no formulário. */
  const cidadesDisponiveis = useMemo(() => getCidadesByEstado(form.state), [form.state]);

  function openCreate() {
    setEditing(null);
    setDrawerOpen(true);
  }

  function openEdit(tenant: Tenant) {
    setEditing(tenant);
    setDrawerOpen(true);
  }

  function handleEstadoChange(novoEstado: string) {
    setForm((f) => ({
      ...f,
      state: novoEstado,
      // Limpa a cidade apenas se ela não pertence ao novo estado
      city: getCidadesByEstado(novoEstado).includes(f.city) ? f.city : "",
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch(editing ? `/api/tenants/${editing.id}` : "/api/tenants", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        city: form.city,
        state: form.state,
        coordinator: form.coordinator || null,
        status: form.status,
      }),
    });

    setSubmitting(false);
    if (!response.ok) {
      setError(await readApiError(response, "Não foi possível salvar a localidade."));
      return;
    }

    toast(editing ? "Localidade atualizada." : "Localidade criada.");
    setDrawerOpen(false);
    startTransition(() => router.refresh());
  }

  const createButton = (
    <Button variant="primary" size="sm" icon="plus" onClick={openCreate}>
      Nova localidade
    </Button>
  );

  return (
    <>
      <Card>
        <CardHeader
          title="Igrejas da rede"
          meta={tenants.length > 0 ? `${plural(tenants.length, "localidade", "localidades")} · dados isolados` : undefined}
          action={createButton}
        />
        <div className="pt-2">
          {tenants.length === 0 ? (
            <div className="px-4 pb-4">
              <EmptyState
                title="Nenhuma localidade cadastrada."
                reason="Cada localidade é uma unidade operacional da central, com contatos, cuidadores e assistidos próprios."
                hint={<>Use &quot;Nova localidade&quot; para cadastrar a primeira.</>}
              />
            </div>
          ) : (
            <Table caption="Igrejas da rede">
              <thead>
                <tr>
                  <Th>Igreja</Th>
                  <Th>Cidade</Th>
                  <Th>Coordenação</Th>
                  <Th>Situação</Th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <Tr key={tenant.id} onActivate={() => openEdit(tenant)} aria-label={`Editar ${tenant.name}`}>
                    <Td className="font-medium">{tenant.name}</Td>
                    <Td>
                      {tenant.city}/{tenant.state}
                    </Td>
                    <Td>{tenant.coordinator || <span className="text-muted">—</span>}</Td>
                    <Td>
                      <Pill tone={tenant.status === "active" ? "success" : "muted"}>
                        {tenant.status === "active" ? "Ativa" : "Inativa"}
                      </Pill>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      </Card>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Editar localidade" : "Nova localidade"}
        subtitle={editing ? editing.name : "Cada localidade é uma unidade operacional da central."}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDrawerOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" form="tenant-form" loading={submitting}>
              {editing ? "Salvar localidade" : "Criar localidade"}
            </Button>
          </>
        }
      >
        <form id="tenant-form" onSubmit={handleSubmit} className="grid gap-4">
          <Input
            label="Nome da igreja"
            value={form.name}
            onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
            placeholder="Ex.: AD Curitiba"
            hint="Aparece no topo do painel e nos links de cadastro."
            required
            data-autofocus
          />
          <Input
            label="Coordenador"
            value={form.coordinator}
            onChange={(event) => setForm((f) => ({ ...f, coordinator: event.target.value }))}
            placeholder="Nome do responsável"
          />
          <FormGrid>
            {/* Estado primeiro: ele filtra as cidades */}
            <SearchableSelect
              label="Estado (UF)"
              value={form.state}
              onChange={handleEstadoChange}
              options={ESTADOS_BRASIL}
              placeholder="Selecione o estado"
              required
            />
            <SearchableSelect
              label="Cidade"
              value={form.city}
              onChange={(v) => setForm((f) => ({ ...f, city: v }))}
              options={cidadesDisponiveis}
              placeholder={form.state ? "Selecione a cidade" : "Selecione o estado primeiro"}
              required
            />
          </FormGrid>
          <Switch
            checked={form.status === "active"}
            onChange={(event) => setForm((f) => ({ ...f, status: event.target.checked ? "active" : "inactive" }))}
            label={form.status === "active" ? "Central ativa" : "Central inativa"}
          />
          <Notice>Desativar bloqueia o acesso dos cuidadores sem apagar nenhum dado.</Notice>
          <FormError>{error}</FormError>
        </form>
      </Drawer>
    </>
  );
}
