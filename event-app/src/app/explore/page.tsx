
import { searchEventsAction } from "@/app/actions/event.actions";
import { ExplorePage } from "@/components/ExplorePage/ExplorePage";

import type {
  EventCategory,
  EventFilters,
} from "@/types/event";

interface PageProps {
  searchParams: Promise<{
    city?: string;
    radius?: string;
    date?: string;
    category?: string;
    q?: string;
    page?: string;
  }>;
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

function buildPageUrl(
  params: Record<string, string | undefined>,
  page: number
) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      query.set(key, value);
    }
  }

  query.set("page", String(page));

  return `/explore?${query.toString()}`;
}

export default async function Page({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const parsedRadius = Number(params.radius || 25);
  const parsedPage = Number(params.page || 1);

  const filters: EventFilters = {
    city: params.city ?? "",
    radius:
      Number.isFinite(parsedRadius) && parsedRadius > 0
        ? parsedRadius
        : 25,
    date: params.date ?? "",
    category:
      params.category &&
      categories.includes(
        params.category as EventCategory
      )
        ? (params.category as EventCategory)
        : "all",
  };

  const page =
    Number.isSafeInteger(parsedPage) && parsedPage > 0
      ? parsedPage
      : 1;

  const result = await searchEventsAction({
    ...filters,
    q: params.q ?? "",
    page,
    pageSize: 20,
  });

  const urlParams = {
    city: filters.city,
    radius: String(filters.radius),
    date: filters.date,
    category: filters.category,
    q: params.q,
  };

  return (
    <ExplorePage
      filters={filters}
      events={result.events}
      page={result.page}
      hasMore={result.hasMore}
      previousUrl={
        result.page > 1
          ? buildPageUrl(urlParams, result.page - 1)
          : undefined
      }
      nextUrl={
        result.hasMore
          ? buildPageUrl(urlParams, result.page + 1)
          : undefined
      }
    />
  );
}
