
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  MouseEvent,
  PointerEvent,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { SectionHeader } from "@/components/molecules/SectionHeader/SectionHeader";
import { CategoryCard } from "@/components/molecules/CategoryCard/CategoryCard";

import { categories } from "@/data/categories";
import type { EventCategory } from "@/types/event";

interface CategoriesSectionProps {
  selectedCategory: EventCategory | "all";
  onCategoryChange: (
    category: EventCategory | "all"
  ) => void;
}

export function CategoriesSection({
  selectedCategory,
  onCategoryChange,
}: CategoriesSectionProps) {
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

    setCanScrollLeft(slider.scrollLeft > 2);

    setCanScrollRight(
      slider.scrollLeft + slider.clientWidth <
        slider.scrollWidth - 2
    );
  }, []);

  useEffect(() => {
    const slider = sliderRef.current;

    if (!slider) return;

    updateArrows();

    const observer = new ResizeObserver(updateArrows);

    observer.observe(slider);

    return () => observer.disconnect();
  }, [updateArrows]);

  function scroll(direction: "left" | "right") {
    const slider = sliderRef.current;

    if (!slider) return;

    const firstCard =
      slider.firstElementChild as HTMLElement | null;

    if (!firstCard) return;

    const cardWidth =
      firstCard.getBoundingClientRect().width;

    const gap =
      parseFloat(getComputedStyle(slider).columnGap) || 16;

    slider.scrollBy({
      left:
        direction === "right"
          ? cardWidth + gap
          : -(cardWidth + gap),
      behavior: "smooth",
    });
  }

  function handlePointerDown(
    event: PointerEvent<HTMLDivElement>
  ) {
    if (event.pointerType !== "mouse") return;
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
    event: PointerEvent<HTMLDivElement>
  ) {
    const slider = sliderRef.current;
    const drag = dragRef.current;

    if (!slider || !drag.active) return;

    const distance = event.clientX - drag.startX;

    if (!drag.moved && Math.abs(distance) < 6) {
      return;
    }

    if (!drag.moved) {
      drag.moved = true;
      setIsDragging(true);
      slider.setPointerCapture(event.pointerId);
    }

    slider.scrollLeft =
      drag.startScrollLeft - distance;
  }

  function handlePointerUp(
    event: PointerEvent<HTMLDivElement>
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
    event: MouseEvent<HTMLDivElement>
  ) {
    if (!dragRef.current.moved) return;

    event.preventDefault();
    event.stopPropagation();

    dragRef.current.moved = false;
  }

  return (
    <section
      id="categories"
      className="bg-[#FCFAF7] py-20 md:py-24"
    >
      <div className="mx-auto max-w-[1280px] px-5 lg:px-10">
        <SectionHeader
          eyebrow="YOUR INTERESTS"
          title="What are you in the mood for?"
          description="Explore experiences that match your interests."
        />

        <div className="relative mt-8">
          <button
            type="button"
            aria-label="Previous categories"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="absolute left-0 top-1/2 z-20 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#E9E5E0] bg-white text-[#101828] shadow-lg transition-all hover:bg-[#101828] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
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
            className={`flex gap-4 overflow-x-auto overscroll-x-contain pb-4 select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
              isDragging
                ? "cursor-grabbing"
                : "cursor-grab scroll-smooth"
            }`}
          >
            {categories.map((category) => (
              <div
                key={category.id}
                className="min-w-0 shrink-0 basis-[calc((100%-16px)/2)] sm:basis-[calc((100%-32px)/3)] md:basis-[calc((100%-48px)/4)] xl:basis-[calc((100%-80px)/6)]"
              >
                <CategoryCard
                  category={category.id}
                  label={category.label}
                  color={category.color}
                  selected={
                    selectedCategory === category.id
                  }
                  onClick={(value) =>
                    onCategoryChange(
                      selectedCategory === value
                        ? "all"
                        : value
                    )
                  }
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            aria-label="Next categories"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="absolute right-0 top-1/2 z-20 flex h-12 w-12 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#E9E5E0] bg-white text-[#101828] shadow-lg transition-all hover:bg-[#101828] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </section>
  );
}
