
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  getAdminTicketTypes,
  getEventTicketTypes,
} from "../../src/services/ticket-type.service";

// ======================================
// DATABASE MOCK
// ======================================

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
}));

vi.mock("../../src/db/database", () => ({
  pool: {
    query: mocks.query,
  },
}));

// ======================================
// TEST DATA
// ======================================

const eventId =
  "11111111-1111-4111-8111-111111111111";

const ticketTypeId =
  "22222222-2222-4222-8222-222222222222";

const adminRow = {
  id: ticketTypeId,
  event_id: eventId,
  event_title: "EventGo Festival",
  name: "Standard",
  price: "25.50",
  currency: "EUR",
  quantity: 100,
  sold: "30",
};

const eventRow = {
  id: ticketTypeId,
  event_id: eventId,
  name: "Standard",
  price: "25.50",
  currency: "EUR",
  quantity: 100,
  sold: "30",
};

// ======================================
// MOCK HELPERS
// ======================================

function mockAdminResults(
  rows: typeof adminRow[] = [adminRow],
  total = "1"
) {
  mocks.query
    .mockResolvedValueOnce({
      rows,
    })
    .mockResolvedValueOnce({
      rows: [{ total }],
    });
}

function mockEventResults(
  rows: typeof eventRow[] = [eventRow]
) {
  mocks.query.mockResolvedValue({
    rows,
  });
}

// ======================================
// SETUP
// ======================================

beforeEach(() => {
  vi.resetAllMocks();
});

// ======================================
// ADMIN TICKET TYPES
// ======================================

describe("getAdminTicketTypes", () => {
  it("returns mapped ticket types", async () => {
    mockAdminResults();

    const result = await getAdminTicketTypes();

    expect(result.ticketTypes).toEqual([
      {
        id: ticketTypeId,
        eventId,
        eventTitle: "EventGo Festival",
        name: "Standard",
        price: 25.5,
        currency: "EUR",
        quantity: 100,
        sold: 30,
        available: 70,
      },
    ]);

    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.totalPages).toBe(1);
  });

  it("calculates available tickets correctly", async () => {
    mockAdminResults();

    const result = await getAdminTicketTypes();

    expect(result.ticketTypes[0].available).toBe(70);
  });

  it("never returns negative availability", async () => {
    mockAdminResults([
      {
        ...adminRow,
        quantity: 10,
        sold: "15",
      },
    ]);

    const result = await getAdminTicketTypes();

    expect(result.ticketTypes[0].available).toBe(0);
  });

  it("returns empty results", async () => {
    mockAdminResults([], "0");

    const result = await getAdminTicketTypes();

    expect(result).toEqual({
      ticketTypes: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    });
  });

  it("calculates pagination correctly", async () => {
    mockAdminResults([adminRow], "45");

    const result = await getAdminTicketTypes(2);

    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(20);
    expect(result.total).toBe(45);
    expect(result.totalPages).toBe(3);

    expect(mocks.query).toHaveBeenCalledWith(
      expect.stringContaining("LIMIT $3 OFFSET $4"),
      ["", "%%", 20, 20]
    );
  });

  it("uses the correct offset for page 3", async () => {
    mockAdminResults();

    await getAdminTicketTypes(3);

    expect(mocks.query).toHaveBeenCalledWith(
      expect.any(String),
      ["", "%%", 20, 40]
    );
  });

  it.each([
    0,
    -1,
    1.5,
    NaN,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
  ])(
    "rejects invalid page %s",
    async (page) => {
      await expect(
        getAdminTicketTypes(page)
      ).rejects.toThrow("Invalid page.");

      expect(mocks.query).not.toHaveBeenCalled();
    }
  );

  it("rejects pagination offset overflow", async () => {
    const veryLargePage =
      Number.MAX_SAFE_INTEGER;

    await expect(
      getAdminTicketTypes(veryLargePage)
    ).rejects.toThrow("Invalid page.");

    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("trims search input", async () => {
    mockAdminResults();

    await getAdminTicketTypes(
      1,
      "  Festival  "
    );

    expect(mocks.query).toHaveBeenCalledWith(
      expect.any(String),
      ["Festival", "%Festival%", 20, 0]
    );

    expect(mocks.query).toHaveBeenCalledWith(
      expect.any(String),
      ["Festival", "%Festival%"]
    );
  });

  it("rejects search longer than 200 characters", async () => {
    await expect(
      getAdminTicketTypes(
        1,
        "x".repeat(201)
      )
    ).rejects.toThrow("Search is too long.");

    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("accepts search of exactly 200 characters", async () => {
    mockAdminResults();

    const search = "x".repeat(200);

    await getAdminTicketTypes(1, search);

    expect(mocks.query).toHaveBeenCalledTimes(2);
  });

  it("uses parameterized SQL queries", async () => {
    mockAdminResults();

    const search = "' OR 1=1 --";

    await getAdminTicketTypes(1, search);

    expect(mocks.query).toHaveBeenCalledWith(
      expect.any(String),
      [search, `%${search}%`, 20, 0]
    );
  });

  it("propagates database failures", async () => {
    mocks.query.mockRejectedValue(
      new Error("Database unavailable")
    );

    await expect(
      getAdminTicketTypes()
    ).rejects.toThrow("Database unavailable");
  });
});

// ======================================
// EVENT TICKET TYPES
// ======================================

describe("getEventTicketTypes", () => {
  it("returns mapped event ticket types", async () => {
    mockEventResults();

    const result = await getEventTicketTypes(
      eventId
    );

    expect(result).toEqual([
      {
        id: ticketTypeId,
        eventId,
        name: "Standard",
        price: 25.5,
        currency: "EUR",
        quantity: 100,
        sold: 30,
        available: 70,
      },
    ]);
  });

  it("calculates availability correctly", async () => {
    mockEventResults();

    const result = await getEventTicketTypes(
      eventId
    );

    expect(result[0].available).toBe(70);
  });

  it("never returns negative availability", async () => {
    mockEventResults([
      {
        ...eventRow,
        quantity: 10,
        sold: "15",
      },
    ]);

    const result = await getEventTicketTypes(
      eventId
    );

    expect(result[0].available).toBe(0);
  });

  it("returns an empty array when no ticket types exist", async () => {
    mockEventResults([]);

    const result = await getEventTicketTypes(
      eventId
    );

    expect(result).toEqual([]);
  });

  it.each([
    "",
    "invalid",
    "123",
    "not-a-uuid",
    "11111111-1111-1111-1111",
  ])(
    "rejects invalid event ID %s",
    async (invalidId) => {
      await expect(
        getEventTicketTypes(invalidId)
      ).rejects.toThrow("Invalid event ID");

      expect(mocks.query).not.toHaveBeenCalled();
    }
  );

  it("accepts uppercase UUID characters", async () => {
    mockEventResults();

    const uppercaseId =
      "AAAAAAAA-BBBB-4CCC-8DDD-EEEEEEEEEEEE";

    await getEventTicketTypes(uppercaseId);

    expect(mocks.query).toHaveBeenCalledWith(
      expect.any(String),
      [uppercaseId]
    );
  });

  it("filters ticket types by event ID", async () => {
    mockEventResults();

    await getEventTicketTypes(eventId);

    expect(mocks.query).toHaveBeenCalledWith(
      expect.stringContaining(
        "WHERE tt.event_id = $1"
      ),
      [eventId]
    );
  });

  it("requests tickets for upcoming events", async () => {
    mockEventResults();

    await getEventTicketTypes(eventId);

    const [sql] = mocks.query.mock.calls[0];

    expect(sql).toContain(
      "e.starts_at >= NOW()"
    );
  });

  it("counts sold tickets from paid orders", async () => {
    mockEventResults();

    await getEventTicketTypes(eventId);

    const [sql] = mocks.query.mock.calls[0];

    expect(sql).toContain(
      "o.status IN ('PAID', 'DEMO_PAID')"
    );
  });

  it("propagates database errors", async () => {
    mocks.query.mockRejectedValue(
      new Error("Database unavailable")
    );

    await expect(
      getEventTicketTypes(eventId)
    ).rejects.toThrow("Database unavailable");
  });
});
