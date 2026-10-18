
"use client";

import { useState } from "react";
import Image from "next/image";

import {
  CalendarDays,
  Clock3,
  MapPin,
  Navigation,
  Ticket,
  ArrowRight,
} from "lucide-react";

import { CategoryIcon } from "@/components/atoms/CategoryIcon/CategoryIcon";
import { EventDetailsDialog } from "@/components/molecules/EventDetailsDialog/EventDetailsDialog";

import type { Event } from "@/types/event";

interface SearchResultCardProps {
  event: Event;
}

function formatEventDate(value: string) {
  const date = new Date(`${value}T12:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function SearchResultCard({
  event,
}: SearchResultCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const categoryLabel =
    event.category.charAt(0).toUpperCase() +
    event.category.slice(1);

  return (
    <>
      <article className="overflow-hidden rounded-[20px] border border-[#EAE7E3] bg-white shadow-sm transition-shadow hover:shadow-md">
        <div className="flex flex-col sm:min-h-[208px] sm:flex-row">
          <div className="relative h-48 shrink-0 overflow-hidden bg-slate-100 sm:h-auto sm:w-[38%]">
            <Image
              src={event.image}
              alt={event.title}
              fill
              sizes="(max-width: 640px) 100vw, 300px"
              className="object-cover"
            />

            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#08111D] shadow-sm">
                <CategoryIcon
                  category={event.category}
                  size={13}
                />
                {categoryLabel}
              </span>

              {event.isDemo && (
                <span className="rounded-full bg-[#FFF0CC] px-2.5 py-1 text-[11px] font-semibold text-[#8A5600]">
                  Demo
                </span>
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col p-5">
            <h3 className="text-base font-bold leading-snug text-[#08111D]">
              {event.title}
            </h3>

            {event.description && (
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                {event.description}
              </p>
            )}

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <CalendarDays
                  size={15}
                  className="shrink-0 text-slate-400"
                />
                <span>{formatEventDate(event.date)}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Clock3
                  size={15}
                  className="shrink-0 text-slate-400"
                />
                <span>{event.time}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600">
                <MapPin
                  size={15}
                  className="shrink-0 text-slate-400"
                />
                <span className="truncate">
                  {event.venue
                    ? `${event.venue}, ${event.city}`
                    : event.city}
                </span>
              </div>

              {event.distanceKm != null && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Navigation
                    size={15}
                    className="shrink-0 text-slate-400"
                  />
                  <span>
                    {event.distanceKm.toFixed(1)} km away
                  </span>
                </div>
              )}
            </div>

            <div className="mt-auto pt-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div>
                  {event.price != null ? (
                    <p className="text-base font-bold text-[#08111D]">
                      {new Intl.NumberFormat("de-DE", {
                        style: "currency",
                        currency: event.currency ?? "EUR",
                      }).format(event.price)}
                    </p>
                  ) : (
                    <p className="text-xs font-semibold text-slate-500">
                      See ticket prices
                    </p>
                  )}
                </div>

                {event.isDemo && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-500">
                    <Ticket size={13} />
                    Demo event
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setDetailsOpen(true)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B53] px-4 text-sm font-bold text-white transition hover:bg-[#F05B44]"
              >
                View Tickets
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>
      </article>

      {detailsOpen && (
        <EventDetailsDialog
          event={event}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}
    </>
  );
}
