
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import dotenv from "dotenv";
import path from "node:path";

import type * as DashboardService from "../../src/services/dashboard.service";

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

type DashboardData = Awaited<
  ReturnType<
    typeof DashboardService.getDashboardData
  >
>;

let service: typeof DashboardService;
let dashboard: DashboardData;

let closeDatabase: (() => Promise<void>) | undefined;

// ======================================
// SETUP
// ======================================

beforeAll(async () => {
  service = await import(
    "../../src/services/dashboard.service"
  );

  const { pool } = await import(
    "../../src/db/database"
  );

  closeDatabase = () => pool.end();

  // Run the real service once so that every
  // test uses the same consistent snapshot.
  dashboard = await service.getDashboardData();
}, 120000);

afterAll(async () => {
  await closeDatabase?.();
}, 30000);

// ======================================
// HELPERS
// ======================================

function isValidISODate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

// ======================================
// METRICS
// ======================================

describe("Dashboard Metrics - Integration", () => {
  it("returns valid metrics", () => {
    expect(dashboard.metrics).toEqual({
      totalRevenue: expect.any(Number),
      ticketsSold: expect.any(Number),
      totalEvents: expect.any(Number),
      totalUsers: expect.any(Number),
    });
  });

  it("returns nonnegative values", () => {
    const {
      totalRevenue,
      ticketsSold,
      totalEvents,
      totalUsers,
    } = dashboard.metrics;

    expect(totalRevenue).toBeGreaterThanOrEqual(0);
    expect(ticketsSold).toBeGreaterThanOrEqual(0);
    expect(totalEvents).toBeGreaterThanOrEqual(0);
    expect(totalUsers).toBeGreaterThanOrEqual(0);

    expect(Number.isFinite(totalRevenue)).toBe(true);
    expect(Number.isSafeInteger(ticketsSold)).toBe(true);
    expect(Number.isSafeInteger(totalEvents)).toBe(true);
    expect(Number.isSafeInteger(totalUsers)).toBe(true);
  });
});

// ======================================
// DAILY DATA
// ======================================

describe("Dashboard Daily Data - Integration", () => {
  it("returns exactly 30 days", () => {
    expect(dashboard.dailyData).toHaveLength(30);
  });

  it("returns daily revenue and ticket counts", () => {
    for (const day of dashboard.dailyData) {
      expect(isValidISODate(day.date)).toBe(true);

      expect(Number.isFinite(day.revenue)).toBe(true);
      expect(day.revenue).toBeGreaterThanOrEqual(0);

      expect(Number.isSafeInteger(day.tickets)).toBe(true);
      expect(day.tickets).toBeGreaterThanOrEqual(0);
    }
  });

  it("returns consecutive days in ascending order", () => {
    const dates = dashboard.dailyData.map(
      (day) => day.date
    );

    for (let i = 1; i < dates.length; i++) {
      const previous = new Date(
        `${dates[i - 1]}T12:00:00Z`
      );

      previous.setUTCDate(
        previous.getUTCDate() + 1
      );

      expect(dates[i]).toBe(
        previous.toISOString().slice(0, 10)
      );
    }
  });

  it("does not report more daily tickets than total sales", () => {
    const ticketsInLast30Days =
      dashboard.dailyData.reduce(
        (sum, day) => sum + day.tickets,
        0
      );

    expect(ticketsInLast30Days).toBeLessThanOrEqual(
      dashboard.metrics.ticketsSold
    );
  });
});

// ======================================
// CATEGORIES
// ======================================

describe("Dashboard Categories - Integration", () => {
  it("returns valid category data", () => {
    expect(Array.isArray(dashboard.categories)).toBe(true);

    for (const category of dashboard.categories) {
      expect(category.name.length).toBeGreaterThan(0);
      expect(Number.isSafeInteger(category.value)).toBe(true);
      expect(category.value).toBeGreaterThan(0);
    }
  });

  it("does not duplicate category names", () => {
    const names = dashboard.categories.map(
      (category) => category.name
    );

    expect(new Set(names).size).toBe(names.length);
  });
});

// ======================================
// TOP EVENTS
// ======================================

describe("Dashboard Top Events - Integration", () => {
  it("returns at most five top events", () => {
    expect(dashboard.topEvents.length).toBeLessThanOrEqual(5);

    for (const event of dashboard.topEvents) {
      expect(event.id).toBeTruthy();
      expect(event.title).toBeTruthy();
      expect(event.city).toBeTruthy();
      expect(event.ticketsSold).toBeGreaterThan(0);
    }
  });

  it("sorts top events by tickets sold", () => {
    for (let i = 1; i < dashboard.topEvents.length; i++) {
      expect(
        dashboard.topEvents[i - 1].ticketsSold
      ).toBeGreaterThanOrEqual(
        dashboard.topEvents[i].ticketsSold
      );
    }
  });
});

// ======================================
// PARTICIPANT EVENTS
// ======================================

describe("Dashboard Participant Events - Integration", () => {
  it("returns at most five events", () => {
    expect(
      dashboard.participantEvents.length
    ).toBeLessThanOrEqual(5);
  });

  it("sorts events by unique participants", () => {
    for (
      let i = 1;
      i < dashboard.participantEvents.length;
      i++
    ) {
      expect(
        dashboard.participantEvents[i - 1].ticketsSold
      ).toBeGreaterThanOrEqual(
        dashboard.participantEvents[i].ticketsSold
      );
    }
  });

  it("never counts more participants than tickets", () => {
    const ticketCounts = new Map(
      dashboard.topEvents.map((event) => [
        event.id,
        event.ticketsSold,
      ])
    );

    for (const event of dashboard.participantEvents) {
      const tickets = ticketCounts.get(event.id);

      // Only compare events that appear in both top-five lists.
      if (tickets !== undefined) {
        expect(event.ticketsSold).toBeLessThanOrEqual(
          tickets
        );
      }
    }
  });
});

// ======================================
// RECENT EVENTS
// ======================================

describe("Dashboard Recent Events - Integration", () => {
  it("returns at most eight events", () => {
    expect(
      dashboard.recentEvents.length
    ).toBeLessThanOrEqual(8);
  });

  it("returns valid event details", () => {
    for (const event of dashboard.recentEvents) {
      expect(event.id).toBeTruthy();
      expect(event.title).toBeTruthy();
      expect(event.city).toBeTruthy();

      expect(
        Number.isNaN(
          new Date(event.startsAt).getTime()
        )
      ).toBe(false);

      expect(event.capacity).toBeGreaterThanOrEqual(0);
      expect(event.ticketsSold).toBeGreaterThan(0);
      expect(typeof event.isDemo).toBe("boolean");
    }
  });
});

// ======================================
// RECENT PARTICIPANTS
// ======================================

describe("Dashboard Recent Participants - Integration", () => {
  it("returns at most five participants", () => {
    expect(
      dashboard.recentParticipants.length
    ).toBeLessThanOrEqual(5);
  });

  it("returns valid participant details", () => {
    for (const person of dashboard.recentParticipants) {
      expect(person.id).toBeTruthy();
      expect(person.name).toBeTruthy();
      expect(person.email).toBeTruthy();
      expect(person.eventTitle).toBeTruthy();

      if (person.purchasedAt !== null) {
        expect(
          Number.isNaN(
            new Date(person.purchasedAt).getTime()
          )
        ).toBe(false);
      }
    }
  });

  it("sorts recent participants by purchase date", () => {
    const participants = dashboard.recentParticipants;

    for (let i = 1; i < participants.length; i++) {
      const previous = participants[i - 1].purchasedAt
        ? new Date(
            participants[i - 1].purchasedAt!
          ).getTime()
        : 0;

      const current = participants[i].purchasedAt
        ? new Date(
            participants[i].purchasedAt!
          ).getTime()
        : 0;

      expect(previous).toBeGreaterThanOrEqual(current);
    }
  });
});
