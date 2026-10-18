
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Wallet,
  Landmark,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";

import {
  confirmDemoOrderAction,
} from "@/app/actions/checkout.actions";

type PaymentMethod = "card" | "paypal" | "bank";

const paymentMethods = [
  {
    id: "card",
    label: "Credit / Debit Card",
    Icon: CreditCard,
  },
  {
    id: "paypal",
    label: "PayPal",
    Icon: Wallet,
  },
  {
    id: "bank",
    label: "Bank Transfer",
    Icon: Landmark,
  },
] as const;

export function DemoCheckoutButton() {
  const router = useRouter();

  const [method, setMethod] =
    useState<PaymentMethod>("card");

  const [loading, setLoading] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function handleConfirm() {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const order = await confirmDemoOrderAction();

      window.dispatchEvent(
        new CustomEvent("eventgo:cart-updated")
      );

      router.push(
        `/checkout/success?orderId=${encodeURIComponent(
          order.orderId
        )}`
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete demo checkout."
      );

      setLoading(false);
    }
  }

  return (
    <div className="mt-6 space-y-5">
      <div>
        <h3 className="mb-4 text-lg font-bold text-[#08111D]">
          Payment Method
        </h3>

        <div className="space-y-3">
          {paymentMethods.map(
            ({ id, label, Icon }) => {
              const selected = method === id;

              return (
                <label
                  key={id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                    selected
                      ? "border-[#FF6B53] bg-[#FFF5F1]"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    value={id}
                    checked={selected}
                    onChange={() => setMethod(id)}
                    disabled={loading}
                    className="accent-[#FF6B53]"
                  />

                  <Icon
                    size={22}
                    className="text-slate-700"
                  />

                  <span className="flex-1 text-sm font-semibold text-[#08111D]">
                    {label}
                  </span>

                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                    Demo
                  </span>
                </label>
              );
            }
          )}
        </div>
      </div>

     

      <button
        type="button"
        disabled={loading}
        onClick={handleConfirm}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B53] px-5 py-4 font-bold text-white transition hover:bg-[#F05B44] disabled:cursor-wait disabled:opacity-60"
      >
        {loading && (
          <LoaderCircle
            size={19}
            className="animate-spin"
          />
        )}

        {loading
          ? "Processing Demo Order..."
          : "Confirm Demo Order"}
      </button>

      {error && (
        <p
          role="alert"
          className="text-sm text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}
