
"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Search, Pencil, Trash2 } from "lucide-react";

export interface AdminEvent {
  id: string;
  title: string;
  category: string | null;
  city_name: string;
  starts_at: string | Date;
  capacity: number;
  is_demo: boolean;
}

interface EventsTableProps {
  events: AdminEvent[];
}

export function EventsTable({ events }: EventsTableProps) {
  const [search, setSearch] = useState("");

  const filteredEvents = useMemo(() => {
    return events.filter((event) =>
      `${event.title} ${event.city_name} ${event.category ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [events, search]);

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6">
        <div>
          <h2 className="text-xl font-bold text-[#08111D]">
            All Events
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {filteredEvents.length} events
          </p>
        </div>

        <div className="relative w-full max-w-sm">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none focus:border-[#FF6B53]"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="bg-[#FCFAF7] text-slate-500">
            <tr>
              <th className="px-6 py-4">Event</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">City</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Capacity</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredEvents.map((event) => (
              <tr
                key={event.id}
                className="border-t border-slate-100 hover:bg-slate-50"
              >
                <td className="px-6 py-4 font-semibold text-[#08111D]">
                  {event.title}
                </td>
                <td className="px-6 py-4 capitalize">
                  {event.category ?? "—"}
                </td>
                <td className="px-6 py-4">{event.city_name}</td>
                <td className="px-6 py-4">
                  {new Date(event.starts_at).toLocaleDateString(
                    "de-DE",
                    { timeZone: "Europe/Berlin" }
                  )}
                </td>
                <td className="px-6 py-4">{event.capacity}</td>
                <td className="px-6 py-4">
                  {event.is_demo ? "Demo" : "Regular"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled
                      title="Editing coming soon"
                      className="text-slate-400"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      type="button"
                      disabled
                      title="Deletion coming soon"
                      className="text-slate-400"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredEvents.length === 0 && (
        <div className="py-16 text-center text-slate-400">
          <CalendarDays className="mx-auto mb-3" size={32} />
          No events found.
        </div>
      )}
    </section>
  );
}
