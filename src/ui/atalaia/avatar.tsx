import type { HTMLAttributes } from "react";
import { cx } from "./cx";

/** Iniciais de um nome: "Maria Souza" -> "MS"; um nome so -> duas primeiras letras. */
export function getInitials(name?: string | null): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export type AvatarProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  /** Nome da pessoa; sem nome vira o marcador tracejado "sem cuidador". */
  name?: string | null;
  size?: "sm" | "md" | "lg";
};

const SIZE = {
  sm: "size-5 text-[9px]",
  md: "size-6 text-[10px]",
  lg: "size-10 text-sm",
};

/** Avatar de iniciais. Decorativo: o nome deve aparecer em texto ao lado. */
export function Avatar({ name, size = "md", className, ...rest }: AvatarProps) {
  const initials = getInitials(name);
  return (
    <span
      title={name ?? "Sem cuidador"}
      aria-hidden="true"
      {...rest}
      className={cx(
        "inline-grid shrink-0 place-items-center rounded-full font-bold tracking-[0.02em]",
        SIZE[size],
        initials
          ? "bg-primary-soft text-primary"
          : "border border-dashed border-border-strong bg-transparent text-subtle",
        className,
      )}
    >
      {initials || "?"}
    </span>
  );
}
