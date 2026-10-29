import type { HTMLAttributes } from "react";
import { cx } from "./cx";

/** Rotulo tecnico em IBM Plex Mono, maiusculo, 11px, cor `muted`. */
export function Eyebrow({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...rest}
      className={cx("font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted", className)}
    />
  );
}

export const MonoLabel = Eyebrow;
