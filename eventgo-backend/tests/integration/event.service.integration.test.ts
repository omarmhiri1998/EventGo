
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import dotenv from "dotenv";
import path from "node:path";
import { Pool } from "pg";

import type * as EventService from "../../src/services/event.service";

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

const databaseUrl = process.env.DATABASE_URL || parsed?.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing from eventgo-backend/.env.local"
  );
}

// Set the URL before importing the service.
process.env.DATABASE_URL = databaseUrl;

const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
  connectionTimeoutMillis: 10000,
});

let service: typeof EventService;

// ======================================
// SETUP
// ======================================

beforeAll(async () => {
  service = await import(
    "../../src/services/event.service"
  );
});

afterAll(async () => {
  await pool.end();
});

// ======================================
// DATABASE SCHEMA
// ======================================

describe("Events Integration - Database", () => {
  it("verifies required tables exist", async () => {
    const result = await pool.query<{
      name: string | null;
    }>(
      `
      SELECT
        to_regclass('public.events')::text AS name
      `
    );

    expect(result.rows[0].name).not.toBeNull();

    const cities = await pool.query(
      `
      SELECT to_regclass('public.cities') AS name
      `
    );

    expect(cities.rows[0].name).not.toBeNull();
  });

  it("verifies events can be queried", async () => {
    const result = await pool.query<{
      total: number;
    }>(
      `
      SELECT COUNT(*)::int AS total
      FROM events
      `
    );

    expect(result.rows[0].total)
      .toBeGreaterThanOrEqual(0);
  });

  it("verifies events reference cities", async () => {
    const result = await pool.query(
      `
      SELECT
        e.id,
        c.name AS city_name
      FROM events e
      JOIN cities c ON c.id = e.city_id
      LIMIT 5
      `
    );

    expect(Array.isArray(result.rows)).toBe(true);

    for (const row of result.rows) {
      expect(row.id).toBeTruthy();
      expect(row.city_name).toBeTruthy();
    }
  });
});

// ======================================
// GET ALL EVENTS
// ======================================

describe("getAllEvents - Integration", () => {
  it("executes against PostgreSQL", async () => {
    const result = await service.getAllEvents();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeLessThanOrEqual(20);
  });

  it("returns upcoming events in chronological order", async () => {
    const result = await service.getAllEvents();

    for (let i = 1; i < result.length; i++) {
      expect(
        new Date(result[i].starts_at).getTime()
      ).toBeGreaterThanOrEqual(
        new Date(result[i - 1].starts_at).getTime()
      );
    }
  });
});

// ======================================
// SEARCH EVENTS
// ======================================

describe("searchEvents - Integration", () => {
  it("returns a valid paginated result", async () => {
    const result = await service.searchEvents({
      page: 1,
      pageSize: 10,
    });

    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(typeof result.hasMore).toBe("boolean");

    expect(Array.isArray(result.events)).toBe(true);
    expect(result.events.length)
      .toBeLessThanOrEqual(10);
  });

  it("returns required event fields", async () => {
    const result = await service.searchEvents({
      pageSize: 5,
    });

    for (const event of result.events) {
      expect(event.id).toBeTruthy();
      expect(event.title).toBeTruthy();
      expect(event.category).toBeTruthy();
      expect(event.city_name).toBeTruthy();
      expect(event.country_code).toBeTruthy();
      expect(event.starts_at).toBeTruthy();
    }
  });

  it("returns only demo events", async () => {
    const result = await service.searchEvents({
      pageSize: 20,
    });

    for (const event of result.events) {
      expect(event.is_demo).toBe(true);
    }
  });

  it("filters by category", async () => {
    const result = await service.searchEvents({
      category: "music",
      pageSize: 20,
    });

    for (const event of result.events) {
      expect(event.category).toBe("music");
    }
  });

  it("filters by search keyword", async () => {
    const keyword = "festival";

    const result = await service.searchEvents({
      q: keyword,
      pageSize: 20,
    });

    for (const event of result.events) {
      const searchableText = [
        event.title,
        event.description ?? "",
      ].join(" ").toLowerCase();

      expect(searchableText).toContain(keyword);
    }
  });

  it("searches events near Dortmund", async () => {
    const result = await service.searchEvents({
      city: "Dortmund",
      radius: 25,
      pageSize: 20,
    });

    expect(Array.isArray(result.events)).toBe(true);

    for (const event of result.events) {
      expect(event.country_code).toBe("DE");

      expect(
        Number(event.distance_km)
      ).toBeGreaterThanOrEqual(0);

      expect(
        Number(event.distance_km)
      ).toBeLessThanOrEqual(25.01);
    }
  });

  it("returns no events for an unknown city", async () => {
    const result = await service.searchEvents({
      city: "EventGoNonexistentCity12345",
      radius: 25,
    });

    expect(result.events).toEqual([]);
    expect(result.hasMore).toBe(false);
  });

  it("filters events by a specified date", async () => {
    const date = "2027-06-15";

    const result = await service.searchEvents({
      date,
      pageSize: 20,
    });

    for (const event of result.events) {
      const eventDate = new Intl.DateTimeFormat(
        "en-CA",
        {
          timeZone: "Europe/Berlin",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }
      ).format(new Date(event.starts_at));

      expect(eventDate).toBe(date);
    }
  });

  it("supports pagination without duplicates", async () => {
    const first = await service.searchEvents({
      page: 1,
      pageSize: 5,
    });

    const second = await service.searchEvents({
      page: 2,
      pageSize: 5,
    });

    const firstIds = new Set(
      first.events.map(event => event.id)
    );

    for (const event of second.events) {
      expect(firstIds.has(event.id)).toBe(false);
    }

    expect(first.events.length)
      .toBeLessThanOrEqual(5);

    expect(second.events.length)
      .toBeLessThanOrEqual(5);
  });
});

// ======================================
// RANDOM EVENTS
// ======================================

describe("getRandomEvents - Integration", () => {
  it("executes the random events SQL", async () => {
    const result = await service.getRandomEvents();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeLessThanOrEqual(12);
  });

  it("respects the requested limit", async () => {
    const result = await service.getRandomEvents(5);

    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("filters random events by category", async () => {
    const result = await service.getRandomEvents(
      8,
      "technology"
    );

    for (const event of result) {
      expect(event.category).toBe("technology");
      expect(event.is_demo).toBe(true);
    }
  });
});

// ======================================
// ADMIN EVENTS
// ======================================

describe("getAdminEvents - Integration", () => {
  it("loads admin events", async () => {
    const result = await service.getAdminEvents();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeLessThanOrEqual(100);
  });

  it("returns events ordered by start date descending", async () => {
    const result = await service.getAdminEvents();

    for (let i = 1; i < result.length; i++) {
      expect(
        new Date(result[i - 1].starts_at).getTime()
      ).toBeGreaterThanOrEqual(
        new Date(result[i].starts_at).getTime()
      );
    }
  });
});

