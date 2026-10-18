
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Typography } from "../../atoms/Typography/Typography";
import { cn } from "../../lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-5",
        "sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="max-w-2xl">
        {eyebrow && (
          <Typography
            variant="eyebrow"
            className="mb-3 block text-[#FF6B53]"
          >
            {eyebrow}
          </Typography>
        )}

        <Typography
          variant="h2"
          className="text-[#101828]"
        >
          {title}
        </Typography>

        {description && (
          <Typography
            variant="body"
            className="mt-3 text-slate-500"
          >
            {description}
          </Typography>
        )}
      </div>

      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className={cn(
            "inline-flex shrink-0 items-center",
            "justify-center gap-2 self-start",
            "rounded-full border border-[#E8E4DF]",
            "bg-white px-5 py-3",
            "text-sm font-semibold text-[#101828]",
            "transition-all duration-200",
            "hover:border-[#FF6B53]",
            "hover:text-[#FF6B53]",
            "hover:shadow-md"
          )}
        >
          {actionLabel}
          <ArrowRight size={17} />
        </Link>
      )}
    </div>
  );
}
