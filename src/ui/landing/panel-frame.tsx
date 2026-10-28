import { SNAPSHOT } from "./data";

/** Miniatura do painel da coordenação (dados fictícios) que emerge do arco do hero. */
export function PanelFrame() {
  const s = SNAPSHOT;
  const max = Math.max(1, ...s.funnel.map((f) => f[1]));
  return (
    <div id="hero-frame" role="img" aria-label={`Painel da coordenação com ${s.needs.length} pessoas esperando alguém`}>
      <div className="mf-bar" aria-hidden="true">
        <i />
        <i />
        <i />
        <span>atalaia · {s.tenant}</span>
      </div>
      <div className="mf" aria-hidden="true">
        <div className="mf-side">
          <b>{s.tenant}</b>
          <span className="on">
            Painel <em>{s.needsCount}</em>
          </span>
          <span>Contatos</span>
          <span>Assistidos</span>
          <span>Saídas</span>
          <span>Encontros</span>
          <span>Ajustes</span>
        </div>
        <div className="mf-main">
          <div className="mf-head">
            <h3>Bom dia, {s.first}</h3>
            <small>{s.date}</small>
          </div>
          <div className="mf-kpis">
            {s.kpis.map(([label, value, alert]) => (
              <div key={label}>
                <small>{label}</small>
                <b className={alert ? "alert" : ""}>{value}</b>
              </div>
            ))}
          </div>
          <div className="mf-cols">
            <div className="mf-box">
              <small>Precisa de alguém</small>
              {s.needs.map((n) => (
                <div className="mf-row" key={n.name}>
                  <i className={n.sev === 3 ? "hi" : ""} />
                  <span>
                    {n.name} <small>· {n.reason}</small>
                  </span>
                  <em>{n.action}</em>
                </div>
              ))}
            </div>
            <div className="mf-box">
              <small>Jornada</small>
              <div className="mf-bars">
                {s.funnel.map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <u>
                      <b style={{ width: `${(value / max) * 100}%` }} />
                    </u>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
