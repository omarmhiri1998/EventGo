
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { EventImage } from "../../atoms/EventImage/EventImage";
import { Typography } from "../../atoms/Typography/Typography";

export function FeaturedBanner() {
  return (
    <section className="bg-[#FCFAF7] pb-28 md:pb-36">
      <div className="mx-auto max-w-[1280px] px-5 lg:px-10">
        <div className="grid overflow-hidden rounded-[32px] bg-[#08111D] lg:min-h-[420px] lg:grid-cols-2">

          {/* Left: Festival image */}
          <div className="relative min-h-[280px] sm:min-h-[360px] lg:min-h-[420px]">
            <EventImage
              src="/images/banners/festival.jpg"
              alt="People enjoying a music festival"
              className="absolute inset-0 h-full w-full"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          {/* Right: Editorial content */}
          <div className="relative flex flex-col justify-center overflow-hidden px-7 py-14 text-white sm:px-12 lg:px-14">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-[#FF6B53]/15 blur-[90px]"
            />

            <div className="relative z-10">
              <Typography
                variant="eyebrow"
                className="text-[#FF6B53]"
              >
                THE EVENTGO EDIT
              </Typography>

              <Typography
                variant="h2"
                className="mt-6 max-w-[520px] text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl"
              >
                Festival season,
                <br />
                <span className="text-[#FF6B53]">
                  curated
                </span>{" "}
                for you.
              </Typography>

              <Typography
                variant="body"
                className="mt-6 max-w-[480px] text-base leading-8 text-slate-300"
              >
                Discover unforgettable festivals, open-air
                concerts, and unique experiences. Find the
                moments worth remembering.
              </Typography>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/explore?category=festivals"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#FF6B53] px-6 text-sm font-bold text-white transition hover:bg-[#F05B44]"
                >
                  Explore festivals
                  <ArrowRight size={18} />
                </Link>

                <Link
                  href="/signup"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Create account
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
