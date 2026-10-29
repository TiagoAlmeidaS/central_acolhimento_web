import Link from "next/link";
import type { PeopleDashboardSnapshot } from "@/server/domain/mvp";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Pill,
  Table,
  Td,
  Th,
  Tr,
  cx,
} from "@/ui/atalaia";
import {
  formatDateLabel,
  formatDateTimeLabel,
  type ChurchAttentionItem,
  type ChurchProfileDashboard,
} from "@/ui/coord/church-profile";

const PRIORITY: Record<ChurchAttentionItem["priority"], { label: string; tone: "danger" | "warning" | "cold"; dot: string }> = {
  alta: { label: "Alta", tone: "danger", dot: "bg-danger" },
  media: { label: "Média", tone: "warning", dot: "bg-warning" },
  baixa: { label: "Baixa", tone: "cold", dot: "bg-cold" },
};

/** Avisos de dados do recorte (ex.: coluna ausente), um por linha. */
export function WarningList({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <ul className="grid gap-2" aria-label="Avisos">
      {warnings.map((warning) => (
        <li key={warning} className="rounded-control bg-warning-soft px-3 py-2 text-[13px] text-warning">
          {warning}
        </li>
      ))}
    </ul>
  );
}

// --- Blocos do dashboard de pessoas (segmentos Cuidado e Igreja) --------------------------------

/** Série do período + totais por cidade do estado do recorte. */
export function PeopleTimelineCards({ snapshot, contacts }: { snapshot: PeopleDashboardSnapshot; contacts: boolean }) {
  return (
    <div className="grid gap-4 min-[900px]:grid-cols-2">
      <Card aria-labelledby="timeline-heading">
        <CardHeader
          id="timeline-heading"
          title={contacts ? "Série do período" : "Tendência de presença"}
          meta={contacts ? "cadastros no período" : "presenças por ocorrência fechada"}
        />
        <CardBody className="grid gap-2.5">
          {snapshot.timeline.length > 0 ? (
            snapshot.timeline.map((item) => (
              <div key={item.key} className="grid grid-cols-[minmax(80px,1fr)_repeat(4,minmax(0,1fr))] items-center gap-2 text-[13px]">
                <strong className="font-semibold">{item.label}</strong>
                {Object.entries(item.values).map(([key, value]) => (
                  <span key={key} className="text-muted">
                    {key}: <b className="font-mono font-medium text-fg">{value}</b>
                  </span>
                ))}
              </div>
            ))
          ) : (
            <p className="text-[13px] text-muted">Nenhum dado no período.</p>
          )}
        </CardBody>
      </Card>

      <Card aria-labelledby="cities-heading">
        <CardHeader id="cities-heading" title="Cidades do estado" meta={`totais de ${snapshot.filters.state}`} />
        <CardBody className="grid gap-2.5">
          {snapshot.cities.length > 0 ? (
            snapshot.cities.map((item) => (
              <div key={`${item.state}-${item.city}`} className="rounded-control border border-border bg-raised px-3 py-2.5">
                <div className="mb-1 flex justify-between gap-3">
                  <strong className="font-semibold">{item.city}</strong>
                  <span className="font-mono text-[11px] text-muted">{item.state}</span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted">
                  {Object.entries(item.values).map(([key, value]) => (
                    <span key={key}>
                      {key}: <b className="font-mono font-medium text-fg">{value}</b>
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-[13px] text-muted">Nenhuma cidade com dados no recorte.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

/** Lista nominal (20 primeiros) de contatos ou de frequência. */
export function PeopleNominalList({ snapshot, contacts }: { snapshot: PeopleDashboardSnapshot; contacts: boolean }) {
  return (
    <Card aria-labelledby="nominal-heading">
      <CardHeader
        id="nominal-heading"
        title={contacts ? "Lista nominal de contatos" : "Lista nominal de frequência"}
        meta={`${snapshot.people.length} registro(s)${snapshot.people.length > 20 ? " · mostrando 20" : ""}`}
      />
      {snapshot.people.length > 0 ? (
        <Table caption={contacts ? "Contatos do recorte" : "Frequência do recorte"} wrapperClassName="mt-2">
          <thead>
            <tr>
              <Th>Nome</Th>
              <Th>Localidade</Th>
              <Th>Situação</Th>
              {contacts ? (
                <>
                  <Th>Origem</Th>
                  <Th>Cuidador</Th>
                  <Th>Criado</Th>
                  <Th>Atualizado</Th>
                </>
              ) : (
                <>
                  <Th>Presenças</Th>
                  <Th>Faltas</Th>
                  <Th>Justif.</Th>
                  <Th>Freq.</Th>
                  <Th>Última presença</Th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {snapshot.people.slice(0, 20).map((person) => (
              <Tr key={String(person.id)}>
                <Td className="font-semibold">{String(person.name ?? "Sem nome")}</Td>
                <Td className="text-muted">
                  {String(person.city ?? "")}
                  {person.state ? ` - ${String(person.state)}` : ""} · {String(person.tenantName ?? "Sem localidade")}
                </Td>
                <Td>
                  <Pill tone="neutral">{String((contacts ? person.currentStatus : person.status) ?? "—")}</Pill>
                </Td>
                {contacts ? (
                  <>
                    <Td>{String(person.source ?? "—")}</Td>
                    <Td>{person.caregiver ? String(person.caregiver) : <span className="text-subtle">Sem cuidador</span>}</Td>
                    <Td className="font-mono text-xs">{formatDateTimeLabel(String(person.createdAt ?? ""))}</Td>
                    <Td className="font-mono text-xs">{formatDateTimeLabel(String(person.updatedAt ?? ""))}</Td>
                  </>
                ) : (
                  <>
                    <Td className="font-mono">{String(person.presences ?? 0)}</Td>
                    <Td className="font-mono">{String(person.absences ?? 0)}</Td>
                    <Td className="font-mono">{String(person.justified ?? 0)}</Td>
                    <Td className="font-mono">
                      {person.frequency !== null && person.frequency !== undefined ? `${String(person.frequency)}%` : "—"}
                    </Td>
                    <Td className="font-mono text-xs">{String(person.lastPresence ?? "—")}</Td>
                  </>
                )}
              </Tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <div className="p-4">
          <EmptyState
            title="Nenhum registro com esses filtros."
            reason="O recorte escolhido não encontrou pessoas."
            hint="Amplie o período, escolha “Todas” em cidade e localidade e use “Aplicar”."
          />
        </div>
      )}
    </Card>
  );
}

// --- Perfil da igreja -----------------------------------------------------------------------------

function ChurchTrendChart({ data }: { data: ChurchProfileDashboard["trend"] }) {
  const max = Math.max(...data.map((item) => item.eligible), 1);
  if (data.length === 0) return <p className="text-[13px] text-muted">Sem chamada fechada no período.</p>;
  return (
    <div className="flex items-end gap-2.5 pt-4" role="img" aria-label={`Presenças por data: ${data.map((item) => `${item.label} ${item.rate === null ? "sem dados" : `${item.rate}%`}`).join(", ")}`}>
      {data.map((item) => (
        <div key={item.label} className="flex min-w-10 flex-1 flex-col gap-2">
          <div className="relative flex h-28 items-end border-b border-border">
            <div
              className="relative w-full overflow-hidden rounded-t-control bg-sunken"
              style={{ height: `${(item.eligible / max) * 100}%`, minHeight: item.eligible > 0 ? 12 : 2 }}
            >
              <div
                className="absolute inset-x-0 bottom-0 bg-success"
                style={{ height: item.eligible > 0 ? `${(item.present / item.eligible) * 100}%` : "0%" }}
              />
            </div>
            <span className="absolute inset-x-0 -top-3.5 text-center font-mono text-[11px] text-fg">
              {item.rate === null ? "—" : `${item.rate}%`}
            </span>
          </div>
          <span className="text-center font-mono text-[11px] text-muted">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function ChurchTrendCard({ profile, meetingTypeName }: { profile: ChurchProfileDashboard; meetingTypeName: string | null }) {
  return (
    <Card aria-labelledby="trend-heading">
      <CardHeader
        id="trend-heading"
        title="Tendência de participação"
        meta={`${meetingTypeName ?? "Todos os tipos"} · ausentes ${profile.attendanceBase.absent} · justificadas ${profile.attendanceBase.justified}`}
      />
      <CardBody>
        <p className="-mt-1 mb-1 text-xs text-muted">Verde: presenças na base elegível das chamadas fechadas.</p>
        <ChurchTrendChart data={profile.trend} />
      </CardBody>
    </Card>
  );
}

export function ChurchAttentionCard({ profile }: { profile: ChurchProfileDashboard }) {
  return (
    <Card aria-labelledby="attention-heading">
      <CardHeader
        id="attention-heading"
        title="Pessoas para revisão"
        meta="ausências, frequência e ações vencidas"
        action={
          <Link href="/coord/igreja" className="text-[13px] text-primary underline underline-offset-2">
            Igreja
          </Link>
        }
      />
      {profile.attention.length > 0 ? (
        <ul className="pb-1 pt-2">
          {profile.attention.map((item) => {
            const priority = PRIORITY[item.priority];
            return (
              <li key={item.member.id} className="grid gap-2 border-t border-border px-4 py-3 first:border-t-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span aria-hidden="true" className={cx("size-2 shrink-0 rounded-full", priority.dot)} />
                      <strong className="truncate font-semibold">{item.member.name}</strong>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {item.caregiverName ?? "Sem cuidador"} · última presença: {item.lastPresence ? formatDateLabel(item.lastPresence) : "sem registro"}
                    </p>
                  </div>
                  <Pill tone={priority.tone}>Prioridade {priority.label.toLowerCase()}</Pill>
                </div>
                <p className="text-[13px] text-muted">
                  {item.reason}. {item.presentTotal} presença(s) em {item.sampleTotal} chamada(s).
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" href={`/coord/membros/${item.member.id}/editar`} icon="assistidos">
                    Designar
                  </Button>
                  <Button size="sm" href="/coord/acompanhamentos" icon="message">
                    Iniciar contato
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="p-4">
          <EmptyState
            title="Ninguém para revisar."
            reason="Nenhuma pessoa tem faltas seguidas, frequência baixa ou ação vencida nesta amostra."
            hint="Quando alguém precisar de atenção, aparece aqui com os botões Designar e Iniciar contato."
          />
        </div>
      )}
    </Card>
  );
}
