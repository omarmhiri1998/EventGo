"use client";

import { useQuery } from "@tanstack/react-query";

import { getCartAction } from "@/app/actions/cart.actions";
import { useCurrentUserId } from "@/app/providers";

export function cartQueryKey(userId: string) {
  return ["cart", userId] as const;
}

export function useCart() {
  const userId = useCurrentUserId();

  return useQuery({
    queryKey: cartQueryKey(userId),
    queryFn: () => getCartAction(),
    staleTime: 0,
  });
}