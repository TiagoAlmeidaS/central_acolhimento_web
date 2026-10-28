"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "./use-reduced-motion";

const WORDS = ["Acolhimento", "Visitas", "Cuidado", "Consolidação"] as const;

/** Título do hero. A palavra apaga e escreve letra a letra; com movimento reduzido fica fixa. */
export function HeroTitle() {
  const reduced = usePrefersReducedMotion();
  const [word, setWord] = useState<string>(WORDS[0]);

  useEffect(() => {
    if (reduced) return;
    let index = 0;
    let text: string = WORDS[0];
    let timer: ReturnType<typeof setTimeout> | undefined;
    const set = (next: string) => {
      text = next;
      setWord(next);
    };
    const later = (fn: () => void, ms: number) => {
      timer = setTimeout(fn, ms);
    };
    const erase = () => {
      if (text.length) {
        set(text.slice(0, -1));
        later(erase, 45);
      } else {
        index = (index + 1) % WORDS.length;
        later(type, 220);
      }
    };
    const type = () => {
      const target = WORDS[index];
      if (text.length < target.length) {
        set(target.slice(0, text.length + 1));
        later(type, 75);
      } else {
        later(erase, 2600);
      }
    };
    later(erase, 2600);
    return () => clearTimeout(timer);
  }, [reduced]);

  return (
    <h1 id="hero-h">
      <span className="l-sr">Acolhimento, visitas, cuidado e consolidação sem ninguém esquecido.</span>
      <span aria-hidden="true">
        <span className="word">{reduced ? WORDS[0] : word}</span>
        <span id="hero-cursor">_</span>
        <br />
        sem ninguém esquecido.
      </span>
    </h1>
  );
}
