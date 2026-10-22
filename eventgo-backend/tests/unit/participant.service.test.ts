
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  getParticipants,
  getParticipantEvents,
} from "../../src/services/participant.service";

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

const participantRow = {
  ticket_id: "ticket-123",
  participant_name: "Omar",
  email: "omar@example.com",
  event_id: eventId,
  event_title: "EventGo Festival",
  ticket_type: "Standard",
  ticket_status: "ISSUED",
  order_status: "DEMO_PAID",
  purchased_at: new Date("2026-10-20T12:00:00Z"),
};

const expectedParticipant = {
  ...participantRow,
  purchased_at: "2026-10-20T12:00:00.000Z",
};

// ======================================
// MOCK HELPERS
// ======================================

function mockParticipantsResults(
  rows: Array<typeof participantRow> = [
    participantRow,
  ],
  total = "1"
) {
  // Promise.all starts queries in this order:
  // 1. Count
  // 2. Participants
  // 3. Statistics

  mocks.query
    .mockResolvedValueOnce({
      rows: [{ total }],
    })
    .mockResolvedValueOnce({
      rows,
    })
    .mockResolvedValueOnce({
      rows: [{
        total_participants: "15",
        total_tickets: "30",
        events_with_participants: "5",
      }],
    });
}

function getQueries() {
  return mocks.query.mock.calls.map(
    ([sql, params]) => ({
      sql: sql as string,
      params: params as unknown[] | undefined,
    })
  );
}

// ======================================
// SETUP
// ======================================

beforeEach(() => {
  vi.resetAllMocks();
});

// ======================================
// GET PARTICIPANTS
// ======================================

describe("getParticipants", () => {
  it("returns participants and statistics", async () => {
    mockParticipantsResults();

    const result = await getParticipants();

    expect(result).toEqual({
      participants: [expectedParticipant],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      totalParticipants: 15,
      totalTickets: 30,
      eventsWithParticipants: 5,
    });
  });

  it("returns empty participants", async () => {
    mockParticipantsResults([], "0");

    const result = await getParticipants();

    expect(result.participants).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it("converts purchase date to ISO format", async () => {
    mockParticipantsResults();

    const result = await getParticipants();

    expect(
      result.participants[0].purchased_at
    ).toBe("2026-10-20T12:00:00.000Z");
  });

  it("preserves a null purchase date", async () => {
    mockParticipantsResults([
      {
        ...participantRow,
        purchased_at: null as never,
      },
    ]);

    const result = await getParticipants();

    expect(
      result.participants[0].purchased_at
    ).toBeNull();
  });

  it("calculates pagination correctly", async () => {
    mockParticipantsResults([participantRow], "45");

    const result = await getParticipants(2);

    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(20);
    expect(result.total).toBe(45);
    expect(result.totalPages).toBe(3);

    expect(mocks.query).toHaveBeenCalledWith(
      expect.stringContaining("LIMIT $4 OFFSET $5"),
      ["", "%%", null, 20, 20]
    );
  });

  it.each([
    0,
    -1,
    1.5,
    NaN,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
  ])("rejects invalid page %s", async page => {
    await expect(
      getParticipants(page)
    ).rejects.toThrow("Invalid page.");

    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("rejects pagination offset overflow", async () => {
    await expect(
      getParticipants(Number.MAX_SAFE_INTEGER)
    ).rejects.toThrow("Invalid page.");

    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("trims search input", async () => {
    mockParticipantsResults();

    await getParticipants(1, "  Omar  ");

    const queries = getQueries();

    expect(queries[0].params).toEqual([
      "Omar",
      "%Omar%",
      null,
    ]);

    expect(queries[1].params).toEqual([
      "Omar",
      "%Omar%",
      null,
      20,
      0,
    ]);
  });

  it("rejects search longer than 200 characters", async () => {
    await expect(
      getParticipants(1, "x".repeat(201))
    ).rejects.toThrow("Search is too long.");

    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("accepts search of exactly 200 characters", async () => {
    mockParticipantsResults();

    await getParticipants(1, "x".repeat(200));

    expect(mocks.query).toHaveBeenCalledTimes(3);
  });

  it("uses parameterized search values", async () => {
    mockParticipantsResults();

    const search = "' OR 1=1 --";

    await getParticipants(1, search);

    const queries = getQueries();

    expect(queries[1].params).toContain(
      `%${search}%`
    );

    expect(queries[1].sql).not.toContain(search);
  });

  it("filters participants by event ID", async () => {
    mockParticipantsResults();

    await getParticipants(1, "", eventId);

    const queries = getQueries();

    expect(queries[0].params).toEqual([
      "",
      "%%",
      eventId,
    ]);

    expect(queries[1].sql).toContain(
      "e.id = $3::uuid"
    );

    expect(queries[1].params).toEqual([
      "",
      "%%",
      eventId,
      20,
      0,
    ]);
  });

  it.each([
    "invalid",
    "123",
    "not-a-uuid",
    "11111111-1111-1111",
  ])("rejects invalid event ID %s", async id => {
    await expect(
      getParticipants(1, "", id)
    ).rejects.toThrow("Invalid event ID.");

    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("accepts uppercase UUIDs", async () => {
    mockParticipantsResults();

    const uppercaseId =
      "AAAAAAAA-BBBB-4CCC-8DDD-EEEEEEEEEEEE";

    await getParticipants(1, "", uppercaseId);

    expect(mocks.query).toHaveBeenCalledTimes(3);
  });

  it("searches name, email and event title", async () => {
    mockParticipantsResults();

    await getParticipants(1, "Festival");

    const sql = getQueries()[1].sql;

    expect(sql).toContain("u.name ILIKE $2");
    expect(sql).toContain("u.email ILIKE $2");
    expect(sql).toContain("e.title ILIKE $2");
  });

  it("calculates global statistics", async () => {
    mockParticipantsResults();

    await getParticipants(1, "Omar", eventId);

    const statsQuery = getQueries()[2];

    expect(statsQuery.sql).toContain(
      "COUNT(DISTINCT u.id)"
    );

    expect(statsQuery.sql).toContain(
      "COUNT(*) AS total_tickets"
    );

    expect(statsQuery.sql).toContain(
      "COUNT(DISTINCT e.id)"
    );

    // Current behavior: statistics are global,
    // not limited by search or event filters.
    expect(statsQuery.params).toBeUndefined();
  });

  it("uses stable ordering for pagination", async () => {
    mockParticipantsResults();

    await getParticipants();

    const sql = getQueries()[1].sql;

    expect(sql).toContain(
      "o.created_at DESC NULLS LAST"
    );

    expect(sql).toContain("t.id DESC");
  });

  it("propagates database errors", async () => {
    mocks.query.mockRejectedValue(
      new Error("Database unavailable")
    );

    await expect(
      getParticipants()
    ).rejects.toThrow("Database unavailable");
  });
});

// ======================================
// GET PARTICIPANT EVENTS
// ======================================

describe("getParticipantEvents", () => {
  it("returns events with tickets", async () => {
    const events = [
      {
        id: eventId,
        title: "EventGo Festival",
      },
    ];

    mocks.query.mockResolvedValue({
      rows: events,
    });

    const result = await getParticipantEvents();

    expect(result).toEqual(events);
  });

  it("returns an empty array when no events exist", async () => {
    mocks.query.mockResolvedValue({
      rows: [],
    });

    const result = await getParticipantEvents();

    expect(result).toEqual([]);
  });

  it("selects distinct events", async () => {
    mocks.query.mockResolvedValue({
      rows: [],
    });

    await getParticipantEvents();

    const sql = getQueries()[0].sql;

    expect(sql).toContain("SELECT DISTINCT");
    expect(sql).toContain("FROM events e");
    expect(sql).toContain(
      "JOIN tickets t"
    );
  });

  it("orders events by title and ID", async () => {
    mocks.query.mockResolvedValue({
      rows: [],
    });

    await getParticipantEvents();

    const sql = getQueries()[0].sql;

    expect(sql).toContain(
      "ORDER BY e.title, e.id"
    );
  });

  it("propagates database errors", async () => {
    mocks.query.mockRejectedValue(
      new Error("Database unavailable")
    );

    await expect(
      getParticipantEvents()
    ).rejects.toThrow("Database unavailable");
  });
});
