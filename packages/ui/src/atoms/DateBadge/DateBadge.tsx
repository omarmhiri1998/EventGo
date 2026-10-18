
import { cn } from "../../lib/utils";

interface DateBadgeProps {
  date: string;
  className?: string;
}

export function DateBadge({
  date,
  className,
}: DateBadgeProps) {
  const parsedDate = new Date(`${date}T12:00:00`);
  const valid = !Number.isNaN(parsedDate.getTime());

  const month = valid
    ? new Intl.DateTimeFormat("en", {
        month: "short",
      }).format(parsedDate)
    : "---";

  const day = valid ? parsedDate.getDate() : "--";

  return (
    <div
      className={cn(
        "flex h-14 w-14 flex-col items-center",
        "justify-center rounded-2xl bg-white shadow-md",
        className
      )}
    >
      <span className="text-[11px] font-extrabold uppercase text-[#FF6B53]">
        {month}
      </span>

      <span className="text-xl font-extrabold leading-tight text-[#101828]">
        {day}
      </span>
    </div>
  );
}
