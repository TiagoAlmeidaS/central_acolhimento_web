"use client";

import { useMemo, useState } from "react";
import type { Followup } from "@/server/domain/mvp";
import { Card, StatusPill } from "@/ui/v2-components/ui";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBell,
  IconCalendar,
  IconClock,
  IconDoc,
  IconHeart,
  IconMessage,
  IconPhone,
  IconUser,
} from "@/ui/v2-components/icons";

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
  return parseDateOnly(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatDayHeader(value: string) {
  const d = parseDateOnly(value);
  const dayName = d.toLocaleDateString("pt-BR", { weekday: "long", timeZone: "UTC" });
  const dateStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
  return { dayName, dateStr, full: `${dayName}, ${dateStr}` };
}

function isToday(value: string) {
  return value === toDateOnly(new Date());
}

function isPastDay(value: string) {
  return value < toDateOnly(new Date());
}

const typeIcons: Record<Followup["type"], React.ReactNode> = {
  visit: <IconUser size={13} />,
  call: <IconPhone size={13} />,
  message: <IconMessage size={13} />,
  prayer: <IconHeart size={13} />,
  other: <IconDoc size={13} />,
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

export function WeeklySchedulePanel({ followups }: Props) {
  const [referenceDate, setReferenceDate] = useState(() => toDateOnly(new Date()));

  const weekStart = useMemo(() => getMonday(referenceDate), [referenceDate]);
  const weekEnd = addDays(weekStart, 6);

  const weekLabel = `${formatDateLabel(weekStart)} — ${formatDateLabel(weekEnd)}`;

  const days = useMemo(() => {
    const scheduled = followups.filter((f) => {
      if (!f.nextActionAt) return false;
      const date = f.nextActionAt.slice(0, 10);
      return date >= weekStart && date <= weekEnd;
    });

    const result: Array<{
      date: string;
      dayName: string;
      dateStr: string;
      full: string;
      items: Followup[];
    }> = [];

    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const { dayName, dateStr, full } = formatDayHeader(date);
      const items = scheduled
        .filter((f) => f.nextActionAt?.slice(0, 10) === date)
        .sort((a, b) => (a.nextActionAt ?? "").localeCompare(b.nextActionAt ?? ""));
      result.push({ date, dayName, dateStr, full, items });
    }

    return result;
  }, [followups, weekStart]);

  const goPrevWeek = () => setReferenceDate(addDays(referenceDate, -7));
  const goNextWeek = () => setReferenceDate(addDays(referenceDate, 7));
  const goToday = () => setReferenceDate(toDateOnly(new Date()));

  return (
    <Card padding={24}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
            Ações Programadas
          </h3>
          <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--text-3)" }}>
            Acompanhamentos agendados pelos cuidadores
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={goPrevWeek}
            style={navBtnStyle}
            title="Semana anterior"
          >
            <IconArrowLeft size={16} />
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 10,
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              fontSize: 13,
              fontWeight: 700,
              color: "var(--text)",
              whiteSpace: "nowrap",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <IconCalendar size={14} color="var(--accent)" />
            {weekLabel}
          </div>

          <button
            onClick={goNextWeek}
            style={navBtnStyle}
            title="Próxima semana"
          >
            <IconArrowRight size={16} />
          </button>

          <button
            onClick={goToday}
            style={{
              ...navBtnStyle,
              fontWeight: 700,
              fontSize: 12,
              padding: "6px 12px",
              width: "auto",
            }}
          >
            Hoje
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {days.map((day) => {
          const today = isToday(day.date);
          const past = isPastDay(day.date);

          return (
            <div
              key={day.date}
              style={{
                borderRadius: 14,
                border: `1.5px solid ${today ? "var(--accent)" : "var(--border)"}`,
                background: today ? "var(--accent-bg)" : "var(--surface-2)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 16px",
                  borderBottom: day.items.length > 0 ? "1px solid var(--border)" : "none",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: today ? 800 : 600,
                    color: today ? "var(--accent)" : "var(--text)",
                    textTransform: "capitalize",
                  }}
                >
                  {day.full}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)" }}>
                  {day.items.length} {day.items.length === 1 ? "ação" : "ações"}
                </span>
              </div>

              {day.items.length === 0 ? (
                <div
                  style={{
                    padding: "14px 16px",
                    fontSize: 12.5,
                    color: "var(--text-3)",
                    fontStyle: "italic",
                  }}
                >
                  Nenhuma ação programada
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {day.items.map((item) => {
                    const overdue =
                      item.nextActionAt !== null &&
                      new Date(item.nextActionAt) < new Date();
                    const title = item.notes ? parseTitle(item.notes) : null;
                    const time = extractTime(item.nextActionAt ?? "");

                    return (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          padding: "12px 16px",
                          borderBottom: "1px solid var(--border)",
                          background: overdue ? "#FFF1F2" : "transparent",
                        }}
                      >
                        <div
                          style={{
                            minWidth: 56,
                            textAlign: "center",
                            padding: "4px 8px",
                            borderRadius: 8,
                            background: overdue ? "#FEE2E2" : "var(--surface)",
                            border: `1px solid ${overdue ? "#FECDD3" : "var(--border)"}`,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 800,
                              color: overdue ? "#DC2626" : "var(--text)",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {time}
                          </div>
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              flexWrap: "wrap",
                              marginBottom: 3,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 11.5,
                                fontWeight: 700,
                                color: "var(--accent)",
                              }}
                            >
                              {typeIcons[item.type]}
                              {typeLabels[item.type]}
                            </div>

                            {overdue && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                  fontSize: 10,
                                  fontWeight: 800,
                                  textTransform: "uppercase",
                                  color: "#DC2626",
                                  background: "#FEE2E2",
                                  padding: "1px 6px",
                                  borderRadius: 4,
                                }}
                              >
                                <IconBell size={10} />
                                Vencida
                              </span>
                            )}
                          </div>

                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "var(--text)",
                              marginBottom: 2,
                            }}
                          >
                            {item.member ?? "Membro não identificado"}
                          </div>

                          {title && (
                            <div
                              style={{
                                fontSize: 12.5,
                                color: "var(--text-2)",
                                marginBottom: 2,
                              }}
                            >
                              {title}
                            </div>
                          )}

                          <div
                            style={{
                              fontSize: 11.5,
                              color: "var(--text-3)",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            {item.caregiver ? (
                              <>Cuidador: {item.caregiver}</>
                            ) : (
                              "Sem cuidador atribuído"
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {days.every((d) => d.items.length === 0) && (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "var(--text-3)",
            fontSize: 13.5,
          }}
        >
          Nenhuma ação programada para esta semana.
        </div>
      )}
    </Card>
  );
}

const navBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 36,
  height: 36,
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 13,
};
