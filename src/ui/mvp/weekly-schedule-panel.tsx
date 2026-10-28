"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Followup } from "@/server/domain/mvp";
import { Card, CardBody, CardHeader, Button, EmptyState, Icon, IconButton, Pill, cx, type IconName } from "@/ui/atalaia";

function parseDateOnly(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addDays(value: string, amount: number) {
  const date = parseDateOnly(value);
  date.setDate(date.getDate() + amount);
  return toDateOnly(date);
}

function getMonday(dateStr: string): string {
  const date = parseDateOnly(dateStr);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toDateOnly(date);
}

function formatDateLabel(value: string) {
  return parseDateOnly(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatDayHeader(value: string) {
  const d = parseDateOnly(value);
  const dayName = d.toLocaleDateString("pt-BR", { weekday: "long" });
  const dateStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return { dayName, dateStr };
}

function isToday(value: string) {
  return value === toDateOnly(new Date());
}

const typeIcons: Record<Followup["type"], IconName> = {
  visit: "visit",
  call: "call",
  message: "message",
  prayer: "prayer",
  other: "other",
};

const typeLabels: Record<Followup["type"], string> = {
  visit: "Visita",
  call: "Ligação",
  message: "Mensagem",
  prayer: "Oração",
  other: "Outro",
};

function parseTitle(notes: string): string | null {
  if (notes.startsWith("Agendado:")) {
    return notes.split("\n")[0].replace("Agendado:", "").trim();
  }
  return null;
}

function extractTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  followups: Followup[];
}

/** Ações marcadas pelos cuidadores, semana a semana. */
export function WeeklySchedulePanel({ followups }: Props) {
  const [referenceDate, setReferenceDate] = useState(() => toDateOnly(new Date()));

  const weekStart = useMemo(() => getMonday(referenceDate), [referenceDate]);
  const weekEnd = addDays(weekStart, 6);
  const weekLabel = `${formatDateLabel(weekStart)} a ${formatDateLabel(weekEnd)}`;

  const days = useMemo(() => {
    const scheduled = followups.filter((f) => {
      if (!f.nextActionAt) return false;
      const date = f.nextActionAt.slice(0, 10);
      return date >= weekStart && date <= addDays(weekStart, 6);
    });

    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const { dayName, dateStr } = formatDayHeader(date);
      const items = scheduled
        .filter((f) => f.nextActionAt?.slice(0, 10) === date)
        .sort((a, b) => (a.nextActionAt ?? "").localeCompare(b.nextActionAt ?? ""));
      return { date, dayName, dateStr, items };
    });
  }, [followups, weekStart]);

  const total = days.reduce((sum, day) => sum + day.items.length, 0);

  return (
    <Card aria-labelledby="weekly-heading">
      <CardHeader
        id="weekly-heading"
        title="Ações programadas"
        meta="agendadas pelos cuidadores"
        action={
          <div className="flex items-center gap-1">
            <IconButton
              label="Semana anterior"
              icon="arrow-left"
              size="sm"
              onClick={() => setReferenceDate(addDays(referenceDate, -7))}
            />
            <span
              className="px-1.5 font-mono text-xs tabular-nums text-fg"
              aria-live="polite"
            >
              {weekLabel}
            </span>
            <IconButton
              label="Próxima semana"
              icon="chevron-right"
              size="sm"
              onClick={() => setReferenceDate(addDays(referenceDate, 7))}
            />
            <Button size="sm" onClick={() => setReferenceDate(toDateOnly(new Date()))}>
              Hoje
            </Button>
          </div>
        }
      />
      <CardBody className="grid gap-2">
        {total === 0 ? (
          <EmptyState
            title="Nenhuma ação nesta semana."
            reason="Quando um cuidador marcar a próxima ação de um acompanhamento, ela aparece no dia combinado."
            hint="Use as setas para ver outras semanas."
          />
        ) : (
          days.map((day) => {
            const today = isToday(day.date);
            return (
              <section
                key={day.date}
                aria-label={`${day.dayName}, ${day.dateStr}`}
                className={cx(
                  "overflow-hidden rounded-card border",
                  today ? "border-primary bg-primary-soft/40" : "border-border bg-raised",
                )}
              >
                <div className="flex items-center justify-between px-3 py-2 text-[13px]">
                  <span className={cx("font-medium capitalize", today ? "text-primary" : "text-fg")}>
                    {day.dayName}, {day.dateStr}
                    {today ? <span className="ml-2 font-mono text-[11px] uppercase tracking-wider">hoje</span> : null}
                  </span>
                  <span className="font-mono text-[11px] text-muted">
                    {day.items.length} {day.items.length === 1 ? "ação" : "ações"}
                  </span>
                </div>

                {day.items.length > 0 ? (
                  <ul>
                    {day.items.map((item) => {
                      const overdue = item.nextActionAt !== null && new Date(item.nextActionAt) < new Date();
                      const title = item.notes ? parseTitle(item.notes) : null;
                      return (
                        <li
                          key={item.id}
                          className={cx(
                            "flex items-start gap-3 border-t border-border px-3 py-2.5",
                            overdue && "bg-danger-soft/60",
                          )}
                        >
                          <span
                            className={cx(
                              "mt-0.5 min-w-14 rounded-control border px-2 py-0.5 text-center font-mono text-[13px] tabular-nums",
                              overdue ? "border-danger text-danger" : "border-border bg-surface text-fg",
                            )}
                          >
                            {extractTime(item.nextActionAt ?? "")}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                              <span className="inline-flex items-center gap-1 font-semibold text-primary">
                                <Icon name={typeIcons[item.type]} size={13} />
                                {typeLabels[item.type]}
                              </span>
                              {overdue ? <Pill tone="danger">Vencida</Pill> : null}
                            </div>
                            <div className="font-semibold">
                              <Link className="hover:underline" href="/coord/acompanhamentos">
                                {item.member ?? "Membro não identificado"}
                              </Link>
                            </div>
                            {title ? <div className="text-[13px] text-muted">{title}</div> : null}
                            <div className="text-xs text-subtle">
                              {item.caregiver ? `Cuidador: ${item.caregiver}` : "Sem cuidador atribuído"}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </section>
            );
          })
        )}
      </CardBody>
    </Card>
  );
}
