import type { TciSession, TciSessionStatus } from "@/server/domain/mvp";

export function normalizeTimeLabel(value: string) {
  return value.trim().slice(0, 5);
}

function timeToMinutes(value: string) {
  const normalized = normalizeTimeLabel(value);
  const [hoursRaw, minutesRaw] = normalized.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    throw new Error("Horario invalido. Use o formato HH:MM.");
  }

  return hours * 60 + minutes;
}

export function validateTciSessionWindow(startsAt: string, endsAt: string) {
  const startMinutes = timeToMinutes(startsAt);
  const endMinutes = timeToMinutes(endsAt);

  if (endMinutes <= startMinutes) {
    throw new Error("O horario final precisa ser maior que o horario inicial.");
  }
}

export function sessionsOverlap(
  leftStartsAt: string,
  leftEndsAt: string,
  rightStartsAt: string,
  rightEndsAt: string,
) {
  const leftStart = timeToMinutes(leftStartsAt);
  const leftEnd = timeToMinutes(leftEndsAt);
  const rightStart = timeToMinutes(rightStartsAt);
  const rightEnd = timeToMinutes(rightEndsAt);

  return leftStart < rightEnd && rightStart < leftEnd;
}

export function isEditableTciStatus(status: TciSessionStatus) {
  return status !== "completed" && status !== "cancelled";
}

export function getWeekRange(weekStart: string) {
  const start = new Date(`${weekStart}T00:00:00`);
  if (Number.isNaN(start.getTime())) {
    throw new Error("weekStart invalido.");
  }

  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  return {
    start,
    end,
  };
}

export function filterSessionsByWeek(sessions: TciSession[], weekStart: string) {
  const { start, end } = getWeekRange(weekStart);
  return sessions.filter((session) => {
    const current = new Date(`${session.scheduledDate}T00:00:00`);
    return current >= start && current <= end;
  });
}
