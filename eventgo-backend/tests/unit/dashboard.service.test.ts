
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  getDashboardData,
} from "../../src/services/dashboard.service";

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

type SaleRow = {
  ticket_id: string;
  order_id: string;
  user_id: string;
  user_name: string | null;
  email: string;
  total_amount: string;
  currency: string;
  purchased_at: Date | null;
  sale_day: string | null;
  event_id: string;
  event_title: string;
  category: string | null;
  city: string;
  starts_at: Date;
  capacity: number;
  is_demo: boolean;
};

function makeSale(
  overrides: Partial<SaleRow> = {}
): SaleRow {
  return {
    ticket_id: "ticket-1",
    order_id: "order-1",
    user_id: "user-1",
    user_name: "Alice",
    email: "alice@example.com",
    total_amount: "50.00",
    currency: "EUR",
    purchased_at: new Date(
      "2026-10-20T12:00:00Z"
    ),
    sale_day: "2026-10-20",
    event_id: "event-1",
    event_title: "Music Festival",
    category: "music",
    city: "Dortmund",
    starts_at: new Date(
      "2027-06-15T18:00:00Z"
    ),
    capacity: 100,
    is_demo: true,
    ...overrides,
  };
}

function mockSales(rows: SaleRow[]) {
  mocks.query.mockResolvedValue({
    rows,
  });
}

// ======================================
// SETUP
// ======================================

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();

  vi.setSystemTime(
    new Date("2026-10-22T12:00:00Z")
  );

  mocks.connect.mockResolvedValue({
    query: mocks.query,
    release: mocks.release,
  });

  mockSales([]);

  vi.spyOn(console, "log")
    .mockImplementation(() => {});

  vi.spyOn(console, "error")
    .mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ======================================
// DASHBOARD TESTS
// ======================================

describe("getDashboardData", () => {
  it("returns an empty dashboard", async () => {
    const result = await getDashboardData();

    expect(result.metrics).toEqual({
      totalRevenue: 0,
      ticketsSold: 0,
      totalEvents: 0,
      totalUsers: 0,
    });

    expect(result.categories).toEqual([]);
    expect(result.topEvents).toEqual([]);
    expect(result.participantEvents).toEqual([]);
    expect(result.recentEvents).toEqual([]);
    expect(result.recentParticipants).toEqual([]);

    expect(result.dailyData).toHaveLength(30);
  });

  it("calculates dashboard metrics", async () => {
    mockSales([
      makeSale(),
      makeSale({
        ticket_id: "ticket-2",
        order_id: "order-2",
        user_id: "user-2",
        total_amount: "30.00",
        event_id: "event-2",
        event_title: "Tech Conference",
        category: "technology",
      }),
    ]);

    const result = await getDashboardData();

    expect(result.metrics).toEqual({
      totalRevenue: 80,
      ticketsSold: 2,
      totalEvents: 2,
      totalUsers: 2,
    });
  });

  it("counts each order's revenue only once", async () => {
    mockSales([
      makeSale({
        ticket_id: "ticket-1",
        total_amount: "50.00",
      }),
      makeSale({
        ticket_id: "ticket-2",
        total_amount: "50.00",
      }),
      makeSale({
        ticket_id: "ticket-3",
        total_amount: "50.00",
      }),
    ]);

    const result = await getDashboardData();

    expect(result.metrics.totalRevenue).toBe(50);
    expect(result.metrics.ticketsSold).toBe(3);
    expect(result.metrics.totalUsers).toBe(1);
    expect(result.metrics.totalEvents).toBe(1);

    const day = result.dailyData.find(
      item => item.date === "2026-10-20"
    );

    expect(day).toEqual({
      date: "2026-10-20",
      revenue: 50,
      tickets: 3,
    });
  });

  it("excludes non-EUR orders from revenue", async () => {
    mockSales([
      makeSale({
        order_id: "order-eur",
        total_amount: "40.00",
      }),
      makeSale({
        ticket_id: "ticket-usd",
        order_id: "order-usd",
        total_amount: "100.00",
        currency: "USD",
      }),
    ]);

    const result = await getDashboardData();

    expect(result.metrics.totalRevenue).toBe(40);
    expect(result.metrics.ticketsSold).toBe(2);

    const day = result.dailyData.find(
      item => item.date === "2026-10-20"
    );

    expect(day?.revenue).toBe(40);
    expect(day?.tickets).toBe(2);
  });

  it("counts unique customers", async () => {
    mockSales([
      makeSale(),
      makeSale({
        ticket_id: "ticket-2",
        order_id: "order-2",
        event_id: "event-2",
      }),
      makeSale({
        ticket_id: "ticket-3",
        order_id: "order-3",
        user_id: "user-2",
      }),
    ]);

    const result = await getDashboardData();

    expect(result.metrics.totalUsers).toBe(2);
  });

  it("sorts top events by tickets sold", async () => {
    mockSales([
      makeSale({
        ticket_id: "ticket-1",
      }),
      makeSale({
        ticket_id: "ticket-2",
        order_id: "order-2",
      }),
      makeSale({
        ticket_id: "ticket-3",
        order_id: "order-3",
        event_id: "event-2",
        event_title: "Tech Conference",
      }),
    ]);

    const result = await getDashboardData();

    expect(result.topEvents).toEqual([
      {
        id: "event-1",
        title: "Music Festival",
        city: "Dortmund",
        ticketsSold: 2,
      },
      {
        id: "event-2",
        title: "Tech Conference",
        city: "Dortmund",
        ticketsSold: 1,
      },
    ]);
  });

  it("counts unique participants per event", async () => {
    mockSales([
      makeSale({
        ticket_id: "ticket-1",
      }),
      makeSale({
        ticket_id: "ticket-2",
        order_id: "order-2",
      }),
      makeSale({
        ticket_id: "ticket-3",
        order_id: "order-3",
        user_id: "user-2",
      }),
    ]);

    const result = await getDashboardData();

    expect(result.topEvents[0].ticketsSold).toBe(3);

    expect(
      result.participantEvents[0].ticketsSold
    ).toBe(2);
  });

  it("counts distinct events by category", async () => {
    mockSales([
      makeSale({
        ticket_id: "ticket-1",
      }),
      makeSale({
        ticket_id: "ticket-2",
        order_id: "order-2",
      }),
      makeSale({
        ticket_id: "ticket-3",
        order_id: "order-3",
        event_id: "event-2",
      }),
    ]);

    const result = await getDashboardData();

    expect(result.categories).toEqual([
      {
        name: "music",
        value: 2,
      },
    ]);
  });

  it("uses Other for missing categories", async () => {
    mockSales([
      makeSale({
        category: null,
      }),
    ]);

    const result = await getDashboardData();

    expect(result.categories).toEqual([
      {
        name: "Other",
        value: 1,
      },
    ]);
  });

  it("returns the most recently sold events first", async () => {
    mockSales([
      makeSale({
        ticket_id: "ticket-old",
        event_id: "event-old",
        event_title: "Old Event",
        purchased_at: new Date(
          "2026-10-18T12:00:00Z"
        ),
      }),
      makeSale({
        ticket_id: "ticket-new",
        order_id: "order-new",
        event_id: "event-new",
        event_title: "New Event",
        purchased_at: new Date(
          "2026-10-21T12:00:00Z"
        ),
      }),
    ]);

    const result = await getDashboardData();

    expect(
      result.recentEvents.map(event => event.id)
    ).toEqual(["event-new", "event-old"]);
  });

  it("maps recent event details", async () => {
    mockSales([makeSale()]);

    const result = await getDashboardData();

    expect(result.recentEvents).toEqual([
      {
        id: "event-1",
        title: "Music Festival",
        city: "Dortmund",
        category: "music",
        startsAt: "2027-06-15T18:00:00.000Z",
        capacity: 100,
        ticketsSold: 1,
        isDemo: true,
      },
    ]);
  });

  it("sorts recent participants by purchase date", async () => {
    mockSales([
      makeSale({
        ticket_id: "old-ticket",
        purchased_at: new Date(
          "2026-10-18T12:00:00Z"
        ),
      }),
      makeSale({
        ticket_id: "new-ticket",
        order_id: "order-2",
        user_id: "user-2",
        user_name: "Bob",
        purchased_at: new Date(
          "2026-10-21T12:00:00Z"
        ),
      }),
    ]);

    const result = await getDashboardData();

    expect(
      result.recentParticipants.map(
        participant => participant.id
      )
    ).toEqual(["new-ticket", "old-ticket"]);
  });

  it("handles missing participant names and dates", async () => {
    mockSales([
      makeSale({
        user_name: null,
        purchased_at: null,
        sale_day: null,
      }),
    ]);

    const result = await getDashboardData();

    expect(result.recentParticipants[0]).toEqual({
      id: "ticket-1",
      name: "Unnamed user",
      email: "alice@example.com",
      eventTitle: "Music Festival",
      purchasedAt: null,
    });

    expect(result.metrics.totalRevenue).toBe(50);
  });

  it("puts participants without purchase dates last", async () => {
    mockSales([
      makeSale({
        ticket_id: "no-date",
        purchased_at: null,
        sale_day: null,
      }),
      makeSale({
        ticket_id: "with-date",
        order_id: "order-2",
        purchased_at: new Date(
          "2026-10-21T12:00:00Z"
        ),
        sale_day: "2026-10-21",
      }),
    ]);

    const result = await getDashboardData();

    expect(
      result.recentParticipants.map(
        participant => participant.id
      )
    ).toEqual(["with-date", "no-date"]);
  });

  it("builds a 30-day calendar in Berlin time", async () => {
    const result = await getDashboardData();

    expect(result.dailyData).toHaveLength(30);

    expect(result.dailyData[0].date).toBe(
      "2026-09-23"
    );

    expect(
      result.dailyData[29].date
    ).toBe("2026-10-22");

    expect(
      result.dailyData.every(
        day =>
          day.revenue === 0 &&
          day.tickets === 0
      )
    ).toBe(true);
  });

  it("excludes sales outside the 30-day calendar", async () => {
    mockSales([
      makeSale({
        purchased_at: new Date(
          "2026-08-01T12:00:00Z"
        ),
        sale_day: "2026-08-01",
      }),
    ]);

    const result = await getDashboardData();

    expect(result.metrics.totalRevenue).toBe(50);

    expect(
      result.dailyData.reduce(
        (sum, day) => sum + day.revenue,
        0
      )
    ).toBe(0);
  });

  it("releases the database client on success", async () => {
    await getDashboardData();

    expect(mocks.connect).toHaveBeenCalledOnce();
    expect(mocks.query).toHaveBeenCalledOnce();
    expect(mocks.release).toHaveBeenCalledOnce();
  });

  it("releases the client when SQL fails", async () => {
    mocks.query.mockRejectedValue(
      new Error("Database unavailable")
    );

    await expect(
      getDashboardData()
    ).rejects.toThrow("Database unavailable");

    expect(mocks.release).toHaveBeenCalledOnce();
    expect(console.error).toHaveBeenCalled();
  });

  it("propagates connection failures", async () => {
    mocks.connect.mockRejectedValue(
      new Error("Connection failed")
    );

    await expect(
      getDashboardData()
    ).rejects.toThrow("Connection failed");

    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("queries paid and demo-paid orders", async () => {
    await getDashboardData();

    const [sql] = mocks.query.mock.calls[0];

    expect(sql).toContain(
      "o.status IN ('PAID', 'DEMO_PAID')"
    );
  });
});
