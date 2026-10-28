import type { Followup } from "@/server/domain/mvp";
import { fmtDate, fmtTime, shortName } from "./format";

export const FOLLOWUP_TYPE_LABEL: Record<Followup["type"], string> = {
  visit: "Visita",
  call: "Ligação",
  message: "Mensagem",
  prayer: "Oração",
  other: "Outro",
};

export const FOLLOWUP_TYPES = Object.keys(FOLLOWUP_TYPE_LABEL) as Array<Followup["type"]>;

/**
 * Linha do tempo de acompanhamentos (mais recente primeiro): ponto âmbar, tipo, data e quem fez.
 * As notas ficam sempre visíveis. Não depende só de cor para nada.
 */
export function FollowupTimeline({ followups, emptyText }: { followups: Followup[]; emptyText?: string }) {
  const sorted = [...followups].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  if (sorted.length === 0) {
    return <p className="text-muted">{emptyText ?? "Nenhum acompanhamento ainda. O primeiro costuma ser uma ligação."}</p>;
  }
  return (
    <ol className="m-0 list-none p-0">
      {sorted.map((followup) => (
        <li
          key={followup.id}
          className="relative pb-3.5 pl-[22px] before:absolute before:bottom-[-6px] before:left-[5px] before:top-1.5 before:w-px before:bg-border before:content-[''] after:absolute after:left-0 after:top-1 after:size-[11px] after:rounded-full after:border-2 after:border-primary after:bg-surface after:content-[''] last:before:hidden"
        >
          <div className="flex flex-wrap gap-x-2 text-xs text-muted">
            <b className="text-fg">{FOLLOWUP_TYPE_LABEL[followup.type]}</b>
            <span className="font-mono">
              {fmtDate(followup.occurredAt)} {fmtTime(followup.occurredAt)}
            </span>
            {followup.caregiver ? <span>· {shortName(followup.caregiver)}</span> : null}
          </div>
          {followup.notes ? <p className="mt-0.5 whitespace-pre-line text-[13px]">{followup.notes}</p> : null}
          {followup.nextActionAt ? (
            <p className="mt-0.5 text-xs text-muted">
              Próximo contato: <span className="font-mono">{fmtDate(followup.nextActionAt)}</span>
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
