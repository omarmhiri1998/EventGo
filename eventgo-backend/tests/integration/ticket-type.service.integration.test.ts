
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import dotenv from "dotenv";
import path from "node:path";
import { Pool } from "pg";

import type * as TicketTypeService from "../../src/services/ticket-type.service";

// ======================================
// DATABASE CONFIGURATION
// ======================================

const envPath = path.resolve(
  process.cwd(),
  "eventgo-backend/.env.local"
);

const parsed = dotenv.config({
  path: envPath,
}).parsed;

const databaseUrl = parsed?.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing from eventgo-backend/.env.local"
  );
}

// Must be set before importing the service.
process.env.DATABASE_URL = databaseUrl;

const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
  connectionTimeoutMillis: 10000,
});

let service: typeof TicketTypeService;

// ======================================
// SETUP
// ======================================

beforeAll(async () => {
  service = await import(
    "../../src/services/ticket-type.service"
  );
});

afterAll(async () => {
  await pool.end();
});

// ======================================
// HELPERS
// ======================================

function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

// ======================================
// DATABASE SCHEMA
// ======================================

describe("Ticket Types Integration - Database", () => {
  it("verifies required tables exist", async () => {
    const result = await pool.query<{
      table_name: string;
    }>(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])
      `,
      [[
        "ticket_types",
        "tickets",
        "orders",
        "events",
      ]]
    );

    const names = result.rows.map(
      row => row.table_name
    );

    expect(names).toEqual(
      expect.arrayContaining([
        "ticket_types",
        "tickets",
        "orders",
        "events",
      ])
    );
  });

  it("can query ticket types and events", async () => {
    const result = await pool.query(
      `
      SELECT
        tt.id,
        tt.name,
        e.title
      FROM ticket_types tt
      JOIN events e ON e.id = tt.event_id
      LIMIT 5
      `
    );

    expect(Array.isArray(result.rows)).toBe(true);
  });
});

// ======================================
// ADMIN TICKET TYPES
// ======================================

describe("getAdminTicketTypes - Integration", () => {
  it("returns a valid paginated result", async () => {
    const result = await service.getAdminTicketTypes();

    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.totalPages).toBe(
      Math.ceil(result.total / 20)
    );

    expect(Array.isArray(result.ticketTypes)).toBe(true);
    expect(result.ticketTypes.length).toBeLessThanOrEqual(20);
  });

  it("maps PostgreSQL values correctly", async () => {
    const result = await service.getAdminTicketTypes();

    for (const ticket of result.ticketTypes) {
      expect(isUUID(ticket.id)).toBe(true);
      expect(isUUID(ticket.eventId)).toBe(true);

      expect(typeof ticket.name).toBe("string");
      expect(typeof ticket.eventTitle).toBe("string");
      expect(typeof ticket.price).toBe("number");
      expect(typeof ticket.quantity).toBe("number");
      expect(typeof ticket.sold).toBe("number");
      expect(typeof ticket.available).toBe("number");

      expect(ticket.available).toBe(
        Math.max(0, ticket.quantity - ticket.sold)
      );
    }
  });

  it("supports pagination without duplicates", async () => {
    const first = await service.getAdminTicketTypes(1);
    const second = await service.getAdminTicketTypes(2);

    const firstIds = new Set(
      first.ticketTypes.map(ticket => ticket.id)
    );

    for (const ticket of second.ticketTypes) {
      expect(firstIds.has(ticket.id)).toBe(false);
    }
  });

  it("filters ticket types by search keyword", async () => {
    const keyword = "Standard";

    const result = await service.getAdminTicketTypes(
      1,
      keyword
    );

    for (const ticket of result.ticketTypes) {
      const searchable = [
        ticket.name,
        ticket.eventTitle,
      ].join(" ").toLowerCase();

      expect(searchable).toContain(
        keyword.toLowerCase()
      );
    }
  });

  it("returns no results for an unknown search", async () => {
    const result = await service.getAdminTicketTypes(
      1,
      "EventGoUnknownTicketTypeXYZ12345"
    );

    expect(result.ticketTypes).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("calculates sold tickets from paid orders", async () => {
    const result = await service.getAdminTicketTypes();

    for (const ticket of result.ticketTypes.slice(0, 5)) {
      const soldResult = await pool.query<{
        sold: string;
      }>(
        `
        SELECT COUNT(*)::text AS sold
        FROM tickets t
        JOIN orders o ON o.id = t.order_id
        WHERE t.ticket_type_id = $1
          AND o.status IN ('PAID', 'DEMO_PAID')
        `,
        [ticket.id]
      );

      expect(ticket.sold).toBe(
        Number(soldResult.rows[0].sold)
      );
    }
  });
});

// ======================================
// EVENT TICKET TYPES
// ======================================

describe("getEventTicketTypes - Integration", () => {
  it("rejects invalid event IDs", async () => {
    await expect(
      service.getEventTicketTypes("invalid-id")
    ).rejects.toThrow("Invalid event ID");
  });

  it("returns no tickets for a nonexistent event", async () => {
    const result = await service.getEventTicketTypes(
      "00000000-0000-4000-8000-000000000000"
    );

    expect(result).toEqual([]);
  });

  it("returns ticket types for an existing event", async () => {
    const eventResult = await pool.query<{
      id: string;
    }>(
      `
      SELECT id
      FROM events
      WHERE starts_at >= NOW()
      ORDER BY starts_at ASC
      LIMIT 1
      `
    );

    const event = eventResult.rows[0];

    if (!event) {
      return;
    }

    const result = await service.getEventTicketTypes(
      event.id
    );

    for (const ticket of result) {
      expect(ticket.eventId).toBe(event.id);
      expect(isUUID(ticket.id)).toBe(true);

      expect(ticket.available).toBe(
        Math.max(0, ticket.quantity - ticket.sold)
      );
    }
  });

  it("does not return tickets from past events", async () => {
    const pastEvent = await pool.query<{
      id: string;
    }>(
      `
      SELECT id
      FROM events
      WHERE starts_at < NOW()
      ORDER BY starts_at DESC
      LIMIT 1
      `
    );

    if (!pastEvent.rows[0]) {
      return;
    }

    const result = await service.getEventTicketTypes(
      pastEvent.rows[0].id
    );

    expect(result).toEqual([]);
  });

  it("returns tickets sorted by price", async () => {
    const eventResult = await pool.query<{
      id: string;
    }>(
      `
      SELECT e.id
      FROM events e
      JOIN ticket_types tt ON tt.event_id = e.id
      WHERE e.starts_at >= NOW()
      GROUP BY e.id
      HAVING COUNT(tt.id) >= 2
      LIMIT 1
      `
    );

    const event = eventResult.rows[0];

    if (!event) {
      return;
    }

    const tickets = await service.getEventTicketTypes(
      event.id
    );

    for (let index = 1; index < tickets.length; index++) {
      expect(
        tickets[index].price
      ).toBeGreaterThanOrEqual(
        tickets[index - 1].price
      );
    }
  });
});

