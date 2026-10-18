
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { getSession } from "@/lib/auth";

import {
  getDemoOrderForUser,
} from "@eventgo/backend/services/order.service";

interface SuccessPageProps {
  searchParams: Promise<{
    orderId?: string | string[];
  }>;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const { orderId } = await searchParams;

  if (typeof orderId !== "string") {
    notFound();
  }

  const order = await getDemoOrderForUser(
    session.userId,
    orderId
  );

  if (!order) {
    notFound();
  }

  const total = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: order.currency,
  }).format(Number(order.totalAmount));

  return (
    <main className="flex min-h-[75vh] items-center justify-center bg-[#FAF9F7] px-4 py-16">
      <div className="w-full max-w-xl rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2
            size={46}
            className="text-emerald-600"
          />
        </div>

        <h1 className="mt-7 text-3xl font-bold text-[#08111D]">
          Demo Order Confirmed!
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Your demo order was created successfully.
          No real payment was collected.
        </p>

        <div className="mt-8 rounded-2xl bg-[#FAF9F7] p-5 text-left">
          <p className="text-xs font-medium text-slate-500">
            Order ID
          </p>

          <p className="mt-1 break-all text-sm font-semibold">
            {order.id}
          </p>

          <div className="mt-5 flex justify-between">
            <span className="text-sm text-slate-600">
              Tickets issued
            </span>
            <span className="font-bold">
              {order.ticketCount}
            </span>
          </div>

          <div className="mt-3 flex justify-between">
            <span className="text-sm text-slate-600">
              Demo total
            </span>
            <span className="font-bold">
              {total}
            </span>
          </div>
        </div>

        <Link
          href="/explore"
          className="mt-8 inline-flex rounded-xl bg-[#FF6B53] px-7 py-3 font-bold text-white hover:bg-[#F05B44]"
        >
          Explore More Events
        </Link>
      </div>
    </main>
  );
}
