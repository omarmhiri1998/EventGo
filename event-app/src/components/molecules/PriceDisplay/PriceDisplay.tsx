
import { cn } from "@/lib/utils";
import type { Event } from "@/types/event";

interface PriceDisplayProps {
  event: Event;
  className?: string;
}

export function PriceDisplay({
  event,
  className,
}: PriceDisplayProps) {
  const price =
    event.price == null
      ? null
      : new Intl.NumberFormat("de-DE", {
          style: "currency",
          currency: event.currency ?? "EUR",
          maximumFractionDigits: 0,
        }).format(event.price);

  const remaining = event.ticketsLeft;

  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        className
      )}
    >
      <span className="text-xl font-extrabold tracking-tight text-[#101828]">
        {event.price == null
          ? "Price unavailable"
          : event.price === 0
            ? "Free"
            : price}
      </span>

      {remaining !== undefined && (
        <span
          className={cn(
            "text-xs font-medium",
            remaining === 0
              ? "text-slate-500"
              : remaining <= 20
                ? "text-[#FF6B53]"
                : "text-emerald-700"
          )}
        >
          {remaining === 0
            ? "Sold out"
            : `${remaining} tickets left`}
        </span>
      )}
    </div>
  );
}
