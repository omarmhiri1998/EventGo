
"use server";

import {
  getEventTicketTypes,
} from "@eventgo/backend/services/ticket-type.service";

export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  sold: number;
  available: number;
}

export async function getEventTicketTypesAction(
  eventId: string
): Promise<TicketType[]> {
  const rows = await getEventTicketTypes(eventId);

  return rows.map((row) => ({
    id: row.id,
    eventId: row.eventId,
    name: row.name,
    price: row.price,
    currency: row.currency,
    quantity: row.quantity,
    sold: row.sold,
    available: row.available,
  }));
}
