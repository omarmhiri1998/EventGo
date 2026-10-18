
import Link from "next/link";
import { redirect } from "next/navigation";
import { DemoCheckoutButton } from "@/components/molecules/DemoCheckoutButton/DemoCheckoutButton";
import {
  ArrowLeft,
  CreditCard,
  LockKeyhole,
  Ticket,
} from "lucide-react";

import { getSession } from "@/lib/auth";
import { getCart } from "@eventgo/backend/services/cart.service";
export const instant = false;
function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
  }).format(amount);
}

export default async function CheckoutPage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const cart = await getCart(session.userId);
  const items = cart.items;

  if (items.length === 0) {
    redirect("/cart");
  }

  const totals = items.reduce<Record<string, number>>(
    (acc, item) => {
      acc[item.currency] =
        (acc[item.currency] ?? 0) +
        Number(item.unitPrice) * item.quantity;

      return acc;
    },
    {}
  );

  const ticketCount = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const hasUnavailableItems = items.some(
    (item) =>
      item.quantity > item.available ||
      new Date(item.eventDate).getTime() <= Date.now()
  );

  if (hasUnavailableItems) {
    redirect("/cart");
  }

  return (
    <main className="min-h-[75vh] bg-[#FAF9F7] px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#FF6B53]"
        >
          <ArrowLeft size={17} />
          Back to Cart
        </Link>

        <div className="mt-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF0EA] text-[#FF6B53]">
            <CreditCard size={27} />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-[#08111D]">
              Checkout
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Review your tickets before payment
            </p>
          </div>
        </div>

        <div className="mt-9 grid gap-7 md:grid-cols-[1fr_300px]">
          <section className="space-y-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <Ticket
                  size={22}
                  className="text-[#FF6B53]"
                />
                <h2 className="text-xl font-bold text-[#08111D]">
                  Your Tickets
                </h2>
              </div>

              <div className="divide-y divide-slate-100">
                {items.map((item) => (
                  <div
                    key={item.ticketTypeId}
                    className="flex justify-between gap-4 py-5"
                  >
                    <div>
                      <p className="font-semibold text-[#08111D]">
                        {item.eventTitle}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {item.ticketName} × {item.quantity}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {item.city}
                      </p>

                      {item.isDemo && (
                        <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                          Demo ticket
                        </span>
                      )}
                    </div>

                    <span className="whitespace-nowrap font-bold text-[#08111D]">
                      {formatPrice(
                        Number(item.unitPrice) *
                          item.quantity,
                        item.currency
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            
          </section>

          <aside className="h-fit rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#08111D]">
              Payment Summary
            </h2>

            <div className="mt-6 flex justify-between text-sm text-slate-600">
              <span>Tickets</span>
              <span>{ticketCount}</span>
            </div>

            <div className="my-5 border-t border-slate-100" />

            {Object.entries(totals).map(
              ([currency, amount]) => (
                <div
                  key={currency}
                  className="mb-4 flex items-center justify-between gap-3"
                >
                  <span className="font-semibold">
                    Total
                  </span>

                  <span className="text-xl font-bold">
                    {formatPrice(amount, currency)}
                  </span>
                </div>
              )
            )}

          <DemoCheckoutButton />

            <Link
              href="/cart"
              className="mt-4 block text-center text-sm font-semibold text-[#FF6B53] hover:underline"
            >
              Edit Cart
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
