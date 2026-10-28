"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useAuth } from "@/auth/auth-context";
import { Avatar } from "@/ui/atalaia/avatar";
import { cx } from "@/ui/atalaia/cx";
import { Icon } from "@/ui/atalaia/icons";

type UserMenuProps = {
  /** Para onde "Meu perfil" leva. */
  profileHref: string;
  /** Lado em que o menu abre em relacao ao botao. */
  placement?: "up" | "down";
  /** So o avatar no botao (barra superior do celular). */
  compact?: boolean;
  className?: string;
};

const ITEM_CLASS =
  "flex h-8 w-full cursor-pointer items-center gap-2 rounded-control border-0 bg-transparent px-2.5 text-left text-sm text-fg hover:bg-sunken focus-visible:bg-sunken";

/** Menu da pessoa logada: quem esta usando, perfil e sair. */
export function UserMenu({ profileHref, placement = "down", compact = false, className }: UserMenuProps) {
  const router = useRouter();
  const { signOut, user, session } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : "Sem sessão";
  const roleLabel = session?.membership.role === "coordinator" ? "Coordenação" : "Cuidador";

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    rootRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function close(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    const index = items.indexOf(document.activeElement as HTMLElement);
    const next = event.key === "ArrowDown" ? (index + 1) % items.length : (index - 1 + items.length) % items.length;
    event.preventDefault();
    items[next]?.focus();
  }

  async function handleLogout() {
    setOpen(false);
    await signOut();
    router.replace("/login");
  }

  return (
    <div ref={rootRef} className={cx("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={compact ? `Menu de ${displayName}` : undefined}
        onClick={() => setOpen((value) => !value)}
        className={cx(
          "flex cursor-pointer items-center gap-2.5 rounded-card border border-transparent bg-transparent text-left hover:bg-surface",
          compact ? "size-8 justify-center p-0" : "w-full p-2",
        )}
      >
        <Avatar name={displayName} size={compact ? "md" : "lg"} />
        {compact ? null : (
          <>
            <span className="min-w-0 flex-1">
              <b className="block truncate text-sm font-semibold">{displayName}</b>
              <small className="block truncate text-xs text-subtle">{roleLabel}</small>
            </span>
            <Icon name="chevron-down" size={14} className="shrink-0 text-subtle" />
          </>
        )}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Conta"
          onKeyDown={onMenuKeyDown}
          className={cx(
            "absolute z-30 w-60 rounded-card border border-border-strong bg-raised p-1 shadow-[var(--shadow)]",
            placement === "up" ? "bottom-full left-0 mb-1" : "right-0 top-full mt-1",
          )}
        >
          <div className="px-2.5 pb-2 pt-1.5">
            <b className="block truncate text-sm">{displayName}</b>
            <small className="block truncate text-xs text-subtle">{user?.email ?? "Sem e-mail"}</small>
            <small className="mt-1 block truncate text-xs text-muted">
              {roleLabel} · {session?.membership.tenantName ?? "Sem localidade"}
            </small>
          </div>
          <div className="my-1 h-px bg-border" />
          <Link href={profileHref} role="menuitem" className={ITEM_CLASS} onClick={() => close(false)}>
            <Icon name="user" />
            Meu perfil
          </Link>
          <button type="button" role="menuitem" className={ITEM_CLASS} onClick={handleLogout}>
            <Icon name="logout" />
            Sair
          </button>
        </div>
      ) : null}
    </div>
  );
}
