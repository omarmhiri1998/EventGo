"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useCurrentUserId } from "@/app/providers";
import { cartQueryKey, useCart } from "@/hooks/useCart";

export function FloatingCart() {
  const userId = useCurrentUserId();
  const queryClient = useQueryClient();

  const { data } = useCart();

  const count =
    data?.cart?.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    ) ?? 0;

  useEffect(() => {
    async function refreshCart() {
      try {
        const queryKey = cartQueryKey(userId);

        await queryClient.cancelQueries({
          queryKey,
          exact: true,
        });

        await queryClient.invalidateQueries({
          queryKey,
          exact: true,
        });
      } catch (error) {
        console.error("Unable to refresh cart:", error);
      }
    }

    function handleCartUpdated() {
      void refreshCart();
    }

    window.addEventListener(
      "eventgo:cart-updated",
      handleCartUpdated
    );

    return () => {
      window.removeEventListener(
        "eventgo:cart-updated",
        handleCartUpdated
      );
    };
  }, [queryClient, userId]);

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