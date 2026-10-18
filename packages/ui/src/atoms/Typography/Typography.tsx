
import type {
  ElementType,
  HTMLAttributes,
  ReactNode,
} from "react";

import { cn } from "../../lib/utils";

type TypographyVariant =
  | "display"
  | "h1"
  | "h2"
  | "h3"
  | "body"
  | "caption"
  | "eyebrow";

const styles: Record<TypographyVariant, string> = {
  display:
    "text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.08]",
  h1: "text-4xl md:text-5xl font-extrabold tracking-tight",
  h2: "text-3xl md:text-4xl font-bold tracking-tight",
  h3: "text-xl md:text-2xl font-bold",
  body: "text-base leading-relaxed",
  caption: "text-sm text-slate-500",
  eyebrow:
    "text-xs uppercase tracking-[0.2em] font-bold",
};

interface TypographyProps extends HTMLAttributes<HTMLElement> {
  variant?: TypographyVariant;
  as?: ElementType;
  children: ReactNode;
}

export function Typography({
  variant = "body",
  as,
  className,
  children,
  ...props
}: TypographyProps) {
  const Component: ElementType =
    as ??
    (variant === "display"
      ? "h1"
      : variant === "body"
        ? "p"
        : variant === "caption" || variant === "eyebrow"
          ? "span"
          : variant);

  return (
    <Component
      className={cn(styles[variant], className)}
      {...props}
    >
      {children}
    </Component>
  );
}
