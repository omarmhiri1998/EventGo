
"use server";

import { requireAdmin } from "@/lib/require-admin";

import {
  getRandomEvents,
  searchEvents,
} from "@eventgo/backend/services/event.service";

import type {
  Event,
  EventCategory,
} from "@eventgo/ui/EventFilters";

type CategoryFilter = EventCategory | "all";

interface DatabaseEvent {
  id: string;
  title: string;
  description: string | null;
  category: string;
  city_name: string;
  starts_at: Date | string;
  is_demo: boolean;
  distance_km?: number | string | null;
  city_latitude?: number | string | null;
  city_longitude?: number | string | null;
}

export interface EventSearchParams {
  city?: string;
  radius?: number;
  date?: string;
  category?: CategoryFilter;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface EventSearchResult {
  events: Event[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

const categories: EventCategory[] = [
  "music",
  "sports",
  "technology",
  "food",
  "art",
  "business",
  "nightlife",
  "festivals",
  "cinema",
  "comedy",
  "culture",
  "wellness",
];

function isEventCategory(
  value: string
): value is EventCategory {
  return categories.includes(value as EventCategory);
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [
      result[j],
      result[i],
    ];
  }

  return result;
}

function createImagePools() {
  const pools = {} as Record<EventCategory, string[]>;

  for (const category of categories) {
    pools[category] = shuffle(
      Array.from({ length: 24 }, (_, index) => {
        const number = String(index + 1).padStart(2, "0");

        return `/images/events/${category}/${number}.webp`;
      })
    );
  }

  return pools;
}

function formatDateTime(value: Date | string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid event date");
  }

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const getPart = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const eventDate = [
    getPart("year"),
    getPart("month"),
    getPart("day"),
  ].join("-");

  const eventTime = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);

  return {
    date: eventDate,
    time: eventTime,
  };
}

function optionalNumber(
  value: number | string | null | undefined
): number | undefined {
  if (value == null) {
    return undefined;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : undefined;
}

function mapDatabaseEvents(
  rows: DatabaseEvent[]
): Event[] {
  const imagePools = createImagePools();

  return rows
    .filter((row) => isEventCategory(row.category))
    .map((row) => {
      const category = row.category as EventCategory;

      const image =
        imagePools[category].pop() ??
        `/images/events/${category}/01.webp`;

      const { date, time } = formatDateTime(
        row.starts_at
      );

      return {
        id: row.id,
        title: row.title,
        description: row.description ?? "",
        category,
        city: row.city_name,
        date,
        time,
        image,
        isDemo: row.is_demo,
        distanceKm: optionalNumber(row.distance_km),
        cityLatitude: optionalNumber(
          row.city_latitude
        ),
        cityLongitude: optionalNumber(
          row.city_longitude
        ),
      };
    });
}

export async function getRandomEventsAction(
  category: CategoryFilter = "all"
): Promise<Event[]> {
  // Only administrators can execute this action.
  await requireAdmin();

  if (
    category !== "all" &&
    !categories.includes(category)
  ) {
    throw new Error("Invalid category");
  }

  const rows = await getRandomEvents(
    12,
    category
  );

  return mapDatabaseEvents(rows);
}

export async function searchEventsAction(
  filters: EventSearchParams = {}
): Promise<EventSearchResult> {
  // Only administrators can execute this action.
  await requireAdmin();

  const category = filters.category ?? "all";

  if (
    category !== "all" &&
    !categories.includes(category)
  ) {
    throw new Error("Invalid category");
  }

  const result = await searchEvents({
    city: filters.city,
    radius: filters.radius,
    date: filters.date,
    category,
    q: filters.q,
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? 20,
  });

  return {
    events: mapDatabaseEvents(result.events),
    page: result.page,
    pageSize: result.pageSize,
    hasMore: result.hasMore,
  };
}
