import type { HTMLAttributes } from "react";
import { cx } from "./cx";

export type PageContainerProps = HTMLAttributes<HTMLDivElement> & {
  /** Largura maxima da coluna (padrao 1200px, como no design). Use `full` para tabelas largas. */
  width?: "default" | "full";
};

/**
 * Area de conteudo de uma pagina dentro dos shells: respiro lateral (16px no celular, 32px no
 * desktop), coluna de 1200px e `.reveal` na entrada. O shell nao aplica padding proprio.
 */
export function PageContainer({ width = "default", className, ...rest }: PageContainerProps) {
  return (
    <div
      {...rest}
      className={cx(
        "reveal mx-auto w-full px-4 pb-16 pt-4 min-[900px]:px-8 min-[900px]:pt-6",
        width === "default" && "max-w-[1200px]",
        className,
      )}
    />
  );
}
