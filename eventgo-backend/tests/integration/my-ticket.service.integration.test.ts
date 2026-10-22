
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import dotenv from "dotenv";
import path from "node:path";
import { randomUUID } from "node:crypto";

import type { Pool } from "pg";

import type * as OrderService from "../../src/services/order.service";
import type * as CartService from "../../src/services/cart.service";
import type * as MyTicketService from "../../src/services/my-ticket.service";

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

process.env.DATABASE_URL = databaseUrl;

// ======================================
// TEST STATE
// ======================================

let pool: Pool;

let orderService: typeof OrderService;
let cartService: typeof CartService;
let myTicketService: typeof MyTicketService;

let userId: string | null = null;
let ticketTypeId: string;

// ======================================
// HELPERS
// ======================================

function currentUserId(): string {
  if (!userId) {
    throw new Error("Test user was not created");
  }

  return userId;
}

async function findAvailableDemoTicket(): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `
    SELECT tt.id
    FROM ticket_types tt
    JOIN events e ON e.id = tt.event_id
    WHERE e.is_demo = TRUE
      AND e.starts_at > NOW()
      AND e.ends_at > NOW()
      AND tt.quantity >= 2
      AND (
        SELECT COUNT(*)
        FROM tickets t
        JOIN orders o ON o.id = t.order_id
        WHERE t.ticket_type_id = tt.id
          AND o.status IN ('PAID', 'DEMO_PAID')
      ) <= tt.quantity - 2
    LIMIT 1
    `
  );

  const id = result.rows[0]?.id;

  if (!id) {
    throw new Error(
      "No available future demo ticket type " +
      "with a valid event end date was found."
    );
  }

  return id;
}

async function createTestUser(): Promise<void> {
  const id = randomUUID();

  await pool.query(
    `
    INSERT INTO users (
      id,
      name,
      email,
      password_hash,
      role
    )
    VALUES ($1, $2, $3, $4, $5)
    `,
    [
      id,
      "EventGo QR Integration Test",
      `integration-qr-${id}@example.invalid`,
      "not-a-real-password-hash",
      "user",
    ]
  );

  userId = id;
}

async function createTestOrder(
  quantity = 2
) {
  const id = currentUserId();

  for (let index = 0; index < quantity; index++) {
    await cartService.addToCart(
      id,
      ticketTypeId
    );
  }

  return orderService.createDemoOrder(id);
}

async function getCreatedGroupId(
  orderId: string
): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `
    SELECT id
    FROM ticket_groups
    WHERE order_id = $1
      AND ticket_type_id = $2
    `,
    [orderId, ticketTypeId]
  );

  expect(result.rows).toHaveLength(1);

  return result.rows[0].id;
}

// ======================================
// CLEANUP
// ======================================

async function cleanupTestData(): Promise<void> {
  if (!userId) {
    return;
  }

  const id = userId;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
      DELETE FROM tickets
      WHERE order_id IN (
        SELECT id
        FROM orders
        WHERE user_id = $1
      )
      `,
      [id]
    );

    await client.query(
      `
      DELETE FROM ticket_groups
      WHERE order_id IN (
        SELECT id
        FROM orders
        WHERE user_id = $1
      )
      `,
      [id]
    );

    await client.query(
      `
      DELETE FROM orders
      WHERE user_id = $1
      `,
      [id]
    );

    await client.query(
      `
      DELETE FROM cart_items
      WHERE cart_id IN (
        SELECT id
        FROM carts
        WHERE user_id = $1
      )
      `,
      [id]
    );

    await client.query(
      `
      DELETE FROM carts
      WHERE user_id = $1
      `,
      [id]
    );

    await client.query(
      `
      DELETE FROM users
      WHERE id = $1
        AND email = $2
      `,
      [
        id,
        `integration-qr-${id}@example.invalid`,
      ]
    );

    await client.query("COMMIT");

    userId = null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// ======================================
// SETUP
// ======================================

beforeAll(async () => {
  const database = await import(
    "../../src/db/database"
  );

  pool = database.pool;

  orderService = await import(
    "../../src/services/order.service"
  );

  cartService = await import(
    "../../src/services/cart.service"
  );

  myTicketService = await import(
    "../../src/services/my-ticket.service"
  );

  ticketTypeId = await findAvailableDemoTicket();
}, 60000);

beforeEach(async () => {
  await createTestUser();
}, 60000);

afterEach(async () => {
  await cleanupTestData();
}, 60000);

afterAll(async () => {
  if (pool) {
    try {
      await cleanupTestData();
    } finally {
      await pool.end();
    }
  }
}, 60000);

// ======================================
// MY TICKETS INTEGRATION TESTS
// ======================================

describe("My Ticket Service - Integration", () => {
  it("returns an empty list for a new user", async () => {
    const result = await myTicketService.getMyTickets(
      currentUserId()
    );

    expect(result).toEqual([]);
  }, 60000);

  it("returns the purchased ticket group", async () => {
    const id = currentUserId();

    const order = await createTestOrder(2);

    const result = await myTicketService.getMyTickets(id);

    expect(result).toHaveLength(1);

    const group = result[0];

    expect(group.orderId).toBe(order.orderId);
    expect(group.quantity).toBe(2);
    expect(group.ticketType).toBeTruthy();
    expect(group.eventTitle).toBeTruthy();
    expect(group.status).toBe("ACTIVE");
    expect(group.isDemo).toBe(true);

    expect(
      new Date(group.startsAt).getTime()
    ).toBeGreaterThan(Date.now());
  }, 60000);

  it("returns the same QR token stored for the group", async () => {
    const id = currentUserId();

    const order = await createTestOrder(2);

    const groupId = await getCreatedGroupId(
      order.orderId
    );

    const qrToken =
      await myTicketService.getMyTicketQrToken(
        id,
        groupId
      );

    expect(qrToken).toBeTruthy();
    expect(typeof qrToken).toBe("string");

    const stored = await pool.query<{
      qr_token: string;
      quantity: number;
    }>(
      `
      SELECT qr_token, quantity
      FROM ticket_groups
      WHERE id = $1
        AND order_id = $2
      `,
      [groupId, order.orderId]
    );

    expect(stored.rows).toHaveLength(1);

    expect(qrToken).toBe(
      stored.rows[0].qr_token
    );

    expect(stored.rows[0].quantity).toBe(2);

    expect(
      order.tickets.map(ticket => ticket.qrToken)
    ).toEqual([qrToken, qrToken]);
  }, 60000);

  it("prevents another user from viewing tickets and QR", async () => {
    const order = await createTestOrder(1);

    const groupId = await getCreatedGroupId(
      order.orderId
    );

    const anotherUserId = randomUUID();

    const tickets =
      await myTicketService.getMyTickets(
        anotherUserId
      );

    expect(tickets).toEqual([]);

    const qr =
      await myTicketService.getMyTicketQrToken(
        anotherUserId,
        groupId
      );

    expect(qr).toBeNull();
  }, 60000);

  it("does not expose the QR of an inactive group", async () => {
    const id = currentUserId();

    const order = await createTestOrder(1);

    const groupId = await getCreatedGroupId(
      order.orderId
    );

    // Verify the QR is available before deactivation.
    const activeQr =
      await myTicketService.getMyTicketQrToken(
        id,
        groupId
      );

    expect(activeQr).toBeTruthy();

    // Only update the temporary group created by this test.
    await pool.query(
      `
      UPDATE ticket_groups
      SET status = 'USED'
      WHERE id = $1
        AND order_id = $2
      `,
      [groupId, order.orderId]
    );

    const inactiveQr =
      await myTicketService.getMyTicketQrToken(
        id,
        groupId
      );

    expect(inactiveQr).toBeNull();
  }, 60000);

  it("returns null for an invalid group ID", async () => {
    const qr =
      await myTicketService.getMyTicketQrToken(
        currentUserId(),
        "invalid-group-id"
      );

    expect(qr).toBeNull();
  }, 60000);
});
