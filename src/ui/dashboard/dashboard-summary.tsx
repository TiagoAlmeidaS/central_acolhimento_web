import type { DashboardCard } from "@/server/domain/mvp";
import { Stat } from "@/ui/atalaia";

/** Linha de indicadores do resumo do painel (rotulo mono + numero + detalhe). */
export function DashboardSummary({ cards }: Readonly<{ cards: DashboardCard[] }>) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Resumo">
      {cards.map((card) => (
        <Stat key={card.label} label={card.label} value={card.value} note={card.detail} />
      ))}
    </section>
  );
}
