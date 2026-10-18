
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { EventSearchBar } from "@/components/organisms/EventSearchBar/EventSearchBar";

import type { EventFilters } from "@/types/event";

interface ExploreSearchProps {
  initialFilters: EventFilters;
}

export function ExploreSearch({
  initialFilters,
}: ExploreSearchProps) {
  const router = useRouter();

  const [filters, setFilters] =
    useState<EventFilters>(initialFilters);

  function handleChange<K extends keyof EventFilters>(
    key: K,
    value: EventFilters[K]
  ) {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function handleSearch() {
    const params = new URLSearchParams({
      city: filters.city,
      radius: String(filters.radius),
      date: filters.date,
      category: filters.category,
    });

    router.push(`/explore?${params.toString()}`);
  }

  return (
    <EventSearchBar
      filters={filters}
      onChange={handleChange}
      onSearch={handleSearch}
    />
  );
}
