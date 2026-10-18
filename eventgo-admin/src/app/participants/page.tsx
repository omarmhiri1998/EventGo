
import Link from "next/link";
import {
  Users,
  Ticket,
  CalendarDays,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  getParticipantsAction,
  getParticipantEventsAction,
} from "../actions/participants.actions";

type SearchParams = {
  page?: string;
  q?: string;
  event?: string;
};

interface ParticipantsPageProps {
  searchParams: Promise<SearchParams>;
}

function buildUrl(
  page: number,
  search: string,
  eventId: string
) {
  const params = new URLSearchParams();

  if (search) params.set("q", search);
  if (eventId) params.set("event", eventId);
  params.set("page", String(page));

  return `/participants?${params.toString()}`;
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(new Date(value));
}

export default async function ParticipantsPage({
  searchParams,
}: ParticipantsPageProps) {
  const params = await searchParams;

  const rawPage = Number(params.page ?? "1");

  const page =
    Number.isSafeInteger(rawPage) && rawPage > 0
      ? rawPage
      : 1;

  const search = (params.q ?? "").slice(0, 200);
  const eventId = params.event ?? "";

  const [result, availableEvents] = await Promise.all([
    getParticipantsAction(page, search, eventId),
    getParticipantEventsAction(),
  ]);

  const stats = [
    {
      label: "Participants",
      value: result.totalParticipants,
      icon: Users,
    },
    {
      label: "Tickets",
      value: result.totalTickets,
      icon: Ticket,
    },
    {
      label: "Events with attendees",
      value: result.eventsWithParticipants,
      icon: CalendarDays,
    },
  ];

  return (
    <main className="min-h-screen w-full bg-[#F5F7FA] px-5 py-8 text-[#08111D] lg:px-8 2xl:px-10">
    <div className="w-full min-w-0 space-y-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#FF6B53]">
            EventGo Administration
          </p>

          <h1 className="mt-3 text-4xl font-extrabold tracking-tight">
            Participants
          </h1>

          <p className="mt-3 text-slate-500">
            View attendees, ticket details, and event registrations.
          </p>
        </div>

        {/* STATISTICS */}
        <div className="grid gap-5 md:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </p>

                  <div className="rounded-xl bg-[#FFF0EC] p-3 text-[#FF6B53]">
                    <Icon size={21} />
                  </div>
                </div>

                <p className="mt-4 text-3xl font-extrabold">
                  {stat.value.toLocaleString("de-DE")}
                </p>
              </div>
            );
          })}
        </div>

        {/* PARTICIPANTS TABLE */}
        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-xl font-bold">
              All Participants
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {result.total.toLocaleString("de-DE")} ticket
              records found
            </p>

            {/* SEARCH AND FILTER */}
            <form
              action="/participants"
              method="GET"
              className="mt-6 flex flex-wrap gap-3"
            >
              <div className="relative min-w-[280px] flex-[2]">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  key={search}
                  name="q"
                  type="search"
                  maxLength={200}
                  defaultValue={search}
                  placeholder="Search name, email, event..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-[#08111D] placeholder:text-slate-400 outline-none focus:border-[#FF6B53]"
                />
              </div>

              <select
                key={eventId}
                name="event"
                defaultValue={eventId}
                aria-label="Filter by event"
                className="min-w-[200px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-[#08111D] outline-none focus:border-[#FF6B53]"
              >
                <option value="">All Events</option>

                {availableEvents.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="rounded-xl bg-[#FF6B53] px-6 py-3 font-semibold text-white hover:bg-[#F15D45]"
              >
                Search
              </button>

              <Link
                href="/participants"
                className="flex items-center rounded-xl border border-slate-200 px-5 py-3 font-semibold text-[#08111D] hover:bg-slate-50"
              >
                Reset
              </Link>
            </form>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
           <table className="w-full min-w-[1100px] text-left text-sm 2xl:text-base">
              <thead className="bg-[#FCFAF7] text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">Participant</th>
                  <th className="px-6 py-4">Event</th>
                  <th className="px-6 py-4">Ticket Type</th>
                  <th className="px-6 py-4">Ticket Status</th>
                  <th className="px-6 py-4">Order Status</th>
                  <th className="px-6 py-4">Purchase Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {result.participants.map((participant) => (
                  <tr
                    key={participant.ticket_id}
                    className="hover:bg-[#FCFAF7]"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-[#08111D]">
                        {participant.participant_name ||
                          "Unnamed user"}
                      </p>

                      <p className="mt-1 text-slate-500">
                        {participant.email}
                      </p>
                    </td>

                    <td className="px-6 py-4 font-medium">
                      {participant.event_title}
                    </td>

                    <td className="px-6 py-4">
                      {participant.ticket_type}
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {participant.ticket_status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-[#FFF0EC] px-3 py-1 text-xs font-semibold text-[#C75039]">
                        {participant.order_status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {formatDate(participant.purchased_at)}
                    </td>
                  </tr>
                ))}

                {result.participants.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center"
                    >
                      <Users
                        size={36}
                        className="mx-auto mb-3 text-slate-300"
                      />

                      <p className="font-semibold text-[#08111D]">
                        No participants found
                      </p>

                      <p className="mt-2 text-slate-500">
                        No ticket records match your filters.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 p-6">
            <p className="text-sm text-slate-500">
              {result.total === 0
                ? "Showing 0 records"
                : `Showing ${
                    (page - 1) * result.pageSize + 1
                  }–${Math.min(
                    page * result.pageSize,
                    result.total
                  )} of ${result.total}`}
            </p>

            <div className="flex items-center gap-3">
              {page > 1 ? (
                <Link
                  href={buildUrl(page - 1, search, eventId)}
                  className="flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  <ChevronLeft size={17} />
                  Previous
                </Link>
              ) : (
                <span className="flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-400">
                  <ChevronLeft size={17} />
                  Previous
                </span>
              )}

              <span className="text-sm font-semibold">
                Page {page} of {Math.max(result.totalPages, 1)}
              </span>

              {page < result.totalPages ? (
                <Link
                  href={buildUrl(page + 1, search, eventId)}
                  className="flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  Next
                  <ChevronRight size={17} />
                </Link>
              ) : (
                <span className="flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-400">
                  Next
                  <ChevronRight size={17} />
                </span>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
