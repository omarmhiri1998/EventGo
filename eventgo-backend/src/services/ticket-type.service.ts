
import { pool } from "../db/database";

export interface AdminTicketType {
  id: string;
  eventId: string;
  eventTitle: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  sold: number;
  available: number;
}

export interface TicketTypesResult {
  ticketTypes: AdminTicketType[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface EventTicketType {
  id: string;
  eventId: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  sold: number;
  available: number;
}

export async function getAdminTicketTypes(
  page = 1,
  search = ""
): Promise<TicketTypesResult> {
  const pageSize = 20;
  const keyword = search.trim();

  if (!Number.isSafeInteger(page) || page < 1) {
    throw new Error("Invalid page.");
  }

  if (keyword.length > 200) {
    throw new Error("Search is too long.");
  }

  const offset = (page - 1) * pageSize;

  if (!Number.isSafeInteger(offset)) {
    throw new Error("Invalid page.");
  }

  const values = [keyword, `%${keyword}%`];

  const filter = `
    WHERE (
      $1 = ''
      OR tt.name ILIKE $2
      OR e.title ILIKE $2
    )
  `;

  const [dataResult, countResult] = await Promise.all([
    pool.query<{
      id: string;
      event_id: string;
      event_title: string;
      name: string;
      price: string;
      currency: string;
      quantity: number;
      sold: string;
    }>(
      `
      WITH selected_types AS (
        SELECT
          tt.id,
          tt.event_id,
          e.title AS event_title,
          tt.name,
          tt.price,
          tt.currency,
          tt.quantity
        FROM ticket_types tt
        JOIN events e ON e.id = tt.event_id
        ${filter}
        ORDER BY e.title, tt.name, tt.id
        LIMIT $3 OFFSET $4
      )
      SELECT
        st.*,
        (
          SELECT COUNT(*)
          FROM tickets t
          JOIN orders o ON o.id = t.order_id
          WHERE t.ticket_type_id = st.id
            AND o.status IN ('PAID', 'DEMO_PAID')
        )::text AS sold
      FROM selected_types st
      ORDER BY st.event_title, st.name, st.id
      `,
      [...values, pageSize, offset]
    ),

    pool.query<{ total: string }>(
      `
      SELECT COUNT(*)::text AS total
      FROM ticket_types tt
      JOIN events e ON e.id = tt.event_id
      ${filter}
      `,
      values
    ),
  ]);

  const total = Number(countResult.rows[0].total);

  return {
    ticketTypes: dataResult.rows.map((row) => {
      const sold = Number(row.sold);

      return {
        id: row.id,
        eventId: row.event_id,
        eventTitle: row.event_title,
        name: row.name,
        price: Number(row.price),
        currency: row.currency,
        quantity: row.quantity,
        sold,
        available: Math.max(0, row.quantity - sold),
      };
    }),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getEventTicketTypes(
  eventId: string
): Promise<EventTicketType[]> {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(eventId)) {
    throw new Error("Invalid event ID");
  }

  const result = await pool.query<{
    id: string;
    event_id: string;
    name: string;
    price: string;
    currency: string;
    quantity: number;
    sold: string;
  }>(
    `
    SELECT
      tt.id,
      tt.event_id,
      tt.name,
      tt.price::text AS price,
      tt.currency,
      tt.quantity,
      (
        SELECT COUNT(*)
        FROM tickets t
        JOIN orders o ON o.id = t.order_id
        WHERE t.ticket_type_id = tt.id
          AND o.status IN ('PAID', 'DEMO_PAID')
      )::text AS sold
    FROM ticket_types tt
    JOIN events e ON e.id = tt.event_id
    WHERE tt.event_id = $1
      AND e.starts_at >= NOW()
    ORDER BY tt.price ASC, tt.name ASC
    `,
    [eventId]
  );

  return result.rows.map((row) => {
    const sold = Number(row.sold);

    return {
      id: row.id,
      eventId: row.event_id,
      name: row.name,
      price: Number(row.price),
      currency: row.currency,
      quantity: row.quantity,
      sold,
      available: Math.max(0, row.quantity - sold),
    };
  });
}
