
"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchFieldProps {
  label: string;
  value: string;
  icon: ReactNode;
  onClick?: () => void;
  placeholder?: string;
  showChevron?: boolean;
  className?: string;
}

export function SearchField({
  label,
  value,
  icon,
  onClick,
  placeholder = "Select option",
  showChevron = true,
  className,
}: SearchFieldProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex min-h-[64px] w-full items-center",
        "gap-3 rounded-xl px-4 py-3 text-left",
        "transition-colors hover:bg-[#F8F6F3]",
        "focus-visible:outline-2 focus-visible:outline-[#FF6B53]",
        className
      )}
    >
      <span className="shrink-0 text-[#FF6B53]">
        {icon}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {label}
        </span>

        <span className="truncate text-sm font-semibold text-[#101828]">
          {value || placeholder}
        </span>
      </span>

      {showChevron && (
        <ChevronDown
          size={16}
          className="shrink-0 text-slate-500 transition-transform group-hover:translate-y-0.5"
        />
      )}
    </button>
  );
}
