
"use server";

import { getSession } from "@/lib/auth";

import {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
} from "@eventgo/backend/services/cart.service";

export async function getCartAction() {
  const session = await getSession();

  if (!session) {
    return {
      authenticated: false as const,
      cart: null,
    };
  }

  const cart = await getCart(session.userId);

  return {
    authenticated: true as const,
    cart,
  };
}

export async function addToCartAction(
  ticketTypeId: string
) {
  const session = await getSession();

  if (!session) {
    throw new Error("Please log in to add tickets");
  }

  return addToCart(
    session.userId,
    ticketTypeId
  );
}

export async function updateCartQuantityAction(
  ticketTypeId: string,
  quantity: number
) {
  const session = await getSession();

  if (!session) {
    throw new Error("Please log in to update your cart");
  }

  return updateCartItemQuantity(
    session.userId,
    ticketTypeId,
    quantity
  );
}

export async function removeFromCartAction(
  ticketTypeId: string
) {
  const session = await getSession();

  if (!session) {
    throw new Error("Please log in to update your cart");
  }

  return removeFromCart(
    session.userId,
    ticketTypeId
  );
}
