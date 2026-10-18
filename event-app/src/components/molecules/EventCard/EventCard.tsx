
"use client";

import { useState } from "react";
import { ArrowRight, Ticket } from "lucide-react";

import { EventImage } from "@/components/atoms/EventImage/EventImage";
import { DateBadge } from "@/components/atoms/DateBadge/DateBadge";
import { FavoriteButton } from "@/components/atoms/FavoriteButton/FavoriteButton";

import { EventMeta } from "@/components/molecules/EventMeta/EventMeta";
import { PriceDisplay } from "@/components/molecules/PriceDisplay/PriceDisplay";
import { EventDetailsDialog } from "@/components/molecules/EventDetailsDialog/EventDetailsDialog";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { Event } from "@/types/event";

interface EventCardProps {
  event: Event;
  onBook?: (event: Event) => void;
}

export function EventCard({
  event,
  onBook,
}: EventCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const isSoldOut = event.ticketsLeft === 0;

  function handleViewTickets() {
    setDetailsOpen(true);
  }

  return (
    <>
      <article className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-[#E9E5E0] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
        <div className="relative h-[220px] shrink-0">
          <EventImage
            src={event.image}
            alt={event.title}
            className="h-full w-full"
          />

          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <Badge
              variant="secondary"
              className="rounded-full bg-white px-3 py-1 font-semibold capitalize text-[#101828]"
            >
              {event.category}
            </Badge>

            {event.isDemo && (
              <Badge
                variant="secondary"
                className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-900"
              >
                Demo
              </Badge>
            )}
          </div>

          <FavoriteButton
            isFavorite={isFavorite}
            onToggle={() =>
              setIsFavorite((value) => !value)
            }
            className="absolute right-3 top-3"
          />

          <DateBadge
            date={event.date}
            className="absolute bottom-3 left-3"
          />
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="min-h-[52px] text-lg font-bold leading-snug tracking-tight text-[#101828]">
            {event.title}
          </h3>

          <EventMeta
            event={event}
            className="mt-3"
          />

          <div className="mt-auto border-t border-[#ECE9E5] pt-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <PriceDisplay event={event} />

              {event.isDemo && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
                  <Ticket size={13} />
                  Demo
                </span>
              )}
            </div>

            <Button
              type="button"
              onClick={handleViewTickets}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B53] font-bold text-white transition hover:bg-[#F05B44]"
            >
              <Ticket size={17} />

              View Tickets

              <ArrowRight size={17} />
            </Button>
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
