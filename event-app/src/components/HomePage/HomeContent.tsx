
"use client";

import { useEffect, useRef, useState } from "react";

import { useEventFilters } from "@/hooks/useEventFilters";
import { getRandomEventsAction } from "@/app/actions/event.actions";

import { HeroSection } from "@/components/organisms/HeroSection/HeroSection";
import { CategoriesSection } from "@/components/organisms/CategoriesSection/CategoriesSection";
import { PopularEventsSection } from "@/components/organisms/PopularEventsSection/PopularEventsSection";
import { FeaturedBanner } from "@/components/organisms/FeaturedBanner/FeaturedBanner";

import type {
  Event,
  EventCategory,
} from "@/types/event";

interface HomeContentProps {
  events: Event[];
}

type CategoryFilter = EventCategory | "all";

export function HomeContent({
  events: initialEvents,
}: HomeContentProps) {
  const { filters, setFilter } = useEventFilters();

  const [events, setEvents] = useState<Event[]>(
    initialEvents
  );

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(
    null
  );

  const requestId = useRef(0);

  useEffect(() => {
    setEvents(initialEvents);
    setError(null);
    setLoading(false);
    requestId.current += 1;
  }, [initialEvents]);

  async function handleCategoryChange(
    category: CategoryFilter
  ) {
    setFilter("category", category);

    const currentRequest = ++requestId.current;

    setLoading(true);
    setError(null);

    try {
      const results = await getRandomEventsAction(
        category
      );

      if (currentRequest !== requestId.current) {
        return;
      }

      setEvents(results);
    } catch (err) {
      if (currentRequest !== requestId.current) {
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load events"
      );
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
      }
    }
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

      {loading ? (
        <div className="mx-auto max-w-[1280px] px-5 py-16">
          <p role="status">
            Loading events...
          </p>
        </div>
      ) : error ? (
        <div
          role="alert"
          className="mx-auto max-w-[1280px] px-5 py-16 text-red-600"
        >
          {error}
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
