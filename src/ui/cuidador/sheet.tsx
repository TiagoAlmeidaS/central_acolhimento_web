"use client";

import { useState } from "react";
import { cx, Drawer, type DrawerProps } from "@/ui/atalaia";

/**
 * Estilo de "bottom sheet" para o `Drawer` no celular: o painel sobe de baixo, ocupa a largura
 * toda e deixa uma fresta do conteúdo atrás. Acima de 560px continua sendo o painel lateral.
 */
const SHEET_CSS = `
@media (max-width: 560px) {
  .cuidador-sheet.atalaia-drawer {
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    max-height: 92dvh;
    border-radius: 14px 14px 0 0;
    border-top: 1px solid var(--border-strong);
    animation-name: cuidador-sheet-up;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  .cuidador-sheet.atalaia-drawer::before {
    content: "";
    align-self: center;
    flex: none;
    width: 36px;
    height: 4px;
    margin-top: 8px;
    border-radius: 999px;
    background: var(--border-strong);
  }
}
@keyframes cuidador-sheet-up {
  from { transform: translateY(24px); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .cuidador-sheet.atalaia-drawer { animation: none; }
}
`;

/** `Drawer` do Atalaia com cara de bottom sheet no celular. Mesmas props do `Drawer`. */
export function Sheet({ className, ...props }: DrawerProps) {
  return (
    <>
      <style href="cuidador-sheet" precedence="medium">
        {SHEET_CSS}
      </style>
      <Drawer {...props} className={cx("cuidador-sheet", className)} />
    </>
  );
}

/**
 * Reinicia o estado de um formulário toda vez que o drawer abre. Usa o padrão de ajustar estado
 * durante a renderização (sem efeito), então o formulário já nasce com os valores iniciais.
 */
export function useResetOnOpen(open: boolean, reset: () => void) {
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) reset();
  }
}
