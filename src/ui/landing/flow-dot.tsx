"use client";

import { usePrefersReducedMotion } from "./use-reduced-motion";

/** Ponto que percorre o diagrama. Removido com movimento reduzido (e antes da hidratação). */
export function FlowDot() {
  const reduced = usePrefersReducedMotion(true);
  if (reduced) return null;
  return (
    <circle id="flow-dot" r="5" fill="#f2b24c">
      <animateMotion dur="6s" repeatCount="indefinite" path="M215 134 L 520 134 L 790 134 L 850 134" />
    </circle>
  );
}
