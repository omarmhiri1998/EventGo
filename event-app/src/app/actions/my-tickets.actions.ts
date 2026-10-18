
"use server";

import { getSession } from "@/lib/auth";

import {
  getMyTickets,
  getMyTicketQrToken,
} from "@eventgo/backend/services/my-ticket.service";

export async function getMyTicketsAction() {
  const session = await getSession();

  if (!session) {
    throw new Error("Authentication required");
  }

  return getMyTickets(session.userId);
}

export async function getMyTicketQrAction(
  groupId: string
) {
  const session = await getSession();

  if (!session) {
    throw new Error("Authentication required");
  }

  const token = await getMyTicketQrToken(
    session.userId,
    groupId
  );

  if (!token) {
    throw new Error(
      "Ticket unavailable or already used"
    );
  }

  return token;
}
