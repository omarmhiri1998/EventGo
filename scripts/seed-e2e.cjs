const { randomUUID } = require("node:crypto");
const { appendFileSync } = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");

const backendRequire = createRequire(
  path.resolve("eventgo-backend/package.json")
);

const { Pool } = backendRequire("pg");

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10_000,
  });

  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const cityResult = await client.query(
      `
      SELECT id
      FROM cities
      WHERE LOWER(name) = LOWER($1)
        AND country_code = 'DE'
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
      ORDER BY id
      LIMIT 1
      `,
      ["Dortmund"]
    );

    if (cityResult.rows.length === 0) {
      throw new Error(
        "Dortmund with coordinates is missing from the database."
      );
    }

    const title = `EventGo E2E ${randomUUID()}`;

    const startsAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    const endsAt = new Date(
      startsAt.getTime() + 2 * 60 * 60 * 1000
    );

    const eventResult = await client.query(
      `
      INSERT INTO events (
        city_id,
        title,
        description,
        category,
        starts_at,
        ends_at,
        capacity,
        is_demo
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
      RETURNING id
      `,
      [
        cityResult.rows[0].id,
        title,
        "Fictional demo event created for automated E2E testing.",
        "music",
        startsAt,
        endsAt,
        100,
      ]
    );

    await client.query(
      `
      INSERT INTO ticket_types (
        event_id,
        name,
        price,
        currency,
        quantity
      )
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        eventResult.rows[0].id,
        "General Admission",
        10,
        "EUR",
        100,
      ]
    );

    await client.query("COMMIT");

    if (process.env.GITHUB_ENV) {
      appendFileSync(
        process.env.GITHUB_ENV,
        `EVENTGO_E2E_EVENT_TITLE=${title}\n` +
          `EVENTGO_E2E_EVENT_SEARCH=${title}\n`
      );
    }

    console.log(`E2E event created: ${title}`);
    console.log(`Starts at: ${startsAt.toISOString()}`);
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK").catch(() => {});
    }

    throw error;
  } finally {
    client?.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});