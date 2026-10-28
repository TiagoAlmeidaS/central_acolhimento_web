import { Icon } from "@/ui/atalaia";
import { FlowDot } from "./flow-dot";

function Node({ x, y, w, label, glyph }: Readonly<{ x: number; y: number; w: number; label: string; glyph: string }>) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={48} rx={3} fill="#120a06" stroke="#3a2c20" />
      <text x={x + 18} y={y + 30} fill="#fff0de" fontSize={15} fontWeight={500}>
        {glyph} {label}
      </text>
    </g>
  );
}

function Step({ x, y, n }: Readonly<{ x: number; y: number; n: number }>) {
  return (
    <g>
      <circle cx={x} cy={y} r={11} fill="#fff0de" />
      <text x={x} y={y + 4} textAnchor="middle" fill="#0e0704" fontSize={10} fontWeight={600}>
        0{n}
      </text>
    </g>
  );
}

const CARDS: ReadonlyArray<readonly [string, string, string]> = [
  [
    "01",
    "Cadastrar e atribuir",
    "A recepção cadastra em menos de um minuto. A coordenação escolhe o cuidador olhando a carga de cada um.",
  ],
  [
    "02",
    "Visitar e registrar",
    "O cuidador registra visita, ligação ou oração e marca a próxima data. Só ele e a coordenação leem as notas.",
  ],
  [
    "03",
    "Consolidar com frequência",
    "Culto, célula e EBD mostram quem firmou e quem esfriou, antes que a pessoa suma.",
  ],
];

export function Fluxo() {
  return (
    <section className="l-framed" id="fluxo" aria-labelledby="fluxo-h">
      <div className="l-col">
        <div className="l-inner">
          <div className="l-intro">
            <h2 className="l-h2" id="fluxo-h">
              Cada pessoa tem um caminho e um responsável.
            </h2>
            <p className="l-p">
              O cuidador vê só quem está com ele. A coordenação vê a igreja inteira. Pedidos de oração ficam na ficha da
              pessoa, nunca em lista aberta.
            </p>
            <a className="l-link" href="#fluxo-cards" style={{ marginTop: 18 }}>
              Como funciona a privacidade
              <Icon name="arrow" />
            </a>
          </div>
          <div className="l-flow">
            <div className="l-flow-art">
              <svg viewBox="0 0 1000 400" role="img" aria-labelledby="flow-t">
                <title id="flow-t">
                  Recepção cadastra a ficha, o cuidador designado registra visitas dentro da igreja e a pessoa chega à
                  célula; a coordenação vê cada passo.
                </title>
                <rect x={490} y={44} width={330} height={290} rx={4} fill="none" stroke="#5a4838" strokeDasharray="5 5" />
                <text x={508} y={66} fill="#a39582" fontSize={11} letterSpacing={2}>
                  SUA IGREJA
                </text>
                <path d="M215 134 L 246 134 M 452 134 L 520 134 M 790 134 L 850 134" stroke="#8a7c6c" strokeWidth={1.2} fill="none" />
                <path d="M 655 158 L 655 210" stroke="#8a7c6c" strokeWidth={1.2} strokeDasharray="2 3" />
                <path
                  d="M 655 334 L 655 372 Q 655 382 645 382 L 150 382 Q 140 382 140 372 L 140 160"
                  stroke="#8a7c6c"
                  strokeWidth={1.2}
                  fill="none"
                />
                <path d="M 134 170 L 140 158 L 146 170" fill="#8a7c6c" />
                <Node x={65} y={110} w={150} label="Recepção" glyph="◎" />
                <Step x={262} y={92} n={1} />
                <text x={280} y={96} fill="#cdbfad" fontSize={11} letterSpacing={2}>
                  FICHA DE CHEGADA
                </text>
                <rect x={246} y={116} width={206} height={36} rx={3} fill="#17100a" stroke="#3a2c20" />
                <rect x={258} y={129} width={10} height={10} rx={2} fill="#f2b24c" />
                <text x={275} y={138.5} fill="#fff0de" fontSize={12}>
                  Francisca · Mangabeira
                </text>
                <Step x={474} y={134} n={2} />
                <Node x={520} y={110} w={270} label="Cuidador designado" glyph="◉" />
                <rect x={706} y={98} width={76} height={20} rx={10} fill="#f2b24c" />
                <text x={744} y={112} textAnchor="middle" fill="#1b1206" fontSize={9} fontWeight={600} letterSpacing={1}>
                  ATRIBUÍDO
                </text>
                <g>
                  <rect x={520} y={210} width={270} height={96} rx={3} fill="#120a06" stroke="#3a2c20" />
                  <text x={538} y={238} fill="#fff0de" fontSize={15} fontWeight={500}>
                    ⌁ Linha do tempo
                  </text>
                  <line x1={520} y1={252} x2={790} y2={252} stroke="#3a2c20" />
                  <text x={538} y={280} fill="#cdbfad" fontSize={12}>
                    próxima visita
                  </text>
                  <text x={772} y={280} textAnchor="end" fill="#f2b24c" fontSize={12}>
                    sáb, 31 out
                  </text>
                </g>
                <Node x={850} y={110} w={120} label="Célula" glyph="▲" />
                <Step x={140} y={382} n={3} />
                <text x={168} y={372} fill="#cdbfad" fontSize={11} letterSpacing={2}>
                  A COORDENAÇÃO VÊ CADA PASSO
                </text>
                <FlowDot />
              </svg>
              <ol className="l-flow-list" aria-label="Caminho de uma pessoa">
                <li>
                  <b>01</b>
                  <span>Recepção preenche a ficha de chegada: Francisca · Mangabeira</span>
                </li>
                <li>
                  <b>02</b>
                  <span>Dentro da igreja, o cuidador designado registra visitas na linha do tempo</span>
                </li>
                <li>
                  <b>▲</b>
                  <span>A pessoa chega à célula e é consolidada</span>
                </li>
                <li>
                  <b>03</b>
                  <span>A coordenação vê cada passo no painel</span>
                </li>
              </ol>
            </div>
            <div className="l-num3" id="fluxo-cards">
              {CARDS.map(([n, title, text]) => (
                <div key={n}>
                  <small>{n}</small>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
