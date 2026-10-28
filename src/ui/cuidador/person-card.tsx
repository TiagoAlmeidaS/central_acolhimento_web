import { Avatar, buttonClass, cx, Icon, Pill, StatusPill, TempPill } from "@/ui/atalaia";
import { isOverdue, relativeDay, whatsappUrl, telUrl, formatDayMonth, type CarePerson } from "./care-utils";

/** Linha de apoio do cartão: bairro/cidade, idade, casa aberta. */
function placeLine(person: CarePerson) {
  const place = [person.neighborhood, person.city].filter(Boolean).join(" · ");
  const parts = [place || "Sem endereço", person.age ? `${person.age} anos` : "", person.openHouse ? "casa aberta" : ""];
  return parts.filter(Boolean).join(" · ");
}

export type PersonCardProps = {
  person: CarePerson;
  nowIso: string;
  onOpen: (person: CarePerson) => void;
  className?: string;
};

/**
 * Cartão de contato/assistido (seedCard do protótipo). A área principal abre o drawer; as ações
 * de WhatsApp e ligação ficam numa linha própria, para não aninhar controles interativos.
 */
export function PersonCard({ person, nowIso, onOpen, className }: PersonCardProps) {
  const overdue = isOverdue(person, nowIso);
  const last = person.lastContactAt;

  return (
    <li
      className={cx(
        "min-w-0 rounded-card border bg-surface",
        person.isUrgent ? "border-danger/60" : "border-border",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(person)}
        aria-label={`${person.name}, abrir ficha`}
        className="flex min-h-11 w-full cursor-pointer items-start gap-3 rounded-card border-0 bg-transparent px-3.5 py-3 text-left text-fg transition-colors duration-150 hover:bg-sunken"
      >
        <Avatar name={person.name} size="lg" />
        <span className="grid min-w-0 flex-1 gap-1.5">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <b className="min-w-0 max-w-full truncate font-semibold">{person.name}</b>
            {person.isUrgent ? <StatusPill status="urgente" /> : null}
          </span>
          <small className="truncate text-xs text-muted">{placeLine(person)}</small>
          <span className="flex flex-wrap items-center gap-1.5">
            <StatusPill status={person.status} />
            {person.temperature ? <TempPill temperature={person.temperature} /> : null}
            {person.kind === "seed" ? <Pill tone="neutral" dot={false}>Contato novo</Pill> : null}
          </span>
          <small className={cx("text-xs", overdue ? "font-semibold text-danger" : "text-subtle")}>
            {overdue && person.nextActionAt
              ? `Ação atrasada desde ${formatDayMonth(person.nextActionAt)}`
              : last
                ? `Último contato ${relativeDay(last, nowIso)}`
                : person.kind === "seed"
                  ? "Ainda sem primeiro contato"
                  : "Nenhum acompanhamento ainda"}
          </small>
        </span>
      </button>

      {person.phone ? (
        <div className="flex gap-2 border-t border-border px-3.5 py-2">
          <a
            href={whatsappUrl(person.phone)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Abrir WhatsApp de ${person.name}`}
            className={buttonClass("neutral", "sm", "flex-1 max-[560px]:min-h-10")}
          >
            <Icon name="whatsapp" size={15} />
            WhatsApp
          </a>
          <a
            href={telUrl(person.phone)}
            aria-label={`Ligar para ${person.name}`}
            className={buttonClass("neutral", "sm", "flex-1 max-[560px]:min-h-10")}
          >
            <Icon name="phone" size={15} />
            Ligar
          </a>
        </div>
      ) : (
        <p className="border-t border-border px-3.5 py-2 text-xs text-subtle">Sem telefone cadastrado.</p>
      )}
    </li>
  );
}
