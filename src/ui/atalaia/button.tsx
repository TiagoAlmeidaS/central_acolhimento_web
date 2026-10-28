import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";
import { Icon, type IconName } from "./icons";

export type ButtonVariant = "primary" | "neutral" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const BASE =
  "inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-control border font-medium no-underline transition-[background-color,border-color,transform] duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 max-[560px]:min-h-9 [&_svg]:shrink-0";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "border-primary bg-primary text-primary-fg hover:border-primary-hover hover:bg-primary-hover",
  neutral: "border-border-strong bg-surface text-fg hover:bg-sunken",
  ghost: "border-transparent bg-transparent text-fg hover:bg-sunken",
  danger: "border-border-strong bg-surface text-danger hover:bg-danger-soft",
};

const SIZE: Record<ButtonSize, string> = {
  md: "h-8 px-3 text-sm",
  sm: "h-7 px-2.5 text-[13px]",
};

/** Classes de botao para quem precisa estilizar outro elemento como botao. */
export function buttonClass(variant: ButtonVariant = "neutral", size: ButtonSize = "md", className?: string) {
  return cx(BASE, VARIANT[variant], SIZE[size], className);
}

type CommonProps = {
  /** Um unico primario por cabecalho, painel ou drawer. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icone a esquerda do rotulo. */
  icon?: IconName | ReactNode;
  /** Mostra o spinner, desabilita o clique e marca aria-busy. */
  loading?: boolean;
  children?: ReactNode;
  className?: string;
};

type NativeButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & { href?: undefined };

type LinkButtonProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps | "href"> & {
    /** Com href o botao vira um link (next/link). */
    href: string;
    disabled?: boolean;
  };

export type ButtonProps = NativeButtonProps | LinkButtonProps;

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

function renderIcon(icon: CommonProps["icon"]) {
  if (!icon) return null;
  return typeof icon === "string" ? <Icon name={icon as IconName} /> : icon;
}

export function Button(props: ButtonProps) {
  const { variant = "neutral", size = "md", icon, loading = false, children, className, ...rest } = props;
  const classes = buttonClass(variant, size, className);
  const content = (
    <>
      {loading ? <Spinner /> : renderIcon(icon)}
      {children}
    </>
  );

  if ("href" in rest && typeof rest.href === "string") {
    const { href, disabled, ...anchor } = rest as Omit<LinkButtonProps, keyof CommonProps>;
    const blocked = Boolean(disabled || loading);
    return (
      <Link
        {...anchor}
        href={href}
        className={classes}
        aria-disabled={blocked || undefined}
        aria-busy={loading || undefined}
        tabIndex={blocked ? -1 : anchor.tabIndex}
      >
        {content}
      </Link>
    );
  }

  const { type = "button", disabled, ...button } = rest as Omit<NativeButtonProps, keyof CommonProps>;
  return (
    <button
      {...button}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {content}
    </button>
  );
}

export type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "aria-label"
> & {
  /** Nome acessivel do botao (obrigatorio: so ha icone). */
  label: string;
  icon: IconName | ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function IconButton({
  label,
  icon,
  variant = "ghost",
  size = "md",
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      aria-label={label}
      title={rest.title ?? label}
      className={cx(
        BASE,
        VARIANT[variant],
        size === "md" ? "size-8" : "size-7",
        "max-[560px]:min-w-9 p-0",
        className,
      )}
    >
      {renderIcon(icon)}
    </button>
  );
}
