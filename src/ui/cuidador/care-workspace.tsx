"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthSession, Followup, FollowupType, Member, Seed } from "@/server/domain/mvp";
import { useToast } from "@/ui/atalaia";
import {
  claimSeed,
  convertSeed,
  createFollowup,
  inactivateMember,
  inactivateSeed,
  type ApiResult,
} from "./care-api";
import { CareContacts, type ContactFilter } from "./care-contacts";
import { CareFollowups } from "./care-followups";
import { CareHome } from "./care-home";
import { buildCarePeople, buildNeeds, buildUpcoming, type CarePerson } from "./care-utils";
import { FollowupSheet } from "./followup-sheet";
import { NewContactSheet } from "./new-contact-sheet";
import { PersonSheet } from "./person-sheet";
import { ScheduleSheet } from "./schedule-sheet";

export type CareView = "painel" | "contatos" | "acompanhamentos";

type Overlay =
  | { kind: "none" }
  | { kind: "person"; id: string }
  | { kind: "followup"; memberId: string | null; backTo: string | null }
  | { kind: "schedule"; id: string }
  | { kind: "new" };

export type CareWorkspaceProps = {
  view: CareView;
  members: Member[];
  seeds: Seed[];
  followups: Followup[];
  session: AuthSession;
  /** Instante do carregamento da página (vem do servidor, para a hidratação bater). */
  nowIso: string;
  initialFilter?: ContactFilter;
};

/**
 * Orquestra as três telas do cuidador (painel, contatos, acompanhamentos) e os drawers que elas
 * compartilham: ficha da pessoa, registrar acompanhamento, agendar ação e novo contato.
 * Todas as gravações usam as mesmas APIs de antes (ver `care-api.ts`).
 */
export function CareWorkspace({ view, members, seeds, followups, session, nowIso, initialFilter }: CareWorkspaceProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [overlay, setOverlay] = useState<Overlay>({ kind: "none" });
  const [freshNow, setFreshNow] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const now = freshNow && freshNow > nowIso ? freshNow : nowIso;
  const people = useMemo(() => buildCarePeople(members, seeds, followups), [members, seeds, followups]);
  const needs = useMemo(() => buildNeeds(people, now), [people, now]);
  const upcoming = useMemo(() => buildUpcoming(people, now), [people, now]);
  const memberPeople = useMemo(() => people.filter((person) => person.kind === "member"), [people]);
  const unassigned = useMemo(
    () => seeds.filter((seed) => !seed.caregiverId && seed.status !== "inactive" && seed.status !== "in_progress"),
    [seeds],
  );

  const selectedId = overlay.kind === "person" || overlay.kind === "schedule" ? overlay.id : null;
  const selected = selectedId ? (people.find((person) => person.id === selectedId) ?? null) : null;

  function refresh() {
    startTransition(() => router.refresh());
  }

  function openOverlay(next: Overlay) {
    setFreshNow(new Date().toISOString());
    setActionError(null);
    setOverlay(next);
  }

  const close = () => setOverlay({ kind: "none" });

  const openPerson = (person: CarePerson) => openOverlay({ kind: "person", id: person.id });
  const registerFor = (person?: CarePerson) =>
    openOverlay({
      kind: "followup",
      memberId: person?.kind === "member" ? person.id : null,
      backTo: overlay.kind === "person" && person ? person.id : null,
    });

  async function run(action: () => Promise<ApiResult>, success: string, after?: () => void) {
    setBusy(true);
    setActionError(null);
    const result = await action();
    setBusy(false);
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    toast(success);
    after?.();
    refresh();
  }

  function quickLog(person: CarePerson, type: FollowupType, note: string) {
    return run(
      () => createFollowup({ session, memberId: person.id, type, occurredAt: new Date().toISOString(), notes: note }),
      "Registro salvo na linha do tempo.",
    );
  }

  function convert(person: CarePerson) {
    return run(() => convertSeed(session, person.id, person.notes), `${person.name} agora é um assistido.`, close);
  }

  function inactivate(person: CarePerson) {
    const seed = seeds.find((item) => item.id === person.id);
    return run(
      () => (person.kind === "seed" && seed ? inactivateSeed(seed) : inactivateMember(person.id)),
      `${person.name} foi inativado.`,
      close,
    );
  }

  function claim(seed: Seed) {
    return run(() => claimSeed(session, seed), `${seed.referenceName} agora está com você.`);
  }

  function saved(message: string, options?: { tone?: "success" | "error" }) {
    toast(message, options);
    close();
    refresh();
  }

  const backToPerson =
    overlay.kind === "followup" && overlay.backTo
      ? () => openOverlay({ kind: "person", id: overlay.backTo as string })
      : overlay.kind === "schedule"
        ? () => openOverlay({ kind: "person", id: overlay.id })
        : null;

  return (
    <>
      {view === "painel" ? (
        <CareHome
          session={session}
          people={people}
          needs={needs}
          upcoming={upcoming}
          nowIso={now}
          onOpen={openPerson}
          onRegister={registerFor}
          onNewContact={() => openOverlay({ kind: "new" })}
        />
      ) : null}

      {view === "contatos" ? (
        <CareContacts
          people={people}
          needs={needs}
          unassigned={unassigned}
          nowIso={now}
          initialFilter={initialFilter}
          busy={busy}
          claimError={actionError}
          onOpen={openPerson}
          onNewContact={() => openOverlay({ kind: "new" })}
          onClaim={claim}
        />
      ) : null}

      {view === "acompanhamentos" ? (
        <CareFollowups people={people} followups={followups} nowIso={now} onOpen={openPerson} onRegister={registerFor} />
      ) : null}

      <PersonSheet
        open={overlay.kind === "person"}
        person={selected}
        nowIso={now}
        busy={busy}
        error={overlay.kind === "person" ? actionError : null}
        onClose={close}
        onRegister={registerFor}
        onSchedule={(person) => openOverlay({ kind: "schedule", id: person.id })}
        onQuickLog={quickLog}
        onConvert={convert}
        onInactivate={inactivate}
      />

      <FollowupSheet
        open={overlay.kind === "followup"}
        onClose={close}
        members={memberPeople}
        rawMembers={members}
        session={session}
        nowIso={now}
        initialMemberId={overlay.kind === "followup" ? overlay.memberId : null}
        onBack={overlay.kind === "followup" ? backToPerson : null}
        onSaved={saved}
      />

      <ScheduleSheet
        open={overlay.kind === "schedule"}
        person={overlay.kind === "schedule" ? selected : null}
        session={session}
        nowIso={now}
        onClose={close}
        onBack={backToPerson}
        onSaved={saved}
      />

      <NewContactSheet open={overlay.kind === "new"} session={session} onClose={close} onSaved={saved} />
    </>
  );
}
