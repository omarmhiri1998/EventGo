
"use server";

import { getSession } from "@/lib/auth";

import {
  createDemoOrder,
} from "@eventgo/backend/services/order.service";

export async function confirmDemoOrderAction() {
  const session = await getSession();

  if (!session) {
    throw new Error("Please log in first");
  }

  return createDemoOrder(session.userId);
}
