
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  LoaderCircle,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";

import {
  getCartAction,
  removeFromCartAction,
  updateCartQuantityAction,
} from "@/app/actions/cart.actions";

type CartResult = Awaited<
  ReturnType<typeof getCartAction>
>;

type CartData = NonNullable<CartResult["cart"]>;
type CartItem = CartData["items"][number];

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
  }).format(amount);
}

export default function CartPage() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    try {
      const response = await getCartAction();
      setCart(response.cart);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your cart."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  function notifyCartChanged() {
    window.dispatchEvent(
      new CustomEvent("eventgo:cart-updated")
    );
  }

  async function changeQuantity(
    item: CartItem,
    nextQuantity: number
  ) {
    if (
      updatingId ||
      nextQuantity < 1 ||
      nextQuantity > 10 ||
      nextQuantity > item.available
    ) {
      return;
    }

    setUpdatingId(item.ticketTypeId);
    setError(null);

    try {
      const updated = await updateCartQuantityAction(
        item.ticketTypeId,
        nextQuantity
      );

      setCart(updated);
      notifyCartChanged();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update ticket quantity."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function removeItem(ticketTypeId: string) {
    if (updatingId) return;

    setUpdatingId(ticketTypeId);
    setError(null);

    try {
      const updated = await removeFromCartAction(
        ticketTypeId
      );

      setCart(updated);
      notifyCartChanged();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to remove ticket."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const items = cart?.items ?? [];

  const ticketCount = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const totals = items.reduce<Record<string, number>>(
    (acc, item) => {
      acc[item.currency] =
        (acc[item.currency] ?? 0) +
        Number(item.unitPrice) * item.quantity;

      return acc;
    },
    {}
  );

  const canCheckout =
    items.length > 0 &&
    items.every(
      (item) =>
        item.available >= item.quantity &&
        item.quantity >= 1 &&
        item.quantity <= 10 &&
        new Date(item.eventDate).getTime() > Date.now()
    );

  if (loading) {
    return (
      <main className="flex min-h-[65vh] items-center justify-center">
        <LoaderCircle
          className="animate-spin text-[#FF6B53]"
          size={36}
        />
      </main>
    );
  }

  return (
    <main className="min-h-[75vh] bg-[#FAF9F7] px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/explore"
          className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#FF6B53]"
        >
          <ArrowLeft size={17} />
          Continue exploring
        </Link>

        <div className="mb-9 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF0EA] text-[#FF6B53]">
            <ShoppingCart size={27} />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-[#08111D]">
              Your Cart
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {ticketCount} tickets in your cart
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
            <button
              type="button"
              onClick={() => void loadCart()}
              className="ml-3 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {items.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white px-6 py-20 text-center shadow-sm">
            <ShoppingCart
              size={54}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-5 text-xl font-bold text-[#08111D]">
              Your cart is empty
            </h2>

            <p className="mt-2 text-slate-500">
              Find an event and add your favorite tickets.
            </p>

            <Link
              href="/explore"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#FF6B53] px-6 py-3 font-semibold text-white hover:bg-[#F05B44]"
            >
              Explore Events
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            <section className="space-y-4">
              {items.map((item) => {
                const busy = updatingId !== null;
                const price = Number(item.unitPrice);

                return (
                  <article
                    key={item.ticketTypeId}
                    className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6"
                  >
                    <div className="flex flex-col justify-between gap-5 sm:flex-row">
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-[#FFF0EA] px-3 py-1 text-xs font-semibold capitalize text-[#D85640]">
                            {item.eventCategory}
                          </span>

                          {item.isDemo && (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                              Demo
                            </span>
                          )}
                        </div>

                        <h2 className="text-lg font-bold text-[#08111D]">
                          {item.eventTitle}
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                          {item.city}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {new Date(
                            item.eventDate
                          ).toLocaleString("de-DE", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>

                        <p className="mt-3 text-sm font-medium text-slate-700">
                          {item.ticketName}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {formatPrice(
                            price,
                            item.currency
                          )}{" "}
                          per ticket
                        </p>
                      </div>

                      <div className="flex flex-col items-start justify-between gap-4 sm:items-end">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void removeItem(item.ticketTypeId)
                          }
                          aria-label={`Remove ${item.eventTitle}`}
                          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 size={17} />
                          Remove
                        </button>

                        <div className="flex items-center rounded-xl border border-slate-200">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            disabled={
                              busy || item.quantity <= 1
                            }
                            onClick={() =>
                              void changeQuantity(
                                item,
                                item.quantity - 1
                              )
                            }
                            className="p-3 transition hover:bg-slate-100 disabled:opacity-30"
                          >
                            <Minus size={16} />
                          </button>

                          <span className="w-10 text-center text-sm font-bold tabular-nums">
                            {updatingId ===
                            item.ticketTypeId ? (
                              <LoaderCircle
                                size={16}
                                className="mx-auto animate-spin"
                              />
                            ) : (
                              item.quantity
                            )}
                          </span>

                          <button
                            type="button"
                            aria-label="Increase quantity"
                            disabled={
                              busy ||
                              item.quantity >= 10 ||
                              item.quantity >= item.available
                            }
                            onClick={() =>
                              void changeQuantity(
                                item,
                                item.quantity + 1
                              )
                            }
                            className="p-3 transition hover:bg-slate-100 disabled:opacity-30"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <p className="text-xl font-bold text-[#08111D]">
                          {formatPrice(
                            price * item.quantity,
                            item.currency
                          )}
                        </p>
                      </div>
                    </div>

                    {item.quantity > item.available && (
                      <p className="mt-4 text-sm font-medium text-red-600">
                        Only {item.available} tickets remain.
                        Reduce the quantity before checkout.
                      </p>
                    )}

                    {new Date(item.eventDate).getTime() <=
                      Date.now() && (
                      <p className="mt-4 text-sm font-medium text-red-600">
                        This event has already started.
                        Remove it before checkout.
                      </p>
                    )}
                  </article>
                );
              })}
            </section>

            <aside className="h-fit rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:sticky lg:top-24">
              <h2 className="text-xl font-bold text-[#08111D]">
                Order Summary
              </h2>

              <div className="mt-6 flex justify-between text-sm text-slate-600">
                <span>Tickets</span>
                <span className="font-semibold">
                  {ticketCount}
                </span>
              </div>

              <div className="my-5 border-t border-slate-100" />

              {Object.entries(totals).map(
                ([currency, amount]) => (
                  <div
                    key={currency}
                    className="mb-4 flex justify-between gap-3"
                  >
                    <span className="font-semibold text-[#08111D]">
                      Subtotal
                    </span>
                    <span className="text-xl font-bold text-[#08111D]">
                      {formatPrice(amount, currency)}
                    </span>
                  </div>
                )
              )}

              <Link
                href={canCheckout ? "/checkout" : "/cart"}
                aria-disabled={!canCheckout || updatingId !== null}
                onClick={(event) => {
                  if (!canCheckout || updatingId !== null) {
                    event.preventDefault();
                  }
                }}
                className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 font-bold text-white transition ${
                  canCheckout && updatingId === null
                    ? "bg-[#FF6B53] hover:bg-[#F05B44]"
                    : "cursor-not-allowed bg-slate-300"
                }`}
              >
                Proceed to Checkout
                <ArrowRight size={18} />
              </Link>

              <p className="mt-4 text-center text-xs leading-5 text-slate-500">
                Tickets and prices will be verified again
                before payment.
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
