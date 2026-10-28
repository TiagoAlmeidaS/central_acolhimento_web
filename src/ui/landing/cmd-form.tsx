"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "@/ui/atalaia";
import { CMD_EXAMPLE, SOURCES } from "./data";
import { ROUTES } from "./routes";

const ERROR_TEXT =
  "Escreva nome, telefone com DDD e bairro, separados por ponto: Maria Silva · (83) 99999-0000 · Torre";

/**
 * Linha de cadastro (demonstração): valida "nome · telefone · bairro" e leva a
 * pessoa para criar a central. Não chama API e não guarda o que foi digitado.
 */
export function CmdForm({ idPrefix }: Readonly<{ idPrefix: string }>) {
  const router = useRouter();
  const [error, setError] = useState("");
  const errId = `${idPrefix}-err`;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = String(new FormData(event.currentTarget).get("who") ?? "");
    const parts = raw
      .split(/[·|,]/)
      .map((x) => x.trim())
      .filter(Boolean);
    const name = parts.find((x) => !/\d/.test(x));
    const phone = parts.find((x) => x.replace(/\D/g, "").length >= 10);
    if (!name || !phone) {
      setError(ERROR_TEXT);
      return;
    }
    setError("");
    router.push(ROUTES.criar);
  }

  return (
    <>
      <form className="l-cmd" aria-label="Cadastrar uma pessoa nova" onSubmit={onSubmit} noValidate>
        <label className="l-sr" htmlFor={`${idPrefix}-src`}>
          Como chegou
        </label>
        <select id={`${idPrefix}-src`} name="source" defaultValue={SOURCES[0]}>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <label className="l-sr" htmlFor={`${idPrefix}-who`}>
          Nome, telefone e bairro
        </label>
        <input
          id={`${idPrefix}-who`}
          name="who"
          autoComplete="off"
          placeholder="Nome · (83) 9…  · bairro"
          defaultValue={CMD_EXAMPLE}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errId : undefined}
        />
        <button type="submit">
          Cadastrar
          <Icon name="arrow" />
        </button>
      </form>
      <p className="l-cmd-err" id={errId} role="alert">
        {error}
      </p>
    </>
  );
}
