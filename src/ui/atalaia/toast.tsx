"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cx } from "./cx";
import { Icon } from "./icons";

export type ToastTone = "success" | "error";

type ToastItem = { id: number; message: string; tone: ToastTone };

export type ToastApi = {
  /** Mostra um aviso curto. Ex.: toast("Contato salvo."). */
  toast: (message: string, options?: { tone?: ToastTone }) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const DURATION_MS = 3600;
const MAX_VISIBLE = 3;

function ToastView({ item, onDone }: { item: ToastItem; onDone: (id: number) => void }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDone(item.id), DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [item.id, onDone]);

  return (
    <div
      role={item.tone === "error" ? "alert" : "status"}
      className={cx(
        "atalaia-toast pointer-events-auto flex items-center gap-2.5 rounded-md bg-fg px-3.5 py-2.5 text-[13px] text-bg shadow-[var(--shadow-lg)]",
      )}
    >
      <Icon name={item.tone === "error" ? "alert" : "check"} />
      <span>{item.message}</span>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback<ToastApi["toast"]>((message, options) => {
    const id = nextId.current++;
    setItems((current) => [...current, { id, message, tone: options?.tone ?? "success" }].slice(-MAX_VISIBLE));
  }, []);

  const api = useMemo<ToastApi>(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-[calc(20px+env(safe-area-inset-bottom,0px))] left-1/2 z-[80] grid w-max max-w-[min(420px,calc(100vw-32px))] -translate-x-1/2 gap-2"
      >
        {items.map((item) => (
          <ToastView key={item.id} item={item} onDone={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Acesso ao `toast()`. Exige o ToastProvider (ja montado em AppProviders). */
export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast precisa estar dentro do ToastProvider.");
  return context;
}
