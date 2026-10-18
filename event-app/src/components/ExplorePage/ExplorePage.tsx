
import { ExploreSearch } from "@/components/organisms/ExploreSearch/ExploreSearch";
import { ExploreFilters } from "@/components/organisms/ExploreFilters/ExploreFilters";
import { ExploreResults } from "@/components/organisms/ExploreResults/ExploreResults";
import { ExploreMap } from "@/components/organisms/ExploreMap/ExploreMap";

import type {
  Event,
  EventFilters,
} from "@/types/event";

interface ExplorePageProps {
  filters: EventFilters;
  events: Event[];
  page: number;
  hasMore: boolean;
  previousUrl?: string;
  nextUrl?: string;
}

export function ExplorePage({
  filters,
  events,
  page,
  hasMore,
  previousUrl,
  nextUrl,
}: ExplorePageProps) {
  return (
    <main className="min-h-screen bg-[#FCFAF7]">
      <div className="border-b border-[#EAE7E3] bg-[#F5F7F6]">
        <div className="mx-auto max-w-[1280px] px-5 py-6 lg:px-10">
          <ExploreSearch
            initialFilters={filters}
          />
        </div>
      </div>

      <ExploreFilters
        key={`${filters.category}-${filters.date}-${filters.radius}`}
        initialCategory={filters.category}
        initialDate={filters.date}
        initialRadius={filters.radius}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,45%)_minmax(0,55%)]">
        <div className="min-w-0 border-r border-[#EAE7E3] bg-[#FCFAF7]">
          <div className="px-5 py-8 lg:px-8">
            <header className="mb-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#FF6B53]">
                DISCOVER EVENTS
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-[#08111D]">
                {filters.city
                  ? `Events near ${filters.city}`
                  : "Explore Events"}
              </h1>

              <p className="mt-3 text-sm text-slate-500">
                {filters.city
                  ? `Upcoming events within ${filters.radius} km of ${filters.city}.`
                  : "Discover upcoming events from different cities."}
              </p>
            </header>

            <ExploreResults
              events={events}
              page={page}
              hasMore={hasMore}
              previousUrl={previousUrl}
              nextUrl={nextUrl}
            />
          </div>
        </div>

        <aside
          aria-label="Event locations"
          className="relative min-h-[420px] overflow-hidden lg:sticky lg:top-0 lg:h-screen"
        >
          <ExploreMap events={events} />
        </aside>
      </div>
    </main>
  );
}
