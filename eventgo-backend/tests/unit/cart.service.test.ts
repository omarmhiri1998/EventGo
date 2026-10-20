
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
} from "../../src/services/cart.service";

// ======================================
// DATABASE MOCK
// ======================================

const mocks = vi.hoisted(() => ({
  connect: vi.fn(),
  query: vi.fn(),
  release: vi.fn(),
}));

vi.mock("../../src/db/database", () => ({
  pool: {
    connect: mocks.connect,
  },
}));

// ======================================
// TEST DATA
// ======================================

const userId =
  "11111111-1111-4111-8111-111111111111";

const ticketTypeId =
  "22222222-2222-4222-8222-222222222222";

const cartId =
  "33333333-3333-4333-8333-333333333333";

const cartRow = {
  id: "item-1",
  ticket_type_id: ticketTypeId,
  event_id: "event-1",
  event_title: "EventGo Festival",
  event_category: "Music",
  event_date: new Date("2027-06-15T18:00:00Z"),
  city: "Dortmund",
  ticket_name: "Standard",
  unit_price: "25.00",
  currency: "EUR",
  quantity: 2,
  available: 8,
  is_demo: false,
};

const expectedItem = {
  id: "item-1",
  ticketTypeId,
  eventId: "event-1",
  eventTitle: "EventGo Festival",
  eventCategory: "Music",
  eventDate: "2027-06-15T18:00:00.000Z",
  city: "Dortmund",
  ticketName: "Standard",
  unitPrice: "25.00",
  currency: "EUR",
  quantity: 2,
  available: 8,
  isDemo: false,
};

// ======================================
// DATABASE SCENARIO
// ======================================

type Scenario = {
  cartExists: boolean;
  available: number;
  existingQuantity: number;
  ticketExists: boolean;
  cartCreated: boolean;
  updateRowCount: number;
  failOn: string | null;
  cartItems: typeof cartRow[];
};

let scenario: Scenario;

function setupDatabase() {
  mocks.query.mockImplementation(
    async (sql: string, params?: unknown[]) => {
      if (scenario.failOn && sql.includes(scenario.failOn)) {
        throw new Error("Database failure");
      }

      if (
        sql.includes("INSERT INTO carts")
      ) {
        return {
          rows: scenario.cartCreated
            ? [{ id: cartId }]
            : [],
          rowCount: scenario.cartCreated ? 1 : 0,
        };
      }

      if (
        sql.includes("SELECT id") &&
        sql.includes("FROM carts") &&
        !sql.includes("FOR UPDATE")
      ) {
        return {
          rows: scenario.cartExists
            ? [{ id: cartId }]
            : [],
        };
      }

      if (
        sql.includes("FROM ticket_types tt") &&
        sql.includes("FOR UPDATE OF tt")
      ) {
        if (!scenario.ticketExists) {
          return { rows: [] };
        }

        return {
          rows: [{
            quantity: scenario.available,
            sold: "0",
          }],
        };
      }

      if (
        sql.includes("SELECT quantity") &&
        sql.includes("FROM cart_items")
      ) {
        return {
          rows: scenario.existingQuantity > 0
            ? [{
                quantity: scenario.existingQuantity,
              }]
            : [],
        };
      }

      if (
        sql.includes("UPDATE cart_items")
      ) {
        return {
          rows: scenario.updateRowCount
            ? [{ id: "item-1" }]
            : [],
          rowCount: scenario.updateRowCount,
        };
      }

      if (
        sql.includes("FROM cart_items ci")
      ) {
        return {
          rows: scenario.cartItems,
        };
      }

      return {
        rows: [],
        rowCount: 1,
      };
    }
  );
}

// ======================================
// SETUP
// ======================================

beforeEach(() => {
  vi.resetAllMocks();

  scenario = {
    cartExists: true,
    available: 10,
    existingQuantity: 0,
    ticketExists: true,
    cartCreated: true,
    updateRowCount: 1,
    failOn: null,
    cartItems: [cartRow],
  };

  mocks.connect.mockResolvedValue({
    query: mocks.query,
    release: mocks.release,
  });

  setupDatabase();
});

// ======================================
// HELPERS
// ======================================

function executedSQL(): string[] {
  return mocks.query.mock.calls.map(
    ([sql]) => sql as string
  );
}

function expectRollbackWithoutCommit() {
  const commands = executedSQL();

  expect(commands).toContain("ROLLBACK");
  expect(commands).not.toContain("COMMIT");
}

function expectCommitWithoutRollback() {
  const commands = executedSQL();

  expect(commands).toContain("COMMIT");
  expect(commands).not.toContain("ROLLBACK");
}

// ======================================
// GET CART
// ======================================

describe("getCart", () => {
  it("returns an empty cart when no cart exists", async () => {
    scenario.cartExists = false;

    const result = await getCart(userId);

    expect(result).toEqual({
      id: null,
      items: [],
    });
  });

  it("returns cart items with correct fields", async () => {
    const result = await getCart(userId);

    expect(result).toEqual({
      id: cartId,
      items: [expectedItem],
    });
  });

  it("converts event date to ISO format", async () => {
    const result = await getCart(userId);

    expect(result.items[0].eventDate).toBe(
      "2027-06-15T18:00:00.000Z"
    );
  });

  it("never returns negative availability", async () => {
    scenario.cartItems = [{
      ...cartRow,
      available: -5,
    }];

    const result = await getCart(userId);

    expect(result.items[0].available).toBe(0);
  });

  it("rejects an invalid user ID", async () => {
    await expect(
      getCart("invalid-id")
    ).rejects.toThrow("Invalid user ID");

    expect(mocks.connect).not.toHaveBeenCalled();
  });

  it("releases the connection after success", async () => {
    await getCart(userId);

    expect(mocks.release).toHaveBeenCalledOnce();
  });

  it("releases the connection after database failure", async () => {
    scenario.failOn = "FROM cart_items ci";

    await expect(
      getCart(userId)
    ).rejects.toThrow("Database failure");

    expect(mocks.release).toHaveBeenCalledOnce();
  });
});

// ======================================
// ADD TO CART
// ======================================

describe("addToCart", () => {
  it("adds an available ticket", async () => {
    const result = await addToCart(
      userId,
      ticketTypeId
    );

    expect(result.id).toBe(cartId);
    expect(result.items).toEqual([expectedItem]);

    expect(
      executedSQL().some(sql =>
        sql.includes("INSERT INTO cart_items")
      )
    ).toBe(true);

    expectCommitWithoutRollback();
  });

  it("rejects an invalid user ID", async () => {
    await expect(
      addToCart("invalid", ticketTypeId)
    ).rejects.toThrow("Invalid user ID");

    expect(mocks.connect).not.toHaveBeenCalled();
  });

  it("rejects an invalid ticket type ID", async () => {
    await expect(
      addToCart(userId, "invalid")
    ).rejects.toThrow("Invalid ticket type ID");

    expect(mocks.connect).not.toHaveBeenCalled();
  });

  it("rejects an unavailable ticket type", async () => {
    scenario.ticketExists = false;

    await expect(
      addToCart(userId, ticketTypeId)
    ).rejects.toThrow("Ticket type is unavailable");

    expectRollbackWithoutCommit();
  });

  it("rejects sold-out tickets", async () => {
    scenario.available = 0;

    await expect(
      addToCart(userId, ticketTypeId)
    ).rejects.toThrow("Ticket is sold out");

    expectRollbackWithoutCommit();
  });

  it("rejects adding more than 10 tickets", async () => {
    scenario.existingQuantity = 10;

    await expect(
      addToCart(userId, ticketTypeId)
    ).rejects.toThrow(
      "Ticket quantity limit reached"
    );

    expectRollbackWithoutCommit();
  });

  it("rejects quantities exceeding availability", async () => {
    scenario.available = 3;
    scenario.existingQuantity = 3;

    await expect(
      addToCart(userId, ticketTypeId)
    ).rejects.toThrow(
      "Ticket quantity limit reached"
    );

    expectRollbackWithoutCommit();
  });

  it("allows increasing quantity up to the limit", async () => {
    scenario.available = 10;
    scenario.existingQuantity = 9;

    await addToCart(userId, ticketTypeId);

    expectCommitWithoutRollback();

    expect(
      executedSQL().some(sql =>
        sql.includes("INSERT INTO cart_items")
      )
    ).toBe(true);
  });

  it("rejects failure to create a cart", async () => {
    scenario.cartCreated = false;

    await expect(
      addToCart(userId, ticketTypeId)
    ).rejects.toThrow("Unable to create cart");

    expectRollbackWithoutCommit();
  });

  it("rolls back when inserting an item fails", async () => {
    scenario.failOn = "INSERT INTO cart_items";

    await expect(
      addToCart(userId, ticketTypeId)
    ).rejects.toThrow("Database failure");

    expectRollbackWithoutCommit();
  });

  it("releases the transaction connection on failure", async () => {
    scenario.available = 0;

    await expect(
      addToCart(userId, ticketTypeId)
    ).rejects.toThrow();

    expect(mocks.release).toHaveBeenCalledOnce();
  });
});

// ======================================
// UPDATE CART ITEM QUANTITY
// ======================================

describe("updateCartItemQuantity", () => {
  it("updates a valid quantity", async () => {
    const result = await updateCartItemQuantity(
      userId,
      ticketTypeId,
      3
    );

    expect(result.id).toBe(cartId);

    expect(mocks.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE cart_items"),
      [cartId, ticketTypeId, 3]
    );

    expectCommitWithoutRollback();
  });

  it.each([
    0,
    -1,
    11,
    1.5,
    NaN,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
  ])("rejects invalid quantity %s", async quantity => {
    await expect(
      updateCartItemQuantity(
        userId,
        ticketTypeId,
        quantity
      )
    ).rejects.toThrow("Invalid ticket quantity");

    expect(mocks.connect).not.toHaveBeenCalled();
  });

  it("accepts quantity equal to 1", async () => {
    await updateCartItemQuantity(
      userId,
      ticketTypeId,
      1
    );

    expectCommitWithoutRollback();
  });

  it("accepts quantity equal to 10 when available", async () => {
    scenario.available = 10;

    await updateCartItemQuantity(
      userId,
      ticketTypeId,
      10
    );

    expectCommitWithoutRollback();
  });

  it("rejects an invalid user ID", async () => {
    await expect(
      updateCartItemQuantity(
        "invalid",
        ticketTypeId,
        2
      )
    ).rejects.toThrow("Invalid user ID");
  });

  it("rejects an invalid ticket type ID", async () => {
    await expect(
      updateCartItemQuantity(
        userId,
        "invalid",
        2
      )
    ).rejects.toThrow("Invalid ticket type ID");
  });

  it("rejects when the cart does not exist", async () => {
    scenario.cartExists = false;

    await expect(
      updateCartItemQuantity(
        userId,
        ticketTypeId,
        2
      )
    ).rejects.toThrow("Cart not found");

    expectRollbackWithoutCommit();
  });

  it("rejects quantity exceeding availability", async () => {
    scenario.available = 2;

    await expect(
      updateCartItemQuantity(
        userId,
        ticketTypeId,
        3
      )
    ).rejects.toThrow(
      "Not enough tickets available"
    );

    expectRollbackWithoutCommit();
  });

  it("rejects when the cart item does not exist", async () => {
    scenario.updateRowCount = 0;

    await expect(
      updateCartItemQuantity(
        userId,
        ticketTypeId,
        2
      )
    ).rejects.toThrow("Cart item not found");

    expectRollbackWithoutCommit();
  });

  it("rolls back on database failure", async () => {
    scenario.failOn = "UPDATE cart_items";

    await expect(
      updateCartItemQuantity(
        userId,
        ticketTypeId,
        2
      )
    ).rejects.toThrow("Database failure");

    expectRollbackWithoutCommit();
    expect(mocks.release).toHaveBeenCalledOnce();
  });
});

// ======================================
// REMOVE FROM CART
// ======================================

describe("removeFromCart", () => {
  it("removes an item from the cart", async () => {
    const result = await removeFromCart(
      userId,
      ticketTypeId
    );

    expect(result.id).toBe(cartId);

    expect(mocks.query).toHaveBeenCalledWith(
      expect.stringContaining(
        "DELETE FROM cart_items"
      ),
      [cartId, ticketTypeId]
    );

    expectCommitWithoutRollback();
  });

  it("handles a missing cart without throwing", async () => {
    scenario.cartExists = false;

    const result = await removeFromCart(
      userId,
      ticketTypeId
    );

    expect(result).toEqual({
      id: null,
      items: [],
    });

    expect(
      executedSQL().some(sql =>
        sql.includes("DELETE FROM cart_items")
      )
    ).toBe(false);

    expectCommitWithoutRollback();
  });

  it("rejects an invalid user ID", async () => {
    await expect(
      removeFromCart("invalid", ticketTypeId)
    ).rejects.toThrow("Invalid user ID");

    expect(mocks.connect).not.toHaveBeenCalled();
  });

  it("rejects an invalid ticket type ID", async () => {
    await expect(
      removeFromCart(userId, "invalid")
    ).rejects.toThrow("Invalid ticket type ID");

    expect(mocks.connect).not.toHaveBeenCalled();
  });

  it("rolls back when deletion fails", async () => {
    scenario.failOn = "DELETE FROM cart_items";

    await expect(
      removeFromCart(userId, ticketTypeId)
    ).rejects.toThrow("Database failure");

    expectRollbackWithoutCommit();

    expect(mocks.release).toHaveBeenCalledOnce();
  });
});
