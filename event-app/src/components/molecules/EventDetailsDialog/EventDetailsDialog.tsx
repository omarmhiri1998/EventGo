
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import {
  CalendarDays,
  Clock3,
  MapPin,
  ShoppingCart,
  Ticket,
  LoaderCircle,
  CheckCircle2,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import {
  getEventTicketTypesAction,
  type TicketType,
} from "@/app/actions/ticket.actions";

import { addToCartAction } from "@/app/actions/cart.actions";

import type { Event } from "@/types/event";

interface EventDetailsDialogProps {
  event: Event;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatPrice(
  price: number,
  currency: string
) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
  }).format(price);
}

function formatEventDate(dateValue: string) {
  const date = new Date(`${dateValue}T12:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function EventDetailsDialog({
  event,
  open,
  onOpenChange,
}: EventDetailsDialogProps) {
  const [ticketTypes, setTicketTypes] =
    useState<TicketType[]>([]);

  const [selectedTicketId, setSelectedTicketId] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [message, setMessage] = useState("");

  // ==========================================
  // LOAD EVENT TICKETS
  // ==========================================

  useEffect(() => {
    if (!open) return;

    let active = true;

    async function loadTickets() {
      setLoading(true);
      setError(null);
      setMessage("");
      setTicketTypes([]);
      setSelectedTicketId("");

      // DEBUG: Which event did Explore send?
      console.log("[EventGo] EVENT:", {
        id: event.id,
        title: event.title,
        city: event.city,
      });

      try {
        const data = await getEventTicketTypesAction(
          event.id
        );

        if (!active) return;

        // DEBUG: What did the backend return?
        console.log(
          "[EventGo] TICKETS RETURNED:",
          data
        );

        setTicketTypes(data);

        const firstAvailable = data.find(
          (ticket) => ticket.available > 0
        );

        console.log(
          "[EventGo] FIRST AVAILABLE TICKET:",
          firstAvailable ?? null
        );

        setSelectedTicketId(
          firstAvailable?.id ?? ""
        );
      } catch (err) {
        if (!active) return;

        // DEBUG: Show the actual error.
        console.error(
          "[EventGo] TICKET ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load tickets."
        );
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
  }, [event.id, open]);

  // ==========================================
  // SELECTED TICKET
  // ==========================================

  const selectedTicket = ticketTypes.find(
    (ticket) => ticket.id === selectedTicketId
  );

  // ==========================================
  // ADD TO CART
  // ==========================================

  async function handleAddToCart() {
    if (
      !selectedTicket ||
      selectedTicket.available <= 0 ||
      adding
    ) {
      return;
    }

    setAdding(true);
    setError(null);
    setMessage("");

    try {
      await addToCartAction(selectedTicket.id);

      setMessage("Ticket added to your cart.");

      window.dispatchEvent(
        new Event("eventgo:cart-updated")
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to add ticket to cart."
      );
    } finally {
      setAdding(false);
    }
  }

  // ==========================================
  // DIALOG UI
  // ==========================================

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[24px] p-0 sm:max-w-[700px]">
        <div className="relative h-[240px] w-full bg-slate-100 sm:h-[300px]">
          <Image
            src={event.image}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, 700px"
            className="object-cover"
          />
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          <DialogHeader>
            <div className="mb-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#FFF0CC] px-3 py-1 text-xs font-semibold capitalize text-[#8A5600]">
                {event.category}
              </span>

              {event.isDemo && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  Demo event
                </span>
              )}
            </div>

            <DialogTitle className="text-2xl font-bold text-[#08111D] sm:text-3xl">
              {event.title}
            </DialogTitle>

            <DialogDescription className="text-sm text-slate-500">
              Event details and available tickets.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <CalendarDays
                size={19}
                className="text-[#FF6B53]"
              />
              {formatEventDate(event.date)}
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Clock3
                size={19}
                className="text-[#FF6B53]"
              />
              {event.time}
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-600">
              <MapPin
                size={19}
                className="text-[#FF6B53]"
              />
              {event.venue
                ? `${event.venue}, ${event.city}`
                : event.city}
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Ticket
                size={19}
                className="text-[#FF6B53]"
              />
              Ticket options
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h3 className="mb-3 text-lg font-bold text-[#08111D]">
              About this event
            </h3>

            <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
              {event.description ||
                "No description available."}
            </p>
          </div>

          <div className="rounded-2xl border border-[#EAE7E3] bg-[#FCFAF7] p-5">
            <h3 className="mb-4 text-lg font-bold text-[#08111D]">
              Select a ticket
            </h3>

            {loading && (
              <div
                role="status"
                className="flex items-center gap-2 py-6 text-sm text-slate-500"
              >
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
                Loading tickets...
              </div>
            )}

            {!loading &&
              ticketTypes.length === 0 &&
              !error && (
                <p className="py-5 text-sm text-slate-500">
                  No tickets are available for this event.
                </p>
              )}

            {!loading && (
              <div className="space-y-3">
                {ticketTypes.map((ticket) => {
                  const selected =
                    selectedTicketId === ticket.id;

                  return (
                    <button
                      key={ticket.id}
                      type="button"
                      disabled={ticket.available <= 0}
                      onClick={() => {
                        setSelectedTicketId(ticket.id);
                        setError(null);
                        setMessage("");
                      }}
                      className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition ${
                        selected
                          ? "border-[#FF6B53] bg-[#FFF3EF]"
                          : "border-[#EAE7E3] bg-white"
                      } ${
                        ticket.available > 0
                          ? "hover:border-[#FF6B53]"
                          : "cursor-not-allowed opacity-50"
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-[#08111D]">
                          {ticket.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {ticket.available > 0
                            ? `${ticket.available} available`
                            : "Sold out"}
                        </p>
                      </div>

                      <span className="text-base font-bold text-[#08111D]">
                        {formatPrice(
                          ticket.price,
                          ticket.currency
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-5 border-t border-[#EAE7E3] pt-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-slate-600">
                  Selected ticket
                </span>

                <span className="text-lg font-bold text-[#08111D]">
                  {selectedTicket
                    ? formatPrice(
                        selectedTicket.price,
                        selectedTicket.currency
                      )
                    : "—"}
                </span>
              </div>

              <Button
                type="button"
                disabled={
                  loading ||
                  adding ||
                  !selectedTicket ||
                  selectedTicket.available <= 0
                }
                onClick={handleAddToCart}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B53] font-bold text-white hover:bg-[#F05B44]"
              >
                {adding ? (
                  <LoaderCircle
                    size={19}
                    className="animate-spin"
                  />
                ) : (
                  <ShoppingCart size={19} />
                )}

                {adding
                  ? "Adding..."
                  : "Add to Cart"}
              </Button>

              {message && (
                <p
                  role="status"
                  className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold text-emerald-700"
                >
                  <CheckCircle2 size={17} />
                  {message}
                </p>
              )}

              {error && (
                <p
                  role="alert"
                  className="mt-3 text-center text-sm text-red-600"
                >
                  {error}
                </p>
              )}

              {event.isDemo && (
                <p className="mt-3 text-center text-xs text-slate-500">
                  Demo tickets cannot be purchased
                  with real money.
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
