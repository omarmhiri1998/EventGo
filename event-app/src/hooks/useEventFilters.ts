
"use client";

import { useState } from "react";
import type { EventFilters } from "@/types/event";

const initialFilters: EventFilters = {
  city: "Dortmund",
  radius: 25,
  date: "all",
  category: "all",
};

export function useEventFilters() {
  const [filters, setFilters] =
    useState<EventFilters>(initialFilters);

  function setFilter<K extends keyof EventFilters>(
    key: K,
    value: EventFilters[K]
  ) {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  return {
    filters,
    setFilter,
  };
}
