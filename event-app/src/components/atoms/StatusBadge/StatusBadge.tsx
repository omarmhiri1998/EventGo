
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type EventStatus = "available" | "limited" | "sold-out";

interface StatusBadgeProps {
  status: EventStatus;
  className?: string;
}

const statusConfig = {
  available: {
    label: "Available",
    style: "bg-emerald-100 text-emerald-800",
  },
  limited: {
    label: "Few tickets left",
    style: "bg-orange-100 text-orange-800",
  },
  "sold-out": {
    label: "Sold out",
    style: "bg-slate-200 text-slate-700",
  },
};

export function StatusBadge({
  status,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      className={cn(
        "rounded-full border-0 px-3 py-1 text-xs font-semibold",
        config.style,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
