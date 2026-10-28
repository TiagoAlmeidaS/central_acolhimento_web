import Link from "next/link";
import { Icon } from "@/ui/atalaia";
import { MAP_POINTS, MAP_STATS } from "./data";
import { DOT_COLORS } from "./dot-colors";
import { DotsCanvas } from "./dots-canvas";
import { ROUTES } from "./routes";

const MEMBERS_OTHER = "#8a7c6c";

export function Mapa() {
  const m = MAP_STATS;
  const total = m.seeds + m.members;
  const max = Math.max(1, total);
  const seg = (n: number, color: string) => <i style={{ width: `${(n / max) * 100}%`, background: color }} />;

  return (
    <section className="l-framed" id="mapa" aria-labelledby="mapa-h">
      <div className="l-col">
        <div className="l-inner">
          <div className="l-intro">
            <h2 className="l-h2" id="mapa-h">
              Veja onde estão as casas antes de sair.
            </h2>
            <p className="l-p">
              Cada contato tem bairro e coordenadas aproximadas. A coordenação monta a saída de sábado por região e sabe
              quais casas recebem vizinhos.
            </p>
          </div>
          <div className="l-box">
            <div className="l-box-text">
              <p>
                Uma saída rende mais quando os grupos visitam casas próximas. O mapa mostra quem chegou, em que etapa
                está e onde há casa aberta.
              </p>
              <strong>
                Em {m.city}, {m.seeds} pessoas estão no quadro de contatos.
                <br />
                Com os assistidos, a igreja acompanha {total}.
              </strong>
              <div className="l-cmp" role="img" aria-label={`${m.seeds} contatos no quadro; ${total} pessoas com os assistidos`}>
                <div>
                  <span>contatos no quadro</span>
                  <u>{seg(m.seeds, DOT_COLORS.contacted)}</u>
                  <b>{m.seeds}</b>
                </div>
                <div>
                  <span>+ assistidos</span>
                  <u>
                    {seg(m.seeds, DOT_COLORS.contacted)}
                    {seg(m.inProgress, DOT_COLORS.in_progress)}
                    {seg(m.consolidated, DOT_COLORS.consolidated)}
                    {seg(m.members - m.inProgress - m.consolidated, MEMBERS_OTHER)}
                  </u>
                  <b>{total}</b>
                </div>
              </div>
              <ol className="l-abcd">
                <li>
                  <b style={{ color: DOT_COLORS.contacted }}>A</b>
                  <span>contatos em jornada</span>
                  <span>{m.seeds}</span>
                </li>
                <li>
                  <b style={{ color: DOT_COLORS.in_progress }}>B</b>
                  <span>assistidos em acompanhamento</span>
                  <span>{m.inProgress}</span>
                </li>
                <li>
                  <b style={{ color: DOT_COLORS.consolidated }}>C</b>
                  <span>assistidos consolidados</span>
                  <span>{m.consolidated}</span>
                </li>
                <li>
                  <b style={{ color: "var(--l-lume)" }}>D</b>
                  <span>casas abertas para visitas</span>
                  <span>{m.open}</span>
                </li>
              </ol>
              <Link className="l-link" href={ROUTES.contatos}>
                Abrir o mapa
                <Icon name="arrow" />
              </Link>
            </div>
            <div className="l-dots">
              <DotsCanvas
                points={MAP_POINTS}
                label={`Mapa pontilhado de ${m.city} com ${MAP_POINTS.length} casas por situação: ${m.seeds} contatos em jornada, ${m.inProgress} assistidos em acompanhamento, ${m.consolidated} consolidados e ${m.open} casas abertas para visitas.`}
              />
              <div className="l-legend">
                <span className="l-label">Situação</span>
                <span>
                  <i style={{ background: DOT_COLORS.new }} />
                  Novo
                </span>
                <span>
                  <i style={{ background: DOT_COLORS.contacted }} />
                  Contatado ou aguardando visita
                </span>
                <span>
                  <i style={{ background: DOT_COLORS.in_progress }} />
                  Em acompanhamento
                </span>
                <span>
                  <i style={{ background: DOT_COLORS.consolidated }} />
                  Consolidado
                </span>
                <span>
                  <i className="ring" />
                  Casa aberta
                </span>
                <span>
                  <i style={{ background: DOT_COLORS.urgent }} />
                  Urgente
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
