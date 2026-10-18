
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarX2, ChevronLeft, ChevronRight } from "lucide-react";


import { SectionHeader } from "../../molecules/SectionHeader/SectionHeader";
import { EventCard } from "../../molecules/EventCard/EventCard";

import type { Event } from "../../types/event";


interface PopularEventsSectionProps {
  events: Event[];
}

export function PopularEventsSection({
  events,
}: PopularEventsSectionProps) {
  const sliderRef = useRef<HTMLDivElement>(null);

  const dragRef = useRef({
    active: false,
    startX: 0,
    startScrollLeft: 0,
    moved: false,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = useCallback(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const { scrollLeft, scrollWidth, clientWidth } = slider;

    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(
      scrollLeft + clientWidth < scrollWidth - 2
    );
  }, []);

  useEffect(() => {
    updateArrows();

    const slider = sliderRef.current;
    if (!slider) return;

    const observer = new ResizeObserver(updateArrows);
    observer.observe(slider);

    return () => observer.disconnect();
  }, [events, updateArrows]);

  function scroll(direction: "left" | "right") {
    const slider = sliderRef.current;
    if (!slider) return;

    const firstCard = slider.firstElementChild as HTMLElement | null;

    if (!firstCard) return;

    const cardWidth = firstCard.getBoundingClientRect().width;
    const gap = parseFloat(window.getComputedStyle(slider).gap) || 24;

    slider.scrollBy({
      left:
        direction === "right"
          ? cardWidth + gap
          : -(cardWidth + gap),
      behavior: "smooth",
    });
  }

  function handlePointerDown(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    if (event.pointerType === "touch") return;
    if (event.button !== 0) return;

    const slider = sliderRef.current;
    if (!slider) return;

    dragRef.current = {
      active: true,
      startX: event.clientX,
      startScrollLeft: slider.scrollLeft,
      moved: false,
    };
  }

  function handlePointerMove(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    const slider = sliderRef.current;
    const drag = dragRef.current;

    if (!slider || !drag.active) return;

    const distance = event.clientX - drag.startX;

    if (!drag.moved && Math.abs(distance) < 5) return;

    if (!drag.moved) {
      drag.moved = true;
      setIsDragging(true);
      slider.setPointerCapture(event.pointerId);
    }

    slider.scrollLeft = drag.startScrollLeft - distance;
  }

  function handlePointerUp(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    dragRef.current.active = false;
    setIsDragging(false);

    const slider = sliderRef.current;

    if (slider?.hasPointerCapture(event.pointerId)) {
      slider.releasePointerCapture(event.pointerId);
    }

    updateArrows();
  }

  function handleClickCapture(
    event: React.MouseEvent<HTMLDivElement>
  ) {
    if (dragRef.current.moved) {
      event.preventDefault();
      event.stopPropagation();
      dragRef.current.moved = false;
    }
  }

  return (
    <section
      id="popular-events"
      className="bg-[#FCFAF7] pb-24 pt-8 md:pb-32"
    >
      <div className="mx-auto max-w-[1280px] px-5 lg:px-10">
        <SectionHeader
          eyebrow="DISCOVER EVENTS"
          title="Explore Events"
          description="Discover exciting events from different cities."
          actionLabel="See all events"
          actionHref="/explore"
        />

        {events.length > 0 ? (
          <div className="relative mt-8">
            <button
              type="button"
              aria-label="Previous events"
              disabled={!canScrollLeft}
              onClick={() => scroll("left")}
              className="
                absolute left-0 top-1/2 z-20
                -translate-x-1/2 -translate-y-1/2
                flex h-12 w-12 items-center justify-center
                rounded-full bg-white text-[#101828]
                shadow-lg border border-[#E9E5E0]
                transition-all
                hover:bg-[#101828] hover:text-white
                disabled:cursor-not-allowed
                disabled:opacity-30
              "
            >
              <ChevronLeft size={24} />
            </button>

            <div
              ref={sliderRef}
              onScroll={updateArrows}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onClickCapture={handleClickCapture}
              className={`
                flex gap-6 overflow-x-auto
                overscroll-x-contain
                snap-x snap-mandatory
                pb-5
                select-none
                [scrollbar-width:none]
                [&::-webkit-scrollbar]:hidden
                ${
                  isDragging
                    ? "cursor-grabbing snap-none"
                    : "cursor-grab scroll-smooth"
                }
              `}
              style={{
                touchAction: "pan-x pan-y",
              }}
            >
              {events.map((event) => (
                <div
                  key={event.id}
                  className="
                    min-w-0 shrink-0 snap-start
                    basis-[85%]
                    sm:basis-[calc((100%-24px)/2)]
                    xl:basis-[calc((100%-72px)/4)]
                  "
                >
                  <EventCard event={event} />
                </div>
              ))}
            </div>

            <button
              type="button"
              aria-label="Next events"
              disabled={!canScrollRight}
              onClick={() => scroll("right")}
              className="
                absolute right-0 top-1/2 z-20
                translate-x-1/2 -translate-y-1/2
                flex h-12 w-12 items-center justify-center
                rounded-full bg-white text-[#101828]
                shadow-lg border border-[#E9E5E0]
                transition-all
                hover:bg-[#101828] hover:text-white
                disabled:cursor-not-allowed
                disabled:opacity-30
              "
            >
              <ChevronRight size={24} />
            </button>
          </div>
        ) : (
          <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[26px] border border-[#E9E5E0] bg-white px-5 text-center">
            <CalendarX2
              size={42}
              strokeWidth={1.5}
              className="mb-5 text-[#FF6B53]"
            />

            <h3 className="text-xl font-bold text-[#101828]">
              No events found
            </h3>

            <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
              No events are available in this selection.
              Try another category.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
