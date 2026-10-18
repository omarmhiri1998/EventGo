
"use client";

import { Sparkles } from "lucide-react";

import { Typography } from "../../atoms/Typography/Typography";
import { TrendChip } from "../../atoms/TrendChip/TrendChip";
import { EventSearchBar } from "../EventSearchBar/EventSearchBar";

import type { EventFilters } from "../../types/event";

interface HeroSectionProps {
  filters: EventFilters;
  onChange: <K extends keyof EventFilters>(
    key: K,
    value: EventFilters[K]
  ) => void;
  onSearch: () => void;
  onTrendClick: (trend: string) => void;
}

const trends = [
  "Techno tonight",
  "Jazz brunch",
  "Open air cinema",
  "Startup meetups",
  "This weekend",
];

export function HeroSection({
  filters,
  onChange,
  onSearch,
  onTrendClick,
}: HeroSectionProps) {
  return (
    <section className="relative isolate overflow-hidden bg-[#08111D] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_15%_25%,rgba(255,107,83,0.16),transparent_38%),radial-gradient(ellipse_at_85%_80%,rgba(30,180,167,0.17),transparent_40%)]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-10 size-80 rounded-full bg-[#FF6B53]/10 blur-[110px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 bottom-0 size-96 rounded-full bg-teal-500/10 blur-[120px]"
      />

      <div className="relative mx-auto flex min-h-[580px] max-w-[1280px] flex-col items-center justify-center px-5 py-20 text-center lg:px-10">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
          <Sparkles size={15} className="text-[#FF6B53]" />
          Discover your next experience
        </div>

        <Typography
          variant="display"
          className="max-w-[850px] text-[clamp(2.8rem,6vw,5.5rem)] leading-[1.08] text-white"
        >
          Find the nights
          <br />
          you&apos;ll{" "}
          <span className="text-[#FF6B53]">never</span>{" "}
          <span className="italic underline decoration-teal-400 decoration-[5px] underline-offset-[10px]">
            forget
          </span>
        </Typography>

        <Typography
          variant="body"
          className="mt-7 max-w-[620px] text-base leading-8 text-slate-300 md:text-lg"
        >
          Concerts, food markets, art exhibitions and unforgettable
          experiences — discover what is happening near you.
        </Typography>

        <div className="mt-11 w-full max-w-[1050px]">
          <EventSearchBar
            filters={filters}
            onChange={onChange}
            onSearch={onSearch}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="mr-1 text-xs text-slate-400">
            Trending:
          </span>

          {trends.map((trend) => (
            <TrendChip
              key={trend}
              label={trend}
              onClick={() => onTrendClick(trend)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
