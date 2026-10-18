
import { pool } from "../db/database";

const allowedCategories = [
  "music",
  "sports",
  "technology",
  "food",
  "art",
  "business",
  "nightlife",
  "festivals",
  "cinema",
  "comedy",
  "culture",
  "wellness",
] as const;

export type EventCategory =
  (typeof allowedCategories)[number];

export type CategoryFilter = EventCategory | "all";

export interface DatabaseEvent {
  id: string;
  title: string;
  description: string | null;
  category: string;
  starts_at: Date | string;
  ends_at: Date | string | null;
  capacity: number | null;
  is_demo: boolean;
  city_name: string;
  country_code: string;
  distance_km?: number | string | null;
  city_latitude?: number | null;
  city_longitude?: number | null;
}

export interface SearchEventFilters {
  city?: string;
  radius?: number;
  date?: string;
  category?: CategoryFilter;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface SearchEventResult {
  events: DatabaseEvent[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

function getBerlinToday(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const getPart = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return [
    getPart("year"),
    getPart("month"),
    getPart("day"),
  ].join("-");
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);

  value.setUTCDate(value.getUTCDate() + days);

  return value.toISOString().slice(0, 10);
}

function validateDate(date: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Invalid date");
  }

  const parsed = new Date(`${date}T12:00:00Z`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    throw new Error("Invalid date");
  }
}

function getDateRange(
  value: string
): { start: string; end: string } | null {
  const date = value.trim().toLowerCase();

  if (!date || date === "all") {
    return null;
  }

  const today = getBerlinToday();

  if (date === "today") {
    return {
      start: today,
      end: addDays(today, 1),
    };
  }

  if (date === "tomorrow") {
    const tomorrow = addDays(today, 1);

    return {
      start: tomorrow,
      end: addDays(tomorrow, 1),
    };
  }

  if (date === "weekend") {
    const day = new Date(
      `${today}T12:00:00Z`
    ).getUTCDay();

    const daysUntilSaturday = (6 - day + 7) % 7;

    const saturday = addDays(
      today,
      daysUntilSaturday
    );

    return {
      start: saturday,
      end: addDays(saturday, 2),
    };
  }

  validateDate(date);

  return {
    start: date,
    end: addDays(date, 1),
  };
}

export async function getAllEvents() {
  const result = await pool.query(
    `
    SELECT *
    FROM events
    WHERE starts_at >= NOW()
    ORDER BY starts_at ASC
    LIMIT 20
    `
  );

  return result.rows;
}

export async function searchEvents(
  filters: SearchEventFilters = {}
): Promise<SearchEventResult> {
  const city = (filters.city ?? "").trim();
  const radius = filters.radius ?? 25;
  const category = filters.category ?? "all";
  const keyword = (filters.q ?? "").trim();

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;

  const dateRange = getDateRange(
    filters.date ?? ""
  );

  if (
    !Number.isFinite(radius) ||
    radius <= 0 ||
    radius > 500
  ) {
    throw new Error("Invalid radius");
  }

  if (
    !Number.isSafeInteger(page) ||
    page < 1
  ) {
    throw new Error("Invalid page");
  }

  if (
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 50
  ) {
    throw new Error("Invalid page size");
  }

  if (
    category !== "all" &&
    !allowedCategories.includes(category)
  ) {
    throw new Error("Invalid category");
  }

  if (keyword.length > 200) {
    throw new Error("Search query is too long");
  }

  const offset = (page - 1) * pageSize;

  if (!Number.isSafeInteger(offset)) {
    throw new Error("Invalid page");
  }

  const values: unknown[] = [];

  const conditions: string[] = [
    "e.starts_at >= NOW()",
    "e.is_demo = TRUE",
  ];

  let prefix = "";

  let fromClause = `
    FROM events e
    JOIN cities c ON c.id = e.city_id
  `;

  let distanceSelection = `
    NULL::numeric AS distance_km
  `;

  if (city) {
    values.push(city);
    const cityParameter = `$${values.length}`;

    values.push(radius);
    const radiusParameter = `$${values.length}`;

    prefix = `
      WITH origin AS (
        SELECT
          latitude,
          longitude
        FROM cities
        WHERE LOWER(name) = LOWER(${cityParameter})
          AND country_code = 'DE'
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
        ORDER BY id
        LIMIT 1
      ),
      nearby_cities AS (
        SELECT
          c.id,
          6371 * ACOS(
            LEAST(
              1,
              GREATEST(
                -1,
                SIN(RADIANS(o.latitude)) *
                SIN(RADIANS(c.latitude)) +
                COS(RADIANS(o.latitude)) *
                COS(RADIANS(c.latitude)) *
                COS(
                  RADIANS(
                    c.longitude - o.longitude
                  )
                )
              )
            )
          ) AS distance_km
        FROM cities c
        CROSS JOIN origin o
        WHERE c.country_code = 'DE'
          AND c.latitude IS NOT NULL
          AND c.longitude IS NOT NULL
          AND ABS(c.latitude - o.latitude) <=
            ${radiusParameter} / 111.0
          AND ABS(c.longitude - o.longitude) <=
            ${radiusParameter} /
            (
              111.0 *
              GREATEST(
                ABS(COS(RADIANS(o.latitude))),
                0.01
              )
            )
      )
    `;

    fromClause = `
      FROM nearby_cities nc
      JOIN events e ON e.city_id = nc.id
      JOIN cities c ON c.id = e.city_id
    `;

    conditions.push(
      `nc.distance_km <= ${radiusParameter}`
    );

    distanceSelection = `
      ROUND(nc.distance_km::numeric, 2)
        AS distance_km
    `;
  }

  if (category !== "all") {
    values.push(category);

    conditions.push(
      `e.category = $${values.length}`
    );
  }

  if (dateRange) {
    values.push(dateRange.start);
    const startParameter = `$${values.length}`;

    values.push(dateRange.end);
    const endParameter = `$${values.length}`;

    conditions.push(`
      e.starts_at >=
        (${startParameter}::date::timestamp
          AT TIME ZONE 'Europe/Berlin')
    `);

    conditions.push(`
      e.starts_at <
        (${endParameter}::date::timestamp
          AT TIME ZONE 'Europe/Berlin')
    `);
  }

  if (keyword) {
    values.push(`%${keyword}%`);

    const keywordParameter = `$${values.length}`;

    conditions.push(`
      (
        e.title ILIKE ${keywordParameter}
        OR e.description ILIKE ${keywordParameter}
      )
    `);
  }

  values.push(pageSize + 1);
  const limitParameter = `$${values.length}`;

  values.push(offset);
  const offsetParameter = `$${values.length}`;

  const result = await pool.query<DatabaseEvent>(
    `
    ${prefix}

    SELECT
      e.id,
      e.title,
      e.description,
      e.category,
      e.starts_at,
      e.ends_at,
      e.capacity,
      e.is_demo,
      c.name AS city_name,
      c.country_code,
      c.latitude AS city_latitude,
      c.longitude AS city_longitude,
      ${distanceSelection}

    ${fromClause}

    WHERE ${conditions.join(" AND ")}

    ORDER BY e.starts_at ASC, e.id ASC

    LIMIT ${limitParameter}
    OFFSET ${offsetParameter}
    `,
    values
  );

  return {
    events: result.rows.slice(0, pageSize),
    page,
    pageSize,
    hasMore: result.rows.length > pageSize,
  };
}

export async function getRandomEvents(
  limit: number = 12,
  category: CategoryFilter = "all"
): Promise<DatabaseEvent[]> {
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 24
  ) {
    throw new Error("Invalid event limit");
  }

  if (
    category !== "all" &&
    !allowedCategories.includes(category)
  ) {
    throw new Error("Invalid category");
  }

  const selectedCategory =
    category === "all" ? null : category;

  const result = await pool.query<DatabaseEvent>(
    `
    SELECT
      e.id,
      e.title,
      e.description,
      e.category,
      e.starts_at,
      e.ends_at,
      e.capacity,
      e.is_demo,
      c.name AS city_name,
      c.country_code
    FROM events AS e TABLESAMPLE SYSTEM (2)
    JOIN cities c ON c.id = e.city_id
    WHERE e.starts_at >= NOW()
      AND e.is_demo = TRUE
      AND (
        $2::text IS NULL
        OR e.category = $2
      )
    ORDER BY RANDOM()
    LIMIT $1
    `,
    [limit, selectedCategory]
  );

  return result.rows;
}
export async function getAdminEvents() {
  const result = await pool.query(`
    SELECT
      e.id,
      e.title,
      e.description,
      e.category,
      e.starts_at,
      e.ends_at,
      e.capacity,
      e.is_demo,
      c.name AS city_name
    FROM events e
    JOIN cities c ON c.id = e.city_id
    ORDER BY e.starts_at DESC
    LIMIT 100
  `);

  return result.rows;
}

export interface CreateEventInput {
  title: string;
  description: string;
  category: string;
  city: string;
  startsAt: string;
  endsAt: string | null;
  capacity: number;
  tickets: {
    name: string;
    price: number;
    quantity: number;
  }[];
}

export async function createEvent(input: CreateEventInput) {
  const title = input.title.trim();
  const cityName = input.city.trim();
  const description = input.description.trim();

  if (!title || !cityName) {
    throw new Error("Event title and city are required.");
  }

  const startsAt = new Date(input.startsAt);
  const endsAt = input.endsAt
    ? new Date(input.endsAt)
    : null;

  if (Number.isNaN(startsAt.getTime())) {
    throw new Error("Invalid start date.");
  }

  if (endsAt && Number.isNaN(endsAt.getTime())) {
    throw new Error("Invalid end date.");
  }

  if (endsAt && endsAt <= startsAt) {
    throw new Error("End date must be after start date.");
  }

  if (
    !Number.isSafeInteger(input.capacity) ||
    input.capacity < 0
  ) {
    throw new Error("Invalid event capacity.");
  }

  if (!Array.isArray(input.tickets) || input.tickets.length === 0) {
    throw new Error("At least one ticket type is required.");
  }

  const tickets = input.tickets.map((ticket) => {
    if (
      !ticket.name.trim() ||
      !Number.isFinite(ticket.price) ||
      ticket.price < 0 ||
      !Number.isSafeInteger(ticket.quantity) ||
      ticket.quantity < 0
    ) {
      throw new Error("Invalid ticket information.");
    }

    return {
      name: ticket.name.trim(),
      price: ticket.price,
      quantity: ticket.quantity,
    };
  });

  const totalTickets = tickets.reduce(
    (sum, ticket) => sum + ticket.quantity,
    0
  );

  if (totalTickets > input.capacity) {
    throw new Error(
      "Total ticket quantity cannot exceed event capacity."
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Find city in the existing cities table.
    const cityResult = await client.query<{ id: string }>(
      `
      SELECT id
      FROM cities
      WHERE LOWER(name) = LOWER($1)
      LIMIT 2
      `,
      [cityName]
    );

    if (cityResult.rows.length === 0) {
      throw new Error("City not found in the database.");
    }

    if (cityResult.rows.length > 1) {
      throw new Error(
        "Multiple cities have this name. Select a specific city."
      );
    }

    const cityId = cityResult.rows[0].id;

    // Create the event.
    const eventResult = await client.query<{ id: string }>(
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
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, false
      )
      RETURNING id
      `,
      [
        cityId,
        title,
        description || null,
        input.category,
        startsAt,
        endsAt,
        input.capacity,
      ]
    );

    const eventId = eventResult.rows[0].id;

    // Create all ticket types.
    for (const ticket of tickets) {
      await client.query(
        `
        INSERT INTO ticket_types (
          event_id,
          name,
          price,
          currency,
          quantity
        )
        VALUES ($1, $2, $3, 'EUR', $4)
        `,
        [
          eventId,
          ticket.name,
          ticket.price,
          ticket.quantity,
        ]
      );
    }

    await client.query("COMMIT");

    return {
      success: true,
      eventId,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
