"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/**
 * `prefers-reduced-motion: reduce` como estado reativo.
 * `serverValue` é o que o servidor renderiza antes da hidratação
 * (use `true` onde o movimento só deve existir depois de confirmado).
 */
export function usePrefersReducedMotion(serverValue = false): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => serverValue,
  );
}
