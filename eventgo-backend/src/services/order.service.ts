import { createHash, randomBytes } from "node:crypto";
import type { PoolClient } from "pg";
import { pool } from "../db/database";

export interface AdminOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string | null;
  ticketCount: number;
}

export interface OrdersResult {
  orders: AdminOrder[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalOrders: number;
    paidOrders: number;
    pendingOrders: number;
    revenueEUR: number;
  };
}

export async function getAdminOrders(
  page = 1,
  search = "",
  status = ""
): Promise<OrdersResult> {
  const pageSize = 20;

  if (!Number.isSafeInteger(page) || page < 1) {
    throw new Error("Invalid page.");
  }

  const keyword = search.trim();

  if (keyword.length > 200) {
    throw new Error("Search is too long.");
  }

  const allowedStatuses = [
    "",
    "PAID",
    "DEMO_PAID",
    "PENDING",
    "CANCELLED",
    "FAILED",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid order status.");
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
      OR o.id::text ILIKE $2
    )
    AND ($3 = '' OR o.status = $3)
  `;

  const values = [
    keyword,
    `%${keyword}%`,
    status,
  ];

  const [dataResult, countResult, statsResult] =
    await Promise.all([
      pool.query<{
        id: string;
        customer_name: string | null;
        customer_email: string;
        status: string;
        total_amount: string;
        currency: string;
        created_at: Date | null;
        ticket_count: string;
      }>(
        `
        SELECT
          o.id,
          u.name AS customer_name,
          u.email AS customer_email,
          o.status,
          o.total_amount,
          o.currency,
          o.created_at,
          (
            SELECT COUNT(*)
            FROM tickets t
            WHERE t.order_id = o.id
          )::text AS ticket_count
        FROM orders o
        JOIN users u ON u.id = o.user_id
        ${filters}
        ORDER BY o.created_at DESC NULLS LAST, o.id DESC
        LIMIT $4 OFFSET $5
        `,
        [...values, pageSize, offset]
      ),

      pool.query<{ total: string }>(
        `
        SELECT COUNT(*)::text AS total
        FROM orders o
        JOIN users u ON u.id = o.user_id
        ${filters}
        `,
        values
      ),

      pool.query<{
        total_orders: string;
        paid_orders: string;
        pending_orders: string;
        revenue_eur: string;
      }>(`
        SELECT
          COUNT(*)::text AS total_orders,
          COUNT(*) FILTER (
            WHERE status IN ('PAID', 'DEMO_PAID')
          )::text AS paid_orders,
          COUNT(*) FILTER (
            WHERE status = 'PENDING'
          )::text AS pending_orders,
          COALESCE(
            SUM(total_amount) FILTER (
              WHERE status IN ('PAID', 'DEMO_PAID')
                AND currency = 'EUR'
            ),
            0
          )::text AS revenue_eur
        FROM orders
      `),
    ]);

  const total = Number(countResult.rows[0].total);
  const stats = statsResult.rows[0];

  return {
    orders: dataResult.rows.map((row) => ({
      id: row.id,
      customerName: row.customer_name ?? "Unnamed user",
      customerEmail: row.customer_email,
      status: row.status,
      totalAmount: Number(row.total_amount),
      currency: row.currency,
      createdAt: row.created_at
        ? new Date(row.created_at).toISOString()
        : null,
      ticketCount: Number(row.ticket_count),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    stats: {
      totalOrders: Number(stats.total_orders),
      paidOrders: Number(stats.paid_orders),
      pendingOrders: Number(stats.pending_orders),
      revenueEUR: Number(stats.revenue_eur),
    },
  };
}

export interface DemoOrderTicket {
  id: string;
  ticketTypeId: string;
  eventId: string;
  eventTitle: string;
  qrToken: string;
}

export interface DemoOrderResult {
  orderId: string;
  status: "DEMO_PAID";
  totalAmount: string;
  currency: string;
  tickets: DemoOrderTicket[];
}

interface CheckoutCartRow {
  ticket_type_id: string;
  quantity: number;
}

interface CheckoutTicketRow {
  event_id: string;
  event_title: string;
  is_demo: boolean;
  quantity: number;
  price: string;
  currency: string;
  starts_at: Date | string;
}

const CHECKOUT_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function priceToCents(price: string): bigint {
  if (!/^\d+(\.\d{1,2})?$/.test(price)) {
    throw new Error("Invalid ticket price");
  }

  const [whole, decimal = ""] = price.split(".");

  return (
    BigInt(whole) * BigInt(100) +
    BigInt(decimal.padEnd(2, "0"))
  );
}

function centsToPrice(cents: bigint): string {
  const whole = cents / BigInt(100);
const decimal = (cents % BigInt(100))
    .toString()
    .padStart(2, "0");

  return `${whole}.${decimal}`;
}

async function lockTicketType(
  client: PoolClient,
  ticketTypeId: string
): Promise<CheckoutTicketRow> {
  const result = await client.query<CheckoutTicketRow>(
    `
    SELECT
      e.id AS event_id,
      e.title AS event_title,
      e.is_demo,
      e.starts_at,
      tt.quantity,
      tt.price::text AS price,
      tt.currency
    FROM ticket_types tt
    JOIN events e ON e.id = tt.event_id
    WHERE tt.id = $1
    FOR UPDATE OF tt
    `,
    [ticketTypeId]
  );

  if (!result.rows[0]) {
    throw new Error("Ticket type not found");
  }

  return result.rows[0];
}

async function getSoldCount(
  client: PoolClient,
  ticketTypeId: string
): Promise<number> {
  const result = await client.query<{ sold: string }>(
    `
    SELECT COUNT(*)::text AS sold
    FROM tickets t
    JOIN orders o ON o.id = t.order_id
    WHERE t.ticket_type_id = $1
      AND o.status IN ('PAID', 'DEMO_PAID')
    `,
    [ticketTypeId]
  );

  return Number(result.rows[0].sold);
}

export async function createDemoOrder(
  userId: string
): Promise<DemoOrderResult> {
  if (!CHECKOUT_UUID_PATTERN.test(userId)) {
    throw new Error("Invalid user ID");
  }

  const client = await pool.connect();

  let transactionStarted = false;

  try {
    await client.query("BEGIN");
    transactionStarted = true;

    const cartResult = await client.query<{
      id: string;
    }>(
      `
      SELECT id
      FROM carts
      WHERE user_id = $1
        AND status = 'ACTIVE'
      FOR UPDATE
      `,
      [userId]
    );

    const cartId = cartResult.rows[0]?.id;

    if (!cartId) {
      throw new Error("Your cart is empty");
    }

    const cartItemsResult =
      await client.query<CheckoutCartRow>(
        `
        SELECT
          ticket_type_id,
          quantity
        FROM cart_items
        WHERE cart_id = $1
        ORDER BY ticket_type_id
        FOR UPDATE
        `,
        [cartId]
      );

    const items = cartItemsResult.rows;

    if (items.length === 0) {
      throw new Error("Your cart is empty");
    }

    let totalCents = BigInt(0);
    let currency: string | null = null;

    const verifiedItems: Array<{
      ticketTypeId: string;
      quantity: number;
      eventId: string;
      eventTitle: string;
    }> = [];

    for (const item of items) {
      if (
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 10
      ) {
        throw new Error("Invalid ticket quantity");
      }

      const ticket = await lockTicketType(
        client,
        item.ticket_type_id
      );

      if (!ticket.is_demo) {
        throw new Error(
          "Only demo events support demo checkout"
        );
      }

      if (
        new Date(ticket.starts_at).getTime() <=
        Date.now()
      ) {
        throw new Error(
          "An event in your cart has already started"
        );
      }

      if (currency === null) {
        currency = ticket.currency;
      } else if (currency !== ticket.currency) {
        throw new Error(
          "Tickets must use the same currency"
        );
      }

      const sold = await getSoldCount(
        client,
        item.ticket_type_id
      );

      const available = Math.max(
        0,
        ticket.quantity - sold
      );

      if (item.quantity > available) {
        throw new Error(
          `Not enough tickets for ${ticket.event_title}`
        );
      }

      totalCents +=
        priceToCents(ticket.price) *
        BigInt(item.quantity);

      verifiedItems.push({
        ticketTypeId: item.ticket_type_id,
        quantity: item.quantity,
        eventId: ticket.event_id,
        eventTitle: ticket.event_title,
      });
    }

    if (!currency) {
      throw new Error("Invalid order currency");
    }

    const totalAmount = centsToPrice(totalCents);

    const orderResult = await client.query<{
      id: string;
    }>(
      `
      INSERT INTO orders (
        user_id,
        status,
        total_amount,
        currency
      )
      VALUES ($1, 'DEMO_PAID', $2, $3)
      RETURNING id
      `,
      [userId, totalAmount, currency]
    );

    const orderId = orderResult.rows[0].id;

   
const createdTickets: DemoOrderTicket[] = [];

for (const item of verifiedItems) {
  const qrToken = randomBytes(32).toString("hex");

  const qrTokenHash = createHash("sha256")
    .update(qrToken)
    .digest("hex");

  await client.query(
    `
    INSERT INTO ticket_groups (
      order_id,
      ticket_type_id,
      quantity,
      qr_token,
      qr_token_hash,
      status
    )
    VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
    `,
    [
      orderId,
      item.ticketTypeId,
      item.quantity,
      qrToken,
      qrTokenHash,
    ]
  );

  for (
    let index = 0;
    index < item.quantity;
    index++
  ) {
    const ticketResult = await client.query<{
      id: string;
    }>(
      `
      INSERT INTO tickets (
        order_id,
        ticket_type_id,
        status,
        issued_at
      )
      VALUES ($1, $2, 'ISSUED', NOW())
      RETURNING id
      `,
      [orderId, item.ticketTypeId]
    );

    createdTickets.push({
      id: ticketResult.rows[0].id,
      ticketTypeId: item.ticketTypeId,
      eventId: item.eventId,
      eventTitle: item.eventTitle,
      qrToken,
    });
  }
}


    for (const item of verifiedItems) {
      for (let index = 0; index < item.quantity; index++) {
        const qrToken = randomBytes(32).toString("hex");

        const qrTokenHash = createHash("sha256")
          .update(qrToken)
          .digest("hex");

        const ticketResult = await client.query<{
          id: string;
        }>(
          `
          INSERT INTO tickets (
            order_id,
            ticket_type_id,
            qr_token_hash,
            qr_token,
            status,
            issued_at
          )
          VALUES ($1, $2, $3, $4, 'ISSUED', NOW())
          RETURNING id
          `,
          [
            orderId,
            item.ticketTypeId,
            qrTokenHash,
            qrToken,
          ]
        );

        createdTickets.push({
          id: ticketResult.rows[0].id,
          ticketTypeId: item.ticketTypeId,
          eventId: item.eventId,
          eventTitle: item.eventTitle,
          qrToken,
        });
      }
    }

    await client.query(
      `
      UPDATE carts
      SET status = 'CHECKED_OUT',
          updated_at = NOW()
      WHERE id = $1
      `,
      [cartId]
    );

    await client.query("COMMIT");
    transactionStarted = false;

    return {
      orderId,
      status: "DEMO_PAID",
      totalAmount,
      currency,
      tickets: createdTickets,
    };
  } catch (error) {
    if (transactionStarted) {
      await client.query("ROLLBACK");
    }

    throw error;
  } finally {
    client.release();
  }
}

export async function getDemoOrderForUser(
  userId: string,
  orderId: string
) {
  if (
    !CHECKOUT_UUID_PATTERN.test(userId) ||
    !CHECKOUT_UUID_PATTERN.test(orderId)
  ) {
    return null;
  }

  const result = await pool.query<{
    id: string;
    status: string;
    total_amount: string;
    currency: string;
    ticket_count: number;
  }>(
    `
    SELECT
      o.id,
      o.status,
      o.total_amount::text,
      o.currency,
      (
        SELECT COUNT(*)::integer
        FROM tickets t
        WHERE t.order_id = o.id
      ) AS ticket_count
    FROM orders o
    WHERE o.id = $1
      AND o.user_id = $2
      AND o.status = 'DEMO_PAID'
    `,
    [orderId, userId]
  );

  const order = result.rows[0];

  if (!order) {
    return null;
  }

  return {
    id: order.id,
    status: order.status,
    totalAmount: order.total_amount,
    currency: order.currency,
    ticketCount: order.ticket_count,
  };
}
