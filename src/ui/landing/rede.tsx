import { NETWORK } from "./data";

function Items({ copy = false }: Readonly<{ copy?: boolean }>) {
  return (
    <>
      {NETWORK.map((t) => (
        <li key={t.name} className={copy ? "dup" : undefined} aria-hidden={copy ? true : undefined}>
          <b>{t.name}</b>
          <span>
            {t.city}/PB · {t.seeds} em jornada · {t.care} cuidadores
          </span>
        </li>
      ))}
    </>
  );
}

/** Faixa contínua com as igrejas da rede de demonstração. A cópia duplicada fica escondida de leitores de tela. */
export function Rede() {
  return (
    <section className="l-rede" id="rede" aria-label="Igrejas da rede de demonstração">
      <div className="l-marquee">
        <ul>
          <Items />
          <Items copy />
        </ul>
        <ul aria-hidden="true">
          <Items copy />
          <Items copy />
        </ul>
      </div>
    </section>
  );
}
