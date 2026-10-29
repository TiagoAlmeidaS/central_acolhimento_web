"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/ui/atalaia";
import { ROUTES } from "./routes";

type RoleKey = "recepcao" | "coordenacao" | "cuidador";

const ROLES: ReadonlyArray<{ value: RoleKey; label: string }> = [
  { value: "recepcao", label: "Recepção" },
  { value: "coordenacao", label: "Coordenação" },
  { value: "cuidador", label: "Cuidador" },
];

const ROLE_STEPS: Record<RoleKey, ReadonlyArray<readonly [label: string, text: string, href: string]>> = {
  recepcao: [
    ["Passo 1", "Abrir Novo contato no celular da recepção", ROUTES.contatos],
    ["Passo 2", "Nome, telefone e bairro; marcar urgente se precisar de ligação hoje", ROUTES.contatos],
    ["Passo 3", "Pronto: a pessoa entra em Novos e a coordenação é avisada", ROUTES.painel],
  ],
  coordenacao: [
    ["Passo 1", "Abrir Precisa de alguém no painel, todo dia de manhã", ROUTES.painel],
    ["Passo 2", "Atribuir um cuidador olhando a carga de cada um", ROUTES.painel],
    ["Passo 3", "Montar a saída de sábado: os grupos por carro saem prontos", ROUTES.saidas],
  ],
  cuidador: [
    ["Passo 1", "Ver Minhas próximas ações com telefone e endereço", ROUTES.cuidador],
    ["Passo 2", "Registrar visita, ligação ou oração depois do encontro", ROUTES.cuidadorRegistro],
    ["Passo 3", "Marcar a data do próximo contato antes de salvar", ROUTES.cuidadorRegistro],
  ],
};

/** Passos de quem começa, por papel. */
export function RoleSteps() {
  const [role, setRole] = useState<RoleKey>("recepcao");
  return (
    <>
      <label className="l-sr" htmlFor="l-role">
        Papel
      </label>
      <select
        className="l-steps-pick"
        id="l-role"
        value={role}
        onChange={(event) => setRole(event.target.value as RoleKey)}
      >
        {ROLES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <ol className="l-steps" aria-live="polite">
        {ROLE_STEPS[role].map(([label, text, href]) => (
          <li key={label}>
            <span className="l-label">{label}</span>
            <p>{text}</p>
            <Link href={href} aria-label={`Abrir no app: ${text}`}>
              <Icon name="arrow" />
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}
