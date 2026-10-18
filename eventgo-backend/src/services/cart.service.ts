
import { pool } from "../db/database";
import type { PoolClient } from "pg";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_QUANTITY = 10;

export interface CartItem {
  id: string;
  ticketTypeId: string;
  eventId: string;
  eventTitle: string;
  eventCategory: string;
  eventDate: string;
  city: string;
  ticketName: string;
  unitPrice: string;
  currency: string;
  quantity: number;
  available: number;
  isDemo: boolean;
}

export interface Cart {
  id: string | null;
  items: CartItem[];
}

interface CartItemRow {
  id: string;
  ticket_type_id: string;
  event_id: string;
  event_title: string;
  event_category: string;
  event_date: Date | string;
  city: string;
  ticket_name: string;
  unit_price: string;
  currency: string;
  quantity: number;
  available: number;
  is_demo: boolean;
}

function validateUserId(userId: string) {
  if (!UUID_PATTERN.test(userId)) {
    throw new Error("Invalid user ID");
  }
}

function validateTicketTypeId(ticketTypeId: string) {
  if (!UUID_PATTERN.test(ticketTypeId)) {
    throw new Error("Invalid ticket type ID");
  }
}

function validateQuantity(quantity: number) {
  if (
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > MAX_QUANTITY
  ) {
    throw new Error("Invalid ticket quantity");
  }
}

async function getActiveCartId(
  client: PoolClient,
  userId: string,
  create: boolean
): Promise<string | null> {
  if (create) {
    const result = await client.query<{ id: string }>(
      `
      INSERT INTO carts (user_id, status)
      VALUES ($1, 'ACTIVE')
      ON CONFLICT (user_id)
      WHERE status = 'ACTIVE'
      DO UPDATE SET updated_at = NOW()
      RETURNING id
      `,
      [userId]
    );

    return result.rows[0].id;
  }

  const result = await client.query<{ id: string }>(
    `
    SELECT id
    FROM carts
    WHERE user_id = $1
      AND status = 'ACTIVE'
    LIMIT 1
    `,
    [userId]
  );

  return result.rows[0]?.id ?? null;
}

async function getAvailableQuantity(
  client: PoolClient,
  ticketTypeId: string
): Promise<number> {
  const result = await client.query<{
    quantity: number;
    sold: string;
  }>(
    `
    SELECT
      tt.quantity,
      (
        SELECT COUNT(*)::text
        FROM tickets t
        JOIN orders o ON o.id = t.order_id
        WHERE t.ticket_type_id = tt.id
          AND o.status IN ('PAID', 'DEMO_PAID')
      ) AS sold
    FROM ticket_types tt
    JOIN events e ON e.id = tt.event_id
    WHERE tt.id = $1
      AND e.starts_at > NOW()
    FOR UPDATE OF tt
    `,
    [ticketTypeId]
  );

  const ticket = result.rows[0];

  if (!ticket) {
    throw new Error("Ticket type is unavailable");
  }

  return Math.max(
    0,
    ticket.quantity - Number(ticket.sold)
  );
}

export async function getCart(
  userId: string
): Promise<Cart> {
  validateUserId(userId);

  const client = await pool.connect();

  try {
    const cartId = await getActiveCartId(
      client,
      userId,
      false
    );

    if (!cartId) {
      return {
        id: null,
        items: [],
      };
    }

    const result = await client.query<CartItemRow>(
      `
      SELECT
        ci.id,
        ci.ticket_type_id,
        e.id AS event_id,
        e.title AS event_title,
        e.category AS event_category,
        e.starts_at AS event_date,
        c.name AS city,
        tt.name AS ticket_name,
        tt.price::text AS unit_price,
        tt.currency,
        ci.quantity,
        tt.quantity - (
          SELECT COUNT(*)::integer
          FROM tickets t
          JOIN orders o ON o.id = t.order_id
          WHERE t.ticket_type_id = tt.id
            AND o.status IN ('PAID', 'DEMO_PAID')
        ) AS available,
        e.is_demo
      FROM cart_items ci
      JOIN ticket_types tt
        ON tt.id = ci.ticket_type_id
      JOIN events e
        ON e.id = tt.event_id
      JOIN cities c
        ON c.id = e.city_id
      WHERE ci.cart_id = $1
      ORDER BY ci.created_at ASC, ci.id ASC
      `,
      [cartId]
    );

    return {
      id: cartId,
      items: result.rows.map((row) => ({
        id: row.id,
        ticketTypeId: row.ticket_type_id,
        eventId: row.event_id,
        eventTitle: row.event_title,
        eventCategory: row.event_category,
        eventDate: new Date(row.event_date).toISOString(),
        city: row.city,
        ticketName: row.ticket_name,
        unitPrice: row.unit_price,
        currency: row.currency,
        quantity: row.quantity,
        available: Math.max(0, row.available),
        isDemo: row.is_demo,
      })),
    };
  } finally {
    client.release();
  }
}

export async function addToCart(
  userId: string,
  ticketTypeId: string
): Promise<Cart> {
  validateUserId(userId);
  validateTicketTypeId(ticketTypeId);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const cartId = await getActiveCartId(
      client,
      userId,
      true
    );

    if (!cartId) {
      throw new Error("Unable to create cart");
    }

    await client.query(
      "SELECT id FROM carts WHERE id = $1 FOR UPDATE",
      [cartId]
    );

    const available = await getAvailableQuantity(
      client,
      ticketTypeId
    );

    if (available < 1) {
      throw new Error("Ticket is sold out");
    }

    const existing = await client.query<{
      quantity: number;
    }>(
      `
      SELECT quantity
      FROM cart_items
      WHERE cart_id = $1
        AND ticket_type_id = $2
      `,
      [cartId, ticketTypeId]
    );

    const nextQuantity =
      (existing.rows[0]?.quantity ?? 0) + 1;

    if (
      nextQuantity > MAX_QUANTITY ||
      nextQuantity > available
    ) {
      throw new Error("Ticket quantity limit reached");
    }

    await client.query(
      `
      INSERT INTO cart_items (
        cart_id,
        ticket_type_id,
        quantity
      )
      VALUES ($1, $2, 1)
      ON CONFLICT (cart_id, ticket_type_id)
      DO UPDATE SET
        quantity = EXCLUDED.quantity +
          cart_items.quantity,
        updated_at = NOW()
      `,
      [cartId, ticketTypeId]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return getCart(userId);
}

export async function updateCartItemQuantity(
  userId: string,
  ticketTypeId: string,
  quantity: number
): Promise<Cart> {
  validateUserId(userId);
  validateTicketTypeId(ticketTypeId);
  validateQuantity(quantity);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const cartId = await getActiveCartId(
      client,
      userId,
      false
    );

    if (!cartId) {
      throw new Error("Cart not found");
    }

    await client.query(
      "SELECT id FROM carts WHERE id = $1 FOR UPDATE",
      [cartId]
    );

    const available = await getAvailableQuantity(
      client,
      ticketTypeId
    );

    if (quantity > available) {
      throw new Error("Not enough tickets available");
    }

    const result = await client.query(
      `
      UPDATE cart_items
      SET quantity = $3,
          updated_at = NOW()
      WHERE cart_id = $1
        AND ticket_type_id = $2
      RETURNING id
      `,
      [cartId, ticketTypeId, quantity]
    );

    if (result.rowCount === 0) {
      throw new Error("Cart item not found");
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return getCart(userId);
}

export async function removeFromCart(
  userId: string,
  ticketTypeId: string
): Promise<Cart> {
  validateUserId(userId);
  validateTicketTypeId(ticketTypeId);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const cartId = await getActiveCartId(
      client,
      userId,
      false
    );

    if (cartId) {
      await client.query(
        `
        DELETE FROM cart_items
        WHERE cart_id = $1
          AND ticket_type_id = $2
        `,
        [cartId, ticketTypeId]
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return getCart(userId);
}
