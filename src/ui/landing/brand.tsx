import Link from "next/link";

/** Marca Atalaia da landing: arco com a luz âmbar (a landing é escura nos dois temas). */
export function Brand({ href = "/" }: Readonly<{ href?: string }>) {
  return (
    <Link className="l-brand" href={href}>
      <svg viewBox="0 0 28 28" aria-hidden="true" focusable="false">
        <path className="mark-arch" d="M7.5 23.5V13a6.5 6.5 0 0 1 13 0v10.5M4 23.5h20" />
        <circle className="mark-lume" cx="14" cy="14.5" r="2.6" />
      </svg>
      <span>Atalaia</span>
    </Link>
  );
}
