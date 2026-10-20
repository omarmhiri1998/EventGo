
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createDemoOrder,
  getAdminOrders,
  getDemoOrderForUser,
} from "../../src/services/order.service";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  connect: vi.fn(),
  clientQuery: vi.fn(),
  release: vi.fn(),
}));

vi.mock("../../src/db/database", () => ({
  pool: {
    query: mocks.query,
    connect: mocks.connect,
  },
}));

const userId = "11111111-1111-4111-8111-111111111111";
const orderId = "22222222-2222-4222-8222-222222222222";
const cartId = "33333333-3333-4333-8333-333333333333";
const ticketTypeId = "44444444-4444-4444-8444-444444444444";
const eventId = "55555555-5555-4555-8555-555555555555";

const futureDate = "2099-06-15T18:00:00Z";

type CheckoutScenario = {
  cartExists: boolean;
  items: Array<{
    ticket_type_id: string;
    quantity: number;
  }>;
  ticketExists: boolean;
  isDemo: boolean;
  startsAt: string;
  capacity: number;
  sold: number;
  price: string;
  currency: string;
  failOn: string | null;
};

let scenario: CheckoutScenario;
let ticketCounter: number;

function setupCheckout() {
  mocks.clientQuery.mockImplementation(
    async (sql: string) => {
      if (scenario.failOn && sql.includes(scenario.failOn)) {
        throw new Error("Database failure");
      }

      if (sql.includes("FROM carts")) {
        return {
          rows: scenario.cartExists
            ? [{ id: cartId }]
            : [],
        };
      }

      if (sql.includes("FROM cart_items")) {
        return { rows: scenario.items };
      }

      if (sql.includes("FROM ticket_types tt")) {
        return {
          rows: scenario.ticketExists
            ? [{
                event_id: eventId,
                event_title: "EventGo Festival",
                is_demo: scenario.isDemo,
                starts_at: scenario.startsAt,
                quantity: scenario.capacity,
                price: scenario.price,
                currency: scenario.currency,
              }]
            : [],
        };
      }

      if (sql.includes("AS sold")) {
        return {
          rows: [{
            sold: String(scenario.sold),
          }],
        };
      }

      if (sql.includes("INSERT INTO orders")) {
        return {
          rows: [{ id: orderId }],
        };
      }

      if (sql.includes("INSERT INTO tickets")) {
        ticketCounter++;

        return {
          rows: [{
            id: `ticket-${ticketCounter}`,
          }],
        };
      }

      return { rows: [], rowCount: 1 };
    }
  );
}

function commands() {
  return mocks.clientQuery.mock.calls.map(
    ([sql]) => sql as string
  );
}

function insertedTicketsCount() {
  return commands().filter(sql =>
    sql.includes("INSERT INTO tickets")
  ).length;
}

function expectRollback() {
  expect(commands()).toContain("ROLLBACK");
  expect(commands()).not.toContain("COMMIT");
  expect(mocks.release).toHaveBeenCalledOnce();
}

beforeEach(() => {
  vi.resetAllMocks();

  ticketCounter = 0;

  scenario = {
    cartExists: true,
    items: [{
      ticket_type_id: ticketTypeId,
      quantity: 2,
    }],
    ticketExists: true,
    isDemo: true,
    startsAt: futureDate,
    capacity: 10,
    sold: 0,
    price: "25.50",
    currency: "EUR",
    failOn: null,
  };

  mocks.connect.mockResolvedValue({
    query: mocks.clientQuery,
    release: mocks.release,
  });

  setupCheckout();
});

// ======================================
// CREATE DEMO ORDER
// ======================================

describe("createDemoOrder", () => {
  it("rejects invalid user IDs", async () => {
    await expect(
      createDemoOrder("invalid")
    ).rejects.toThrow("Invalid user ID");

    expect(mocks.connect).not.toHaveBeenCalled();
  });

  it("rejects a missing cart", async () => {
    scenario.cartExists = false;

    await expect(
      createDemoOrder(userId)
    ).rejects.toThrow("Your cart is empty");

    expectRollback();
  });

  it("rejects an empty cart", async () => {
    scenario.items = [];

    await expect(
      createDemoOrder(userId)
    ).rejects.toThrow("Your cart is empty");

    expectRollback();
  });

  it.each([0, -1, 11, 1.5, NaN])(
    "rejects invalid ticket quantity %s",
    async quantity => {
      scenario.items[0].quantity = quantity;

      await expect(
        createDemoOrder(userId)
      ).rejects.toThrow("Invalid ticket quantity");

      expectRollback();
    }
  );

  it("rejects nonexistent ticket types", async () => {
    scenario.ticketExists = false;

    await expect(
      createDemoOrder(userId)
    ).rejects.toThrow("Ticket type not found");

    expectRollback();
  });

  it("rejects non-demo events", async () => {
    scenario.isDemo = false;

    await expect(
      createDemoOrder(userId)
    ).rejects.toThrow(
      "Only demo events support demo checkout"
    );

    expectRollback();
  });

  it("rejects events that already started", async () => {
    scenario.startsAt = "2020-01-01T00:00:00Z";

    await expect(
      createDemoOrder(userId)
    ).rejects.toThrow(
      "An event in your cart has already started"
    );

    expectRollback();
  });

  it("rejects sold-out ticket types", async () => {
    scenario.capacity = 10;
    scenario.sold = 10;

    await expect(
      createDemoOrder(userId)
    ).rejects.toThrow("Not enough tickets");

    expectRollback();
  });

  it("rejects requests exceeding availability", async () => {
    scenario.capacity = 10;
    scenario.sold = 9;

    await expect(
      createDemoOrder(userId)
    ).rejects.toThrow("Not enough tickets");

    expectRollback();
  });

  it.each([
    "abc",
    "-1.00",
    "10.123",
    "1e3",
  ])("rejects invalid price %s", async price => {
    scenario.price = price;

    await expect(
      createDemoOrder(userId)
    ).rejects.toThrow("Invalid ticket price");

    expectRollback();
  });

  it("calculates total price exactly", async () => {
    scenario.price = "19.99";
    scenario.items[0].quantity = 3;

    const result = await createDemoOrder(userId);

    expect(result.totalAmount).toBe("59.97");
    expect(result.currency).toBe("EUR");

    expect(mocks.clientQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO orders"),
      [userId, "59.97", "EUR"]
    );
  });

  it("handles a price with one decimal", async () => {
    scenario.price = "9.5";

    const result = await createDemoOrder(userId);

    expect(result.totalAmount).toBe("19.00");
  });

  it("handles zero-price demo tickets", async () => {
    scenario.price = "0";

    const result = await createDemoOrder(userId);

    expect(result.totalAmount).toBe("0.00");
  });

  it("uses database prices instead of client prices", async () => {
    scenario.price = "35.00";

    await createDemoOrder(userId);

    expect(mocks.clientQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO orders"),
      [userId, "70.00", "EUR"]
    );
  });

  it("rejects mixed currencies", async () => {
    scenario.items = [
      {
        ticket_type_id: ticketTypeId,
        quantity: 1,
      },
      {
        ticket_type_id:
          "66666666-6666-4666-8666-666666666666",
        quantity: 1,
      },
    ];

    let ticketLookups = 0;

    mocks.clientQuery.mockImplementation(
      async (sql: string) => {
        if (sql.includes("FROM carts")) {
          return { rows: [{ id: cartId }] };
        }

        if (sql.includes("FROM cart_items")) {
          return { rows: scenario.items };
        }

        if (sql.includes("FROM ticket_types tt")) {
          ticketLookups++;

          return {
            rows: [{
              event_id: eventId,
              event_title: "EventGo Festival",
              is_demo: true,
              starts_at: futureDate,
              quantity: 10,
              price: "10.00",
              currency:
                ticketLookups === 1 ? "EUR" : "USD",
            }],
          };
        }

        if (sql.includes("AS sold")) {
          return { rows: [{ sold: "0" }] };
        }

        return { rows: [] };
      }
    );

    await expect(
      createDemoOrder(userId)
    ).rejects.toThrow(
      "Tickets must use the same currency"
    );

    expectRollback();
  });

  it("starts and commits a successful transaction", async () => {
    await createDemoOrder(userId);

    expect(commands()[0]).toBe("BEGIN");
    expect(commands()).toContain("COMMIT");
    expect(commands()).not.toContain("ROLLBACK");
    expect(mocks.release).toHaveBeenCalledOnce();
  });

  it("locks the cart and ticket types", async () => {
    await createDemoOrder(userId);

    expect(commands().some(sql =>
      sql.includes("FROM carts") &&
      sql.includes("FOR UPDATE")
    )).toBe(true);

    expect(commands().some(sql =>
      sql.includes("FOR UPDATE OF tt")
    )).toBe(true);
  });

  it("marks the cart as checked out", async () => {
    await createDemoOrder(userId);

    expect(mocks.clientQuery).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE carts"),
      [cartId]
    );

    expect(commands().some(sql =>
      sql.includes("CHECKED_OUT")
    )).toBe(true);
  });

  it("rolls back if order insertion fails", async () => {
    scenario.failOn = "INSERT INTO orders";

    await expect(
      createDemoOrder(userId)
    ).rejects.toThrow("Database failure");

    expectRollback();
  });

  it("rolls back if ticket insertion fails", async () => {
    scenario.failOn = "INSERT INTO tickets";

    await expect(
      createDemoOrder(userId)
    ).rejects.toThrow("Database failure");

    expectRollback();
  });

  it("rolls back if cart update fails", async () => {
    scenario.failOn = "UPDATE carts";

    await expect(
      createDemoOrder(userId)
    ).rejects.toThrow("Database failure");

    expectRollback();
  });

  it("does not issue more tickets than purchased", async () => {
    scenario.items[0].quantity = 2;

    const result = await createDemoOrder(userId);

    // Critical regression test:
    // Exactly two tickets must be issued.
    expect(insertedTicketsCount()).toBe(2);
    expect(result.tickets).toHaveLength(2);
  });

  it("returns the same order ID on all tickets", async () => {
    const result = await createDemoOrder(userId);

    expect(result.orderId).toBe(orderId);
    expect(result.status).toBe("DEMO_PAID");
    expect(result.tickets.every(ticket =>
      ticket.ticketTypeId === ticketTypeId
    )).toBe(true);
  });
});

// ======================================
// GET ADMIN ORDERS
// ======================================

describe("getAdminOrders", () => {
  function mockAdminResults() {
    mocks.query
      .mockResolvedValueOnce({
        rows: [{
          id: orderId,
          customer_name: null,
          customer_email: "user@example.com",
          status: "DEMO_PAID",
          total_amount: "49.98",
          currency: "EUR",
          created_at: new Date("2026-10-20T12:00:00Z"),
          ticket_count: "2",
        }],
      })
      .mockResolvedValueOnce({
        rows: [{ total: "21" }],
      })
      .mockResolvedValueOnce({
        rows: [{
          total_orders: "30",
          paid_orders: "20",
          pending_orders: "5",
          revenue_eur: "1200.50",
        }],
      });
  }

  it("returns mapped orders and pagination", async () => {
    mockAdminResults();

    const result = await getAdminOrders(2);

    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(20);
    expect(result.total).toBe(21);
    expect(result.totalPages).toBe(2);

    expect(result.orders[0]).toEqual({
      id: orderId,
      customerName: "Unnamed user",
      customerEmail: "user@example.com",
      status: "DEMO_PAID",
      totalAmount: 49.98,
      currency: "EUR",
      createdAt: "2026-10-20T12:00:00.000Z",
      ticketCount: 2,
    });

    expect(result.stats.revenueEUR).toBe(1200.5);
  });

  it("trims the search keyword", async () => {
    mockAdminResults();

    await getAdminOrders(1, "  Omar  ", "PAID");

    expect(mocks.query).toHaveBeenCalledWith(
      expect.stringContaining("FROM orders o"),
      ["Omar", "%Omar%", "PAID", 20, 0]
    );
  });

  it.each([0, -1, 1.5, NaN, Infinity])(
    "rejects invalid page %s",
    async page => {
      await expect(
        getAdminOrders(page)
      ).rejects.toThrow("Invalid page.");

      expect(mocks.query).not.toHaveBeenCalled();
    }
  );

  it("rejects oversized search input", async () => {
    await expect(
      getAdminOrders(1, "x".repeat(201))
    ).rejects.toThrow("Search is too long.");

    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("rejects unsupported order status", async () => {
    await expect(
      getAdminOrders(1, "", "UNKNOWN")
    ).rejects.toThrow("Invalid order status.");

    expect(mocks.query).not.toHaveBeenCalled();
  });

  it.each([
    "PAID",
    "DEMO_PAID",
    "PENDING",
    "CANCELLED",
    "FAILED",
  ])("accepts order status %s", async status => {
    mockAdminResults();

    await getAdminOrders(1, "", status);

    expect(mocks.query).toHaveBeenCalledTimes(3);
  });
});

// ======================================
// GET DEMO ORDER FOR USER
// ======================================

describe("getDemoOrderForUser", () => {
  it("returns null for invalid IDs", async () => {
    const result = await getDemoOrderForUser(
      "invalid",
      orderId
    );

    expect(result).toBeNull();
    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("returns null when the order does not exist", async () => {
    mocks.query.mockResolvedValue({ rows: [] });

    const result = await getDemoOrderForUser(
      userId,
      orderId
    );

    expect(result).toBeNull();
  });

  it("returns the user's demo order", async () => {
    mocks.query.mockResolvedValue({
      rows: [{
        id: orderId,
        status: "DEMO_PAID",
        total_amount: "49.98",
        currency: "EUR",
        ticket_count: 2,
      }],
    });

    const result = await getDemoOrderForUser(
      userId,
      orderId
    );

    expect(result).toEqual({
      id: orderId,
      status: "DEMO_PAID",
      totalAmount: "49.98",
      currency: "EUR",
      ticketCount: 2,
    });
  });

  it("filters by order owner and paid status", async () => {
    mocks.query.mockResolvedValue({ rows: [] });

    await getDemoOrderForUser(userId, orderId);

    expect(mocks.query).toHaveBeenCalledWith(
      expect.stringContaining("o.user_id = $2"),
      [orderId, userId]
    );

    const sql = mocks.query.mock.calls[0][0];

    expect(sql).toContain("o.status = 'DEMO_PAID'");
  });
});
