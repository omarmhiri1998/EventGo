
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  CalendarDays,
  ChevronRight,
  LoaderCircle,
  MapPin,
  QrCode,
  Ticket,
  Users,
} from "lucide-react";

import { getMyTicketsAction } from
  "@/app/actions/my-tickets.actions";

import { MyTicketDialog } from
  "@/components/molecules/MyTicketDialog/MyTicketDialog";

import type { MyTicket } from
  "@eventgo/backend/services/my-ticket.service";

export default function MyEventsPage() {
  const [tickets, setTickets] = useState<MyTicket[]>(
    []
  );
  const [selected, setSelected] =
    useState<MyTicket | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTickets() {
      try {
        const data = await getMyTicketsAction();

        if (active) {
          setTickets(data);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load tickets."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadTickets();

    return () => {
      active = false;
    };
  }, []);

  function openTicket(ticket: MyTicket) {
    setSelected(ticket);
    setOpen(true);
  }

  return (
    <main className="min-h-[75vh] bg-[#FAF9F7] px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-9 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF0EA] text-[#FF6B53]">
            <Ticket size={28} />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-[#08111D]">
              My Events
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Your purchased event tickets
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <LoaderCircle
              size={34}
              className="animate-spin text-[#FF6B53]"
            />
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"
          >
            {error}
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white px-6 py-20 text-center shadow-sm">
            <Ticket
              size={52}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-5 text-xl font-bold text-[#08111D]">
              No tickets yet
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Your group tickets appear here
              after checkout.
            </p>

            <Link
              href="/explore"
              className="mt-7 inline-flex rounded-xl bg-[#FF6B53] px-6 py-3 font-bold text-white hover:bg-[#F05B44]"
            >
              Explore Events
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => openTicket(ticket)}
                className="group overflow-hidden rounded-3xl border border-slate-100 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="bg-[#08111D] p-6 text-white">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF9F8C]">
                      <Ticket size={17} />
                      EventGo
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        ticket.status === "ACTIVE"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-slate-500/20 text-slate-300"
                      }`}
                    >
                      {ticket.status === "ACTIVE"
                        ? "Active"
                        : ticket.status === "USED"
                          ? "Used"
                          : "Cancelled"}
                    </span>
                  </div>

                  <h2 className="line-clamp-2 min-h-[56px] text-xl font-bold">
                    {ticket.eventTitle}
                  </h2>

                  <p className="mt-3 text-sm text-slate-300">
                    {ticket.ticketType}
                  </p>

                  <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                    <Users size={18} />
                    <span className="font-bold">
                      {ticket.quantity}{" "}
                      {ticket.quantity === 1
                        ? "Person"
                        : "Persons"}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 p-6">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <CalendarDays
                      size={18}
                      className="text-[#FF6B53]"
                    />
                    {new Date(
                      ticket.startsAt
                    ).toLocaleString("de-DE", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>

                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <MapPin
                      size={18}
                      className="text-[#FF6B53]"
                    />
                    {ticket.city}
                  </div>

                  <div className="border-t border-dashed border-slate-200 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 font-bold text-[#FF6B53]">
                        <QrCode size={20} />
                        View Group Ticket
                      </span>

                      <ChevronRight
                        size={20}
                        className="text-slate-400 transition group-hover:translate-x-1"
                      />
                    </div>
                  </div>

                  {ticket.isDemo && (
                    <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                      Demo Ticket
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        <MyTicketDialog
          ticket={selected}
          open={open}
          onOpenChange={setOpen}
        />
      </div>
    </main>
  );
}
