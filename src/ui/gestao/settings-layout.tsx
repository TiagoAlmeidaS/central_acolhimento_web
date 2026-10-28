"use client";

import { useState, type ReactNode } from "react";
import { cx } from "@/ui/atalaia";

export type SettingsSection = {
  id: string;
  label: string;
  /** Número exibido ao lado do rótulo (ex.: pedidos pendentes). */
  badge?: number;
  content: ReactNode;
};

/**
 * Layout de Ajustes: navegação lateral (vira lista horizontal no celular) e uma seção por vez.
 * Todas as seções ficam montadas; só a ativa é exibida, assim formulários não perdem o estado.
 */
export function SettingsLayout({
  sections,
  label = "Ajustes",
  initialId,
}: {
  sections: SettingsSection[];
  label?: string;
  initialId?: string;
}) {
  const [active, setActive] = useState(
    initialId && sections.some((section) => section.id === initialId) ? initialId : (sections[0]?.id ?? ""),
  );

  return (
    <div className="grid items-start gap-4 min-[900px]:grid-cols-[200px_minmax(0,1fr)] min-[900px]:gap-6">
      <nav
        aria-label={label}
        className="flex gap-0.5 overflow-x-auto min-[900px]:sticky min-[900px]:top-4 min-[900px]:grid min-[900px]:overflow-visible"
      >
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            aria-current={active === section.id ? "page" : undefined}
            onClick={() => setActive(section.id)}
            className={cx(
              "flex h-[34px] shrink-0 cursor-pointer items-center justify-between gap-2 whitespace-nowrap rounded-control border-0 px-2.5 text-left font-medium max-[560px]:min-h-9",
              active === section.id ? "bg-primary-soft text-primary" : "bg-transparent text-muted hover:bg-sunken",
            )}
          >
            {section.label}
            {section.badge ? (
              <span className="rounded-control bg-danger-soft px-1.5 font-mono text-[11px] text-danger">
                {section.badge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>
      <div className="grid min-w-0 gap-4">
        {sections.map((section) => (
          <div key={section.id} hidden={active !== section.id} className="grid min-w-0 gap-4">
            {section.content}
          </div>
        ))}
      </div>
    </div>
  );
}
