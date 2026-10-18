
"use client";

import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  className?: string;
}

export function FavoriteButton({
  isFavorite,
  onToggle,
  className,
}: FavoriteButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      aria-label={
        isFavorite
          ? "Remove from favorites"
          : "Add to favorites"
      }
      aria-pressed={isFavorite}
      onClick={onToggle}
      className={cn(
        "rounded-full bg-white text-[#101828] shadow-sm",
        "hover:bg-white hover:text-[#FF6B53]",
        className
      )}
    >
      <Heart
        size={19}
        strokeWidth={2}
        className={
          isFavorite
            ? "fill-[#FF6B53] text-[#FF6B53]"
            : ""
        }
      />
    </Button>
  );
}
