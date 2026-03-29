/**
 * Drizzle ORM database client backed by LibSQL/Turso (SQLite).
 * Connects using DATABASE_URL from the validated env config.
 *
 * For local SQLite files, enables WAL journal mode and a 5-second
 * busy_timeout to reduce SQLITE_BUSY errors under concurrent access.
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { env } from "./env.ts";

const client = createClient({
  url: env.DATABASE_URL,
  authToken: env.DATABASE_AUTH_TOKEN,
});

/** Apply SQLite pragmas for local file databases to reduce lock contention. */
if (env.DATABASE_URL.startsWith("file:")) {
  await client.executeMultiple("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;");
}

export const db = drizzle(client);
