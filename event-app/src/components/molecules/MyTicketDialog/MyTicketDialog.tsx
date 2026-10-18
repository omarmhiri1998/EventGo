
"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

import {
  CalendarDays,
  LoaderCircle,
  MapPin,
  QrCode,
  Users,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { getMyTicketQrAction } from
  "@/app/actions/my-tickets.actions";

import type { MyTicket } from
  "@eventgo/backend/services/my-ticket.service";

interface Props {
  ticket: MyTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MyTicketDialog({
  ticket,
  open,
  onOpenChange,
}: Props) {
  const [image, setImage] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    null
  );

  const groupId = ticket?.id;
  const isActive = ticket?.status === "ACTIVE";

  useEffect(() => {
    if (!open || !groupId || !isActive) {
      setImage(null);
      setError(null);
      return;
    }

    let cancelled = false;

    async function loadQr() {
      setLoading(true);
      setImage(null);
      setError(null);

      try {
        const token = await getMyTicketQrAction(
          groupId!
        );

        const result = await QRCode.toDataURL(
          token,
          {
            width: 320,
            margin: 2,
            errorCorrectionLevel: "H",
          }
        );

        if (!cancelled) {
          setImage(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load QR code"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadQr();

    return () => {
      cancelled = true;
    };
  }, [groupId, open, isActive]);

  if (!ticket) {
    return null;
  }

  const eventDate = new Date(
    ticket.startsAt
  ).toLocaleString("de-DE", {
    dateStyle: "full",
    timeStyle: "short",
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Group Ticket
          </DialogTitle>
          <DialogDescription className="text-center">
            All group members enter together.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="bg-[#08111D] p-6 text-white">
            <div className="mb-4 flex items-center gap-2 text-[#FF9F8C]">
              <QrCode size={20} />
              <span className="text-xs font-bold uppercase tracking-widest">
                EventGo
              </span>
            </div>

            <h2 className="text-xl font-bold">
              {ticket.eventTitle}
            </h2>

            <p className="mt-2 text-sm text-slate-300">
              {ticket.ticketType}
            </p>

            <div className="mt-5 flex items-center gap-3 rounded-xl bg-white/10 p-4">
              <Users
                size={23}
                className="text-[#FF9F8C]"
              />

              <span className="text-xl font-bold">
                {ticket.quantity}{" "}
                {ticket.quantity === 1
                  ? "Person"
                  : "Persons"}
              </span>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <CalendarDays
                  size={17}
                  className="text-[#FF9F8C]"
                />
                {eventDate}
              </div>

              <div className="flex items-center gap-3">
                <MapPin
                  size={17}
                  className="text-[#FF9F8C]"
                />
                {ticket.city}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center bg-white p-7">
            {ticket.status !== "ACTIVE" ? (
              <div className="py-12 text-center">
                <p className="font-bold text-slate-800">
                  {ticket.status === "USED"
                    ? "Ticket Already Used"
                    : "Ticket Cancelled"}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  This QR code is no longer available.
                </p>
              </div>
            ) : (
              <>
                {loading && (
                  <div className="flex h-[280px] items-center justify-center">
                    <LoaderCircle
                      className="animate-spin text-[#FF6B53]"
                      size={34}
                    />
                  </div>
                )}

                {!loading && image && (
                  <img
                    src={image}
                    alt="Group ticket QR code"
                    width={280}
                    height={280}
                    className="h-[280px] w-[280px]"
                  />
                )}

                {error && (
                  <p
                    role="alert"
                    className="py-10 text-center text-sm text-red-600"
                  >
                    {error}
                  </p>
                )}

                {image && (
                  <p className="mt-3 text-center text-sm font-semibold text-slate-700">
                    Valid for {ticket.quantity}{" "}
                    {ticket.quantity === 1
                      ? "person"
                      : "persons"}{" "}
                    entering together
                  </p>
                )}
              </>
            )}

            <p className="mt-5 text-xs text-slate-400">
              Group ID
            </p>
            <p className="mt-1 break-all text-center font-mono text-xs text-slate-500">
              {ticket.id}
            </p>

            {ticket.isDemo && (
              <span className="mt-4 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                Demo Ticket
              </span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
