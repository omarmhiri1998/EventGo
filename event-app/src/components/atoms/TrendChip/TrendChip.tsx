
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendChipProps {
  label: string;
  onClick?: () => void;
  className?: string;
}

export function TrendChip({
  label,
  onClick,
  className,
}: TrendChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2",
        "rounded-full border border-white/20",
        "bg-white/10 px-4 py-2",
        "text-xs font-medium text-white",
        "transition hover:border-[#FF6B53]",
        "hover:bg-[#FF6B53]/20",
        "focus-visible:outline-2 focus-visible:outline-[#FF6B53]",
        className
      )}
    >
      {label}
      <ArrowUpRight size={13} />
    </button>
  );
}
