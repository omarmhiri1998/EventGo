
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";

import { categories } from "@/data/categories";
import { Button } from "@/components/ui/button";

import type { EventCategory } from "@/types/event";

type CategoryFilter = EventCategory | "all";

interface ExploreFiltersProps {
  initialCategory: CategoryFilter;
  initialDate: string;
  initialRadius: number;
}

export function ExploreFilters({
  initialCategory,
  initialDate,
  initialRadius,
}: ExploreFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [category, setCategory] =
    useState<CategoryFilter>(initialCategory);

  const [date, setDate] = useState(initialDate);
  const [radius, setRadius] = useState(initialRadius);

  function applyFilters() {
    const params = new URLSearchParams(
      searchParams.toString()
    );

    params.set("category", category);
    params.set("radius", String(radius));

    if (date) {
      params.set("date", date);
    } else {
      params.delete("date");
    }

    params.delete("page");

    router.push(`/explore?${params.toString()}`);
  }

  function clearFilters() {
    setCategory("all");
    setDate("");
    setRadius(25);

    const params = new URLSearchParams(
      searchParams.toString()
    );

    params.delete("category");
    params.delete("date");
    params.delete("q");
    params.delete("page");
    params.set("radius", "25");

    router.push(`/explore?${params.toString()}`);
  }

  return (
    <div className="border-b border-[#EAE7E3] bg-[#F5F7F6]">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-3 px-5 py-4 lg:px-10">
        <div className="flex items-center gap-2 text-[#08111D]">
          <SlidersHorizontal size={17} />
          <span className="text-sm font-semibold">
            Filters
          </span>
        </div>

        <select
          aria-label="Event category"
          value={category}
          onChange={(event) =>
            setCategory(
              event.target.value as CategoryFilter
            )
          }
          className="h-11 rounded-xl border border-[#EAE7E3] bg-white px-4 text-sm text-[#08111D] outline-none focus:border-[#FF6B53]"
        >
          <option value="all">All categories</option>

          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>

        <input
          aria-label="Event date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="h-11 rounded-xl border border-[#EAE7E3] bg-white px-3 text-sm text-[#08111D] outline-none focus:border-[#FF6B53]"
        />

        <select
          aria-label="Search radius"
          value={radius}
          onChange={(event) =>
            setRadius(Number(event.target.value))
          }
          className="h-11 rounded-xl border border-[#EAE7E3] bg-white px-4 text-sm text-[#08111D] outline-none focus:border-[#FF6B53]"
        >
          {[5, 10, 25, 50, 100, 200, 500].map(
            (value) => (
              <option key={value} value={value}>
                {value} km
              </option>
            )
          )}
        </select>

        <Button
          type="button"
          onClick={applyFilters}
          className="h-11 rounded-xl bg-[#FF6B53] px-5 text-sm font-semibold text-white hover:bg-[#F05B44]"
        >
          Apply filters
        </Button>

        <button
          type="button"
          onClick={clearFilters}
          className="flex h-11 items-center gap-2 px-2 text-sm font-medium text-slate-500 transition hover:text-[#FF6B53]"
        >
          <RotateCcw size={15} />
          Clear filters
        </button>
      </div>
    </div>
  );
}
