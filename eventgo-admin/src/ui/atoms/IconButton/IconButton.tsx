import type { ReactNode } from "react";

import { Button } from "@/ui/atoms/Button/button";

type IconButtonProps = {
  children: ReactNode;
  label: string;
};

export default function IconButton({
  children,
  label,
}: IconButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      className="h-12 w-12 rounded-full"
    >
      {children}
    </Button>
  );
}