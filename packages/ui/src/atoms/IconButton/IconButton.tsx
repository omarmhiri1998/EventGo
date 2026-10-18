
import type { ComponentProps, ReactNode } from "react";

import { Button } from "../Button/button";
import { cn } from "../../lib/utils";

type IconButtonProps = Omit<
  ComponentProps<typeof Button>,
  "children"
> & {
  icon: ReactNode;
  label: string;
};

export function IconButton({
  icon,
  label,
  className,
  variant = "ghost",
  size = "icon",
  ...props
}: IconButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      aria-label={label}
      className={cn(
        "rounded-full text-slate-600",
        "transition-colors duration-200",
        "hover:bg-orange-50 hover:text-[#FF6B53]",
        className
      )}
      {...props}
    >
      {icon}
    </Button>
  );
}
