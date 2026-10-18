
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import {
  getCartAction,
} from "@/app/actions/cart.actions";

export function FloatingCart() {
  const [count, setCount] = useState(0);

  const refreshCart = useCallback(async () => {
    try {
      const result = await getCartAction();

      const total =
        result.cart?.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        ) ?? 0;

      setCount(total);
    } catch (error) {
      console.error("Unable to load cart:", error);
    }
  }, []);

  useEffect(() => {
    void refreshCart();

    window.addEventListener(
      "eventgo:cart-updated",
      refreshCart
    );

    return () => {
      window.removeEventListener(
        "eventgo:cart-updated",
        refreshCart
      );
    };
  }, [refreshCart]);

  return (
    <Link
      href="/cart"
      aria-label={`Open cart with ${count} tickets`}
      className="fixed bottom-6 right-6 z-[900] flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[#FF6B53] text-white shadow-[0_0_24px_rgba(255,107,83,0.65)] transition-all duration-300 hover:scale-110 hover:shadow-[0_0_38px_rgba(255,107,83,0.85)]"
    >
      <ShoppingCart size={28} strokeWidth={2.2} />

      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-7 min-w-7 items-center justify-center rounded-full border-[3px] border-white bg-[#08111D] px-1 text-xs font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
