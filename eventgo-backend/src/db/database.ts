import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Pool } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../.env.local"),
});

const databaseUrl = process.env.DATABASE_URL;

console.log("DB CONNECTION CHECK:", {
  databaseUrlConfigured: Boolean(databaseUrl),
  databaseHost: databaseUrl
    ? new URL(databaseUrl).hostname
    : process.env.DB_HOST,
  databaseName: databaseUrl
    ? new URL(databaseUrl).pathname.slice(1)
    : process.env.DB_NAME,
});

export const pool = new Pool({
  ...(databaseUrl
    ? {
        connectionString: databaseUrl,
      }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      }),
  max: 5,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

export async function connectDB() {
  const result = await pool.query(`
    SELECT
      current_database() AS database_name,
      current_schema() AS schema_name,
      current_user AS database_user,
      (
        SELECT COUNT(*)::int
        FROM public.users
      ) AS total_users
  `);

  console.log("EVENTGO DATABASE:", result.rows[0]);

  return result.rows[0];
}