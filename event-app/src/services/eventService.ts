
import type { Event, EventFilters } from "@/types/event";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getEvents(
  filters: EventFilters,
  signal?: AbortSignal
): Promise<Event[]> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const params = new URLSearchParams({
    city: filters.city,
    radius: String(filters.radius),
    category: filters.category,
    date: filters.date,
  });

  const response = await fetch(
    `${API_URL}/events?${params.toString()}`,
    { signal }
  );

  if (!response.ok) {
    throw new Error(`Failed to load events: ${response.status}`);
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("Invalid events API response");
  }

  return data as Event[];
}
