
import { pool } from "../db/database";

export interface Participant {
  ticket_id: string;
  participant_name: string | null;
  email: string;
  event_id: string;
  event_title: string;
  ticket_type: string;
  ticket_status: string;
  order_status: string;
  purchased_at: string | null;
}

export interface ParticipantsResult {
  participants: Participant[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  totalParticipants: number;
  totalTickets: number;
  eventsWithParticipants: number;
}

export async function getParticipants(
  page = 1,
  search = "",
  eventId = ""
): Promise<ParticipantsResult> {
  const pageSize = 20;

  if (!Number.isSafeInteger(page) || page < 1) {
    throw new Error("Invalid page.");
  }

  const keyword = search.trim();

  if (keyword.length > 200) {
    throw new Error("Search is too long.");
  }

  if (
    eventId &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId)
  ) {
    throw new Error("Invalid event ID.");
  }

  const offset = (page - 1) * pageSize;

  if (!Number.isSafeInteger(offset)) {
    throw new Error("Invalid page.");
  }

  const filters = `
    WHERE (
      $1 = ''
      OR u.name ILIKE $2
      OR u.email ILIKE $2
      OR e.title ILIKE $2
    )
    AND (
      $3::uuid IS NULL
      OR e.id = $3::uuid
    )
  `;

  const values = [
    keyword,
    `%${keyword}%`,
    eventId || null,
  ];

  const joins = `
    FROM tickets t
    JOIN orders o ON o.id = t.order_id
    JOIN users u ON u.id = o.user_id
    JOIN ticket_types tt ON tt.id = t.ticket_type_id
    JOIN events e ON e.id = tt.event_id
  `;

  const [countResult, dataResult, statsResult] =
    await Promise.all([
      pool.query<{ total: string }>(
        `
        SELECT COUNT(*) AS total
        ${joins}
        ${filters}
        `,
        values
      ),

      pool.query<Participant>(
        `
        SELECT
          t.id AS ticket_id,
          u.name AS participant_name,
          u.email,
          e.id AS event_id,
          e.title AS event_title,
          tt.name AS ticket_type,
          t.status AS ticket_status,
          o.status AS order_status,
          o.created_at AS purchased_at
        ${joins}
        ${filters}
        ORDER BY
          o.created_at DESC NULLS LAST,
          t.id DESC
        LIMIT $4 OFFSET $5
        `,
        [...values, pageSize, offset]
      ),

      pool.query<{
        total_participants: string;
        total_tickets: string;
        events_with_participants: string;
      }>(
        `
        SELECT
          COUNT(DISTINCT u.id) AS total_participants,
          COUNT(*) AS total_tickets,
          COUNT(DISTINCT e.id) AS events_with_participants
        ${joins}
        `
      ),
    ]);

  const total = Number(countResult.rows[0].total);
  const stats = statsResult.rows[0];

  return {
    participants: dataResult.rows.map((row) => ({
      ...row,
      purchased_at: row.purchased_at
        ? new Date(row.purchased_at).toISOString()
        : null,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    totalParticipants: Number(stats.total_participants),
    totalTickets: Number(stats.total_tickets),
    eventsWithParticipants: Number(
      stats.events_with_participants
    ),
  };
}

export async function getParticipantEvents() {
  const result = await pool.query<{
    id: string;
    title: string;
  }>(
    `
    SELECT DISTINCT
      e.id,
      e.title
    FROM events e
    JOIN ticket_types tt ON tt.event_id = e.id
    JOIN tickets t ON t.ticket_type_id = tt.id
    ORDER BY e.title, e.id
    `
  );

  return result.rows;
}
