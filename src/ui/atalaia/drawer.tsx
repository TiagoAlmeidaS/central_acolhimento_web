"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconButton } from "./button";
import { cx } from "./cx";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const subscribeNothing = () => () => {};

export type DrawerProps = {
  open: boolean;
  /** Chamado ao pressionar Esc, clicar no fundo ou no botao Fechar. */
  onClose: () => void;
  /** Titulo do drawer (h2) e nome acessivel do dialogo. */
  title: ReactNode;
  subtitle?: ReactNode;
  /** Corpo rolavel. Ler na pagina, escrever aqui: formularios de cadastro e edicao. */
  children: ReactNode;
  /** Rodape fixo com as acoes (no maximo um botao primario). */
  footer?: ReactNode;
  /** Item alinhado a esquerda do rodape (ex.: "Desativar"). */
  footerStart?: ReactNode;
  className?: string;
};

/**
 * Painel lateral direito modal (role=dialog, aria-modal). Foco preso no painel, Esc e clique
 * no fundo fecham, e o foco volta ao elemento que abriu. Marque um campo com `data-autofocus`
 * para recebe-lo ao abrir; sem isso o foco vai para o proprio painel.
 */
export function Drawer({ open, onClose, title, subtitle, children, footer, footerStart, className }: DrawerProps) {
  const mounted = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Guarda o ultimo elemento focado fora do painel: e para ele que o foco volta.
  useEffect(() => {
    function onFocusIn(event: FocusEvent) {
      const target = event.target;
      if (target instanceof HTMLElement && !target.closest("[data-atalaia-drawer]")) {
        returnRef.current = target;
      }
    }
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, []);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const previouslyFocused = returnRef.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if (panel && !panel.contains(document.activeElement)) {
      const preferred = panel.querySelector<HTMLElement>("[data-autofocus]");
      (preferred ?? panel).focus();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !event.defaultPrevented) {
        event.stopPropagation();
        onCloseRef.current();
      }
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      if (previouslyFocused && document.body.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [open]);

  function trapTab(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const panel = panelRef.current;
    if (!panel) return;
    const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !el.hasAttribute("disabled") && el.offsetParent !== null,
    );
    if (items.length === 0) {
      event.preventDefault();
      panel.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === panel)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        aria-hidden="true"
        onMouseDown={onClose}
        className="atalaia-blanket absolute inset-0 bg-[var(--blanket)]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-atalaia-drawer=""
        tabIndex={-1}
        onKeyDown={trapTab}
        className={cx(
          "atalaia-drawer absolute inset-y-0 right-0 flex w-[min(480px,100%)] flex-col bg-surface shadow-[var(--shadow-lg)] outline-none",
          className,
        )}
      >
        <div className="flex items-start gap-3 border-b border-border px-5 pb-3.5 pt-[18px]">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            {subtitle ? <div className="mt-0.5 text-[13px] text-muted">{subtitle}</div> : null}
          </div>
          <IconButton label="Fechar" icon="x" onClick={onClose} className="ml-auto" />
        </div>
        <div className="grid flex-1 content-start gap-[18px] overflow-y-auto px-5 py-[18px]">{children}</div>
        {footer || footerStart ? (
          <div className="flex items-center justify-end gap-2 border-t border-border bg-surface px-5 py-3">
            {footerStart ? <div className="mr-auto">{footerStart}</div> : null}
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
