import { useState } from "react";

/**
 * Reinicia o estado de um formulário de drawer sempre que ele abre.
 * Usa o padrão "ajustar estado durante a renderização" (sem useEffect), então não há render extra visível.
 * `reset` só deve chamar setters de estado do próprio componente.
 */
export function useResetOnOpen(open: boolean, reset: () => void) {
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) reset();
  }
}
