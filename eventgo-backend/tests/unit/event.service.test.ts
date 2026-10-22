
import {
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  getAllEvents,
  searchEvents,
  getRandomEvents,
  getAdminEvents,
  createEvent,
  type CreateEventInput,
} from "../../src/services/event.service";

// ======================================
// DATABASE MOCK
// ======================================

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

// ======================================
// TEST DATA
// ======================================

const cityId =
  "11111111-1111-4111-8111-111111111111";

const eventId =
  "22222222-2222-4222-8222-222222222222";

const eventRow = {
  id: eventId,
  title: "EventGo Festival",
  description: "Music event",
  category: "music",
  starts_at: new Date("2027-06-15T18:00:00Z"),
  ends_at: new Date("2027-06-15T22:00:00Z"),
  capacity: 100,
  is_demo: true,
  city_name: "Dortmund",
  country_code: "DE",
  distance_km: 5.5,
  city_latitude: 51.5136,
  city_longitude: 7.4653,
};

function validEventInput(): CreateEventInput {
  return {
    title: "EventGo Festival",
    description: "Music event",
    category: "music",
    city: "Dortmund",
    startsAt: "2027-06-15T18:00:00Z",
    endsAt: "2027-06-15T22:00:00Z",
    capacity: 100,
    tickets: [
      {
        name: "Standard",
        price: 25.5,
        quantity: 50,
      },
      {
        name: "VIP",
        price: 75,
        quantity: 20,
      },
    ],
  };
}

// ======================================
// HELPERS
// ======================================

function mockRows(rows: unknown[] = []) {
  mocks.query.mockResolvedValue({ rows });
}

function setupCreateEvent() {
  mocks.clientQuery.mockImplementation(
    async (sql: string) => {
      if (
        sql.includes("FROM cities") &&
        sql.includes("LIMIT 2")
      ) {
        return {
          rows: [{ id: cityId }],
        };
      }

      if (sql.includes("INSERT INTO events")) {
        return {
          rows: [{ id: eventId }],
        };
      }

      return {
        rows: [],
        rowCount: 1,
      };
    }
  );
}

function transactionCommands(): string[] {
  return mocks.clientQuery.mock.calls.map(
    ([sql]) => sql as string
  );
}

function expectRollback() {
  expect(transactionCommands()).toContain("ROLLBACK");
  expect(transactionCommands()).not.toContain("COMMIT");
  expect(mocks.release).toHaveBeenCalledOnce();
}

function expectCommit() {
  expect(transactionCommands()).toContain("COMMIT");
  expect(transactionCommands()).not.toContain("ROLLBACK");
  expect(mocks.release).toHaveBeenCalledOnce();
}

function lastSearchQuery() {
  const [sql, values] = mocks.query.mock.calls[0];

  return {
    sql: sql as string,
    values: values as unknown[],
  };
}

// ======================================
// SETUP
// ======================================

beforeEach(() => {
  vi.resetAllMocks();

  mocks.query.mockResolvedValue({
    rows: [],
  });

  mocks.connect.mockResolvedValue({
    query: mocks.clientQuery,
    release: mocks.release,
  });

  setupCreateEvent();
});

afterEach(() => {
  vi.useRealTimers();
});

// ======================================
// GET ALL EVENTS
// ======================================

describe("getAllEvents", () => {
  it("returns events from database", async () => {
    mockRows([eventRow]);

    const result = await getAllEvents();

    expect(result).toEqual([eventRow]);
  });

  it("returns an empty array when no events exist", async () => {
    mockRows([]);

    const result = await getAllEvents();

    expect(result).toEqual([]);
  });

  it("requests upcoming events with a limit of 20", async () => {
    await getAllEvents();

    const [sql] = mocks.query.mock.calls[0];

    expect(sql).toContain("FROM events");
    expect(sql).toContain("starts_at >= NOW()");
    expect(sql).toContain("ORDER BY starts_at ASC");
    expect(sql).toContain("LIMIT 20");
  });

  it("propagates database errors", async () => {
    mocks.query.mockRejectedValue(
      new Error("Database unavailable")
    );

    await expect(
      getAllEvents()
    ).rejects.toThrow("Database unavailable");
  });
});

// ======================================
// SEARCH EVENTS
// ======================================

describe("searchEvents", () => {
  it("uses default pagination", async () => {
    const result = await searchEvents();

    expect(result).toEqual({
      events: [],
      page: 1,
      pageSize: 20,
      hasMore: false,
    });

    const { values } = lastSearchQuery();

    expect(values).toEqual([21, 0]);
  });

  it("returns matching events", async () => {
    mockRows([eventRow]);

    const result = await searchEvents();

    expect(result.events).toEqual([eventRow]);
    expect(result.hasMore).toBe(false);
  });

  it("detects when more pages are available", async () => {
    mockRows(
      Array.from({ length: 21 }, (_, index) => ({
        ...eventRow,
        id: `event-${index}`,
      }))
    );

    const result = await searchEvents();

    expect(result.events).toHaveLength(20);
    expect(result.hasMore).toBe(true);
  });

  it("calculates pagination offset correctly", async () => {
    const result = await searchEvents({
      page: 3,
      pageSize: 10,
    });

    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(10);

    const { values } = lastSearchQuery();

    expect(values).toEqual([11, 20]);
  });

  it.each([
    0,
    -1,
    NaN,
    Infinity,
    501,
  ])("rejects invalid radius %s", async radius => {
    await expect(
      searchEvents({ radius })
    ).rejects.toThrow("Invalid radius");

    expect(mocks.query).not.toHaveBeenCalled();
  });

  it.each([
    0,
    -1,
    1.5,
    NaN,
    Infinity,
  ])("rejects invalid page %s", async page => {
    await expect(
      searchEvents({ page })
    ).rejects.toThrow("Invalid page");

    expect(mocks.query).not.toHaveBeenCalled();
  });

  it.each([
    0,
    -1,
    1.5,
    51,
    NaN,
    Infinity,
  ])(
    "rejects invalid page size %s",
    async pageSize => {
      await expect(
        searchEvents({ pageSize })
      ).rejects.toThrow("Invalid page size");

      expect(mocks.query).not.toHaveBeenCalled();
    }
  );

  it("accepts maximum radius of 500 km", async () => {
    await searchEvents({
      city: "Dortmund",
      radius: 500,
    });

    const { values } = lastSearchQuery();

    expect(values).toContain(500);
  });

  it("accepts maximum page size of 50", async () => {
    const result = await searchEvents({
      pageSize: 50,
    });

    expect(result.pageSize).toBe(50);

    const { values } = lastSearchQuery();

    expect(values).toEqual([51, 0]);
  });

  it("rejects invalid categories", async () => {
    await expect(
      searchEvents({
        category: "unknown" as never,
      })
    ).rejects.toThrow("Invalid category");

    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("accepts a valid category", async () => {
    await searchEvents({
      category: "music",
    });

    const { sql, values } = lastSearchQuery();

    expect(sql).toContain("e.category = $1");
    expect(values).toEqual(["music", 21, 0]);
  });

  it("does not filter category when all is selected", async () => {
    await searchEvents({
      category: "all",
    });

    const { sql } = lastSearchQuery();

    expect(sql).not.toContain(
      "e.category = $"
    );
  });

  it("rejects search queries longer than 200 characters", async () => {
    await expect(
      searchEvents({
        q: "x".repeat(201),
      })
    ).rejects.toThrow(
      "Search query is too long"
    );

    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("trims search keywords", async () => {
    await searchEvents({
      q: "  Festival  ",
    });

    const { sql, values } = lastSearchQuery();

    expect(values).toContain("%Festival%");
    expect(sql).toContain("e.title ILIKE");
    expect(sql).toContain("e.description ILIKE");
  });

  it("uses parameterized search values", async () => {
    const keyword = "' OR 1=1 --";

    await searchEvents({ q: keyword });

    const { sql, values } = lastSearchQuery();

    expect(values).toContain(`%${keyword}%`);
    expect(sql).not.toContain(keyword);
  });

  it("filters events by city and radius", async () => {
    await searchEvents({
      city: "Dortmund",
      radius: 25,
    });

    const { sql, values } = lastSearchQuery();

    expect(values).toEqual([
      "Dortmund",
      25,
      21,
      0,
    ]);

    expect(sql).toContain("WITH origin AS");
    expect(sql).toContain("nearby_cities AS");
    expect(sql).toContain("nc.distance_km <=");
    expect(sql).toContain("6371 * ACOS");
  });

  it("trims city input", async () => {
    await searchEvents({
      city: "  Dortmund  ",
    });

    const { values } = lastSearchQuery();

    expect(values[0]).toBe("Dortmund");
  });

  it("does not calculate distance without city", async () => {
    await searchEvents();

    const { sql } = lastSearchQuery();

    expect(sql).toContain(
      "NULL::numeric AS distance_km"
    );

    expect(sql).not.toContain(
      "WITH origin AS"
    );
  });

  it("filters only upcoming demo events", async () => {
    await searchEvents();

    const { sql } = lastSearchQuery();

    expect(sql).toContain(
      "e.starts_at >= NOW()"
    );

    expect(sql).toContain(
      "e.is_demo = TRUE"
    );
  });

  it("rejects invalid date strings", async () => {
    await expect(
      searchEvents({
        date: "2027-02-30",
      })
    ).rejects.toThrow("Invalid date");

    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("rejects invalid date formats", async () => {
    await expect(
      searchEvents({
        date: "15-06-2027",
      })
    ).rejects.toThrow("Invalid date");
  });

  it("filters by a specific date", async () => {
    await searchEvents({
      date: "2027-06-15",
    });

    const { sql, values } = lastSearchQuery();

    expect(values).toEqual([
      "2027-06-15",
      "2027-06-16",
      21,
      0,
    ]);

    expect(sql).toContain(
      "Europe/Berlin"
    );
  });

  it("does not apply date filtering for all", async () => {
    await searchEvents({
      date: "all",
    });

    const { sql, values } = lastSearchQuery();

    expect(values).toEqual([21, 0]);

    expect(sql).not.toContain(
      "AT TIME ZONE"
    );
  });

  it("calculates today using Berlin timezone", async () => {
    vi.useFakeTimers();

    vi.setSystemTime(
      new Date("2026-10-22T12:00:00Z")
    );

    await searchEvents({
      date: "today",
    });

    const { values } = lastSearchQuery();

    expect(values).toEqual([
      "2026-10-22",
      "2026-10-23",
      21,
      0,
    ]);
  });

  it("calculates tomorrow correctly", async () => {
    vi.useFakeTimers();

    vi.setSystemTime(
      new Date("2026-10-22T12:00:00Z")
    );

    await searchEvents({
      date: "tomorrow",
    });

    const { values } = lastSearchQuery();

    expect(values).toEqual([
      "2026-10-23",
      "2026-10-24",
      21,
      0,
    ]);
  });

  it("calculates the upcoming weekend", async () => {
    vi.useFakeTimers();

    vi.setSystemTime(
      new Date("2026-10-22T12:00:00Z")
    );

    await searchEvents({
      date: "weekend",
    });

    const { values } = lastSearchQuery();

    expect(values).toEqual([
      "2026-10-24",
      "2026-10-26",
      21,
      0,
    ]);
  });

  it("rejects pagination offset overflow", async () => {
    await expect(
      searchEvents({
        page: Number.MAX_SAFE_INTEGER,
        pageSize: 50,
      })
    ).rejects.toThrow("Invalid page");
  });

  it("propagates database errors", async () => {
    mocks.query.mockRejectedValue(
      new Error("Database unavailable")
    );

    await expect(
      searchEvents()
    ).rejects.toThrow("Database unavailable");
  });
});

// ======================================
// RANDOM EVENTS
// ======================================

describe("getRandomEvents", () => {
  it("returns random event results", async () => {
    mockRows([eventRow]);

    const result = await getRandomEvents();

    expect(result).toEqual([eventRow]);
  });

  it("uses default limit of 12", async () => {
    await getRandomEvents();

    expect(mocks.query).toHaveBeenCalledWith(
      expect.any(String),
      [12, null]
    );
  });

  it("accepts a valid category", async () => {
    await getRandomEvents(8, "music");

    expect(mocks.query).toHaveBeenCalledWith(
      expect.any(String),
      [8, "music"]
    );
  });

  it.each([
    0,
    -1,
    1.5,
    25,
    NaN,
    Infinity,
  ])("rejects invalid limit %s", async limit => {
    await expect(
      getRandomEvents(limit)
    ).rejects.toThrow("Invalid event limit");

    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("rejects unsupported categories", async () => {
    await expect(
      getRandomEvents(12, "invalid" as never)
    ).rejects.toThrow("Invalid category");

    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("filters upcoming demo events", async () => {
    await getRandomEvents();

    const [sql] = mocks.query.mock.calls[0];

    expect(sql).toContain(
      "e.starts_at >= NOW()"
    );

    expect(sql).toContain(
      "e.is_demo = TRUE"
    );
  });

  it("propagates database errors", async () => {
    mocks.query.mockRejectedValue(
      new Error("Database unavailable")
    );

    await expect(
      getRandomEvents()
    ).rejects.toThrow("Database unavailable");
  });
});

// ======================================
// ADMIN EVENTS
// ======================================

describe("getAdminEvents", () => {
  it("returns admin event data", async () => {
    mockRows([eventRow]);

    const result = await getAdminEvents();

    expect(result).toEqual([eventRow]);
  });

  it("returns empty results", async () => {
    mockRows([]);

    const result = await getAdminEvents();

    expect(result).toEqual([]);
  });

  it("requests up to 100 events", async () => {
    await getAdminEvents();

    const [sql] = mocks.query.mock.calls[0];

    expect(sql).toContain("LIMIT 100");
    expect(sql).toContain(
      "ORDER BY e.starts_at DESC"
    );
  });

  it("propagates database errors", async () => {
    mocks.query.mockRejectedValue(
      new Error("Database unavailable")
    );

    await expect(
      getAdminEvents()
    ).rejects.toThrow("Database unavailable");
  });
});

// ======================================
// CREATE EVENT
// ======================================

describe("createEvent", () => {
  it("creates an event and ticket types", async () => {
    const result = await createEvent(
      validEventInput()
    );

    expect(result).toEqual({
      success: true,
      eventId,
    });

    const sql = transactionCommands();

    expect(
      sql.filter(query =>
        query.includes("INSERT INTO events")
      )
    ).toHaveLength(1);

    expect(
      sql.filter(query =>
        query.includes("INSERT INTO ticket_types")
      )
    ).toHaveLength(2);

    expectCommit();
  });

  it("trims title, city and ticket names", async () => {
    const input = validEventInput();

    input.title = "  EventGo Festival  ";
    input.city = "  Dortmund  ";
    input.tickets[0].name = "  Standard  ";

    await createEvent(input);

    expect(mocks.clientQuery).toHaveBeenCalledWith(
      expect.stringContaining("FROM cities"),
      ["Dortmund"]
    );

    const eventInsert = mocks.clientQuery.mock.calls.find(
      ([sql]) =>
        (sql as string).includes("INSERT INTO events")
    );

    expect(eventInsert?.[1]).toContain(
      "EventGo Festival"
    );

    const ticketInsert = mocks.clientQuery.mock.calls.find(
      ([sql]) =>
        (sql as string).includes(
          "INSERT INTO ticket_types"
        )
    );

    expect(ticketInsert?.[1]).toContain("Standard");
  });

  it("rejects empty event title", async () => {
    const input = validEventInput();
    input.title = "   ";

    await expect(
      createEvent(input)
    ).rejects.toThrow(
      "Event title and city are required."
    );

    expect(mocks.connect).not.toHaveBeenCalled();
  });

  it("rejects empty city", async () => {
    const input = validEventInput();
    input.city = "";

    await expect(
      createEvent(input)
    ).rejects.toThrow(
      "Event title and city are required."
    );

    expect(mocks.connect).not.toHaveBeenCalled();
  });

  it("rejects invalid start date", async () => {
    const input = validEventInput();
    input.startsAt = "invalid-date";

    await expect(
      createEvent(input)
    ).rejects.toThrow("Invalid start date.");
  });

  it("rejects invalid end date", async () => {
    const input = validEventInput();
    input.endsAt = "invalid-date";

    await expect(
      createEvent(input)
    ).rejects.toThrow("Invalid end date.");
  });

  it("rejects end date before start date", async () => {
    const input = validEventInput();
    input.endsAt = "2027-06-14T18:00:00Z";

    await expect(
      createEvent(input)
    ).rejects.toThrow(
      "End date must be after start date."
    );
  });

  it("accepts an event without end date", async () => {
    const input = validEventInput();
    input.endsAt = null;

    const result = await createEvent(input);

    expect(result.success).toBe(true);
    expectCommit();
  });

  it.each([
    -1,
    1.5,
    NaN,
    Infinity,
  ])(
    "rejects invalid event capacity %s",
    async capacity => {
      const input = validEventInput();
      input.capacity = capacity;

      await expect(
        createEvent(input)
      ).rejects.toThrow(
        "Invalid event capacity."
      );
    }
  );

  it("rejects an empty ticket types array", async () => {
    const input = validEventInput();
    input.tickets = [];

    await expect(
      createEvent(input)
    ).rejects.toThrow(
      "At least one ticket type is required."
    );
  });

  it("rejects empty ticket names", async () => {
    const input = validEventInput();
    input.tickets[0].name = "";

    await expect(
      createEvent(input)
    ).rejects.toThrow(
      "Invalid ticket information."
    );
  });

  it.each([
    -1,
    NaN,
    Infinity,
  ])(
    "rejects invalid ticket price %s",
    async price => {
      const input = validEventInput();
      input.tickets[0].price = price;

      await expect(
        createEvent(input)
      ).rejects.toThrow(
        "Invalid ticket information."
      );
    }
  );

  it.each([
    -1,
    1.5,
    NaN,
    Infinity,
  ])(
    "rejects invalid ticket quantity %s",
    async quantity => {
      const input = validEventInput();
      input.tickets[0].quantity = quantity;

      await expect(
        createEvent(input)
      ).rejects.toThrow(
        "Invalid ticket information."
      );
    }
  );

  it("rejects ticket quantities exceeding capacity", async () => {
    const input = validEventInput();

    input.capacity = 10;

    await expect(
      createEvent(input)
    ).rejects.toThrow(
      "Total ticket quantity cannot exceed event capacity."
    );

    expect(mocks.connect).not.toHaveBeenCalled();
  });

  it("accepts ticket quantities equal to capacity", async () => {
    const input = validEventInput();

    input.capacity = 70;

    const result = await createEvent(input);

    expect(result.success).toBe(true);
    expectCommit();
  });

  it("rejects a city not found in database", async () => {
    mocks.clientQuery.mockImplementation(
      async (sql: string) => {
        if (sql.includes("FROM cities")) {
          return { rows: [] };
        }

        return { rows: [] };
      }
    );

    await expect(
      createEvent(validEventInput())
    ).rejects.toThrow(
      "City not found in the database."
    );

    expectRollback();
  });

  it("rejects ambiguous city names", async () => {
    mocks.clientQuery.mockImplementation(
      async (sql: string) => {
        if (sql.includes("FROM cities")) {
          return {
            rows: [
              { id: cityId },
              { id: "another-city" },
            ],
          };
        }

        return { rows: [] };
      }
    );

    await expect(
      createEvent(validEventInput())
    ).rejects.toThrow(
      "Multiple cities have this name."
    );

    expectRollback();
  });

  it("rolls back when inserting event fails", async () => {
    mocks.clientQuery.mockImplementation(
      async (sql: string) => {
        if (sql.includes("FROM cities")) {
          return {
            rows: [{ id: cityId }],
          };
        }

        if (sql.includes("INSERT INTO events")) {
          throw new Error("Insert event failed");
        }

        return { rows: [] };
      }
    );

    await expect(
      createEvent(validEventInput())
    ).rejects.toThrow("Insert event failed");

    expectRollback();
  });

  it("rolls back when inserting ticket type fails", async () => {
    mocks.clientQuery.mockImplementation(
      async (sql: string) => {
        if (sql.includes("FROM cities")) {
          return {
            rows: [{ id: cityId }],
          };
        }

        if (sql.includes("INSERT INTO events")) {
          return {
            rows: [{ id: eventId }],
          };
        }

        if (
          sql.includes("INSERT INTO ticket_types")
        ) {
          throw new Error("Ticket insertion failed");
        }

        return { rows: [] };
      }
    );

    await expect(
      createEvent(validEventInput())
    ).rejects.toThrow(
      "Ticket insertion failed"
    );

    expectRollback();
  });

  it("starts and commits the database transaction", async () => {
    await createEvent(validEventInput());

    const commands = transactionCommands();

    expect(commands[0]).toBe("BEGIN");
    expect(commands.at(-1)).toBe("COMMIT");

    expectCommit();
  });

  it("releases the connection after failure", async () => {
    mocks.clientQuery.mockRejectedValueOnce(
      new Error("Transaction failed")
    );

    await expect(
      createEvent(validEventInput())
    ).rejects.toThrow("Transaction failed");

    expect(mocks.release).toHaveBeenCalledOnce();
  });

  it("stores non-demo events", async () => {
    await createEvent(validEventInput());

    const sql = transactionCommands().find(
      query =>
        query.includes("INSERT INTO events")
    );

    expect(sql).toContain("false");
  });

  it("uses EUR as ticket currency", async () => {
    await createEvent(validEventInput());

    const ticketQueries =
      transactionCommands().filter(
        sql => sql.includes("INSERT INTO ticket_types")
      );

    expect(ticketQueries).toHaveLength(2);

    for (const sql of ticketQueries) {
      expect(sql).toContain("'EUR'");
    }
  });
});
