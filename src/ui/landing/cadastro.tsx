import Link from "next/link";
import { Icon } from "@/ui/atalaia";
import { QUESTION_COUNTS } from "./data";
import { ModulesGrid } from "./modules-grid";
import { RoleShortcuts } from "./role-shortcuts";
import { RoleSteps } from "./role-steps";
import { ROUTES } from "./routes";

const QUESTIONS = [
  {
    id: "none",
    href: ROUTES.contatos,
    text: `Quem está sem cuidador há mais de ${QUESTION_COUNTS.days} dias?`,
    count: QUESTION_COUNTS.noCare,
  },
  {
    id: "late",
    href: ROUTES.assistidos,
    text: "Quem passou da data da próxima visita?",
    count: QUESTION_COUNTS.late,
  },
  {
    id: "absent",
    href: ROUTES.encontros,
    text: "Quem faltou aos três últimos cultos de domingo?",
    count: QUESTION_COUNTS.absent,
  },
  {
    id: "cars",
    href: ROUTES.saidas,
    text: "Quantos cuidadores podem levar gente no sábado?",
    count: QUESTION_COUNTS.drivers,
  },
] as const;

export function Cadastro() {
  return (
    <section className="l-framed" id="cadastro" aria-labelledby="cad-h">
      <div className="l-col">
        <div className="l-inner">
          <div className="l-split">
            <div>
              <h2 className="l-h2" id="cad-h">
                Cadastre na recepção. Cuide pelo celular.
              </h2>
              <p className="l-p">
                A recepção usa <span className="l-code">Novo contato</span> e a pessoa já entra no quadro. O cuidador
                abre <span className="l-code">Registrar acompanhamento</span> depois de cada visita e marca a próxima
                antes de salvar.
              </p>
              <div className="l-links">
                <span className="l-label" style={{ width: "100%" }}>
                  Entrar como
                </span>
                <RoleShortcuts />
                <Link className="l-link" href={ROUTES.contatos}>
                  Ver o quadro
                  <Icon name="arrow" />
                </Link>
              </div>
            </div>
            <div>
              <span className="l-label">Como a equipe começa</span>
              <br />
              <RoleSteps />
            </div>
          </div>
          <ModulesGrid />
          <div className="l-qs">
            <span className="l-label">Perguntas que o painel responde</span>
            <ul>
              {QUESTIONS.map((q) => (
                <li key={q.id}>
                  <Link href={q.href}>
                    <span>{q.text}</span>
                    <b>{q.count}</b>
                    <small>
                      <span>Abrir</span>
                      <Icon name="arrow" />
                    </small>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
