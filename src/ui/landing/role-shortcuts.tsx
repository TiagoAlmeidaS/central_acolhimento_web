import Link from "next/link";
import { Icon } from "@/ui/atalaia";
import { ROUTES } from "./routes";

/** Três atalhos redondos para entrar no app como cada papel (todos passam pelo login). */
export function RoleShortcuts() {
  return (
    <div className="l-roles">
      <Link href={ROUTES.login} aria-label="Entrar como coordenação">
        <Icon name="painel" />
      </Link>
      <Link href={ROUTES.login} aria-label="Entrar como cuidador">
        <Icon name="call" />
      </Link>
      <Link href={ROUTES.login} aria-label="Entrar para ver o quadro de contatos">
        <Icon name="contatos" />
      </Link>
    </div>
  );
}
