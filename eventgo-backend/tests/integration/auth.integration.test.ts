
import {
  describe,
  it,
  expect,
  afterAll,
} from "vitest";

import dotenv from "dotenv";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";

const envPath = path.resolve(
  process.cwd(),
  "eventgo-backend/.env.local"
);

const parsed = dotenv.config({
  path: envPath,
}).parsed;

const databaseUrl =
  process.env.DATABASE_URL || parsed?.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing from environment variables or .env.local"
  );
}

// Ensure auth.service uses the same database as these tests.
// This must happen before importing the service.
process.env.DATABASE_URL = databaseUrl;

const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
  connectionTimeoutMillis: 10000,
});

describe("Authentication Integration Tests - Read Only", () => {
  afterAll(async () => {
    await pool.end();
  });

  it("connects to PostgreSQL", async () => {
    const result = await pool.query(
      "SELECT current_database() AS database_name"
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].database_name).toBeTruthy();
  });

  it("verifies that the users table exists", async () => {
    const result = await pool.query(
      "SELECT to_regclass('public.users') AS table_name"
    );

    expect(result.rows[0].table_name).not.toBeNull();
  });

  it("reads the number of users without modifying data", async () => {
    const result = await pool.query<{ total: number }>(
      "SELECT COUNT(*)::int AS total FROM public.users"
    );

    expect(result.rows[0].total).toBeGreaterThanOrEqual(0);
  });

  it("verifies authentication columns exist", async () => {
    const result = await pool.query<{ column_name: string }>(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
    `);

    const columns = result.rows.map(
      (row) => row.column_name
    );

    expect(columns).toEqual(
      expect.arrayContaining([
        "id",
        "name",
        "email",
        "password_hash",
        "role",
      ])
    );
  });

  it("rejects login for a nonexistent user", async () => {
    const { login } = await import(
      "../../src/services/auth.service"
    );

    const email = `nonexistent-${randomUUID()}@example.com`;

    await expect(
      login({
        email,
        password: "InvalidPassword123!",
      })
    ).rejects.toThrow("Invalid email or password");
  });
});

