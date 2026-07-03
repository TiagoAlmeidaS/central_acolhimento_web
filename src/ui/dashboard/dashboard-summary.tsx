import type { DashboardCard } from "@/server/domain/mvp";

export function DashboardSummary({ cards }: Readonly<{ cards: DashboardCard[] }>) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">{card.label}</p>
          <p className="mt-4 text-4xl font-black tracking-tight text-slate-900">{card.value}</p>
          <p className="mt-2 text-sm text-slate-500">{card.detail}</p>
        </article>
      ))}
    </section>
  );
}
