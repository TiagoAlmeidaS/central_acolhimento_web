import Link from "next/link";
import type { Followup } from "@/server/domain/mvp";
import { Avatar, Button, Card, CardBody, CardHeader, EmptyState, Icon, Pill, cx, type IconName } from "@/ui/atalaia";
import { CAREGIVER_CAPACITY, SEED_STATUS_LABEL, firstName, type SeedStatus } from "@/ui/coord/seed-utils";
import { Meter } from "@/ui/coord/meter";

// --- Abas do painel -----------------------------------------------------------------------------

export function PanelTabs<T extends string>({
  tabs,
  active,
  hrefFor,
}: {
  tabs: Array<{ value: T; label: string; count?: number }>;
  active: T;
  hrefFor: (tab: T) => string;
}) {
  return (
    <nav aria-label="Seções do painel" className="mb-5 flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((tab) => {
        const selected = tab.value === active;
        return (
          <Link
            key={tab.value}
            href={hrefFor(tab.value)}
            aria-current={selected ? "page" : undefined}
            className={cx(
              "-mb-px inline-flex h-9 items-center whitespace-nowrap border-b-2 px-3 font-medium no-underline",
              selected ? "border-primary text-fg" : "border-transparent text-muted hover:text-fg",
            )}
          >
            {tab.label}
            {tab.count !== undefined ? <span className="ml-1.5 font-mono text-[11px] text-subtle">{tab.count}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

// --- Novos contatos por semana (sparkline) -------------------------------------------------------

export function Sparkline({ weeks, label }: { weeks: number[]; label: string }) {
  const max = Math.max(1, ...weeks);
  return (
    <svg viewBox="0 0 80 28" preserveAspectRatio="none" role="img" aria-label={label} className="mt-2 h-7 w-full max-w-40">
      {weeks.map((value, index) => {
        const height = Math.max(2, (value / max) * 26);
        return (
          <rect
            key={index}
            x={index * 10 + 1}
            y={28 - height}
            width={8}
            height={height}
            rx={1.5}
            fill={index === weeks.length - 1 ? "var(--primary)" : "var(--primary-soft)"}
            stroke={index === weeks.length - 1 ? undefined : "var(--border-strong)"}
            strokeWidth={index === weeks.length - 1 ? 0 : 0.5}
          />
        );
      })}
    </svg>
  );
}

// --- Jornada dos contatos --------------------------------------------------------------------------

export function JourneyCard({ counts }: { counts: Array<{ status: SeedStatus; count: number }> }) {
  const max = Math.max(1, ...counts.map((item) => item.count));
  const total = counts.reduce((sum, item) => sum + item.count, 0);
  const consolidated = counts.find((item) => item.status === "consolidated")?.count ?? 0;
  const conversion = total > 0 ? Math.round((consolidated / total) * 100) : 0;

  return (
    <Card aria-labelledby="journey-heading">
      <CardHeader id="journey-heading" title="Jornada dos contatos" meta={`${conversion}% já consolidados`} />
      <CardBody className="grid gap-2">
        {counts.map((item, index) => (
          <Link
            key={item.status}
            href="/coord/contatos"
            className="grid grid-cols-[130px_1fr_32px] items-center gap-3 text-[13px] text-fg no-underline hover:text-primary max-[560px]:grid-cols-[104px_1fr_28px]"
          >
            <span>{SEED_STATUS_LABEL[item.status]}</span>
            <span className="block h-2 overflow-hidden rounded-full bg-sunken">
              <span
                className="block h-full rounded-full bg-primary"
                style={{ width: `${(item.count / max) * 100}%`, opacity: 1 - index * 0.12 }}
              />
            </span>
            <span className="text-right font-mono tabular-nums">{item.count}</span>
          </Link>
        ))}
      </CardBody>
    </Card>
  );
}

// --- Carga dos cuidadores ---------------------------------------------------------------------------

export type CaregiverLoadRow = {
  id: string;
  name: string;
  load: number;
  active: boolean;
  lastActionAt: string | null;
};

export function CaregiverLoadCard({ rows, showLastAction = false }: { rows: CaregiverLoadRow[]; showLastAction?: boolean }) {
  return (
    <Card aria-labelledby="load-heading">
      <CardHeader
        id="load-heading"
        title="Carga dos cuidadores"
        meta={`limite de ${CAREGIVER_CAPACITY}`}
        action={
          <Link href="/coord/cuidadores" className="text-[13px] text-primary underline underline-offset-2">
            Gerenciar
          </Link>
        }
      />
      <CardBody className="grid gap-2.5">
        {rows.length > 0 ? (
          rows.map((row) => (
            <div key={row.id} className="grid grid-cols-[1fr_88px_44px] items-center gap-3 text-[13px] max-[560px]:grid-cols-[1fr_64px_40px]">
              <span className="flex min-w-0 items-center gap-2">
                <Avatar name={row.name} />
                <span className="truncate">{firstName(row.name)}</span>
                {!row.active ? <Pill tone="muted">Inativo</Pill> : null}
              </span>
              <Meter value={row.load} max={CAREGIVER_CAPACITY} />
              <span className="text-right font-mono tabular-nums">
                {row.load}/{CAREGIVER_CAPACITY}
              </span>
              {showLastAction ? (
                <span className="col-span-3 -mt-1.5 pl-8 text-xs text-muted">
                  Última ação: {row.lastActionAt ? new Date(row.lastActionAt).toLocaleDateString("pt-BR") : "sem registro"}
                </span>
              ) : null}
            </div>
          ))
        ) : (
          <EmptyState
            title="Nenhum cuidador ainda."
            reason="Sem cuidadores, ninguém pode ser atribuído e os contatos ficam em “Precisa de alguém”."
            hint="Convide a equipe por um convite ou canal de cadastro."
            action={
              <Button href="/coord/cuidadores?aba=canais" size="sm">
                Criar canal
              </Button>
            }
          />
        )}
      </CardBody>
    </Card>
  );
}

// --- Gráfico de ações dos últimos dias ----------------------------------------------------------------

export function VisitChart({ data }: { data: Array<{ dia: string; n: number }> }) {
  const max = Math.max(...data.map((item) => item.n), 1);
  return (
    <div
      className="flex h-32 items-end gap-2 pt-5"
      role="img"
      aria-label={`Acompanhamentos por dia: ${data.map((item) => `${item.dia} ${item.n}`).join(", ")}`}
    >
      {data.map((item, index) => {
        const isLast = index === data.length - 1;
        return (
          <div key={`${item.dia}-${index}`} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="relative flex w-full flex-1 items-end">
              <div
                className={cx("w-full rounded-t-control", isLast ? "bg-primary" : "bg-primary-soft border border-border-strong")}
                style={{ height: `${(item.n / max) * 100}%`, minHeight: item.n > 0 ? 8 : 2 }}
              />
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 font-mono text-[11px] tabular-nums text-fg">{item.n}</span>
            </div>
            <span className={cx("font-mono text-[11px] uppercase tracking-wider", isLast ? "text-primary" : "text-muted")}>{item.dia}</span>
          </div>
        );
      })}
    </div>
  );
}

// --- Rosca da jornada dos membros -----------------------------------------------------------------------

const DONUT_COLOR: Record<string, string> = {
  novo: "var(--primary)",
  acompanhamento: "var(--cold)",
  concluido: "var(--success)",
  inativo: "var(--subtle)",
};

export function StatusDonut({
  data,
  total,
  size = 140,
}: {
  data: Array<{ key: string; label: string; count: number }>;
  total: number;
  size?: number;
}) {
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const segments = data.reduce<Array<{ item: (typeof data)[number]; length: number; offset: number }>>((acc, item) => {
    const offset = acc.reduce((sum, segment) => sum + segment.length, 0);
    const length = total > 0 ? (item.count / total) * circumference : 0;
    return [...acc, { item, length, offset }];
  }, []);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} role="img" aria-label={`${total} membros: ${data.map((item) => `${item.label} ${item.count}`).join(", ")}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--sunken)" strokeWidth={stroke} />
        {segments.map(({ item, length, offset }) => (
          <circle
            key={item.key}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={DONUT_COLOR[item.key] ?? "var(--subtle)"}
            strokeWidth={stroke}
            strokeDasharray={`${length} ${circumference}`}
            strokeDashoffset={-offset}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-mono text-[28px] font-medium leading-none tabular-nums">{total}</div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted">membros</div>
      </div>
    </div>
  );
}

export function LegendDot({ statusKey }: { statusKey: string }) {
  return <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: DONUT_COLOR[statusKey] ?? "var(--subtle)" }} />;
}

// --- Atividade recente -----------------------------------------------------------------------------------

const FOLLOWUP_LABEL: Record<Followup["type"], string> = {
  visit: "Visita",
  call: "Ligação",
  message: "Mensagem",
  prayer: "Oração",
  other: "Outro",
};

const FOLLOWUP_ICON: Record<Followup["type"], IconName> = {
  visit: "visit",
  call: "call",
  message: "message",
  prayer: "prayer",
  other: "other",
};

export function ActivityFeed({ items, limit = 10 }: { items: Followup[]; limit?: number }) {
  const rows = items.slice(0, limit);
  return (
    <Card aria-labelledby="feed-heading">
      <CardHeader
        id="feed-heading"
        title="Últimas interações pastorais"
        action={
          <Link href="/coord/acompanhamentos" className="text-[13px] text-primary underline underline-offset-2">
            Ver todos
          </Link>
        }
      />
      <CardBody>
        {rows.length > 0 ? (
          <ul className="grid gap-3">
            {rows.map((item) => (
              <li key={item.id} className="grid grid-cols-[28px_1fr] gap-3">
                <span className="grid size-7 place-items-center rounded-control bg-sunken text-muted">
                  <Icon name={FOLLOWUP_ICON[item.type]} size={14} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2 text-[13px]">
                    <b className="font-semibold">{FOLLOWUP_LABEL[item.type]}</b>
                    <span>com {item.member ?? "membro sem nome"}</span>
                    {item.caregiver ? <span className="text-muted">por {item.caregiver}</span> : null}
                    <time className="ml-auto font-mono text-[11px] text-muted" dateTime={item.occurredAt}>
                      {new Date(item.occurredAt).toLocaleDateString("pt-BR")}
                    </time>
                  </div>
                  {item.notes ? <p className="mt-0.5 text-[13px] text-muted">{item.notes}</p> : null}
                  {item.nextActionAt ? (
                    <p className="mt-0.5 text-xs text-primary">Próxima ação: {new Date(item.nextActionAt).toLocaleDateString("pt-BR")}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Sem acompanhamentos ainda."
            reason="Quando um cuidador registrar uma visita ou ligação, ela aparece aqui."
            hint="Cuidadores registram pelo app deles; você também pode usar “Novo acompanhamento”."
            action={
              <Button href="/coord/acompanhamentos" size="sm" icon="plus">
                Novo acompanhamento
              </Button>
            }
          />
        )}
      </CardBody>
    </Card>
  );
}

// --- Temperatura espiritual ---------------------------------------------------------------------------------

export function TemperatureCard({ cold, warm, hot }: { cold: number; warm: number; hot: number }) {
  const total = Math.max(1, cold + warm + hot);
  const parts = [
    { key: "cold", label: "Frio", count: cold, color: "var(--cold)" },
    { key: "warm", label: "Morno", count: warm, color: "var(--warm)" },
    { key: "hot", label: "Quente", count: hot, color: "var(--hot)" },
  ];
  return (
    <Card aria-labelledby="temp-heading">
      <CardHeader id="temp-heading" title="Temperatura espiritual" meta="assistidos ativos" />
      <CardBody className="grid gap-3">
        <div
          className="flex h-2.5 overflow-hidden rounded-full bg-sunken"
          role="img"
          aria-label={`Frio ${cold}, morno ${warm}, quente ${hot}`}
        >
          {parts.map((part) =>
            part.count > 0 ? <span key={part.key} style={{ width: `${(part.count / total) * 100}%`, background: part.color }} /> : null,
          )}
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
          {parts.map((part) => (
            <li key={part.key} className="flex items-center gap-1.5">
              <span aria-hidden="true" className="size-2 rounded-full" style={{ background: part.color }} />
              {part.label} <b className="font-mono font-medium tabular-nums">{part.count}</b>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

/** Indicador com mini grafico de barras (ex.: novos contatos nas ultimas 8 semanas). */
export function SparkStat({ label, value, note, weeks, weeksLabel }: { label: string; value: number; note: string; weeks: number[]; weeksLabel: string }) {
  return (
    <div className="min-w-0 rounded-card border border-border bg-surface px-4 py-3.5">
      <span className="block font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted">{label}</span>
      <div className="mt-1 flex items-baseline gap-2 font-mono text-[28px] font-medium leading-[1.1] tabular-nums max-[560px]:text-[22px]">
        {value}
        <small className="font-sans text-xs font-normal text-muted">{note}</small>
      </div>
      <Sparkline weeks={weeks} label={weeksLabel} />
    </div>
  );
}
