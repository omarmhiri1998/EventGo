import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

import { Button } from "@/ui/atoms/Button/button";

type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  icon?: ReactNode;
  children?: ReactNode;
  label: string;
};

export default function IconButton({
  icon,
  children,
  label,
  className = "",
  ...props
}: IconButtonProps) {
  return (
    <Button
      {...props}
      variant="ghost"
      size="icon"
      aria-label={label}
      className={`h-12 w-12 rounded-full ${className}`}
    >
      {icon ?? children}
    </Button>
  );
}