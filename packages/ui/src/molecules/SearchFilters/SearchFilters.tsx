
"use client";

import {
  MapPin,
  Radar,
  CalendarDays,
  Tags,
} from "lucide-react";


import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/select";

import { cn } from "../../lib/utils";
import { categories } from "../../data/categories";

import type {
  EventCategory,
  EventFilters,
} from "../../types/event";


interface SearchFiltersProps {
  filters: EventFilters;
  onChange: <K extends keyof EventFilters>(
    key: K,
    value: EventFilters[K]
  ) => void;
  className?: string;
}

const cities = [
  "Dortmund",
  "Berlin",
  "Hamburg",
  "Munich",
  "Cologne",
  "Düsseldorf",
  "Frankfurt",
  "Stuttgart",
  "Leipzig",
  "Münster",
];

const eventCategories: {
  label: string;
  value: EventCategory | "all";
}[] = [
  {
    label: "All categories",
    value: "all",
  },
  ...categories.map((category) => ({
    label: category.label,
    value: category.id,
  })),
];

const dates = [
  { label: "Any date", value: "all" },
  { label: "Today", value: "today" },
  { label: "Tomorrow", value: "tomorrow" },
  { label: "This weekend", value: "weekend" },
];

function FilterCell({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-4 py-2">
      <span className="shrink-0 text-[#FF6B53]">
        {icon}
      </span>

      <div className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {label}
        </span>

        {children}
      </div>
    </div>
  );
}

export function SearchFilters({
  filters,
  onChange,
  className,
}: SearchFiltersProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 divide-y divide-[#EAE7E3]",
        "md:grid-cols-2 md:divide-y-0",
        "xl:grid-cols-4",
        className
      )}
    >
      <FilterCell
        label="Location"
        icon={<MapPin size={20} />}
      >
        <Select
          value={filters.city}
          onValueChange={(value) => {
            if (value) {
              onChange("city", value);
            }
          }}
        >
          <SelectTrigger className="w-full border-0 bg-transparent px-0 text-[#08111D] shadow-none [&_[data-slot=select-value]]:text-[#08111D] [&_svg]:text-[#64748B]">
  <SelectValue placeholder="Choose city" />
</SelectTrigger>

          <SelectContent>
            {cities.map((city) => (
              <SelectItem
                key={city}
                value={city}
              >
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterCell>

      <FilterCell
        label="Radius"
        icon={<Radar size={20} />}
      >
        <Select
          value={String(filters.radius)}
          onValueChange={(value) => {
            if (value) {
              onChange(
                "radius",
                Number(value)
              );
            }
          }}
        >
          <SelectTrigger className="w-full border-0 bg-transparent px-0 shadow-none">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            {[5, 10, 25, 50, 100, 200, 500].map(
              (radius) => (
                <SelectItem
                  key={radius}
                  value={String(radius)}
                >
                  {radius} km
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </FilterCell>

      <FilterCell
        label="Date"
        icon={<CalendarDays size={20} />}
      >
        <Select
          value={filters.date || "all"}
          onValueChange={(value) => {
            if (value) {
              onChange("date", value);
            }
          }}
        >
          <SelectTrigger className="w-full border-0 bg-transparent px-0 shadow-none">
            <SelectValue placeholder="Any date" />
          </SelectTrigger>

          <SelectContent>
            {dates.map((date) => (
              <SelectItem
                key={date.value}
                value={date.value}
              >
                {date.label}
              </SelectItem>
            ))}

            {filters.date &&
              /^\d{4}-\d{2}-\d{2}$/.test(
                filters.date
              ) && (
                <SelectItem value={filters.date}>
                  {filters.date}
                </SelectItem>
              )}
          </SelectContent>
        </Select>
      </FilterCell>

      <FilterCell
        label="Category"
        icon={<Tags size={20} />}
      >
        <Select
          value={filters.category || "all"}
          onValueChange={(value) => {
            if (value) {
              onChange(
                "category",
                value as EventCategory | "all"
              );
            }
          }}
        >
          <SelectTrigger className="w-full border-0 bg-transparent px-0 shadow-none">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>

          <SelectContent>
            {eventCategories.map((category) => (
              <SelectItem
                key={category.value}
                value={category.value}
              >
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterCell>
    </div>
  );
}
