"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { OutingEvent, Seed, Tenant } from "@/server/domain/mvp";
import { formatPhone } from "@/ui/mvp/contact-form-utils";
import { Avatar, Button, Card, CardBody, CardHeader, EmptyState, StatusPill, useToast } from "@/ui/atalaia";
import { ContactForm } from "@/ui/coord/contact-form";
import { convertSeedRequest, deleteSeedRequest, SEED_STATUS_LABEL } from "@/ui/coord/seed-utils";

/**
 * Cadastro de contato dentro da pagina (usado no app do cuidador). A coordenacao usa o mesmo
 * formulario (`ContactForm`) dentro de um drawer em /coord/contatos.
 */
export function ContactManager({
  contacts,
  tenants,
  hideList = false,
  initialEditing = null,
  outings = [],
}: Readonly<{
  contacts: Seed[];
  tenants: Tenant[];
  hideList?: boolean;
  initialEditing?: Seed | null;
  outings?: OutingEvent[];
}>) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Seed | null>(initialEditing);
  const [formVersion, setFormVersion] = useState(0);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openEdit(contact: Seed) {
    setEditing(contact);
    setFormVersion((version) => version + 1);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function stopEditing() {
    setEditing(initialEditing);
    setFormVersion((version) => version + 1);
  }

  async function convertContact(contact: Seed) {
    setConvertingId(contact.id);
    setError(null);
    const result = await convertSeedRequest({ ...contact, caregiverId: null });
    setConvertingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    toast(`${contact.referenceName} agora é membro.`);
    startTransition(() => router.refresh());
  }

  async function deleteContact(contact: Seed) {
    const confirmed = window.confirm(`Excluir o contato "${contact.referenceName}"? Esta ação não pode ser desfeita.`);
    if (!confirmed) return;

    setDeletingId(contact.id);
    setError(null);
    const result = await deleteSeedRequest(contact);
    setDeletingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (editing?.id === contact.id) stopEditing();
    toast("Contato excluído.");
    startTransition(() => router.refresh());
  }

  return (
    <div className="grid gap-5">
      <Card aria-labelledby="contact-manager-form">
        <CardHeader id="contact-manager-form" title={editing ? "Editar contato" : "Novo contato"} />
        <CardBody>
          <ContactForm
            key={`${editing?.id ?? "novo"}-${formVersion}`}
            tenants={tenants}
            outings={outings}
            editing={editing}
            formId="contact-manager-form-body"
            showActions
            onCancel={stopEditing}
            onSaved={() => {
              toast("Contato salvo.");
              if (editing && !initialEditing) setEditing(null);
              setFormVersion((version) => version + 1);
              startTransition(() => router.refresh());
            }}
          />
        </CardBody>
      </Card>

      {!hideList ? (
        <Card aria-labelledby="contact-manager-list">
          <CardHeader
            id="contact-manager-list"
            title="Fila de novos contatos"
            meta={`${contacts.length} ${contacts.length === 1 ? "contato" : "contatos"}`}
          />
          <CardBody className="grid gap-3">
            {error ? (
              <p role="alert" className="rounded-control bg-danger-soft px-3 py-2 text-[13px] text-danger">
                {error}
              </p>
            ) : null}

            {contacts.length === 0 ? (
              <EmptyState
                title="Nenhum contato ainda."
                reason="Quem você cadastrar aparece aqui para ser acompanhado e, depois, virar membro."
                hint="Preencha o formulário acima e use “Registrar contato”."
              />
            ) : null}

            {contacts.map((contact) => (
              <article key={contact.id} className="grid gap-2 rounded-card border border-border bg-raised p-3.5">
                <div className="flex items-start gap-3">
                  <Avatar name={contact.referenceName} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{contact.referenceName}</div>
                        <div className="text-xs text-muted">
                          {contact.phone ? formatPhone(contact.phone) : "Sem telefone"} · {contact.city || "Sem cidade"}
                        </div>
                      </div>
                      <StatusPill status={contact.status} label={SEED_STATUS_LABEL[contact.status]} />
                    </div>

                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted">
                      {contact.age !== null ? <span>Idade: {contact.age}</span> : null}
                      {contact.source ? <span>Origem: {contact.source}</span> : null}
                      {contact.openHouse ? <span>Casa aberta</span> : null}
                    </div>

                    {contact.address ? (
                      <div className="mt-1 text-[13px] text-muted">Endereço: {contact.address}</div>
                    ) : null}

                    {contact.houseFrontImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={contact.houseFrontImageUrl}
                        alt="Casa do contato"
                        className="mt-2 max-h-[180px] w-full rounded-control border border-border object-cover"
                      />
                    ) : null}

                    {contact.notes ? <p className="mt-1.5 text-[13px] text-muted">{contact.notes}</p> : null}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => openEdit(contact)}>
                        Editar contato
                      </Button>
                      <Button
                        size="sm"
                        loading={convertingId === contact.id}
                        disabled={deletingId === contact.id || contact.status === "in_progress"}
                        onClick={() => convertContact(contact)}
                      >
                        {contact.status === "in_progress" ? "Já convertido em membro" : "Converter em membro"}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        loading={deletingId === contact.id}
                        disabled={convertingId === contact.id}
                        onClick={() => deleteContact(contact)}
                      >
                        Excluir contato
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
