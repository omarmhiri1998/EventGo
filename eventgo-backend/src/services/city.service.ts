
import { pool } from "../db/database";

export interface AdminCity {
  id: string;
  name: string;
  countryCode: string;
  latitude: number;
  longitude: number;
}

export interface CitiesResult {
  cities: AdminCity[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getAdminCities(
  page = 1,
  search = ""
): Promise<CitiesResult> {
  const pageSize = 20;
  const keyword = search.trim();

  if (!Number.isSafeInteger(page) || page < 1) {
    throw new Error("Invalid page.");
  }

  if (keyword.length > 200) {
    throw new Error("Search is too long.");
  }

  const offset = (page - 1) * pageSize;

  if (!Number.isSafeInteger(offset)) {
    throw new Error("Invalid page.");
  }

  const filter = `
    WHERE (
      $1 = ''
      OR name ILIKE $2
      OR country_code ILIKE $2
    )
  `;

  const values = [keyword, `%${keyword}%`];

  const [citiesResult, countResult] = await Promise.all([
    pool.query<{
      id: string;
      name: string;
      country_code: string;
      latitude: number;
      longitude: number;
    }>(
      `
      SELECT
        id,
        name,
        country_code,
        latitude,
        longitude
      FROM cities
      ${filter}
      ORDER BY name ASC, country_code ASC, id ASC
      LIMIT $3 OFFSET $4
      `,
      [...values, pageSize, offset]
    ),

    pool.query<{ total: string }>(
      `
      SELECT COUNT(*)::text AS total
      FROM cities
      ${filter}
      `,
      values
    ),
  ]);

  const total = Number(countResult.rows[0].total);

  return {
    cities: citiesResult.rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      countryCode: row.country_code,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
