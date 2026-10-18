
import Link from "next/link";

import { SearchResultCard } from "@/components/molecules/SearchResultCard/SearchResultCard";
import type { Event } from "@/types/event";

interface ExploreResultsProps {
  events: Event[];
  page: number;
  hasMore: boolean;
  previousUrl?: string;
  nextUrl?: string;
}

export function ExploreResults({
  events,
  page,
  hasMore,
  previousUrl,
  nextUrl,
}: ExploreResultsProps) {
  return (
    <section aria-label="Search results">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#08111D]">
            Search results
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {events.length} events on this page
          </p>
        </div>

        <span className="text-xs font-medium text-slate-500">
          Page {page}
        </span>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <h3 className="text-lg font-semibold text-[#08111D]">
            No events found
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Try another city, date, radius or category.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {events.map((event) => (
            <SearchResultCard
              key={event.id}
              event={event}
            />
          ))}
        </div>
      )}

      {(previousUrl || (hasMore && nextUrl)) && (
        <nav
          aria-label="Results pagination"
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          {page > 1 && previousUrl ? (
            <Link
              href={previousUrl}
              className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-[#08111D] transition hover:border-[#FF6B53]"
            >
              Previous
            </Link>
          ) : null}

          <span className="text-sm text-slate-500">
            Page {page}
          </span>

          {hasMore && nextUrl ? (
            <Link
              href={nextUrl}
              className="rounded-full bg-[#FF6B53] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#F05B44]"
            >
              Next
            </Link>
          ) : null}
        </nav>
      )}
    </section>
  );
}
