
import { Suspense } from "react";
import Link from "next/link";

import {
  MapPin,
  Search,
  ChevronLeft,
  ChevronRight,
  Globe2,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { getAdminCitiesAction } from "../actions/cities.actions";

interface CitiesPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
  }>;
}

function createUrl(page: number, search: string) {
  const params = new URLSearchParams();

  params.set("page", String(page));

  if (search) {
    params.set("q", search);
  }

  return `/cities?${params.toString()}`;
}

async function CitiesContent({
  searchParams,
}: CitiesPageProps) {
  const params = await searchParams;

  const requestedPage = Number(params.page ?? "1");

  const page =
    Number.isSafeInteger(requestedPage) &&
    requestedPage > 0
      ? requestedPage
      : 1;

  const search = (params.q ?? "").slice(0, 200);

  const result = await getAdminCitiesAction(page, search);

  const firstItem =
    result.total === 0
      ? 0
      : (page - 1) * result.pageSize + 1;

  const lastItem = Math.min(
    page * result.pageSize,
    result.total
  );

  return (
    <div className="w-full space-y-7 2xl:space-y-9">
      <section>
        <h1 className="text-3xl font-extrabold tracking-tight 2xl:text-4xl">
          Cities
        </h1>

        <p className="mt-2 text-sm text-slate-500 2xl:text-base">
          Browse and search cities available in EventGo.
        </p>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF0EC]">
              <MapPin className="h-7 w-7 text-[#FF6B53]" />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Matching Cities
              </p>

              <p className="mt-1 text-3xl font-extrabold text-[#08111D]">
                {result.total.toLocaleString("de-DE")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
              <Globe2 className="h-7 w-7 text-blue-600" />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Cities on This Page
              </p>

              <p className="mt-1 text-3xl font-extrabold text-[#08111D]">
                {result.cities.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-xl font-bold">
            All Cities
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Search cities by name or country code.
          </p>

          <form
            action="/cities"
            method="GET"
            className="mt-6 flex flex-wrap gap-3"
          >
            <div className="relative min-w-[220px] flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <Input
                name="q"
                type="search"
                maxLength={200}
                defaultValue={search}
                placeholder="Search city or country code..."
                className="h-11 border-slate-200 bg-white pl-11 text-[#08111D] placeholder:text-slate-400"
              />
            </div>

            <Button
              type="submit"
              className="h-11 bg-[#FF6B53] px-6 text-white hover:bg-[#F15D45]"
            >
              Search
            </Button>

            <Button
              variant="outline"
              className="h-11"
              render={<Link href="/cities" />}
            >
              Reset
            </Button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm 2xl:text-base">
            <thead className="bg-[#F5F7FA] text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-4">City</th>
                <th className="px-6 py-4">Country</th>
                <th className="px-6 py-4">Latitude</th>
                <th className="px-6 py-4">Longitude</th>
                <th className="px-6 py-4">City ID</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {result.cities.map((city) => (
                <tr
                  key={city.id}
                  className="transition-colors hover:bg-[#F8FAFC]"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-[#FFF0EC] p-2 text-[#FF6B53]">
                        <MapPin size={17} />
                      </div>

                      <span className="font-semibold text-[#08111D]">
                        {city.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {city.countryCode}
                    </span>
                  </td>

                  <td className="px-6 py-4 font-mono text-slate-600">
                    {city.latitude.toFixed(5)}
                  </td>

                  <td className="px-6 py-4 font-mono text-slate-600">
                    {city.longitude.toFixed(5)}
                  </td>

                  <td className="px-6 py-4 font-mono text-slate-500">
                    {city.id}
                  </td>
                </tr>
              ))}

              {result.cities.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-16 text-center text-slate-500"
                  >
                    No cities found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 p-6">
          <p className="text-sm text-slate-500">
            Showing {firstItem}–{lastItem} of{" "}
            {result.total.toLocaleString("de-DE")}
          </p>

          <div className="flex items-center gap-3">
            {page > 1 ? (
              <Link
                href={createUrl(page - 1, search)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
              >
                <ChevronLeft size={16} />
                Previous
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-400">
                <ChevronLeft size={16} />
                Previous
              </span>
            )}

            <span className="text-sm font-semibold">
              {page} / {Math.max(result.totalPages, 1)}
            </span>

            {page < result.totalPages ? (
              <Link
                href={createUrl(page + 1, search)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
              >
                Next
                <ChevronRight size={16} />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-400">
                Next
                <ChevronRight size={16} />
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function CitiesLoading() {
  return (
    <div
      role="status"
      className="flex min-h-[60vh] items-center justify-center"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#FF6B53]" />

        <p className="text-sm text-slate-500">
          Loading cities...
        </p>
      </div>
    </div>
  );
}

export default function CitiesPage(props: CitiesPageProps) {
  return (
    <main className="min-h-full w-full bg-[#F5F7FA] p-5 text-[#08111D] lg:p-8 2xl:p-10">
      <Suspense fallback={<CitiesLoading />}>
        <CitiesContent searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
