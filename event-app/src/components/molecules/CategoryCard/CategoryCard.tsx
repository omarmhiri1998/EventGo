
"use client";

import { ArrowUpRight } from "lucide-react";

import { CategoryIcon } from "@/components/atoms/CategoryIcon/CategoryIcon";
import { cn } from "@/lib/utils";
import type { EventCategory } from "@/types/event";

interface CategoryCardProps {
  category: EventCategory;
  label: string;
  color: string;
  selected?: boolean;
  onClick?: (category: EventCategory) => void;
}

export function CategoryCard({
  category,
  label,
  color,
  selected = false,
  onClick,
}: CategoryCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(category)}
      aria-pressed={selected}
      className={cn(
        "group flex min-h-[145px] flex-col",
        "justify-between rounded-[24px]",
        "border bg-white p-4 text-left",
        "transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-xl",
        "focus-visible:outline-2 focus-visible:outline-[#FF6B53]",
        selected
          ? "border-[#FF6B53] ring-2 ring-[#FF6B53]/20"
          : "border-[#E8E4DF]"
      )}
    >
      <span
        className="flex size-12 items-center justify-center rounded-2xl"
        style={{ backgroundColor: color }}
      >
        <CategoryIcon category={category} size={22} />
      </span>

      <div className="flex w-full items-end justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#101828]">
            {label}
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Explore events
          </p>
        </div>

        <ArrowUpRight
          size={17}
          className="text-slate-400 transition group-hover:text-[#FF6B53]"
        />
      </div>
    </button>
  );
}
