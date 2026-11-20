"use client";

import { useQuery } from "@tanstack/react-query";

import { useEventFilters } from "@/hooks/useEventFilters";
import { getRandomEventsAction } from "@/app/actions/event.actions";

import { HeroSection } from "@/components/organisms/HeroSection/HeroSection";
import { CategoriesSection } from "@/components/organisms/CategoriesSection/CategoriesSection";
import { PopularEventsSection } from "@/components/organisms/PopularEventsSection/PopularEventsSection";
import { FeaturedBanner } from "@/components/organisms/FeaturedBanner/FeaturedBanner";

import type { EventCategory } from "@/types/event";

type CategoryFilter = EventCategory | "all";

export function HomeContent() {
  const { filters, setFilter } = useEventFilters();

  const {
    data: events = [],
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["events", "random", filters.category],
    queryFn: () => getRandomEventsAction(filters.category),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  function handleCategoryChange(category: CategoryFilter) {
    setFilter("category", category);
  }

  return (
    <main>
      <HeroSection
        filters={filters}
        onChange={setFilter}
      />

      <CategoriesSection
        selectedCategory={filters.category}
        onCategoryChange={handleCategoryChange}
      />

      {isPending ? (
        <div className="mx-auto max-w-[1280px] px-5 py-16">
          <p role="status">Loading events...</p>
        </div>
      ) : isError ? (
        <div
          role="alert"
          className="mx-auto max-w-[1280px] px-5 py-16 text-red-600"
        >
          <p>{error.message}</p>

          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="mt-3 underline disabled:opacity-50"
          >
            {isFetching ? "Retrying..." : "Try again"}
          </button>
        </div>
      ) : (
        <PopularEventsSection
          key={filters.category}
          events={events}
        />
      )}

      <FeaturedBanner />
    </main>
  );
}