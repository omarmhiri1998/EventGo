
import { pool } from "../db/database";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface MyTicket {
  id: string;
  orderId: string;
  eventId: string;
  eventTitle: string;
  category: string;
  city: string;
  startsAt: string;
  ticketType: string;
  quantity: number;
  status: string;
  isDemo: boolean;
}

interface MyTicketRow {
  id: string;
  order_id: string;
  event_id: string;
  event_title: string;
  category: string;
  city: string;
  starts_at: Date | string;
  ticket_type: string;
  quantity: number;
  status: string;
  is_demo: boolean;
}

export async function getMyTickets(
  userId: string
): Promise<MyTicket[]> {
  if (!UUID_PATTERN.test(userId)) {
    throw new Error("Invalid user ID");
  }

  const result = await pool.query<MyTicketRow>(
    `
    SELECT
      tg.id,
      tg.order_id,
      e.id AS event_id,
      e.title AS event_title,
      e.category,
      c.name AS city,
      e.starts_at,
      tt.name AS ticket_type,
      tg.quantity,
      tg.status,
      e.is_demo
    FROM ticket_groups tg
    JOIN orders o
      ON o.id = tg.order_id
    JOIN ticket_types tt
      ON tt.id = tg.ticket_type_id
    JOIN events e
      ON e.id = tt.event_id
    JOIN cities c
      ON c.id = e.city_id
    WHERE o.user_id = $1
      AND o.status IN ('PAID', 'DEMO_PAID')
    ORDER BY
      e.starts_at ASC,
      tg.created_at ASC,
      tg.id ASC
    `,
    [userId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    orderId: row.order_id,
    eventId: row.event_id,
    eventTitle: row.event_title,
    category: row.category,
    city: row.city,
    startsAt: new Date(row.starts_at).toISOString(),
    ticketType: row.ticket_type,
    quantity: row.quantity,
    status: row.status,
    isDemo: row.is_demo,
  }));
}

export async function getMyTicketQrToken(
  userId: string,
  groupId: string
): Promise<string | null> {
  if (
    !UUID_PATTERN.test(userId) ||
    !UUID_PATTERN.test(groupId)
  ) {
    return null;
  }

  const result = await pool.query<{
    qr_token: string;
  }>(
    `
    SELECT tg.qr_token
    FROM ticket_groups tg
    JOIN orders o
      ON o.id = tg.order_id
    WHERE tg.id = $1
      AND o.user_id = $2
      AND o.status IN ('PAID', 'DEMO_PAID')
      AND tg.status = 'ACTIVE'
      AND EXISTS (
        SELECT 1
        FROM ticket_types tt
        JOIN events e
          ON e.id = tt.event_id
        WHERE tt.id = tg.ticket_type_id
          AND e.ends_at > NOW()
      )
    LIMIT 1
    `,
    [groupId, userId]
  );

  return result.rows[0]?.qr_token ?? null;
}
