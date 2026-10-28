import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/ui/atalaia";
import { ROUTES } from "./routes";

type Front = {
  id: string;
  color: string;
  art: ReactNode;
  title: string;
  text: string;
  href: string;
  cta: string;
};

const FRONTS: readonly Front[] = [
  {
    id: "painel",
    color: "#f2b24c",
    art: <path d="M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z" />,
    title: "Painel da coordenação",
    text: "A fila de quem precisa de alguém, a carga de cada cuidador e a jornada da igreja numa tela.",
    href: ROUTES.painel,
    cta: "Abrir o painel",
  },
  {
    id: "cuidador",
    color: "#6fb6ff",
    art: (
      <>
        <rect x="6" y="2" width="12" height="20" rx="2.5" />
        <path d="M10 18h4" />
      </>
    ),
    title: "Celular do cuidador",
    text: "Só as pessoas sob seu cuidado, com telefone, endereço e a próxima visita. Registro em três toques.",
    href: ROUTES.cuidador,
    cta: "Ver como cuidador",
  },
  {
    id: "saidas",
    color: "#6fd3a2",
    art: (
      <>
        <path d="M4 16V11l2-5h12l2 5v5M4 16h16M4 16v3M20 16v3" />
        <circle cx="8" cy="13" r="1" />
        <circle cx="16" cy="13" r="1" />
      </>
    ),
    title: "Saídas em grupo",
    text: "Quem vai, quem tem carro e quantos lugares. Os grupos saem montados com um cuidador em cada.",
    href: ROUTES.saidas,
    cta: "Abrir saídas",
  },
  {
    id: "rede",
    color: "#d98aff",
    art: (
      <>
        <circle cx="12" cy="5" r="2.5" />
        <circle cx="5" cy="18" r="2.5" />
        <circle cx="19" cy="18" r="2.5" />
        <path d="M12 7.5v4M12 11.5 6.5 16M12 11.5l5.5 4.5" />
      </>
    ),
    title: "Rede de igrejas",
    text: "Cada igreja com seus dados isolados, seus canais de cadastro e seus ajustes de alerta.",
    href: ROUTES.ajustes,
    cta: "Abrir ajustes",
  },
];

export function Papeis() {
  return (
    <section className="l-framed" id="papeis" aria-labelledby="papeis-h">
      <div className="l-col">
        <div className="l-inner">
          <h2 className="l-h2" id="papeis-h" style={{ maxWidth: "15em" }}>
            Uma central para quem coordena, visita e recebe.
          </h2>
          <div className="l-grid4">
            {FRONTS.map((f) => (
              <article className="l-card l-card-tall" key={f.id}>
                <svg
                  viewBox="0 0 24 24"
                  width={28}
                  height={28}
                  fill="none"
                  stroke={f.color}
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  {f.art}
                </svg>
                <h3 className="l-h3">{f.title}</h3>
                <p>{f.text}</p>
                <Link className="l-more" href={f.href}>
                  {f.cta}
                  <Icon name="arrow" />
                </Link>
              </article>
            ))}
          </div>
          <Link className="l-link" href={ROUTES.criar} style={{ marginTop: 36 }}>
            Criar a central da minha igreja
            <Icon name="arrow" />
          </Link>
        </div>
      </div>
    </section>
  );
}
