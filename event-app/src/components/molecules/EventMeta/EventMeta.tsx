
import {
  Clock3,
  MapPin,
  Navigation,
} from "lucide-react";

import type { Event } from "@/types/event";
import { cn } from "@/lib/utils";

interface EventMetaProps {
  event: Event;
  className?: string;
}

export function EventMeta({
  event,
  className,
}: EventMetaProps) {
  return (
    <div
      className={cn(
        "space-y-2.5 text-sm text-[#667085]",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Clock3
          size={16}
          className="shrink-0"
          aria-hidden="true"
        />

        <span>{event.time}</span>

        {event.distanceKm !== undefined && (
          <>
            <span aria-hidden="true">·</span>

            <Navigation
              size={14}
              aria-hidden="true"
            />

            <span>
              {event.distanceKm} km away
            </span>
          </>
        )}
      </div>

      <div className="flex items-start gap-2">
        <MapPin
          size={16}
          className="mt-0.5 shrink-0"
          aria-hidden="true"
        />

        <span>
          {event.venue
            ? `${event.venue}, ${event.city}`
            : event.city}
        </span>
      </div>
    </div>
  );
}
