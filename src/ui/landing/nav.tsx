import Link from "next/link";
import { Brand } from "./brand";
import { ROUTES } from "./routes";

export function LandingNav() {
  return (
    <header className="l-nav">
      <div className="l-wrap">
        <Brand />
        <nav aria-label="Principal">
          <a href="#cadastro">Como funciona</a>
          <a href="#mapa">Mapa</a>
          <a href="#fluxo">Privacidade</a>
          <a href="#papeis">Para quem</a>
        </nav>
        <div className="right">
          <Link className="l-btn" href={ROUTES.login}>
            Entrar
          </Link>
          <Link className="l-btn fill" href={ROUTES.criar}>
            Criar central
          </Link>
        </div>
      </div>
    </header>
  );
}
