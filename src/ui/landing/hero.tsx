import { CmdForm } from "./cmd-form";
import { HeroTitle } from "./hero-title";
import { PanelFrame } from "./panel-frame";
import { RoleShortcuts } from "./role-shortcuts";

export function Hero() {
  return (
    <section className="l-hero" id="hero" aria-labelledby="hero-h">
      <div className="l-wrap l-hero-copy">
        <HeroTitle />
        <p className="lead">
          Do primeiro culto à célula: cada pessoa nova tem um cuidador, uma próxima visita marcada e uma coordenação
          que vê a igreja inteira.
        </p>
        <div className="l-hero-row">
          <div className="l-hero-left">
            <CmdForm idPrefix="hc" />
            <div className="l-cmd-note">
              <span className="dot" aria-hidden="true" />
              <span className="l-label">Cadastre na recepção · o cuidador recebe no celular</span>
            </div>
          </div>
          <div className="l-side">
            <RoleShortcuts />
            <span className="l-label">Entrar no app</span>
          </div>
        </div>
      </div>
      <div className="l-dawn" aria-hidden="true">
        <i className="glow" />
        <i className="drift" />
        <i className="veil" />
        <i className="rim" />
      </div>
      <div className="l-wrap l-frame-wrap">
        <PanelFrame />
      </div>
    </section>
  );
}
