
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  getSalesOverview,
  getDailyRevenue,
  getDailyTicketSales,
  getEventsByCategory,
  getMostPopularEvents,
  getUserGrowth,
  getSalesHeatmap,
} from "../../src/services/analytics.service";

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

function mockRows(rows: unknown[]) {
  mocks.query.mockResolvedValue({ rows });
}

function getSQL(): string {
  return mocks.query.mock.calls[0][0] as string;
}

beforeEach(() => {
  vi.resetAllMocks();
});

// ======================================
// SALES OVERVIEW
// ======================================

describe("getSalesOverview", () => {
  it("returns sales metrics as numbers", async () => {
    mockRows([
      {
        total_orders: "12",
        total_revenue: "1499.50",
        tickets_sold: "35",
      },
    ]);

    const result = await getSalesOverview();

    expect(result).toEqual({
      totalOrders: 12,
      totalRevenue: 1499.5,
      ticketsSold: 35,
    });
  });

  it("returns zeros when there are no sales", async () => {
    mockRows([
      {
        total_orders: "0",
        total_revenue: "0",
        tickets_sold: "0",
      },
    ]);

    expect(await getSalesOverview()).toEqual({
      totalOrders: 0,
      totalRevenue: 0,
      ticketsSold: 0,
    });
  });

  it("counts orders and tickets separately", async () => {
    mockRows([
      {
        total_orders: "1",
        total_revenue: "60.00",
        tickets_sold: "3",
      },
    ]);

    const result = await getSalesOverview();

    expect(result.totalOrders).toBe(1);
    expect(result.ticketsSold).toBe(3);
    expect(result.totalRevenue).toBe(60);
  });

  it("filters demo-paid EUR orders", async () => {
    mockRows([
      {
        total_orders: "0",
        total_revenue: "0",
        tickets_sold: "0",
      },
    ]);

    await getSalesOverview();

    const sql = getSQL();

    expect(sql).toContain("status = 'DEMO_PAID'");
    expect(sql).toContain("currency = 'EUR'");
    expect(sql).toContain(
      "o.status = 'DEMO_PAID'"
    );
    expect(sql).toContain(
      "o.currency = 'EUR'"
    );
  });

  it("propagates database errors", async () => {
    mocks.query.mockRejectedValue(
      new Error("Database unavailable")
    );

    await expect(
      getSalesOverview()
    ).rejects.toThrow("Database unavailable");
  });
});

// ======================================
// DAILY REVENUE
// ======================================

describe("getDailyRevenue", () => {
  it("converts revenue strings to numbers", async () => {
    mockRows([
      {
        date: "2026-10-20",
        revenue: "100.50",
      },
      {
        date: "2026-10-21",
        revenue: "250.25",
      },
    ]);

    expect(await getDailyRevenue()).toEqual([
      {
        date: "2026-10-20",
        revenue: 100.5,
      },
      {
        date: "2026-10-21",
        revenue: 250.25,
      },
    ]);
  });

  it("returns an empty array", async () => {
    mockRows([]);

    expect(await getDailyRevenue()).toEqual([]);
  });

  it("groups EUR revenue by Berlin date", async () => {
    mockRows([]);

    await getDailyRevenue();

    const sql = getSQL();

    expect(sql).toContain(
      "AT TIME ZONE 'Europe/Berlin'"
    );
    expect(sql).toContain(
      "SUM(total_amount)"
    );
    expect(sql).toContain(
      "status = 'DEMO_PAID'"
    );
    expect(sql).toContain(
      "currency = 'EUR'"
    );
    expect(sql).toContain("GROUP BY 1");
    expect(sql).toContain("ORDER BY 1 ASC");
  });

  it("propagates database errors", async () => {
    mocks.query.mockRejectedValue(
      new Error("Database unavailable")
    );

    await expect(
      getDailyRevenue()
    ).rejects.toThrow("Database unavailable");
  });
});

// ======================================
// DAILY TICKET SALES
// ======================================

describe("getDailyTicketSales", () => {
  it("returns daily ticket counts as numbers", async () => {
    mockRows([
      {
        date: "2026-10-20",
        tickets: "5",
      },
      {
        date: "2026-10-21",
        tickets: "12",
      },
    ]);

    expect(await getDailyTicketSales()).toEqual([
      {
        date: "2026-10-20",
        tickets: 5,
      },
      {
        date: "2026-10-21",
        tickets: 12,
      },
    ]);
  });

  it("returns an empty array", async () => {
    mockRows([]);

    expect(await getDailyTicketSales()).toEqual([]);
  });

  it("counts tickets from demo-paid EUR orders", async () => {
    mockRows([]);

    await getDailyTicketSales();

    const sql = getSQL();

    expect(sql).toContain(
      "JOIN tickets t ON t.order_id = o.id"
    );
    expect(sql).toContain("COUNT(t.id)");
    expect(sql).toContain(
      "o.status = 'DEMO_PAID'"
    );
    expect(sql).toContain(
      "o.currency = 'EUR'"
    );
    expect(sql).toContain(
      "AT TIME ZONE 'Europe/Berlin'"
    );
  });

  it("propagates database errors", async () => {
    mocks.query.mockRejectedValue(
      new Error("Database unavailable")
    );

    await expect(
      getDailyTicketSales()
    ).rejects.toThrow("Database unavailable");
  });
});

// ======================================
// EVENTS BY CATEGORY
// ======================================

describe("getEventsByCategory", () => {
  it("returns category counts", async () => {
    mockRows([
      {
        category: "music",
        count: "120",
      },
      {
        category: "technology",
        count: "45",
      },
    ]);

    expect(await getEventsByCategory()).toEqual([
      {
        category: "music",
        count: 120,
      },
      {
        category: "technology",
        count: 45,
      },
    ]);
  });

  it("returns an empty array", async () => {
    mockRows([]);

    expect(await getEventsByCategory()).toEqual([]);
  });

  it("groups events by category", async () => {
    mockRows([]);

    await getEventsByCategory();

    const sql = getSQL();

    expect(sql).toContain("FROM events");
    expect(sql).toContain("GROUP BY category");
    expect(sql).toContain("ORDER BY count DESC");
  });

  it("propagates database errors", async () => {
    mocks.query.mockRejectedValue(
      new Error("Database unavailable")
    );

    await expect(
      getEventsByCategory()
    ).rejects.toThrow("Database unavailable");
  });
});

// ======================================
// MOST POPULAR EVENTS
// ======================================

describe("getMostPopularEvents", () => {
  it("returns popular events with numeric sales", async () => {
    mockRows([
      {
        id: "event-1",
        title: "Music Festival",
        tickets_sold: "250",
      },
      {
        id: "event-2",
        title: "Tech Conference",
        tickets_sold: "120",
      },
    ]);

    expect(await getMostPopularEvents()).toEqual([
      {
        id: "event-1",
        title: "Music Festival",
        ticketsSold: 250,
      },
      {
        id: "event-2",
        title: "Tech Conference",
        ticketsSold: 120,
      },
    ]);
  });

  it("returns an empty array", async () => {
    mockRows([]);

    expect(await getMostPopularEvents()).toEqual([]);
  });

  it("selects the top ten paid demo events", async () => {
    mockRows([]);

    await getMostPopularEvents();

    const sql = getSQL();

    expect(sql).toContain(
      "COUNT(t.id) AS tickets_sold"
    );
    expect(sql).toContain(
      "o.status = 'DEMO_PAID'"
    );
    expect(sql).toContain(
      "o.currency = 'EUR'"
    );
    expect(sql).toContain(
      "ORDER BY tickets_sold DESC"
    );
    expect(sql).toContain("LIMIT 10");
  });

  it("propagates database errors", async () => {
    mocks.query.mockRejectedValue(
      new Error("Database unavailable")
    );

    await expect(
      getMostPopularEvents()
    ).rejects.toThrow("Database unavailable");
  });
});

// ======================================
// USER GROWTH
// ======================================

describe("getUserGrowth", () => {
  it("calculates cumulative users", async () => {
    mockRows([
      {
        date: "2026-10-20",
        users: "5",
      },
      {
        date: "2026-10-21",
        users: "3",
      },
      {
        date: "2026-10-22",
        users: "7",
      },
    ]);

    expect(await getUserGrowth()).toEqual([
      {
        date: "2026-10-20",
        users: 5,
      },
      {
        date: "2026-10-21",
        users: 8,
      },
      {
        date: "2026-10-22",
        users: 15,
      },
    ]);
  });

  it("handles zero new users", async () => {
    mockRows([
      {
        date: "2026-10-20",
        users: "5",
      },
      {
        date: "2026-10-21",
        users: "0",
      },
    ]);

    expect(await getUserGrowth()).toEqual([
      {
        date: "2026-10-20",
        users: 5,
      },
      {
        date: "2026-10-21",
        users: 5,
      },
    ]);
  });

  it("returns an empty array", async () => {
    mockRows([]);

    expect(await getUserGrowth()).toEqual([]);
  });

  it("resets cumulative count on each call", async () => {
    mockRows([
      {
        date: "2026-10-20",
        users: "4",
      },
    ]);

    const first = await getUserGrowth();
    const second = await getUserGrowth();

    expect(first[0].users).toBe(4);
    expect(second[0].users).toBe(4);
  });

  it("groups registrations by Berlin date", async () => {
    mockRows([]);

    await getUserGrowth();

    const sql = getSQL();

    expect(sql).toContain("FROM users");
    expect(sql).toContain(
      "AT TIME ZONE 'Europe/Berlin'"
    );
    expect(sql).toContain("COUNT(*) AS users");
    expect(sql).toContain("GROUP BY 1");
    expect(sql).toContain("ORDER BY 1 ASC");
  });

  it("propagates database errors", async () => {
    mocks.query.mockRejectedValue(
      new Error("Database unavailable")
    );

    await expect(
      getUserGrowth()
    ).rejects.toThrow("Database unavailable");
  });
});

// ======================================
// SALES HEATMAP
// ======================================

describe("getSalesHeatmap", () => {
  it("returns numeric day, hour and order counts", async () => {
    mockRows([
      {
        day: "1",
        hour: "9",
        orders: "12",
      },
      {
        day: "5",
        hour: "20",
        orders: "25",
      },
    ]);

    expect(await getSalesHeatmap()).toEqual([
      {
        day: 1,
        hour: 9,
        orders: 12,
      },
      {
        day: 5,
        hour: 20,
        orders: 25,
      },
    ]);
  });

  it("returns an empty array", async () => {
    mockRows([]);

    expect(await getSalesHeatmap()).toEqual([]);
  });

  it("uses ISO weekdays and Berlin local hours", async () => {
    mockRows([]);

    await getSalesHeatmap();

    const sql = getSQL();

    expect(sql).toContain(
      "ISODOW FROM created_at AT TIME ZONE 'Europe/Berlin'"
    );

    expect(sql).toContain(
      "HOUR FROM created_at AT TIME ZONE 'Europe/Berlin'"
    );
  });

  it("counts demo-paid orders", async () => {
    mockRows([]);

    await getSalesHeatmap();

    const sql = getSQL();

    expect(sql).toContain(
      "status = 'DEMO_PAID'"
    );
    expect(sql).toContain(
      "COUNT(*) AS orders"
    );
    expect(sql).toContain("GROUP BY 1, 2");
    expect(sql).toContain("ORDER BY 1, 2");
  });

  it("propagates database errors", async () => {
    mocks.query.mockRejectedValue(
      new Error("Database unavailable")
    );

    await expect(
      getSalesHeatmap()
    ).rejects.toThrow("Database unavailable");
  });
});
