
"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchFilters } from "@/components/molecules/SearchFilters/SearchFilters";
import type { EventFilters } from "@/types/event";

interface EventSearchBarProps {
  filters: EventFilters;
  onChange: <K extends keyof EventFilters>(
    key: K,
    value: EventFilters[K]
  ) => void;
  onSearch: () => void;
}

export function EventSearchBar({
  filters,
  onChange,
  onSearch,
}: EventSearchBarProps) {
  return (
    <div className="w-full rounded-[28px] bg-white p-2 shadow-[0_18px_55px_rgba(0,0,0,0.18)]">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <SearchFilters
            filters={filters}
            onChange={onChange}
            className="lg:grid-cols-[1.35fr_0.75fr_1fr_1fr] lg:items-center [&>div:not(:first-child)]:lg:border-l [&>div:not(:first-child)]:lg:border-[#EAE7E3]"
          />
        </div>

        <Button
          type="button"
          onClick={onSearch}
          className="flex h-[64px] w-full shrink-0 items-center justify-center gap-2 rounded-[21px] bg-[#FF6B53] px-7 text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(255,107,83,0.22)] transition hover:bg-[#F05B44] lg:w-[140px]"
        >
          <Search size={19} />
          Search
        </Button>
      </div>
    </div>
  );
}
