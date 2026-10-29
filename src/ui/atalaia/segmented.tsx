"use client";

import { useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { cx } from "./cx";

export type SegmentedOption<T extends string> = { value: T; label: ReactNode };

export type SegmentedProps<T extends string> = {
  options: Array<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  /** Nome acessivel do grupo (ex.: "Visualizacao"). */
  label: string;
  className?: string;
};

/** Alternador de visualizacao (ex.: quadro | lista | mapa). Um botao `aria-pressed` por opcao. */
export function Segmented<T extends string>({ options, value, onChange, label, className }: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cx("inline-flex gap-0.5 rounded-md bg-sunken p-0.5", className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cx(
              "h-7 cursor-pointer rounded-control border-0 px-2.5 font-medium transition-colors duration-150 max-[560px]:min-h-9",
              active ? "bg-surface text-fg shadow-[0_1px_2px_rgba(0,0,0,0.12)]" : "bg-transparent text-muted hover:text-fg",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export type TabItem<T extends string> = { value: T; label: ReactNode; count?: number };

export type TabsProps<T extends string> = {
  tabs: Array<TabItem<T>>;
  value: T;
  onChange: (value: T) => void;
  /** Nome acessivel da lista de abas. */
  label: string;
  /** Prefixo dos ids: aba = `${idPrefix}-tab-${value}`, painel = `${idPrefix}-panel-${value}`. */
  idPrefix?: string;
  className?: string;
};

/**
 * Abas com sublinhado. Setas esquerda/direita, Home e End movem a selecao.
 * O painel deve usar `role="tabpanel"` com o id e o aria-labelledby descritos em `idPrefix`.
 */
export function Tabs<T extends string>({ tabs, value, onChange, label, idPrefix = "tabs", className }: TabsProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = tabs.findIndex((tab) => tab.value === value);
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    onChange(tabs[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cx("flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border", className)}
    >
      {tabs.map((tab, i) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${idPrefix}-tab-${tab.value}`}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${tab.value}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.value)}
            className={cx(
              "-mb-px h-9 cursor-pointer whitespace-nowrap border-0 border-b-2 bg-transparent px-3 font-medium",
              selected ? "border-primary text-fg" : "border-transparent text-muted hover:text-fg",
            )}
          >
            {tab.label}
            {tab.count !== undefined ? <span className="ml-1.5 font-mono text-[11px] text-subtle">{tab.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
