
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

let userId: string | null = null;
let ticketTypeId: string;

// ======================================
// TEST DATA HELPERS
// ======================================

function currentUserId(): string {
  if (!userId) {
    throw new Error("Test user was not created");
  }

  return userId;
}

async function findAvailableDemoTicket(): Promise<string> {
  const result = await pool.query<{
    id: string;
  }>(
    `
    SELECT tt.id
    FROM ticket_types tt
    JOIN events e ON e.id = tt.event_id
    WHERE e.is_demo = TRUE
      AND e.starts_at > NOW()
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
      "No future demo ticket type with at least " +
      "2 available tickets was found."
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
      "EventGo Order Integration Test",
      `integration-order-${id}@example.invalid`,
      "not-a-real-password-hash",
      "user",
    ]
  );

  userId = id;
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

    // Delete issued tickets first.
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

    // Delete ticket groups and their QR tokens.
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

    // Delete test orders.
    await client.query(
      `
      DELETE FROM orders
      WHERE user_id = $1
      `,
      [id]
    );

    // Delete cart items.
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

    // Delete carts.
    await client.query(
      `
      DELETE FROM carts
      WHERE user_id = $1
      `,
      [id]
    );

    // Delete only the exact test user.
    await client.query(
      `
      DELETE FROM users
      WHERE id = $1
        AND email = $2
      `,
      [
        id,
        `integration-order-${id}@example.invalid`,
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
// ORDER INTEGRATION TESTS
// ======================================

describe("Order Service - Integration", () => {
  it("rejects checkout with an empty cart", async () => {
    await expect(
      orderService.createDemoOrder(currentUserId())
    ).rejects.toThrow("Your cart is empty");

    const result = await pool.query<{
      total: number;
    }>(
      `
      SELECT COUNT(*)::int AS total
      FROM orders
      WHERE user_id = $1
      `,
      [currentUserId()]
    );

    expect(result.rows[0].total).toBe(0);
  }, 60000);

  it("creates exactly two tickets with one group QR", async () => {
    const id = currentUserId();

    // Add the same ticket type twice.
    await cartService.addToCart(id, ticketTypeId);
    await cartService.addToCart(id, ticketTypeId);

    const cartBefore = await cartService.getCart(id);

    expect(cartBefore.items).toHaveLength(1);
    expect(cartBefore.items[0].quantity).toBe(2);

    // Perform a real checkout.
    const order = await orderService.createDemoOrder(id);

    expect(order.status).toBe("DEMO_PAID");
    expect(order.orderId).toBeTruthy();
    expect(order.tickets).toHaveLength(2);

    // The two tickets must share one QR.
    const qrTokens = new Set(
      order.tickets.map((ticket) => ticket.qrToken)
    );

    expect(qrTokens.size).toBe(1);

    const qrToken = order.tickets[0].qrToken;

    expect(typeof qrToken).toBe("string");
    expect(qrToken.length).toBeGreaterThan(0);

    // Verify the order was stored.
    const savedOrder = await pool.query<{
      status: string;
      user_id: string;
    }>(
      `
      SELECT status, user_id
      FROM orders
      WHERE id = $1
      `,
      [order.orderId]
    );

    expect(savedOrder.rows[0]).toEqual({
      status: "DEMO_PAID",
      user_id: id,
    });

    // Verify exactly two tickets were issued.
    const tickets = await pool.query<{
      total: number;
    }>(
      `
      SELECT COUNT(*)::int AS total
      FROM tickets
      WHERE order_id = $1
      `,
      [order.orderId]
    );

    expect(tickets.rows[0].total).toBe(2);

    // Verify there is only one ticket group.
    const groups = await pool.query<{
      id: string;
      quantity: number;
      qr_token: string;
      status: string;
    }>(
      `
      SELECT
        id,
        quantity,
        qr_token,
        status
      FROM ticket_groups
      WHERE order_id = $1
      `,
      [order.orderId]
    );

    expect(groups.rows).toHaveLength(1);
    expect(groups.rows[0].quantity).toBe(2);
    expect(groups.rows[0].qr_token).toBe(qrToken);
    expect(groups.rows[0].status).toBe("ACTIVE");

    // A successful checkout must close the cart.
    const cartAfter = await cartService.getCart(id);

    expect(cartAfter).toEqual({
      id: null,
      items: [],
    });

    // The owner must be able to read the order.
    const ownerOrder =
      await orderService.getDemoOrderForUser(
        id,
        order.orderId
      );

    expect(ownerOrder).not.toBeNull();
    expect(ownerOrder?.ticketCount).toBe(2);
  }, 60000);

  it("prevents another user from reading an order", async () => {
    const id = currentUserId();

    await cartService.addToCart(id, ticketTypeId);

    const order = await orderService.createDemoOrder(id);

    // A different valid UUID represents another user.
    const anotherUserId = randomUUID();

    const result =
      await orderService.getDemoOrderForUser(
        anotherUserId,
        order.orderId
      );

    expect(result).toBeNull();

    // Verify the real owner still has access.
    const ownerResult =
      await orderService.getDemoOrderForUser(
        id,
        order.orderId
      );

    expect(ownerResult).not.toBeNull();
  }, 60000);
});
