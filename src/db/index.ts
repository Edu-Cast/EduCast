import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const fallbackDatabaseUrl = "postgresql://postgres:postgres@127.0.0.1:5433/app_db";
const databaseUrl = process.env.DATABASE_URL?.trim() || fallbackDatabaseUrl;

if (!process.env.DATABASE_URL) {
  // Keeps local DX smooth when .env is missing.
  // In production, set DATABASE_URL explicitly.
  console.warn("[db] DATABASE_URL is not set, using local fallback:", fallbackDatabaseUrl);
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
