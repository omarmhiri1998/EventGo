
import {
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import dotenv from "dotenv";
import path from "node:path";

import type * as AnalyticsService from "../../src/services/analytics.service";

// ======================================
// DATABASE CONFIGURATION
// ======================================

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

// Must be configured before importing the service.
process.env.DATABASE_URL = databaseUrl;

// ======================================
// SERVICE
// ======================================

let service: typeof AnalyticsService;

beforeAll(async () => {
  service = await import(
    "../../src/services/analytics.service"
  );
});

// ======================================
// HELPERS
// ======================================

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function expectAscendingDates(
  dates: string[]
): void {
  for (let index = 1; index < dates.length; index++) {
    expect(
      dates[index] >= dates[index - 1]
    ).toBe(true);
  }
}

// ======================================
// SALES OVERVIEW
// ======================================

describe("Sales Overview - Integration", () => {
  it(
    "loads sales statistics from PostgreSQL",
    async () => {
      const result = await service.getSalesOverview();

      expect(result).toEqual({
        totalOrders: expect.any(Number),
        totalRevenue: expect.any(Number),
        ticketsSold: expect.any(Number),
      });

      expect(result.totalOrders).toBeGreaterThanOrEqual(0);
      expect(result.totalRevenue).toBeGreaterThanOrEqual(0);
      expect(result.ticketsSold).toBeGreaterThanOrEqual(0);

      expect(Number.isFinite(result.totalRevenue)).toBe(
        true
      );
    },
    60000
  );
});

// ======================================
// DAILY REVENUE
// ======================================

describe("Daily Revenue - Integration", () => {
  it(
    "returns valid daily revenue records",
    async () => {
      const result = await service.getDailyRevenue();

      expect(Array.isArray(result)).toBe(true);

      for (const row of result) {
        expect(isValidDate(row.date)).toBe(true);
        expect(Number.isFinite(row.revenue)).toBe(true);
        expect(row.revenue).toBeGreaterThanOrEqual(0);
      }

      expectAscendingDates(
        result.map((row) => row.date)
      );
    },
    60000
  );
});

// ======================================
// DAILY TICKET SALES
// ======================================

describe("Daily Ticket Sales - Integration", () => {
  it(
    "returns daily ticket counts",
    async () => {
      const result = await service.getDailyTicketSales();

      expect(Array.isArray(result)).toBe(true);

      for (const row of result) {
        expect(isValidDate(row.date)).toBe(true);
        expect(Number.isSafeInteger(row.tickets)).toBe(
          true
        );
        expect(row.tickets).toBeGreaterThanOrEqual(0);
      }

      expectAscendingDates(
        result.map((row) => row.date)
      );
    },
    60000
  );
});

// ======================================
// EVENTS BY CATEGORY
// ======================================

describe("Events By Category - Integration", () => {
  it(
    "returns category statistics",
    async () => {
      const result = await service.getEventsByCategory();

      expect(Array.isArray(result)).toBe(true);

      for (const row of result) {
        expect(typeof row.category).toBe("string");
        expect(Number.isSafeInteger(row.count)).toBe(true);
        expect(row.count).toBeGreaterThanOrEqual(0);
      }

      for (let index = 1; index < result.length; index++) {
        expect(result[index - 1].count)
          .toBeGreaterThanOrEqual(result[index].count);
      }
    },
    60000
  );
});

// ======================================
// MOST POPULAR EVENTS
// ======================================

describe("Most Popular Events - Integration", () => {
  it(
    "returns up to ten popular events",
    async () => {
      const result =
        await service.getMostPopularEvents();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(10);

      for (const event of result) {
        expect(event.id).toBeTruthy();
        expect(event.title).toBeTruthy();

        expect(
          Number.isSafeInteger(event.ticketsSold)
        ).toBe(true);

        expect(event.ticketsSold).toBeGreaterThan(0);
      }

      for (let index = 1; index < result.length; index++) {
        expect(result[index - 1].ticketsSold)
          .toBeGreaterThanOrEqual(
            result[index].ticketsSold
          );
      }
    },
    60000
  );
});

// ======================================
// USER GROWTH
// ======================================

describe("User Growth - Integration", () => {
  it(
    "returns cumulative user counts",
    async () => {
      const result = await service.getUserGrowth();

      expect(Array.isArray(result)).toBe(true);

      for (const row of result) {
        expect(isValidDate(row.date)).toBe(true);
        expect(Number.isSafeInteger(row.users)).toBe(
          true
        );
        expect(row.users).toBeGreaterThanOrEqual(0);
      }

      for (let index = 1; index < result.length; index++) {
        expect(
          result[index].users
        ).toBeGreaterThanOrEqual(
          result[index - 1].users
        );
      }

      expectAscendingDates(
        result.map((row) => row.date)
      );
    },
    60000
  );
});

// ======================================
// SALES HEATMAP
// ======================================

describe("Sales Heatmap - Integration", () => {
  it(
    "returns valid weekdays and hours",
    async () => {
      const result = await service.getSalesHeatmap();

      expect(Array.isArray(result)).toBe(true);

      for (const row of result) {
        expect(Number.isInteger(row.day)).toBe(true);
        expect(row.day).toBeGreaterThanOrEqual(1);
        expect(row.day).toBeLessThanOrEqual(7);

        expect(Number.isInteger(row.hour)).toBe(true);
        expect(row.hour).toBeGreaterThanOrEqual(0);
        expect(row.hour).toBeLessThanOrEqual(23);

        expect(Number.isInteger(row.orders)).toBe(true);
        expect(row.orders).toBeGreaterThan(0);
      }

      // One aggregated row per day/hour combination.
      const keys = result.map(
        (row) => `${row.day}-${row.hour}`
      );

      expect(new Set(keys).size).toBe(keys.length);
    },
    60000
  );
});

// ======================================
// CROSS-SERVICE CONSISTENCY
// ======================================

describe("Analytics Consistency - Integration", () => {
  it(
    "matches total orders with daily revenue and ticket counts",
    async () => {
      const [overview, revenue, tickets] =
        await Promise.all([
          service.getSalesOverview(),
          service.getDailyRevenue(),
          service.getDailyTicketSales(),
        ]);

      const totalDailyRevenue = revenue.reduce(
        (sum, row) => sum + row.revenue,
        0
      );

      const totalDailyTickets = tickets.reduce(
        (sum, row) => sum + row.tickets,
        0
      );

      // The daily reports exclude orders without created_at.
      // When the database contains such orders, the overview
      // may be larger than the daily reports.
      expect(totalDailyRevenue).toBeLessThanOrEqual(
        overview.totalRevenue + 0.01
      );

      expect(totalDailyTickets).toBeLessThanOrEqual(
        overview.ticketsSold
      );
    },
    60000
  );
});
