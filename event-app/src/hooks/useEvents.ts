
"use client";

import { useEffect, useState } from "react";
import { getEvents } from "@/services/eventService";

import type { Event, EventFilters } from "@/types/event";

export function useEvents(filters: EventFilters) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { city, radius, date, category } = filters;

  useEffect(() => {
    const controller = new AbortController();

    async function loadEvents() {
      setLoading(true);
      setError(null);

      try {
        const results = await getEvents(
          { city, radius, date, category },
          controller.signal
        );

        if (!controller.signal.aborted) {
          setEvents(results);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setEvents([]);
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load events"
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadEvents();

    return () => controller.abort();
  }, [city, radius, date, category]);

  return { events, loading, error };
}
