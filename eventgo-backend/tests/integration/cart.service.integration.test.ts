
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
// SHARED TEST STATE
// ======================================

let pool: Pool;
let service: typeof CartService;

let userId: string | null = null;
let ticketTypeId: string;

// ======================================
// FIXTURE HELPERS
// ======================================

async function findAvailableTicketType(): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `
    SELECT tt.id
    FROM ticket_types tt
    JOIN events e ON e.id = tt.event_id
    WHERE e.starts_at > NOW()
      AND tt.quantity - (
        SELECT COUNT(*)::integer
        FROM tickets t
        JOIN orders o ON o.id = t.order_id
        WHERE t.ticket_type_id = tt.id
          AND o.status IN ('PAID', 'DEMO_PAID')
      ) >= 3
    ORDER BY e.starts_at ASC, tt.id ASC
    LIMIT 1
    `
  );

  if (!result.rows[0]) {
    throw new Error(
      "Integration test requires a future event " +
      "with at least 3 available tickets."
    );
  }

  return result.rows[0].id;
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
      "EventGo Integration Test",
      `integration-${id}@example.invalid`,
      "not-a-real-password-hash",
      "user",
    ]
  );

  userId = id;
}

async function cleanupTestUser(): Promise<void> {
  if (!userId) {
    return;
  }

  const id = userId;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

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
      [id, `integration-${id}@example.invalid`]
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

function testUserId(): string {
  if (!userId) {
    throw new Error("Test user was not created");
  }

  return userId;
}

// ======================================
// SETUP
// ======================================

beforeAll(async () => {
  // Import after DATABASE_URL has been configured.
  const database = await import(
    "../../src/db/database"
  );

  pool = database.pool;

  service = await import(
    "../../src/services/cart.service"
  );

  ticketTypeId = await findAvailableTicketType();
});

beforeEach(async () => {
  await createTestUser();
});

afterEach(async () => {
  if (pool) {
    await cleanupTestUser();
  }
});

afterAll(async () => {
  if (pool) {
    try {
      await cleanupTestUser();
    } finally {
      await pool.end();
    }
  }
});

// ======================================
// GET CART
// ======================================

describe("getCart - Integration", () => {
  it("returns an empty cart for a new user", async () => {
    const result = await service.getCart(
      testUserId()
    );

    expect(result).toEqual({
      id: null,
      items: [],
    });
  });

  it("rejects invalid user IDs", async () => {
    await expect(
      service.getCart("invalid-user")
    ).rejects.toThrow("Invalid user ID");
  });
});

// ======================================
// ADD TO CART
// ======================================

describe("addToCart - Integration", () => {
  it("creates a cart and adds one ticket", async () => {
    const cart = await service.addToCart(
      testUserId(),
      ticketTypeId
    );

    expect(cart.id).toBeTruthy();
    expect(cart.items).toHaveLength(1);

    expect(cart.items[0].ticketTypeId).toBe(
      ticketTypeId
    );

    expect(cart.items[0].quantity).toBe(1);
    expect(cart.items[0].available).toBeGreaterThanOrEqual(3);

    const result = await pool.query<{
      quantity: number;
    }>(
      `
      SELECT ci.quantity
      FROM cart_items ci
      JOIN carts c ON c.id = ci.cart_id
      WHERE c.user_id = $1
        AND c.status = 'ACTIVE'
        AND ci.ticket_type_id = $2
      `,
      [testUserId(), ticketTypeId]
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].quantity).toBe(1);
  });

  it("increases quantity when adding the same ticket", async () => {
    await service.addToCart(
      testUserId(),
      ticketTypeId
    );

    const cart = await service.addToCart(
      testUserId(),
      ticketTypeId
    );

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(2);
  });

  it("rejects an invalid ticket type ID", async () => {
    await expect(
      service.addToCart(
        testUserId(),
        "invalid-ticket"
      )
    ).rejects.toThrow("Invalid ticket type ID");
  });

  it("rejects a nonexistent ticket type", async () => {
    await expect(
      service.addToCart(
        testUserId(),
        "00000000-0000-4000-8000-000000000000"
      )
    ).rejects.toThrow(
      "Ticket type is unavailable"
    );

    // The failed transaction must leave no active cart.
    const cart = await service.getCart(
      testUserId()
    );

    expect(cart).toEqual({
      id: null,
      items: [],
    });
  });
});

// ======================================
// UPDATE CART QUANTITY
// ======================================

describe("updateCartItemQuantity - Integration", () => {
  it("updates an existing cart item", async () => {
    await service.addToCart(
      testUserId(),
      ticketTypeId
    );

    const result =
      await service.updateCartItemQuantity(
        testUserId(),
        ticketTypeId,
        3
      );

    expect(result.items).toHaveLength(1);
    expect(result.items[0].quantity).toBe(3);
  });

  it("rejects invalid quantities", async () => {
    await expect(
      service.updateCartItemQuantity(
        testUserId(),
        ticketTypeId,
        0
      )
    ).rejects.toThrow(
      "Invalid ticket quantity"
    );

    await expect(
      service.updateCartItemQuantity(
        testUserId(),
        ticketTypeId,
        11
      )
    ).rejects.toThrow(
      "Invalid ticket quantity"
    );
  });

  it("does not update a missing cart", async () => {
    await expect(
      service.updateCartItemQuantity(
        testUserId(),
        ticketTypeId,
        2
      )
    ).rejects.toThrow("Cart not found");
  });

  it("rolls back when a cart item does not exist", async () => {
    await service.addToCart(
      testUserId(),
      ticketTypeId
    );

    const nonexistentTicketType =
      "00000000-0000-4000-8000-000000000000";

    await expect(
      service.updateCartItemQuantity(
        testUserId(),
        nonexistentTicketType,
        2
      )
    ).rejects.toThrow(
      "Ticket type is unavailable"
    );

    const cart = await service.getCart(
      testUserId()
    );

    expect(cart.items[0].quantity).toBe(1);
  });
});

// ======================================
// REMOVE FROM CART
// ======================================

describe("removeFromCart - Integration", () => {
  it("removes an existing ticket", async () => {
    await service.addToCart(
      testUserId(),
      ticketTypeId
    );

    const cart = await service.removeFromCart(
      testUserId(),
      ticketTypeId
    );

    expect(cart.items).toEqual([]);

    const result = await pool.query<{
      total: number;
    }>(
      `
      SELECT COUNT(*)::integer AS total
      FROM cart_items ci
      JOIN carts c ON c.id = ci.cart_id
      WHERE c.user_id = $1
      `,
      [testUserId()]
    );

    expect(result.rows[0].total).toBe(0);
  });

  it("does not fail when removing from an empty cart", async () => {
    const result = await service.removeFromCart(
      testUserId(),
      ticketTypeId
    );

    expect(result).toEqual({
      id: null,
      items: [],
    });
  });
});
