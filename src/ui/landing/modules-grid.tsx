"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "@/ui/atalaia";
import { ROUTES } from "./routes";
import { usePrefersReducedMotion } from "./use-reduced-motion";

const MODULES: ReadonlyArray<{ href: string; icon: IconName; name: string; text: string }> = [
  {
    href: ROUTES.contatos,
    icon: "contatos",
    name: "contatos",
    text: "Quadro, lista e mapa de quem chegou, do primeiro culto à consolidação.",
  },
  {
    href: ROUTES.assistidos,
    icon: "assistidos",
    name: "assistidos",
    text: "Linha do tempo de cada pessoa: visitas, ligações e pedidos de oração.",
  },
  {
    href: ROUTES.saidas,
    icon: "saidas",
    name: "saidas",
    text: "Saídas de sábado com grupos por carro e pelo menos um cuidador em cada.",
  },
  {
    href: ROUTES.encontros,
    icon: "encontros",
    name: "encontros",
    text: "Frequência de culto, célula e EBD; sessões nas câmaras de TCI.",
  },
  {
    href: ROUTES.ajustes,
    icon: "copy",
    name: "canais",
    text: "Links de cadastro para a equipe, com limite, domínio e aprovação.",
  },
  {
    href: ROUTES.painel,
    icon: "painel",
    name: "painel",
    text: "A fila de quem precisa de alguém hoje, antes de qualquer gráfico.",
  },
];

type Phase = "idle" | "ready" | "revealed";

/**
 * Grade 3×2 de módulos. Reveal único: sobe 16px em 400ms ao entrar na tela (só deslocamento,
 * o conteúdo nunca fica invisível). Sem movimento quando a pessoa pede movimento reduzido.
 */
export function ModulesGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || !("IntersectionObserver" in window)) return;
    // Só prepara o reveal se a grade ainda está abaixo da dobra.
    if (el.getBoundingClientRect().top <= window.innerHeight) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPhase("revealed");
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    setPhase("ready");
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced]);

  const state = reduced ? "idle" : phase;
  return (
    <div
      className={`l-grid3${state === "ready" ? " reveal-ready" : ""}${state === "revealed" ? " revealed" : ""}`}
      id="modulos"
      ref={ref}
    >
      {MODULES.map((m) => (
        <Link className="l-card" href={m.href} key={m.name}>
          <h3>
            <Icon name={m.icon} />
            {m.name}
          </h3>
          <p>{m.text}</p>
        </Link>
      ))}
    </div>
  );
}
