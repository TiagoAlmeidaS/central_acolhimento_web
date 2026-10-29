import type { ReactNode } from "react";

/** Grade dos indicadores de um segmento: colunas de no mínimo 170px, sem barra de rolagem. */
export function KpiGrid({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section aria-label={label} className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
      {children}
    </section>
  );
}
