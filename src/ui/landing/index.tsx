import "./landing.css";
import { Cadastro } from "./cadastro";
import { Fechamento, LandingFooter } from "./fechamento";
import { Fluxo } from "./fluxo";
import { Hero } from "./hero";
import { Mapa } from "./mapa";
import { LandingNav } from "./nav";
import { Papeis } from "./papeis";
import { Rede } from "./rede";

/** Landing do Atalaia: nav, hero, rede, cadastro, mapa, fluxo, papéis, fechamento e rodapé. */
export function Landing() {
  return (
    <div className="lp2">
      <a className="l-skip" href="#main">
        Pular para o conteúdo
      </a>
      <LandingNav />
      <main id="main" tabIndex={-1}>
        <Hero />
        <Rede />
        <Cadastro />
        <Mapa />
        <Fluxo />
        <Papeis />
        <Fechamento />
      </main>
      <LandingFooter />
    </div>
  );
}
