"use client";

import type { HTMLAttributes, KeyboardEvent, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cx } from "./cx";

export type TableProps = HTMLAttributes<HTMLTableElement> & {
  /** Legenda para leitores de tela (nao visivel). */
  caption?: string;
  wrapperClassName?: string;
};

/** Tabela com rolagem horizontal e cabecalho em IBM Plex Mono maiusculo. */
export function Table({ caption, wrapperClassName, className, children, ...rest }: TableProps) {
  return (
    <div className={cx("overflow-x-auto", wrapperClassName)}>
      <table {...rest} className={cx("w-full border-collapse text-[13px] [&_tbody_tr:last-child_td]:border-b-0", className)}>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        {children}
      </table>
    </div>
  );
}

export function Th({ className, scope = "col", ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...rest}
      scope={scope}
      className={cx(
        "sticky top-0 whitespace-nowrap border-b border-border bg-surface px-3 py-2 text-left font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-muted",
        className,
      )}
    />
  );
}

export function Td({ className, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td {...rest} className={cx("border-b border-border px-3 py-[9px] align-middle", className)} />;
}

export type TrProps = HTMLAttributes<HTMLTableRowElement> & {
  /** Torna a linha clicavel e acessivel por teclado (Enter/Espaco). Use para abrir o drawer. */
  onActivate?: () => void;
};

export function Tr({ onActivate, className, onKeyDown, onClick, ...rest }: TrProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || !onActivate) return;
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onActivate();
    }
  }

  return (
    <tr
      {...rest}
      tabIndex={onActivate ? 0 : rest.tabIndex}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onActivate?.();
      }}
      onKeyDown={handleKeyDown}
      className={cx("[&:hover>td]:bg-sunken", onActivate && "cursor-pointer", className)}
    />
  );
}
