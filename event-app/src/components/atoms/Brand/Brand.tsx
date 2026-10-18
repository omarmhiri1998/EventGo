
import Link from "next/link";
import { Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandProps {
  variant?: "light" | "dark";
  className?: string;
}

export function Brand({
  variant = "dark",
  className,
}: BrandProps) {
  return (
    <Link
      href="/"
      aria-label="EventGo homepage"
      className={cn(
        "inline-flex items-center gap-2.5",
        className
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-[#FF6B53] text-white">
        <Ticket size={21} strokeWidth={2.2} />
      </span>

      <span
        className={cn(
          "text-2xl font-extrabold tracking-tight",
          variant === "light"
            ? "text-white"
            : "text-[#101828]"
        )}
      >
        Event
        <span className="text-[#FF6B53]">Go</span>
      </span>
    </Link>
  );
}
