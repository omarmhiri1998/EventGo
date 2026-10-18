
import { Suspense } from "react";
import Link from "next/link";

import {
  Ticket,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { getAdminTicketTypesAction } from "../actions/ticket-types.actions";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
  }>;
}

function formatMoney(price: number, currency: string) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
  }).format(price);
}

function createUrl(page: number, search: string) {
  const params = new URLSearchParams();

  params.set("page", String(page));

  if (search) {
    params.set("q", search);
  }

  return `/ticket-types?${params.toString()}`;
}

async function TicketTypesContent({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const requestedPage = Number(params.page ?? 1);
  const page =
    Number.isSafeInteger(requestedPage) &&
    requestedPage > 0
      ? requestedPage
      : 1;

  const search = (params.q ?? "").slice(0, 200);

  const result = await getAdminTicketTypesAction(
    page,
    search
  );

  return (
    <div className="w-full space-y-7">
      <section>
        <h1 className="text-3xl font-extrabold tracking-tight 2xl:text-4xl">
          Ticket Types
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          View ticket prices, quantities and sales.
        </p>
      </section>

      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF0EC]">
            <Ticket className="h-7 w-7 text-[#FF6B53]" />
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Total Ticket Types
            </p>

            <p className="text-3xl font-extrabold">
              {result.total.toLocaleString("de-DE")}
            </p>
          </div>
        </CardContent>
      </Card>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-xl font-bold">
            All Ticket Types
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Ticket availability by event
          </p>

          <form
            action="/ticket-types"
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
                defaultValue={search}
                placeholder="Search event or ticket type..."
                maxLength={200}
                className="h-11 bg-white pl-11 text-[#08111D]"
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
              render={<Link href="/ticket-types" />}
            >
              Reset
            </Button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm 2xl:text-base">
            <thead className="bg-[#F5F7FA] text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4">Event</th>
                <th className="px-6 py-4">Ticket Type</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Sold</th>
                <th className="px-6 py-4">Available</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {result.ticketTypes.map((ticketType) => (
                <tr
                  key={ticketType.id}
                  className="hover:bg-[#F8FAFC]"
                >
                  <td className="px-6 py-4 font-semibold text-[#08111D]">
                    {ticketType.eventTitle}
                  </td>

                  <td className="px-6 py-4">
                    <span className="rounded-full bg-[#FFF0EC] px-3 py-1 text-xs font-semibold text-[#D45A45]">
                      {ticketType.name}
                    </span>
                  </td>

                  <td className="px-6 py-4 font-semibold">
                    {formatMoney(
                      ticketType.price,
                      ticketType.currency
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {ticketType.quantity}
                  </td>

                  <td className="px-6 py-4">
                    {ticketType.sold}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        ticketType.available === 0
                          ? "bg-red-50 text-red-700"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      {ticketType.available}
                    </span>
                  </td>
                </tr>
              ))}

              {result.ticketTypes.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-14 text-center text-slate-500"
                  >
                    No ticket types found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 p-6">
          <p className="text-sm text-slate-500">
            {result.total} matching ticket types
          </p>

          <div className="flex items-center gap-3">
            {page > 1 ? (
              <Link
                href={createUrl(page - 1, search)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold"
              >
                <ChevronLeft size={16} />
                Previous
              </Link>
            ) : (
              <span className="text-sm text-slate-400">
                Previous
              </span>
            )}

            <span className="text-sm font-semibold">
              {page} / {Math.max(result.totalPages, 1)}
            </span>

            {page < result.totalPages ? (
              <Link
                href={createUrl(page + 1, search)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold"
              >
                Next
                <ChevronRight size={16} />
              </Link>
            ) : (
              <span className="text-sm text-slate-400">
                Next
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function TicketTypesLoading() {
  return (
    <div
      role="status"
      className="flex min-h-[60vh] items-center justify-center"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#FF6B53]" />
    </div>
  );
}

export default function TicketTypesPage(props: PageProps) {
  return (
    <main className="min-h-full w-full bg-[#F5F7FA] p-5 text-[#08111D] lg:p-8 2xl:p-10">
      <Suspense fallback={<TicketTypesLoading />}>
        <TicketTypesContent
          searchParams={props.searchParams}
        />
      </Suspense>
    </main>
  );
}
