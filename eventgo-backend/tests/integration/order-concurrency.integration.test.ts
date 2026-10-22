
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import dotenv from "dotenv";
import path from "node:path";
import { randomUUID } from "node:crypto";

import type { Pool } from "pg";
import type * as CartService from "../../src/services/cart.service";
import type * as OrderService from "../../src/services/order.service";

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

const databaseUrl = process.env.DATABASE_URL || parsed?.DATABASE_URL;

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
let cartService: typeof CartService;
let orderService: typeof OrderService;

const userIds: string[] = [];
const ticketTypeId = randomUUID();

let fixtureReady = false;

// ======================================
// TEST DATA
// ======================================

async function findDemoEvent(): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `
    SELECT id
    FROM events
    WHERE is_demo = TRUE
      AND starts_at > NOW() + INTERVAL '1 day'
    ORDER BY starts_at ASC
    LIMIT 1
    `
  );

  if (!result.rows[0]) {
    throw new Error(
      "No future demo event available for concurrency testing."
    );
  }

  return result.rows[0].id;
}

async function createTestUser(): Promise<string> {
  const userId = randomUUID();

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
      userId,
      "EventGo Concurrency Test",
      `concurrency-${userId}@example.invalid`,
      "not-a-real-password-hash",
      "user",
    ]
  );

  userIds.push(userId);

  return userId;
}

async function createTestTicketType(
  eventId: string
): Promise<void> {
  await pool.query(
    `
    INSERT INTO ticket_types (
      id,
      event_id,
      name,
      price,
      currency,
      quantity
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [
      ticketTypeId,
      eventId,
      `Concurrency Test ${ticketTypeId}`,
      10,
      "EUR",
      1,
    ]
  );
}

// ======================================
// CLEANUP
// ======================================

async function cleanup(): Promise<void> {
  if (!pool) {
    return;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Delete tickets created by the test.
    await client.query(
      `
      DELETE FROM tickets
      WHERE ticket_type_id = $1
      `,
      [ticketTypeId]
    );

    // Delete test QR groups.
    await client.query(
      `
      DELETE FROM ticket_groups
      WHERE ticket_type_id = $1
      `,
      [ticketTypeId]
    );

    // Delete only the test users' orders.
    await client.query(
      `
      DELETE FROM orders
      WHERE user_id = ANY($1::uuid[])
      `,
      [userIds]
    );

    // Delete test cart items.
    await client.query(
      `
      DELETE FROM cart_items
      WHERE cart_id IN (
        SELECT id
        FROM carts
        WHERE user_id = ANY($1::uuid[])
      )
      `,
      [userIds]
    );

    // Delete test carts.
    await client.query(
      `
      DELETE FROM carts
      WHERE user_id = ANY($1::uuid[])
      `,
      [userIds]
    );

    // Delete our temporary ticket type only.
    await client.query(
      `
      DELETE FROM ticket_types
      WHERE id = $1
      `,
      [ticketTypeId]
    );

    // Delete only test users with matching emails.
    for (const userId of userIds) {
      await client.query(
        `
        DELETE FROM users
        WHERE id = $1
          AND email = $2
        `,
        [
          userId,
          `concurrency-${userId}@example.invalid`,
        ]
      );
    }

    await client.query("COMMIT");
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

  cartService = await import(
    "../../src/services/cart.service"
  );

  orderService = await import(
    "../../src/services/order.service"
  );

  const eventId = await findDemoEvent();

  await createTestTicketType(eventId);

  const firstUser = await createTestUser();
  const secondUser = await createTestUser();

  // Both users add the only available ticket
  // before either one starts checkout.
  await cartService.addToCart(
    firstUser,
    ticketTypeId
  );

  await cartService.addToCart(
    secondUser,
    ticketTypeId
  );

  fixtureReady = true;
}, 120000);

afterAll(async () => {
  if (pool) {
    try {
      await cleanup();
    } finally {
      await pool.end();
    }
  }
}, 120000);

// ======================================
// CONCURRENCY TEST
// ======================================

describe("Order Concurrency - Integration", () => {
  it(
    "prevents overselling when two users buy the last ticket",
    async () => {
      expect(fixtureReady).toBe(true);
      expect(userIds).toHaveLength(2);

      const [firstUser, secondUser] = userIds;

      // Start both checkouts concurrently.
      const results = await Promise.allSettled([
        orderService.createDemoOrder(firstUser),
        orderService.createDemoOrder(secondUser),
      ]);

      const successful = results.filter(
        (result) => result.status === "fulfilled"
      );

      const failed = results.filter(
        (result) => result.status === "rejected"
      );

      // Only one purchase may succeed.
      expect(successful).toHaveLength(1);
      expect(failed).toHaveLength(1);

      const successfulOrder = successful[0];

      expect(successfulOrder.status).toBe("fulfilled");

      if (successfulOrder.status === "fulfilled") {
        expect(successfulOrder.value.status).toBe(
          "DEMO_PAID"
        );

        expect(
          successfulOrder.value.tickets
        ).toHaveLength(1);
      }

      // Verify the actual number of issued tickets.
      const ticketResult = await pool.query<{
        total: number;
      }>(
        `
        SELECT COUNT(*)::int AS total
        FROM tickets
        WHERE ticket_type_id = $1
        `,
        [ticketTypeId]
      );

      expect(ticketResult.rows[0].total).toBe(1);

      // Verify only one paid order exists.
      const orderResult = await pool.query<{
        total: number;
      }>(
        `
        SELECT COUNT(DISTINCT o.id)::int AS total
        FROM orders o
        JOIN tickets t ON t.order_id = o.id
        WHERE t.ticket_type_id = $1
          AND o.status = 'DEMO_PAID'
        `,
        [ticketTypeId]
      );

      expect(orderResult.rows[0].total).toBe(1);

      // Verify only one QR group exists.
      const groupsResult = await pool.query<{
        total: number;
      }>(
        `
        SELECT COUNT(*)::int AS total
        FROM ticket_groups
        WHERE ticket_type_id = $1
        `,
        [ticketTypeId]
      );

      expect(groupsResult.rows[0].total).toBe(1);

      // Verify no extra tickets were issued.
      const availability = await pool.query<{
        quantity: number;
        sold: number;
      }>(
        `
        SELECT
          tt.quantity,
          (
            SELECT COUNT(*)::int
            FROM tickets t
            JOIN orders o ON o.id = t.order_id
            WHERE t.ticket_type_id = tt.id
              AND o.status IN ('PAID', 'DEMO_PAID')
          ) AS sold
        FROM ticket_types tt
        WHERE tt.id = $1
        `,
        [ticketTypeId]
      );

      expect(availability.rows[0]).toEqual({
        quantity: 1,
        sold: 1,
      });
    },
    120000
  );
});

