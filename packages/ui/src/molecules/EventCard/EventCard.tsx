

"use client";

import { useState } from "react";
import { Ticket } from "lucide-react";

import { EventImage } from "../../atoms/EventImage/EventImage";
import { DateBadge } from "../../atoms/DateBadge/DateBadge";
import { FavoriteButton } from "../../atoms/FavoriteButton/FavoriteButton";

import { EventMeta } from "../EventMeta/EventMeta";
import { PriceDisplay } from "../PriceDisplay/PriceDisplay";

import { Badge } from "../../components/badge";
import { Button } from "../../atoms/Button/button";

import type { Event } from "../../types/event";


interface EventCardProps {
  event: Event;
  onBook?: (event: Event) => void;
}

export function EventCard({
  event,
  onBook,
}: EventCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  const isSoldOut = event.ticketsLeft === 0;
  const canBook =
    !event.isDemo &&
    !isSoldOut &&
    Boolean(onBook);

  return (
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

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-[#ECE9E5] pt-4">
          <PriceDisplay event={event} />

          <Button
            type="button"
            disabled={!canBook}
            onClick={() => {
              if (canBook) {
                onBook?.(event);
              }
            }}
            className="rounded-full bg-[#101828] px-5 font-semibold text-white hover:bg-[#293344]"
          >
            <Ticket size={16} />

            {event.isDemo
              ? "Demo only"
              : isSoldOut
                ? "Sold out"
                : "Book now"}
          </Button>
        </div>
      </div>
    </article>
  );
}
