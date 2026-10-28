import Link from "next/link";
import { Icon } from "@/ui/atalaia";
import { Brand } from "./brand";
import { CmdForm } from "./cmd-form";
import { NETWORK } from "./data";
import { ROUTES } from "./routes";

/** Fechamento: frase final, a linha de cadastro repetida sobre o brilho e a rede de igrejas. */
export function Fechamento() {
  return (
    <section className="l-pre" id="fechamento" aria-labelledby="pre-h">
      <div className="l-wrap">
        <h2 className="l-h2" id="pre-h" style={{ textAlign: "center", margin: "0 auto", maxWidth: "22em" }}>
          Feito para igrejas que não querem perder ninguém de vista.
        </h2>
        <ul className="l-pre-net">
          {NETWORK.map((t) => (
            <li key={t.name}>
              {t.name.replace(/^Igreja Central /, "")}
              <small>{t.seeds} em jornada</small>
            </li>
          ))}
        </ul>
        <div className="l-hero-row" style={{ marginTop: 56 }}>
          <div className="l-hero-left">
            <span className="l-label">Cadastre a primeira pessoa</span>
            <div style={{ height: 16 }} />
            <CmdForm idPrefix="fc" />
          </div>
          <div className="l-side">
            <span className="l-label">Comece pela sua igreja</span>
            <div style={{ height: 4 }} />
            <Link className="l-btn fill" href={ROUTES.criar} style={{ height: 44, padding: "0 18px" }}>
              Criar a central
            </Link>
            <Link className="l-link" href={ROUTES.login}>
              Entrar no app
              <Icon name="arrow" />
            </Link>
          </div>
        </div>
      </div>
      <div className="l-pre-glow" aria-hidden="true" />
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="l-foot">
      <div className="l-wrap">
        <div className="l-foot-brand">
          <Brand />
          <blockquote>
            “Eu te dei por atalaia sobre a casa de Israel.” Ezequiel 33:7. O atalaia ficava no alto do muro para ver
            quem se aproximava.
          </blockquote>
        </div>
        <nav aria-label="Produto">
          <b>Produto</b>
          <Link href={ROUTES.painel}>Painel</Link>
          <Link href={ROUTES.contatos}>Contatos</Link>
          <Link href={ROUTES.assistidos}>Assistidos</Link>
          <Link href={ROUTES.saidas}>Saídas</Link>
          <Link href={ROUTES.encontros}>Encontros</Link>
          <Link href={ROUTES.ajustes}>Ajustes</Link>
        </nav>
        <nav aria-label="Comece">
          <b>Comece</b>
          <Link href={ROUTES.criar}>Criar central</Link>
          <Link href={ROUTES.login}>Entrar</Link>
          <a href="#cadastro">Como funciona</a>
        </nav>
        <div>
          <b>Dados</b>
          <p>
            Convicção religiosa e saúde são dados sensíveis na LGPD (art. 11). Os números e nomes desta página são
            fictícios e a linha de cadastro daqui não envia nada.
          </p>
        </div>
      </div>
    </footer>
  );
}
